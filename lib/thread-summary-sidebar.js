"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
/*
 * Sidebar del hilo: tarjeta "Claude" con el botón "Resumir hilo".
 *
 * DEV-03: solo la UI del botón y los estados del panel (idle / loading /
 * summary / error) con contenido placeholder. La lectura real de los
 * mensajes del hilo llega en DEV-04 y la llamada a la API en DEV-05.
 */
class ThreadSummarySidebar extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onSummarize = () => {
            // Placeholder DEV-03: simula el ciclo loading -> done sin tocar
            // MessageStore ni la API todavía.
            this.setState({ status: "loading", summary: null, error: null });
            this._timer = setTimeout(() => {
                this.setState({
                    status: "done",
                    summary: "(Placeholder) Aquí aparecerá el resumen del hilo generado por Claude. " +
                        "La lectura de mensajes (DEV-04) y la llamada a la API (DEV-05) vienen después.",
                });
            }, 600);
        };
        // status: "idle" | "loading" | "done" | "error"
        this.state = { status: "idle", summary: null, error: null };
    }
    componentWillUnmount() {
        clearTimeout(this._timer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktc2lkZWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90aHJlYWQtc3VtbWFyeS1zaWRlYmFyLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUEyQztBQUUzQzs7Ozs7O0dBTUc7QUFDSCxNQUFxQixvQkFBcUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFHL0QsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBS2YsaUJBQVksR0FBRyxHQUFHLEVBQUU7WUFDbEIsZ0VBQWdFO1lBQ2hFLGtDQUFrQztZQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDWixNQUFNLEVBQUUsTUFBTTtvQkFDZCxPQUFPLEVBQ0wsd0VBQXdFO3dCQUN4RSxnRkFBZ0Y7aUJBQ25GLENBQUMsQ0FBQztZQUNMLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNWLENBQUMsQ0FBQztRQWhCQSxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDOUQsQ0FBQztJQWdCRCxvQkFBb0I7UUFDbEIsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsV0FBVztRQUNULE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDOUMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3hCLE9BQU8sa0RBQUssU0FBUyxFQUFDLHNCQUFzQiw4QkFBeUIsQ0FBQztTQUN2RTtRQUNELElBQUksTUFBTSxLQUFLLE9BQU8sRUFBRTtZQUN0QixPQUFPLGtEQUFLLFNBQVMsRUFBQyxvQkFBb0IsSUFBRSxLQUFLLENBQU8sQ0FBQztTQUMxRDtRQUNELElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUNyQixPQUFPLGtEQUFLLFNBQVMsRUFBQyxjQUFjLElBQUUsT0FBTyxDQUFPLENBQUM7U0FDdEQ7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNO1FBQ0osTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDOUIsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyx1QkFBdUI7WUFDcEMsa0RBQUssU0FBUyxFQUFDLFFBQVE7Z0JBQ3JCLDhEQUFlLENBQ1g7WUFDTixxREFDRSxTQUFTLEVBQUMsZ0NBQWdDLEVBQzFDLFFBQVEsRUFBRSxNQUFNLEtBQUssU0FBUyxFQUM5QixPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksSUFFekIsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQy9DO1lBQ1IsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUNmLENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBMURILHVDQTJEQztBQTFEUSxnQ0FBVyxHQUFHLHFCQUFxQixDQUFDO0FBNEQ3QyxnRUFBZ0U7QUFDaEUsb0JBQW9CLENBQUMsZUFBZSxHQUFHO0lBQ3JDLEtBQUssRUFBRSxDQUFDO0lBQ1IsVUFBVSxFQUFFLENBQUM7Q0FDZCxDQUFDIn0=