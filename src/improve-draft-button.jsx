import { React, ReactDOM, PropTypes } from "mailspring-exports";
import { htmlToPlainText } from "./thread-text";
import { improveDraft } from "./claude-client";

/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador actual (draft.body es HTML;
 *   se convierte con htmlToPlainText, sin tocar nunca el HTML del editor).
 * DEV-09: campo de instrucción libre + llamada a Claude (borrador + instrucción).
 * DEV-10 (pendiente): Aplicar (reemplaza el texto del editor) / Descartar.
 */
export default class ImproveDraftButton extends React.Component {
  static displayName = "ClaudeImproveDraftButton";

  static propTypes = {
    draft: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    // stage: "input" | "loading" | "preview" | "error" (solo aplica con open)
    this.state = {
      open: false,
      stage: "input",
      extracted: null,
      instruction: "",
      improved: null,
      error: null,
      panelPos: null,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    // El draft cambia en cada tecla; solo re-renderizamos por nuestro estado
    // o por cambio de sesión (mismo criterio que el starter).
    return nextState !== this.state || nextProps.session !== this.props.session;
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _onClick = event => {
    if (this.state.open) {
      this._closePanel();
      return;
    }
    // El panel se ancla a la ventana (position: fixed) porque la barra de
    // acciones del compositor recorta (overflow) a sus hijos absolutos.
    const rect = event.currentTarget.getBoundingClientRect();
    const PANEL_WIDTH = 420;
    const panelPos = {
      left: Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8)),
      bottom: window.innerHeight - rect.top + 8,
    };
    // DEV-08: extraer el texto plano del borrador. Se quitan las citas del
    // mensaje al que se responde (el usuario mejora SU texto, no la cita).
    const text = htmlToPlainText(this.props.draft.body || "");
    this.setState({
      open: true,
      stage: "input",
      extracted: text,
      improved: null,
      error: null,
      panelPos,
    });
  };

  _closePanel = () => {
    this.setState({ open: false, stage: "input", extracted: null, improved: null, error: null });
  };

  _onImprove = async () => {
    const { extracted, instruction } = this.state;
    if (!instruction.trim() || !extracted || !extracted.trim()) {
      return;
    }
    this.setState({ stage: "loading", improved: null, error: null });
    try {
      const improved = await improveDraft(extracted, instruction.trim());
      if (this._unmounted || !this.state.open) return;
      this.setState({ stage: "preview", improved });
    } catch (err) {
      if (this._unmounted || !this.state.open) return;
      this.setState({ stage: "error", error: err.message });
    }
  };

  _onInstructionKeyDown = event => {
    // Enter envía; Shift+Enter hace salto de línea; Escape cierra.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this._onImprove();
    } else if (event.key === "Escape") {
      this._closePanel();
    }
  };

  _renderInput() {
    const { extracted, instruction } = this.state;
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

  _renderBody() {
    const { stage, improved, error } = this.state;
    if (stage === "loading") {
      return <div className="panel-body loading">Mejorando el borrador con Claude…</div>;
    }
    if (stage === "error") {
      return (
        <div>
          <div className="panel-body error">{error}</div>
          <div className="panel-actions">
            <button className="btn" onClick={() => this.setState({ stage: "input", error: null })}>
              Volver
            </button>
          </div>
        </div>
      );
    }
    if (stage === "preview") {
      return <div className="panel-body">{improved}</div>;
    }
    return this._renderInput();
  }

  _renderPanel() {
    return (
      <div className="claude-improve-panel" style={this.state.panelPos}>
        <div className="panel-header">
          <span className="panel-title">Mejorar con Claude</span>
          <button className="btn panel-close" onClick={this._closePanel}>
            ✕
          </button>
        </div>
        {this._renderBody()}
      </div>
    );
  }

  render() {
    return (
      <div className="claude-improve-draft">
        <button
          className="btn btn-toolbar"
          title="Mejorar con Claude"
          onClick={this._onClick}
        >
          Mejorar con Claude
        </button>
        {/* Portal a document.body: en la vista lateral el compositor vive
            dentro de un contenedor con transform que re-ancla position:fixed
            y recorta el panel. En el body no hay nada que lo recorte. */}
        {this.state.open && ReactDOM.createPortal(this._renderPanel(), document.body)}
      </div>
    );
  }
}
