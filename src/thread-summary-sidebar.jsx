import { React } from "mailspring-exports";
import { getFocusedThreadPlainText } from "./thread-text";
import { summarizeThread } from "./claude-client";

/*
 * Sidebar del hilo: tarjeta "Claude" con dos botones de resumen.
 *
 * DEV-03: UI y estados del panel (idle / loading / done / error).
 * DEV-04: extracción de texto plano del hilo (MessageStore).
 * DEV-05/06: llamada real a la API de Claude y panel de resultado.
 *   - Resumen rápido → Haiku 4.5 (económico)
 *   - Resumen detallado → Sonnet 5 (más calidad)
 */
export default class ThreadSummarySidebar extends React.Component {
  static displayName = "ClaudeThreadSummary";

  constructor(props) {
    super(props);
    // status: "idle" | "loading" | "done" | "error"
    // mode: "fast" | "detailed" (cuál botón disparó la carga)
    this.state = { status: "idle", mode: null, summary: null, error: null };
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _onSummarize = async detailed => {
    const mode = detailed ? "detailed" : "fast";
    const extracted = getFocusedThreadPlainText();
    if (!extracted) {
      this.setState({
        status: "error",
        mode,
        summary: null,
        error:
          "No hay un hilo abierto (o sus mensajes siguen cargando). Abre un hilo e inténtalo de nuevo.",
      });
      return;
    }

    this.setState({ status: "loading", mode, summary: null, error: null });
    try {
      const summary = await summarizeThread(extracted.text, { detailed });
      if (!this._mounted) return;
      this.setState({ status: "done", mode, summary });
    } catch (err) {
      if (!this._mounted) return;
      this.setState({ status: "error", mode, error: err.message });
    }
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
    const { status, mode } = this.state;
    const loading = status === "loading";
    return (
      <div className="claude-thread-summary">
        <div className="header">
          <h2>Claude</h2>
        </div>
        <button
          className="btn btn-emphasis summarize-btn"
          disabled={loading}
          onClick={() => this._onSummarize(false)}
        >
          {loading && mode === "fast" ? "Resumiendo…" : "Resumen rápido"}
        </button>
        <button
          className="btn summarize-btn"
          disabled={loading}
          onClick={() => this._onSummarize(true)}
        >
          {loading && mode === "detailed" ? "Resumiendo…" : "Resumen detallado"}
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
