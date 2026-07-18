"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_text_1 = require("./thread-text");
const claude_client_1 = require("./claude-client");
/*
 * Sidebar del hilo: tarjeta "Claude" con dos botones de resumen.
 *
 * DEV-03: UI y estados del panel (idle / loading / done / error).
 * DEV-04: extracción de texto plano del hilo (MessageStore).
 * DEV-05/06: llamada real a la API de Claude y panel de resultado.
 *   - Resumen rápido → Haiku 4.5 (económico)
 *   - Resumen detallado → Sonnet 5 (más calidad)
 */
class ThreadSummarySidebar extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onSummarize = async (detailed) => {
            const mode = detailed ? "detailed" : "fast";
            const extracted = thread_text_1.getFocusedThreadPlainText();
            if (!extracted) {
                this.setState({
                    status: "error",
                    mode,
                    summary: null,
                    error: "No hay un hilo abierto (o sus mensajes siguen cargando). Abre un hilo e inténtalo de nuevo.",
                });
                return;
            }
            this.setState({ status: "loading", mode, summary: null, error: null });
            try {
                const summary = await claude_client_1.summarizeThread(extracted.text, { detailed });
                if (!this._mounted)
                    return;
                this.setState({ status: "done", mode, summary });
            }
            catch (err) {
                if (!this._mounted)
                    return;
                this.setState({ status: "error", mode, error: err.message });
            }
        };
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
    _renderBody() {
        const { status, summary, error } = this.state;
        if (status === "loading") {
            return mailspring_exports_1.React.createElement("div", { className: "summary-body loading" }, "Generando resumen\u2026");
        }
        if (status === "error") {
            return mailspring_exports_1.React.createElement("div", { className: "summary-body error" }, error);
        }
        if (status === "done") {
            return mailspring_exports_1.React.createElement("div", { className: "summary-body" }, summary);
        }
        return null;
    }
    render() {
        const { status, mode } = this.state;
        const loading = status === "loading";
        return (mailspring_exports_1.React.createElement("div", { className: "claude-thread-summary" },
            mailspring_exports_1.React.createElement("div", { className: "header" },
                mailspring_exports_1.React.createElement("h2", null, "Claude")),
            mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis summarize-btn", disabled: loading, onClick: () => this._onSummarize(false) }, loading && mode === "fast" ? "Resumiendo…" : "Resumen rápido"),
            mailspring_exports_1.React.createElement("button", { className: "btn summarize-btn", disabled: loading, onClick: () => this._onSummarize(true) }, loading && mode === "detailed" ? "Resumiendo…" : "Resumen detallado"),
            this._renderBody()));
    }
}
exports.default = ThreadSummarySidebar;
ThreadSummarySidebar.displayName = "ClaudeThreadSummary";
// Le dice a Mailspring cómo dimensionar la columna del sidebar.
ThreadSummarySidebar.containerStyles = {
    order: 1,
    flexShrink: 0,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktc2lkZWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90aHJlYWQtc3VtbWFyeS1zaWRlYmFyLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUEyQztBQUMzQywrQ0FBMEQ7QUFDMUQsbURBQWtEO0FBRWxEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBcUIsb0JBQXFCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBRy9ELFlBQVksS0FBSztRQUNmLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQWVmLGlCQUFZLEdBQUcsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFO1lBQzlCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDNUMsTUFBTSxTQUFTLEdBQUcsdUNBQXlCLEVBQUUsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ1osTUFBTSxFQUFFLE9BQU87b0JBQ2YsSUFBSTtvQkFDSixPQUFPLEVBQUUsSUFBSTtvQkFDYixLQUFLLEVBQ0gsNkZBQTZGO2lCQUNoRyxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdkUsSUFBSTtnQkFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLCtCQUFlLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUTtvQkFBRSxPQUFPO2dCQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FB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