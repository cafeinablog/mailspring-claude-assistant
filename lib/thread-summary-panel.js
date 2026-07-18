"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const summary_store_1 = __importDefault(require("./summary-store"));
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
        return "hace un momento";
    if (mins < 60)
        return `hace ${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24)
        return `hace ${hrs} h`;
    const days = Math.round(hrs / 24);
    return `hace ${days} d`;
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
                this.setState({ error: "No se pudo leer el hilo (o sus mensajes siguen cargando)." });
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
        return (mailspring_exports_1.React.createElement("div", { className: "claude-summary-panel" },
            mailspring_exports_1.React.createElement("div", { className: "cs-head" },
                mailspring_exports_1.React.createElement("span", { className: "cs-title" },
                    mailspring_exports_1.React.createElement("span", { className: "cs-sun" }, "\u2733"),
                    " Resumen del hilo"),
                mailspring_exports_1.React.createElement("span", { className: "cs-grow" }),
                generating ? (mailspring_exports_1.React.createElement("button", { className: "btn cs-btn", disabled: true }, "Generando\u2026")) : entry ? (mailspring_exports_1.React.createElement("button", { className: "btn cs-btn", onClick: this._onGenerate }, newMsgs > 0 ? `Actualizar (${newMsgs} ${newMsgs === 1 ? "nuevo" : "nuevos"})` : "Regenerar")) : (mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis cs-btn", onClick: this._onGenerate }, "Generar resumen")),
                entry && !generating && (mailspring_exports_1.React.createElement("button", { className: "btn cs-btn cs-toggle", onClick: this._toggleCollapsed, "aria-expanded": !collapsed }, collapsed ? "Mostrar ▸" : "Ocultar ▾"))),
            error && mailspring_exports_1.React.createElement("div", { className: "cs-body cs-error" }, error),
            generating && !error && (mailspring_exports_1.React.createElement("div", { className: "cs-body cs-muted" }, "Generando resumen con Claude\u2026")),
            entry && !generating && !collapsed && (mailspring_exports_1.React.createElement("div", null,
                newMsgs > 0 && (mailspring_exports_1.React.createElement("div", { className: "cs-stale" },
                    "Llegaron ",
                    newMsgs,
                    " ",
                    newMsgs === 1 ? "mensaje nuevo" : "mensajes nuevos",
                    " desde este resumen.")),
                mailspring_exports_1.React.createElement("div", { className: "cs-body" }, entry.text),
                mailspring_exports_1.React.createElement("div", { className: "cs-meta" }, [modelShort(entry.model), relativeTime(entry.generatedAt), `${entry.messageCount} mensajes`]
                    .filter(Boolean)
                    .join(" · ")))),
            !entry && !generating && !error && (mailspring_exports_1.React.createElement("div", { className: "cs-body cs-muted" }, "A\u00FAn no hay resumen de este hilo."))));
    }
}
exports.default = ThreadSummaryPanel;
ThreadSummaryPanel.displayName = "ClaudeThreadSummaryPanel";
ThreadSummaryPanel.propTypes = {
    threadId: mailspring_exports_1.PropTypes.string,
    messageCount: mailspring_exports_1.PropTypes.number,
    getThreadData: mailspring_exports_1.PropTypes.func.isRequired,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktcGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGhyZWFkLXN1bW1hcnktcGFuZWwuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQXNEO0FBQ3RELG9FQUFvQztBQUVwQzs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxTQUFTLFVBQVUsQ0FBQyxFQUFFO0lBQ3BCLElBQUksQ0FBQyxFQUFFO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFDbkIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1RCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsRUFBRTtJQUN0QixJQUFJLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDbkQsSUFBSSxJQUFJLEdBQUcsQ0FBQztRQUFFLE9BQU8saUJBQWlCLENBQUM7SUFDdkMsSUFBSSxJQUFJLEdBQUcsRUFBRTtRQUFFLE9BQU8sUUFBUSxJQUFJLE1BQU0sQ0FBQztJQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztJQUNsQyxJQUFJLEdBQUcsR0FBRyxFQUFFO1FBQUUsT0FBTyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ3JDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFH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