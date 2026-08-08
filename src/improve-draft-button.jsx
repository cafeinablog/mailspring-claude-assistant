import { React, ReactDOM, PropTypes, Actions } from "mailspring-exports";
import { RetinaImg } from "mailspring-component-kit";
import { htmlToPlainText, plainTextToDraftHtml, contactLabel } from "./thread-text";
import { improveDraft, getDefaultInstruction } from "./claude-client";

/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador (htmlToPlainText, sin tocar HTML).
 * DEV-09: campo de instrucción libre + llamada a Claude (borrador + instrucción).
 * DEV-10: vista previa con Aplicar / Descartar. Aplicar reemplaza SOLO el texto
 *   del usuario: se corta el body actual en el primer marcador de firma o cita
 *   ('<signature', gmail_quote) y se conserva esa cola intacta — mismo patrón
 *   que el plugin interno composer-templates (verificado en el asar 1.22.0).
 * UI-02: el botón es un icono monocromo (RetinaImg ContentIsMask), mismo estilo
 *   que el resto de la barra.
 * UI-03: el panel usa el sistema nativo de popovers (Actions.openPopover, como
 *   el popup de Plantillas) en lugar del panel flotante propio con portal.
 * BUG-01: se le pasa a Claude quién firma el borrador (y a quién va dirigido);
 *   sin esa información elegía el género al azar y devolvía "Quedo atenta" en
 *   un correo firmado por un hombre.
 */

// Icono del botón (sunburst) como data-URI: el protocolo mailspring:// sirve
// los archivos SIN Content-Type y Chromium se niega a usar un SVG como imagen
// sin su MIME, así que no se puede referenciar assets/icon-composer-claude.svg
// (ese archivo queda como fuente editable). El data-URI sí trae el MIME.
const COMPOSER_ICON_URL =
  "data:image/svg+xml;base64," +
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8ZyBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMi42IiBzdHJva2UtbGluZWNhcD0icm91bmQiPgogICAgPGxpbmUgeDE9IjE3LjUiIHkxPSIxMiIgeDI9IjIzIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSIxNS45IiB5MT0iMTUuOSIgeDI9IjE5LjgiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iMTIiIHkxPSIxNy41IiB4Mj0iMTIiIHkyPSIyMyIvPgogICAgPGxpbmUgeDE9IjguMSIgeTE9IjE1LjkiIHgyPSI0LjIiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iNi41IiB5MT0iMTIiIHgyPSIxIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSI4LjEiIHkxPSI4LjEiIHgyPSI0LjIiIHkyPSI0LjIiLz4KICAgIDxsaW5lIHgxPSIxMiIgeTE9IjYuNSIgeDI9IjEyIiB5Mj0iMSIvPgogICAgPGxpbmUgeDE9IjE1LjkiIHkxPSI4LjEiIHgyPSIxOS44IiB5Mj0iNC4yIi8+CiAgPC9nPgo8L3N2Zz4K";

// BUG-01: identidad del borrador para el prompt. `from` es la cuenta con la que
// se envía (la que firma) y `to` los destinatarios, que definen el género del
// saludo. Se lee del borrador, no de la firma, porque es el dato fiable incluso
// cuando el usuario no tiene firma configurada.
function draftIdentity(draft) {
  if (!draft) {
    return {};
  }
  const sender = draft.from && draft.from[0];
  const recipients = draft.to || [];
  return {
    from: sender ? contactLabel(sender) : null,
    to: recipients.length ? recipients.map(contactLabel).join(", ") : null,
  };
}

// Contenido del popover. Vive montado dentro del FixedPopover nativo de
// Mailspring, que se encarga de posición, fondo, sombra y cierre (clic fuera
// o Escape). Recibe el texto ya extraído y la sesión del borrador.
class ImproveDraftPopover extends React.Component {
  static displayName = "ClaudeImproveDraftPopover";

  static propTypes = {
    extracted: PropTypes.string,
    identity: PropTypes.object,
    session: PropTypes.object.isRequired,
  };

  static defaultProps = {
    identity: {},
  };

