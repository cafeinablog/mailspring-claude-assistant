import { React, PropTypes, localized } from "mailspring-exports";
import store from "./summary-store";
import { t } from "./i18n";

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
  if (!id) return "";
  const base = id.replace(/^claude-/, "").replace(/-.*$/, "");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function relativeTime(ts) {
  if (!ts) return "";
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", mins);
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return t("hoursAgo", hrs);
  const days = Math.round(hrs / 24);
  return t("daysAgo", days);
}

export default class ThreadSummaryPanel extends React.Component {
  static displayName = "ClaudeThreadSummaryPanel";

  static propTypes = {
    threadId: PropTypes.string,
    messageCount: PropTypes.number,
    getThreadData: PropTypes.func.isRequired,
    // "header" (cabecera del hilo) | "composer" (pie del compositor). Solo
    // cambia el margen; el resto del estilo es idéntico.
    variant: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { collapsed: store.getCollapsed(), error: null };
  }

  componentDidMount() {
    this._mounted = true;
    // Refresca cuando el store cambia (esta ventana u otra).
    this._unsub = store.listen(() => this._mounted && this.forceUpdate());
  }

  componentWillUnmount() {
    this._mounted = false;
    if (this._unsub) this._unsub();
  }

  _onGenerate = async () => {
    this.setState({ error: null });
    let data;
    try {
      data = await this.props.getThreadData();
    } catch (err) {
      data = null;
    }
    if (!this._mounted) return;
    if (!data || !data.text || !data.text.trim()) {
      this.setState({ error: t("threadUnreadable") });
      return;
    }
    try {
      await store.generate(this.props.threadId, data);
    } catch (err) {
      if (this._mounted) this.setState({ error: err.message });
    }
  };

  _toggleCollapsed = () => {
    const collapsed = !this.state.collapsed;
    this.setState({ collapsed });
    store.setCollapsed(collapsed);
  };

  render() {
    const { threadId, messageCount } = this.props;
    if (!threadId) return null;

    const entry = store.get(threadId);
    const generating = store.isGenerating(threadId);
    const newMsgs = store.newMessagesSince(threadId, messageCount);
    const { collapsed, error } = this.state;

    const rootClass = `claude-summary-panel${
      this.props.variant === "composer" ? " in-composer" : ""
    }`;

    return (
      <div className={rootClass}>
        <div className="cs-head">
          <span className="cs-title">
            <span className="cs-sun">✳</span> {t("summaryTitle")}
          </span>
          <span className="cs-grow" />
          {generating ? (
            <button className="btn" disabled>
              {t("generating")}
            </button>
          ) : entry ? (
            <button className="btn" onClick={this._onGenerate}>
              {newMsgs > 0 ? t("updateWithNew", newMsgs) : t("regenerate")}
            </button>
          ) : (
            <button className="btn" onClick={this._onGenerate}>
              {t("generateSummary")}
            </button>
          )}
          {entry && !generating && (
            <button className="btn" onClick={this._toggleCollapsed} aria-expanded={!collapsed}>
              {collapsed ? `${localized("Show")} ▸` : `${localized("Hide")} ▾`}
            </button>
          )}
        </div>

        {error && <div className="cs-body cs-error">{error}</div>}

        {generating && !error && (
          <div className="cs-body cs-muted">{t("generatingWithClaude")}</div>
        )}

        {entry && !generating && !collapsed && (
          <div>
            {newMsgs > 0 && <div className="cs-stale">{t("newMessagesSince", newMsgs)}</div>}
            <div className="cs-body">{entry.text}</div>
            <div className="cs-meta">
              {[modelShort(entry.model), relativeTime(entry.generatedAt), t("messageCount", entry.messageCount)]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}

        {!entry && !generating && !error && (
          <div className="cs-body cs-muted">{t("noSummaryYet")}</div>
        )}
      </div>
    );
  }
}
