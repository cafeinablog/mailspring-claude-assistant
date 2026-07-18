import { React, PropTypes, DatabaseStore, Message } from "mailspring-exports";
import ThreadSummaryPanel from "./thread-summary-panel";
import { buildThreadText } from "./thread-text";

/*
 * DEV-15 · Opción C: resumen del hilo dentro del compositor, vía el rol nativo
 * Composer:Footer (mismo punto donde Plantillas pone su barra de estado).
 *
 * A diferencia de la opción A, aquí no se pueden leer los mensajes de
 * MessageStore: en la ventana emergente del compositor sigue al hilo de la
 * ventana principal (o no hay ninguno). Por eso se cargan por threadId con una
 * query directa a la base (mismo patrón que MessageStore internamente).
 *
 * En un mensaje nuevo (sin threadId) el recuadro no se muestra.
 */
export default class ComposerSummaryFooter extends React.Component {
  static displayName = "ClaudeComposerSummaryFooter";

  static propTypes = {
    draft: PropTypes.object,
    threadId: PropTypes.string,
    session: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { messageCount: null }; // null = aún no cargado
  }

  componentDidMount() {
    this._mounted = true;
    if (this.props.threadId) this._refreshCount();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.threadId !== this.props.threadId && this.props.threadId) {
      this._refreshCount();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  // Query a la base: mensajes del hilo (con body), sin borradores ni ocultos,
  // ordenados por fecha. Devuelve Promise<Message[]>.
  _queryMessages() {
    const { threadId } = this.props;
    if (!threadId) return Promise.resolve([]);
    return DatabaseStore.findAll(Message)
      .where({ threadId })
      .include(Message.attributes.body)
      .then(items => {
        const msgs = items.filter(m => !m.draft && !(m.isHidden && m.isHidden()));
        msgs.sort((a, b) => new Date(a.date) - new Date(b.date));
        return msgs;
      });
  }

  // Mantiene messageCount al día para el aviso "N mensajes nuevos" del panel.
  _refreshCount() {
    this._queryMessages().then(msgs => {
      if (this._mounted) this.setState({ messageCount: msgs.length });
    });
  }

  _getThreadData = () => {
    return this._queryMessages().then(msgs => {
      if (msgs.length === 0) return null;
      return {
        text: buildThreadText(this.props.draft && this.props.draft.subject, msgs),
        messageCount: msgs.length,
      };
    });
  };

  render() {
    if (!this.props.threadId) return null;
    return (
      <ThreadSummaryPanel
        threadId={this.props.threadId}
        messageCount={this.state.messageCount}
        getThreadData={this._getThreadData}
        variant="composer"
      />
    );
  }
}
