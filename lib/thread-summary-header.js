"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_summary_panel_1 = __importDefault(require("./thread-summary-panel"));
const thread_text_1 = require("./thread-text");
/*
 * DEV-14 · Opción A: resumen del hilo en la cabecera del hilo, vía el rol
 * nativo MessageListHeaders (recibe `thread` y `messages` como props). Es un
 * envoltorio delgado: arma los datos del hilo y delega el recuadro y toda la
 * lógica a ThreadSummaryPanel (compartido con la opción C).
 *
 * Reemplaza a la antigua tarjeta del sidebar de contactos (que competía con el
 * sidebar Pro y quedaba apretada).
 */
class ThreadSummaryHeader extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        // Los props ya traen thread + messages (con body): construir el texto es
        // síncrono, sin tocar MessageStore.
        this._getThreadData = () => {
            const messages = this._realMessages();
            if (messages.length === 0)
                return Promise.resolve(null);
            const subject = this.props.thread && this.props.thread.subject;
            return Promise.resolve({
                text: thread_text_1.buildThreadText(subject, messages),
                messageCount: messages.length,
            });
        };
    }
    _realMessages() {
        return (this.props.messages || []).filter(m => !m.draft);
    }
    render() {
        const { thread } = this.props;
        if (!thread)
            return null;
        return (mailspring_exports_1.React.createElement(thread_summary_panel_1.default, { threadId: thread.id, messageCount: this._realMessages().length, getThreadData: this._getThreadData }));
    }
}
exports.default = ThreadSummaryHeader;
ThreadSummaryHeader.displayName = "ClaudeThreadSummaryHeader";
ThreadSummaryHeader.propTypes = {
    thread: mailspring_exports_1.PropTypes.object,
    messages: mailspring_exports_1.PropTypes.array,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXN1bW1hcnktaGVhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RocmVhZC1zdW1tYXJ5LWhlYWRlci5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwyREFBc0Q7QUFDdEQsa0ZBQXdEO0FBQ3hELCtDQUFnRDtBQUVoRDs7Ozs7Ozs7R0FRRztBQUNILE1BQXFCLG1CQUFvQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUFoRTs7UUFZRSx5RUFBeUU7UUFDekUsb0NBQW9DO1FBQ3BDLG1CQUFjLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQztnQkFBRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQy9ELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDckIsSUFBSSxFQUFFLDZCQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztnQkFDeEMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxNQUFNO2FBQzlCLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztJQWFKLENBQUM7SUEzQkMsYUFBYTtRQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBY0QsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzlCLElBQUksQ0FBQyxNQUFNO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDekIsT0FBTyxDQUNMLHlDQUFDLDhCQUFrQixJQUNqQixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFDbkIsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQ3pDLGFBQWEsRUFBRSxJQUFJLENBQUMsY0FBYyxHQUNsQyxDQUNILENBQUM7SUFDSixDQUFDOztBQWxDSCxzQ0FtQ0M7QUFsQ1EsK0JBQVcsR0FBRywyQkFBMkIsQ0FBQztBQUUxQyw2QkFBUyxHQUFHO0lBQ2pCLE1BQU0sRUFBRSw4QkFBUyxDQUFDLE1BQU07SUFDeEIsUUFBUSxFQUFFLDhCQUFTLENBQUMsS0FBSztDQUMxQixDQUFDIn0=