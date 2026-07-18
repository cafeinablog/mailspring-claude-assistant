"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_summary_panel_1 = __importDefault(require("./thread-summary-panel"));
const thread_text_1 = require("./thread-text");
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
class ComposerSummaryFooter extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._getThreadData = () => {
            return this._queryMessages().then(msgs => {
                if (msgs.length === 0)
                    return null;
                return {
                    text: thread_text_1.buildThreadText(this.props.draft && this.props.draft.subject, msgs),
                    messageCount: msgs.length,
                };
            });
        };
        this.state = { messageCount: null }; // null = aún no cargado
    }
    componentDidMount() {
        this._mounted = true;
        if (this.props.threadId)
            this._refreshCount();
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
        if (!threadId)
            return Promise.resolve([]);
        return mailspring_exports_1.DatabaseStore.findAll(mailspring_exports_1.Message)
            .where({ threadId })
            .include(mailspring_exports_1.Message.attributes.body)
            .then(items => {
            const msgs = items.filter(m => !m.draft && !(m.isHidden && m.isHidden()));
            msgs.sort((a, b) => new Date(a.date) - new Date(b.date));
            return msgs;
        });
    }
    // Mantiene messageCount al día para el aviso "N mensajes nuevos" del panel.
    _refreshCount() {
        this._queryMessages().then(msgs => {
            if (this._mounted)
                this.setState({ messageCount: msgs.length });
        });
    }
    render() {
        if (!this.props.threadId)
            return null;
        return (mailspring_exports_1.React.createElement(thread_summary_panel_1.default, { threadId: this.props.threadId, messageCount: this.state.messageCount, getThreadData: this._getThreadData }));
    }
}
exports.default = ComposerSummaryFooter;
ComposerSummaryFooter.displayName = "ClaudeComposerSummaryFooter";
ComposerSummaryFooter.propTypes = {
    draft: mailspring_exports_1.PropTypes.object,
    threadId: mailspring_exports_1.PropTypes.string,
    session: mailspring_exports_1.PropTypes.object,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zZXItc3VtbWFyeS1mb290ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9zZXItc3VtbWFyeS1mb290ZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQThFO0FBQzlFLGtGQUF3RDtBQUN4RCwrQ0FBZ0Q7QUFFaEQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXFCLHFCQUFzQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQVNoRSxZQUFZLEtBQUs7UUFDZixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUF5Q2YsbUJBQWMsR0FBRyxHQUFHLEVBQUU7WUFDcEIsT0FBTyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQztvQkFBRSxPQUFPLElBQUksQ0FBQztnQkFDbkMsT0FBTztvQkFDTCxJQUFJLEVBQUUsNkJBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDO29CQUN6RSxZQUFZLEVBQUUsSUFBSSxDQUFDLE1BQU07aUJBQzFCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQWhEQSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsd0JBQXdCO0lBQy9ELENBQUM7SUFFRCxpQkFBaUI7UUFDZixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtZQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsU0FBUztRQUMxQixJQUFJLFNBQVMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDckUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztJQUVELG9CQUFvQjtRQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUN4QixDQUFDO0lBRUQsNEVBQTRFO0lBQzVFLG9EQUFvRDtJQUNwRCxjQUFjO1FBQ1osTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDaEMsSUFBSSxDQUFDLFFBQVE7WUFBRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUMsT0FBTyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyw0QkFBTyxDQUFDO2FBQ2xDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO2FBQ25CLE9BQU8sQ0FBQyw0QkFBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7YUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ1osTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDekQsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCw0RUFBNEU7SUFDNUUsYUFBYTtRQUNYLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEMsSUFBSSxJQUFJLENBQUMsUUFBUTtnQkFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQVlELE1BQU07UUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDdEMsT0FBTyxDQUNMLHlDQUFDLDhCQUFrQixJQUNqQixRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQzdCLFlBQVksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDckMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLEdBQ2xDLENBQ0gsQ0FBQztJQUNKLENBQUM7O0FBdEVILHdDQXVFQztBQXRFUSxpQ0FBVyxHQUFHLDZCQUE2QixDQUFDO0FBRTVDLCtCQUFTLEdBQUc7SUFDakIsS0FBSyxFQUFFLDhCQUFTLENBQUMsTUFBTTtJQUN2QixRQUFRLEVBQUUsOEJBQVMsQ0FBQyxNQUFNO0lBQzFCLE9BQU8sRUFBRSw4QkFBUyxDQUFDLE1BQU07Q0FDMUIsQ0FBQyJ9