import { React, PropTypes } from "mailspring-exports";
import ThreadSummaryPanel from "./thread-summary-panel";
import { buildThreadText } from "./thread-text";

/*
 * DEV-14 · Opción A: resumen del hilo en la cabecera del hilo, vía el rol
 * nativo MessageListHeaders (recibe `thread` y `messages` como props). Es un
 * envoltorio delgado: arma los datos del hilo y delega el recuadro y toda la
 * lógica a ThreadSummaryPanel (compartido con la opción C).
 *
 * Reemplaza a la antigua tarjeta del sidebar de contactos (que competía con el
 * sidebar Pro y quedaba apretada).
 */
export default class ThreadSummaryHeader extends React.Component {
  static displayName = "ClaudeThreadSummaryHeader";

  static propTypes = {
    thread: PropTypes.object,
    messages: PropTypes.array,
  };

  _realMessages() {
    return (this.props.messages || []).filter(m => !m.draft);
  }

  // Los props ya traen thread + messages (con body): construir el texto es
  // síncrono, sin tocar MessageStore.
  _getThreadData = () => {
    const messages = this._realMessages();
    if (messages.length === 0) return Promise.resolve(null);
    const subject = this.props.thread && this.props.thread.subject;
    return Promise.resolve({
      text: buildThreadText(subject, messages),
      messageCount: messages.length,
    });
  };

  render() {
    const { thread } = this.props;
    if (!thread) return null;
    return (
      <ThreadSummaryPanel
        threadId={thread.id}
        messageCount={this._realMessages().length}
        getThreadData={this._getThreadData}
      />
    );
  }
}
