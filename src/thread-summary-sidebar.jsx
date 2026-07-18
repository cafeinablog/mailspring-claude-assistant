import { React } from "mailspring-exports";
import { getFocusedThreadPlainText } from "./thread-text";

/*
 * Sidebar del hilo: tarjeta "Claude" con el botón "Resumir hilo".
 *
 * DEV-03: UI del botón y estados del panel (idle / loading / done / error).
 * DEV-04: al hacer click se extrae el texto plano real del hilo enfocado
 * (MessageStore) y se muestra como verificación. En DEV-05 ese texto se
 * mandará a la API de Claude y el panel mostrará el resumen.
 */
export default class ThreadSummarySidebar extends React.Component {
  static displayName = "ClaudeThreadSummary";

  constructor(props) {
    super(props);
    // status: "idle" | "loading" | "done" | "error"
    this.state = { status: "idle", summary: null, error: null };
  }

  _onSummarize = () => {
    this.setState({ status: "loading", summary: null, error: null });

    // DEV-04: extrae el texto plano del hilo y lo muestra como verificación.
    // En DEV-05 este texto se mandará a la API de Claude.
    const extracted = getFocusedThreadPlainText();
    if (!extracted) {
      this.setState({
        status: "error",
        error: "No hay un hilo abierto (o sus mensajes siguen cargando). Abre un hilo e inténtalo de nuevo.",
      });
      return;
    }

    const MAX_PREVIEW = 2000;
    const preview =
      extracted.text.length > MAX_PREVIEW
        ? `${extracted.text.slice(0, MAX_PREVIEW)}\n\n… (${extracted.text.length} caracteres en total)`
        : extracted.text;

    this.setState({
      status: "done",
      summary:
        `(DEV-04: texto plano extraído — ${extracted.messageCount} mensajes)\n\n${preview}`,
    });
  };

  _renderBody() {
    const { status, summary, error } = this.state;
    if (status === "loading") {
      return <div className="summary-body loading">Generando resumen…</div>;
    }
    if (status === "error") {
      return <div className="summary-body error">{error}</div>;
    }
    if (status === "done") {
      return <div className="summary-body">{summary}</div>;
    }
    return null;
  }

  render() {
    const { status } = this.state;
    return (
      <div className="claude-thread-summary">
        <div className="header">
          <h2>Claude</h2>
        </div>
        <button
          className="btn btn-emphasis summarize-btn"
          disabled={status === "loading"}
          onClick={this._onSummarize}
        >
          {status === "loading" ? "Resumiendo…" : "Resumir hilo"}
        </button>
        {this._renderBody()}
      </div>
    );
  }
}

// Le dice a Mailspring cómo dimensionar la columna del sidebar.
ThreadSummarySidebar.containerStyles = {
  order: 1,
  flexShrink: 0,
};
