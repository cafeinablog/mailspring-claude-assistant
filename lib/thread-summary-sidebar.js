"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_text_1 = require("./thread-text");
/*
 * Sidebar del hilo: tarjeta "Claude" con el botón "Resumir hilo".
 *
 * DEV-03: UI del botón y estados del panel (idle / loading / done / error).
 * DEV-04: al hacer click se extrae el texto plano real del hilo enfocado
 * (MessageStore) y se muestra como verificación. En DEV-05 ese texto se
 * mandará a la API de Claude y el panel mostrará el resumen.
 */
class ThreadSummarySidebar extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onSummarize = () => {
            this.setState({ status: "loading", summary: null, error: null });
            // DEV-04: extrae el texto plano del hilo y lo muestra como verificación.
            // En DEV-05 este texto se mandará a la API de Claude.
            const extracted = thread_text_1.getFocusedThreadPlainText();
            if (!extracted) {
                this.setState({
                    status: "error",
                    error: "No hay un hilo abierto (o sus mensajes siguen cargando). Abre un hilo e inténtalo de nuevo.",
                });
                return;
            }
            const MAX_PREVIEW = 2000;
            const preview = extracted.text.length > MAX_PREVIEW
                ? `${extracted.text.slice(0, MAX_PREVIEW)}\n\n… (${extracted.text.length} caracteres en total)`
                : extracted.text;
            this.setState({
                status: "done",
                summary: `(DEV-04: texto plano extraído — ${extracted.messageCount} mensajes)\n\n${preview}`,
            });
        };
        // status: "idle" | "loading" | "done" | "error"
        this.state = { status: "idle", summary: null, error: null };
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
        const { status } = this.state;
        return (mailspring_exports_1.React.createElement("div", { className: "claude-thread-summary" },
            mailspring_exports_1.React.createElement("div", { className: "header" },
                mailspring_exports_1.React.createElement("h2", null, "Claude")),
            mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis summarize-btn", disabled: status === "loading", onClick: this._onSummarize }, status === "loading" ? "Resumiendo…" : "Resumir hilo"),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktc2lkZWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90aHJlYWQtc3VtbWFyeS1zaWRlYmFyLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUEyQztBQUMzQywrQ0FBMEQ7QUFFMUQ7Ozs7Ozs7R0FPRztBQUNILE1BQXFCLG9CQUFxQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUcvRCxZQUFZLEtBQUs7UUFDZixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFLZixpQkFBWSxHQUFHLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRWpFLHlFQUF5RTtZQUN6RSxzREFBc0Q7WUFDdEQsTUFBTSxTQUFTLEdBQUcsdUNBQXlCLEVBQUUsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ1osTUFBTSxFQUFFLE9BQU87b0JBQ2YsS0FBSyxFQUFFLDZGQUE2RjtpQkFDckcsQ0FBQyxDQUFDO2dCQUNILE9BQU87YUFDUjtZQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQztZQUN6QixNQUFNLE9BQU8sR0FDWCxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXO2dCQUNqQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLFVBQVUsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLHVCQUF1QjtnQkFDL0YsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFFckIsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDWixNQUFNLEVBQUUsTUFBTTtnQkFDZCxPQUFPLEVBQ0wsbUNBQW1DLFNBQVMsQ0FBQyxZQUFZLGlCQUFpQixPQUFPLEVBQUU7YUFDdEYsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBN0JBLGdEQUFnRDtRQUNoRCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBNkJELFdBQVc7UUFDVCxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzlDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixPQUFPLGtEQUFLLFNBQVMsRUFBQyxzQkFBc0IsOEJBQXlCLENBQUM7U0FDdkU7UUFDRCxJQUFJLE1BQU0sS0FBSyxPQUFPLEVBQUU7WUFDdEIsT0FBTyxrREFBSyxTQUFTLEVBQUMsb0JBQW9CLElBQUUsS0FBSyxDQUFPLENBQUM7U0FDMUQ7UUFDRCxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7WUFDckIsT0FBTyxrREFBSyxTQUFTLEVBQUMsY0FBYyxJQUFFLE9BQU8sQ0FBTyxDQUFDO1NBQ3REO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzlCLE9BQU8sQ0FDTCxrREFBSyxTQUFTLEVBQUMsdUJBQXVCO1lBQ3BDLGtEQUFLLFNBQVMsRUFBQyxRQUFRO2dCQUNyQiw4REFBZSxDQUNYO1lBQ04scURBQ0UsU0FBUyxFQUFDLGdDQUFnQyxFQUMxQyxRQUFRLEVBQUUsTUFBTSxLQUFLLFNBQVMsRUFDOUIsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLElBRXpCLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUMvQztZQUNSLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FDZixDQUNQLENBQUM7SUFDSixDQUFDOztBQW5FSCx1Q0FvRUM7QUFuRVEsZ0NBQVcsR0FBRyxxQkFBcUIsQ0FBQztBQXFFN0MsZ0VBQWdFO0FBQ2hFLG9CQUFvQixDQUFDLGVBQWUsR0FBRztJQUNyQyxLQUFLLEVBQUUsQ0FBQztJQUNSLFVBQVUsRUFBRSxDQUFDO0NBQ2QsQ0FBQyJ9