  constructor(props) {
    super(props);
    // stage: "input" | "loading" | "preview" | "error"
    this.state = {
      stage: "input",
      instruction: getDefaultInstruction(),
      improved: null,
      error: null,
    };
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _onImprove = async () => {
    const { extracted, identity } = this.props;
    const { instruction } = this.state;
    if (!instruction.trim() || !extracted || !extracted.trim()) {
      return;
    }
    this.setState({ stage: "loading", improved: null, error: null });
    try {
      const improved = await improveDraft(extracted, instruction.trim(), identity);
      if (this._unmounted) return;
      this.setState({ stage: "preview", improved });
    } catch (err) {
      if (this._unmounted) return;
      this.setState({ stage: "error", error: err.message });
    }
  };

  // DEV-10: reemplaza el texto del usuario en el editor por la versión mejorada,
  // conservando intactas la firma y la cita del mensaje original.
  _onApply = () => {
    const { improved } = this.state;
    const { session } = this.props;
    const current = session.draft().body || "";
    let insertion = current.length;
    for (const marker of [
      "<signature",
      '<div class="gmail_quote_attribution"',
      '<blockquote class="gmail_quote"',
    ]) {
      const i = current.indexOf(marker);
      if (i !== -1) {
        insertion = Math.min(insertion, i);
      }
    }
    const html = plainTextToDraftHtml(improved);
    session.changes.add({ body: `${html}${current.substr(insertion)}` });
    Actions.closePopover();
  };

  // Descartar vuelve a la etapa de instrucción (conservándola) para poder
  // ajustar y reintentar sin re-escribirla.
  _onDiscard = () => {
    this.setState({ stage: "input", improved: null });
  };

  _onInstructionKeyDown = event => {
    // Enter envía; Shift+Enter hace salto de línea; Escape cierra.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this._onImprove();
    } else if (event.key === "Escape") {
      Actions.closePopover();
    }
  };

  _renderInput() {
    const { extracted } = this.props;
    const { instruction } = this.state;
    const empty = !extracted || !extracted.trim();
    if (empty) {
      return (
        <div className="panel-body empty">
          El borrador está vacío. Escribe algo y vuelve a intentarlo.
        </div>
      );
    }
    return (
      <div>
        <div className="panel-body draft-preview">{extracted}</div>
        <textarea
          className="instruction-input"
          placeholder='¿Cómo lo mejoro? ej. "hazlo más formal", "acórtalo"'
          value={instruction}
          autoFocus
          rows={2}
          onChange={e => this.setState({ instruction: e.target.value })}
          onKeyDown={this._onInstructionKeyDown}
        />
        <div className="panel-actions">
          <button
            className="btn btn-emphasis"
            disabled={!instruction.trim()}
            onClick={this._onImprove}
          >
            Mejorar
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { stage, improved, error } = this.state;
    let body;
    if (stage === "loading") {
      body = <div className="panel-body loading">Mejorando el borrador con Claude…</div>;
    } else if (stage === "error") {
      body = (
        <div>
          <div className="panel-body error">{error}</div>
          <div className="panel-actions">
            <button className="btn" onClick={() => this.setState({ stage: "input", error: null })}>
              Volver
            </button>
          </div>
        </div>
      );
    } else if (stage === "preview") {
      body = (
        <div>
          <div className="panel-body">{improved}</div>
          <div className="panel-actions">
            <button className="btn" onClick={this._onDiscard}>
              Descartar
            </button>
            <button className="btn btn-emphasis" onClick={this._onApply}>
              Aplicar
            </button>
          </div>
        </div>
      );
    } else {
      body = this._renderInput();
    }
    // tabIndex={-1}: el FixedPopover cierra por blur y su decorador
    // auto-focuses solo enfoca 'input, textarea, [contenteditable], [tabIndex]'.
    // Sin un elemento enfocable (estado "borrador vacío") el popover nunca
    // recibía foco y el clic fuera no lo cerraba.
    return (
      <div className="claude-improve-popover" tabIndex={-1}>
        <div className="panel-title">Mejorar con Claude</div>
        {body}
      </div>
    );
  }
}

export default class ImproveDraftButton extends React.Component {
  static displayName = "ClaudeImproveDraftButton";

  static propTypes = {
    draft: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
  };

  shouldComponentUpdate(nextProps) {
    // El draft cambia en cada tecla; solo re-renderizamos por cambio de sesión
    // (mismo criterio que el starter).
    return nextProps.session !== this.props.session;
  }

  _onClick = () => {
    // DEV-08: extraer el texto plano del borrador. Se quitan las citas del
    // mensaje al que se responde (el usuario mejora SU texto, no la cita).
    const text = htmlToPlainText(this.props.draft.body || "");
    const buttonRect = ReactDOM.findDOMNode(this).getBoundingClientRect();
    Actions.openPopover(
      <ImproveDraftPopover
        extracted={text}
        identity={draftIdentity(this.props.draft)}
        session={this.props.session}
      />,
      { originRect: buttonRect, direction: "up" }
    );
  };

  render() {
    return (
      <button
        tabIndex={-1}
        className="btn btn-toolbar narrow claude-improve-btn"
        title="Mejorar con Claude"
        aria-label="Mejorar con Claude"
        onClick={this._onClick}
      >
        <RetinaImg url={COMPOSER_ICON_URL} mode={RetinaImg.Mode.ContentIsMask} aria-hidden="true" />
      </button>
    );
  }
}
