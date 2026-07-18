import { React, PropTypes } from "mailspring-exports";
import store from "./summary-store";

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
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `hace ${days} d`;
}

export default class ThreadSummaryPanel extends React.Component {
  static displayName = "ClaudeThreadSummaryPanel";

  static propTypes = {
    threadId: PropTypes.string,
    messageCount: PropTypes.number,
    getThreadData: PropTypes.func.isRequired,
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
      this.setState({ error: "No se pudo leer el hilo (o sus mensajes siguen cargando)." });
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

    return (
      <div className="claude-summary-panel">
        <div className="cs-head">
          <span className="cs-title">
            <span className="cs-sun">✳</span> Resumen del hilo
          </span>
          <span className="cs-grow" />
          {generating ? (
            <button className="btn cs-btn" disabled>
              Generando…
            </button>
          ) : entry ? (
            <button className="btn cs-btn" onClick={this._onGenerate}>
              {newMsgs > 0 ? `Actualizar (${newMsgs} ${newMsgs === 1 ? "nuevo" : "nuevos"})` : "Regenerar"}
            </button>
          ) : (
            <button className="btn btn-emphasis cs-btn" onClick={this._onGenerate}>
              Generar resumen
            </button>
          )}
          {entry && !generating && (
            <button
              className="btn cs-btn cs-toggle"
              onClick={this._toggleCollapsed}
              aria-expanded={!collapsed}
            >
              {collapsed ? "Mostrar ▸" : "Ocultar ▾"}
            </button>
          )}
        </div>

        {error && <div className="cs-body cs-error">{error}</div>}

        {generating && !error && (
          <div className="cs-body cs-muted">Generando resumen con Claude…</div>
        )}

        {entry && !generating && !collapsed && (
          <div>
            {newMsgs > 0 && (
              <div className="cs-stale">
                Llegaron {newMsgs} {newMsgs === 1 ? "mensaje nuevo" : "mensajes nuevos"} desde este
                resumen.
              </div>
            )}
            <div className="cs-body">{entry.text}</div>
            <div className="cs-meta">
              {[modelShort(entry.model), relativeTime(entry.generatedAt), `${entry.messageCount} mensajes`]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}

        {!entry && !generating && !error && (
          <div className="cs-body cs-muted">
            Aún no hay resumen de este hilo.
          </div>
        )}
      </div>
    );
  }
}
