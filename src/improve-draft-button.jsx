import { React, ReactDOM, PropTypes } from "mailspring-exports";
import { htmlToPlainText } from "./thread-text";

/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador actual (draft.body es HTML;
 *   se convierte con htmlToPlainText, sin tocar nunca el HTML del editor).
 *   Como verificación, el texto extraído se muestra en un panel flotante.
 * DEV-09/10 (pendientes): campo de instrucción libre + llamada a Claude +
 *   vista previa con Aplicar / Descartar.
 */
export default class ImproveDraftButton extends React.Component {
  static displayName = "ClaudeImproveDraftButton";

  static propTypes = {
    draft: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { open: false, extracted: null, panelPos: null };
  }

  shouldComponentUpdate(nextProps, nextState) {
    // El draft cambia en cada tecla; solo re-renderizamos por nuestro estado
    // o por cambio de sesión (mismo criterio que el starter).
    return nextState !== this.state || nextProps.session !== this.props.session;
  }

  _onClick = event => {
    if (this.state.open) {
      this.setState({ open: false, extracted: null, panelPos: null });
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
    this.setState({ open: true, extracted: text, panelPos });
  };

  _renderPanel() {
    const { extracted, panelPos } = this.state;
    const empty = !extracted || !extracted.trim();
    return (
      <div className="claude-improve-panel" style={panelPos}>
        <div className="panel-header">
          <span className="panel-title">Claude · texto del borrador (DEV-08)</span>
          <button
            className="btn panel-close"
            onClick={() => this.setState({ open: false, extracted: null })}
          >
            ✕
          </button>
        </div>
        <div className={`panel-body${empty ? " empty" : ""}`}>
          {empty
            ? "El borrador está vacío. Escribe algo y vuelve a intentarlo."
            : extracted}
        </div>
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
