import { React } from "mailspring-exports";

/*
 * Sidebar del hilo: tarjeta "Claude" con el botón "Resumir hilo".
 *
 * DEV-03: solo la UI del botón y los estados del panel (idle / loading /
 * summary / error) con contenido placeholder. La lectura real de los
 * mensajes del hilo llega en DEV-04 y la llamada a la API en DEV-05.
 */
export default class ThreadSummarySidebar extends React.Component {
  static displayName = "ClaudeThreadSummary";

  constructor(props) {
    super(props);
    // status: "idle" | "loading" | "done" | "error"
    this.state = { status: "idle", summary: null, error: null };
  }

  _onSummarize = () => {
    // Placeholder DEV-03: simula el ciclo loading -> done sin tocar
    // MessageStore ni la API todavía.
    this.setState({ status: "loading", summary: null, error: null });
    this._timer = setTimeout(() => {
      this.setState({
        status: "done",
        summary:
          "(Placeholder) Aquí aparecerá el resumen del hilo generado por Claude. " +
          "La lectura de mensajes (DEV-04) y la llamada a la API (DEV-05) vienen después.",
      });
    }, 600);
  };

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

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
