"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const summary_store_1 = __importDefault(require("./summary-store"));
const i18n_1 = require("./i18n");
/*
 * Recuadro de resumen del hilo, compartido por la opción A (cabecera del hilo)
 * y la opción C (pie del compositor). Gris neutro, con el ✳ coral como único
 * toque de identidad. Toda la lógica de datos vive en summary-store.
 *
 * El host decide de dónde salen los datos:
 *   - threadId: identidad del hilo (clave de caché).
 *   - messageCount: nº de mensajes actual (para "N nuevos"); puede ser null.
 *   - getThreadData: () => Promise<{ text, messageCount } | null> para generar.
 *
 * DEV-16: meta ("generado hace X · N mensajes") + aviso de mensajes nuevos con
 * botón para regenerar.
 */
function modelShort(id) {
    if (!id)
        return "";
    const base = id.replace(/^claude-/, "").replace(/-.*$/, "");
    return base.charAt(0).toUpperCase() + base.slice(1);
}
function relativeTime(ts) {
    if (!ts)
        return "";
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1)
        return i18n_1.t("justNow");
    if (mins < 60)
        return i18n_1.t("minutesAgo", mins);
    const hrs = Math.round(mins / 60);
    if (hrs < 24)
        return i18n_1.t("hoursAgo", hrs);
    const days = Math.round(hrs / 24);
    return i18n_1.t("daysAgo", days);
}
class ThreadSummaryPanel extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onGenerate = async () => {
            this.setState({ error: null });
            let data;
            try {
                data = await this.props.getThreadData();
            }
            catch (err) {
                data = null;
            }
            if (!this._mounted)
                return;
            if (!data || !data.text || !data.text.trim()) {
                this.setState({ error: i18n_1.t("threadUnreadable") });
                return;
            }
            try {
                await summary_store_1.default.generate(this.props.threadId, data);
            }
            catch (err) {
                if (this._mounted)
                    this.setState({ error: err.message });
            }
        };
        this._toggleCollapsed = () => {
            const collapsed = !this.state.collapsed;
            this.setState({ collapsed });
            summary_store_1.default.setCollapsed(collapsed);
        };
        this.state = { collapsed: summary_store_1.default.getCollapsed(), error: null };
    }
    componentDidMount() {
        this._mounted = true;
        // Refresca cuando el store cambia (esta ventana u otra).
        this._unsub = summary_store_1.default.listen(() => this._mounted && this.forceUpdate());
    }
    componentWillUnmount() {
        this._mounted = false;
        if (this._unsub)
            this._unsub();
    }
    render() {
        const { threadId, messageCount } = this.props;
        if (!threadId)
            return null;
        const entry = summary_store_1.default.get(threadId);
        const generating = summary_store_1.default.isGenerating(threadId);
        const newMsgs = summary_store_1.default.newMessagesSince(threadId, messageCount);
        const { collapsed, error } = this.state;
        const rootClass = `claude-summary-panel${this.props.variant === "composer" ? " in-composer" : ""}`;
        return (mailspring_exports_1.React.createElement("div", { className: rootClass },
            mailspring_exports_1.React.createElement("div", { className: "cs-head" },
                mailspring_exports_1.React.createElement("span", { className: "cs-title" },
                    mailspring_exports_1.React.createElement("span", { className: "cs-sun" }, "\u2733"),
                    " ",
                    i18n_1.t("summaryTitle")),
                mailspring_exports_1.React.createElement("span", { className: "cs-grow" }),
                generating ? (mailspring_exports_1.React.createElement("button", { className: "btn", disabled: true }, i18n_1.t("generating"))) : entry ? (mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._onGenerate }, newMsgs > 0 ? i18n_1.t("updateWithNew", newMsgs) : i18n_1.t("regenerate"))) : (mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._onGenerate }, i18n_1.t("generateSummary"))),
                entry && !generating && (mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._toggleCollapsed, "aria-expanded": !collapsed }, collapsed ? `${mailspring_exports_1.localized("Show")} ▸` : `${mailspring_exports_1.localized("Hide")} ▾`))),
            error && mailspring_exports_1.React.createElement("div", { className: "cs-body cs-error" }, error),
            generating && !error && (mailspring_exports_1.React.createElement("div", { className: "cs-body cs-muted" }, i18n_1.t("generatingWithClaude"))),
            entry && !generating && !collapsed && (mailspring_exports_1.React.createElement("div", null,
                newMsgs > 0 && mailspring_exports_1.React.createElement("div", { className: "cs-stale" }, i18n_1.t("newMessagesSince", newMsgs)),
                mailspring_exports_1.React.createElement("div", { className: "cs-body" }, entry.text),
                mailspring_exports_1.React.createElement("div", { className: "cs-meta" }, [modelShort(entry.model), relativeTime(entry.generatedAt), i18n_1.t("messageCount", entry.messageCount)]
                    .filter(Boolean)
                    .join(" · ")))),
            !entry && !generating && !error && (mailspring_exports_1.React.createElement("div", { className: "cs-body cs-muted" }, i18n_1.t("noSummaryYet")))));
    }
}
exports.default = ThreadSummaryPanel;
ThreadSummaryPanel.displayName = "ClaudeThreadSummaryPanel";
ThreadSummaryPanel.propTypes = {
    threadId: mailspring_exports_1.PropTypes.string,
    messageCount: mailspring_exports_1.PropTypes.number,
    getThreadData: mailspring_exports_1.PropTypes.func.isRequired,
    // "header" (cabecera del hilo) | "composer" (pie del compositor). Solo
    // cambia el margen; el resto del estilo es idéntico.
    variant: mailspring_exports_1.PropTypes.string,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktcGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGhyZWFkLXN1bW1hcnktcGFuZWwuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQWlFO0FBQ2pFLG9FQUFvQztBQUNwQyxpQ0FBMkI7QUFFM0I7Ozs7Ozs7Ozs7OztHQVlHO0FBRUgsU0FBUyxVQUFVLENBQUMsRUFBRTtJQUNwQixJQUFJLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ25CLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEVBQUU7SUFDdEIsSUFBSSxDQUFDLEVBQUU7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQ25ELElBQUksSUFBSSxHQUFHLENBQUM7UUFBRSxPQUFPLFFBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsQyxJQUFJLElBQUksR0FBRyxFQUFFO1FBQUUsT0FBTyxRQUFDLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ2xDLElBQUksR0FBRyxHQUFHLEVBQUU7UUFBRSxPQUFPLFFBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDbEMsT0FBTyxRQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVCLENBQUM7QUFFRCxNQUFxQixrQkFBbUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFZN0QsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBZWYsZ0JBQVcsR0FBRyxLQUFLLElBQUksRUFBRTtZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDL0IsSUFBSSxJQUFJLENBQUM7WUFDVCxJQUFJO2dCQUNGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDekM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLEdBQUcsSUFBSSxDQUFDO2FBQ2I7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7Z0JBQUUsT0FBTztZQUMzQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBQyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPO2FBQ1I7WUFDRCxJQUFJO2dCQUNGLE1BQU0sdUJBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDakQ7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLElBQUksQ0FBQyxRQUFRO29CQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDMUQ7UUFDSCxDQUFDLENBQUM7UUFFRixxQkFBZ0IsR0FBRyxHQUFHLEVBQUU7WUFDdEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN4QyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM3Qix1QkFBSyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUM7UUF0Q0EsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLFNBQVMsRUFBRSx1QkFBSyxDQUFDLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRUQsaUJBQWlCO1FBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIseURBQXlEO1FBQ3pELElBQUksQ0FBQyxNQUFNLEdBQUcsdUJBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsb0JBQW9CO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLElBQUksSUFBSSxDQUFDLE1BQU07WUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQTRCRCxNQUFNO1FBQ0osTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzlDLElBQUksQ0FBQyxRQUFRO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFM0IsTUFBTSxLQUFLLEdBQUcsdUJBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsTUFBTSxVQUFVLEdBQUcsdUJBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQUcsdUJBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDL0QsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRXhDLE1BQU0sU0FBUyxHQUFHLHVCQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFDdkQsRUFBRSxDQUFDO1FBRUgsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBRSxTQUFTO1lBQ3ZCLGtEQUFLLFNBQVMsRUFBQyxTQUFTO2dCQUN0QixtREFBTSxTQUFTLEVBQUMsVUFBVTtvQkFDeEIsbURBQU0sU0FBUyxFQUFDLFFBQVEsYUFBUzs7b0JBQUUsUUFBQyxDQUFDLGNBQWMsQ0FBQyxDQUMvQztnQkFDUCxtREFBTSxTQUFTLEVBQUMsU0FBUyxHQUFHO2dCQUMzQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQ1oscURBQVEsU0FBUyxFQUFDLEtBQUssRUFBQyxRQUFRLFVBQzdCLFFBQUMsQ0FBQyxZQUFZLENBQUMsQ0FDVCxDQUNWLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FDVixxREFBUSxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxJQUM5QyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFDLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFDLENBQUMsWUFBWSxDQUFDLENBQ3JELENBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FDRixxREFBUSxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxJQUM5QyxRQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FDZCxDQUNWO2dCQUNBLEtBQUssSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUN2QixxREFBUSxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLG1CQUFpQixDQUFDLFNBQVMsSUFDOUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLDhCQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyw4QkFBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ3pELENBQ1YsQ0FDRztZQUVMLEtBQUssSUFBSSxrREFBSyxTQUFTLEVBQUMsa0JBQWtCLElBQUUsS0FBSyxDQUFPO1lBRXhELFVBQVUsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUN2QixrREFBSyxTQUFTLEVBQUMsa0JBQWtCLElBQUUsUUFBQyxDQUFDLHNCQUFzQixDQUFDLENBQU8sQ0FDcEU7WUFFQSxLQUFLLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxTQUFTLElBQUksQ0FDckM7Z0JBQ0csT0FBTyxHQUFHLENBQUMsSUFBSSxrREFBSyxTQUFTLEVBQUMsVUFBVSxJQUFFLFFBQUMsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBTztnQkFDaEYsa0RBQUssU0FBUyxFQUFDLFNBQVMsSUFBRSxLQUFLLENBQUMsSUFBSSxDQUFPO2dCQUMzQyxrREFBSyxTQUFTLEVBQUMsU0FBUyxJQUNyQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFDLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDL0YsTUFBTSxDQUFDLE9BQU8sQ0FBQztxQkFDZixJQUFJLENBQUMsS0FBSyxDQUFDLENBQ1YsQ0FDRixDQUNQO1lBRUEsQ0FBQyxLQUFLLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLElBQUksQ0FDbEMsa0RBQUssU0FBUyxFQUFDLGtCQUFrQixJQUFFLFFBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBTyxDQUM1RCxDQUNHLENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBckhILHFDQXNIQztBQXJIUSw4QkFBVyxHQUFHLDBCQUEwQixDQUFDO0FBRXpDLDRCQUFTLEdBQUc7SUFDakIsUUFBUSxFQUFFLDhCQUFTLENBQUMsTUFBTTtJQUMxQixZQUFZLEVBQUUsOEJBQVMsQ0FBQyxNQUFNO0lBQzlCLGFBQWEsRUFBRSw4QkFBUyxDQUFDLElBQUksQ0FBQyxVQUFVO0lBQ3hDLHVFQUF1RTtJQUN2RSxxREFBcUQ7SUFDckQsT0FBTyxFQUFFLDhCQUFTLENBQUMsTUFBTTtDQUMxQixDQUFDIn0=