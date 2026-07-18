"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_text_1 = require("./thread-text");
/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador actual (draft.body es HTML;
 *   se convierte con htmlToPlainText, sin tocar nunca el HTML del editor).
 *   Como verificación, el texto extraído se muestra en un panel flotante.
 * DEV-09/10 (pendientes): campo de instrucción libre + llamada a Claude +
 *   vista previa con Aplicar / Descartar.
 */
class ImproveDraftButton extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onClick = event => {
            if (this.state.open) {
                this.setState({ open: false, extracted: null, panelPos: null });
                return;
            }
            // El panel se ancla a la ventana (position: fixed) porque la barra de
            // acciones del compositor recorta (overflow) a sus hijos absolutos.
            const rect = event.currentTarget.getBoundingClientRect();
            const PANEL_WIDTH = 420;
            const panelPos = {
                left: Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8)),
                bottom: window.innerHeight - rect.top + 8,
            };
            // DEV-08: extraer el texto plano del borrador. Se quitan las citas del
            // mensaje al que se responde (el usuario mejora SU texto, no la cita).
            const text = thread_text_1.htmlToPlainText(this.props.draft.body || "");
            this.setState({ open: true, extracted: text, panelPos });
        };
        this.state = { open: false, extracted: null, panelPos: null };
    }
    shouldComponentUpdate(nextProps, nextState) {
        // El draft cambia en cada tecla; solo re-renderizamos por nuestro estado
        // o por cambio de sesión (mismo criterio que el starter).
        return nextState !== this.state || nextProps.session !== this.props.session;
    }
    _renderPanel() {
        const { extracted, panelPos } = this.state;
        const empty = !extracted || !extracted.trim();
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-panel", style: panelPos },
            mailspring_exports_1.React.createElement("div", { className: "panel-header" },
                mailspring_exports_1.React.createElement("span", { className: "panel-title" }, "Claude \u00B7 texto del borrador (DEV-08)"),
                mailspring_exports_1.React.createElement("button", { className: "btn panel-close", onClick: () => this.setState({ open: false, extracted: null }) }, "\u2715")),
            mailspring_exports_1.React.createElement("div", { className: `panel-body${empty ? " empty" : ""}` }, empty
                ? "El borrador está vacío. Escribe algo y vuelve a intentarlo."
                : extracted)));
    }
    render() {
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-draft" },
            mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", title: "Mejorar con Claude", onClick: this._onClick }, "Mejorar con Claude"),
            this.state.open && mailspring_exports_1.ReactDOM.createPortal(this._renderPanel(), document.body)));
    }
}
exports.default = ImproveDraftButton;
ImproveDraftButton.displayName = "ClaudeImproveDraftButton";
ImproveDraftButton.propTypes = {
    draft: mailspring_exports_1.PropTypes.object.isRequired,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQWdFO0FBQ2hFLCtDQUFnRDtBQUVoRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFxQixrQkFBbUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFRN0QsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBVWYsYUFBUSxHQUFHLEtBQUssQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLE9BQU87YUFDUjtZQUNELHNFQUFzRTtZQUN0RSxvRUFBb0U7WUFDcEUsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3pELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUN4QixNQUFNLFFBQVEsR0FBRztnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUMsQ0FBQztZQUNGLHVFQUF1RTtZQUN2RSx1RUFBdUU7WUFDdkUsTUFBTSxJQUFJLEdBQUcsNkJBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQztRQTFCQSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRUQscUJBQXFCLENBQUMsU0FBUyxFQUFFLFNBQVM7UUFDeEMseUVBQXlFO1FBQ3pFLDBEQUEwRDtRQUMxRCxPQUFPLFNBQVMsS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFDOUUsQ0FBQztJQXFCRCxZQUFZO1FBQ1YsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLENBQUMsU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlDLE9BQU8sQ0FDTCxrREFBSyxTQUFTLEVBQUMsc0JBQXNCLEVBQUMsS0FBSyxFQUFFLFFBQVE7WUFDbkQsa0RBQUssU0FBUyxFQUFDLGNBQWM7Z0JBQzNCLG1EQUFNLFNBQVMsRUFBQyxhQUFhLGdEQUE0QztnQkFDekUscURBQ0UsU0FBUyxFQUFDLGlCQUFpQixFQUMzQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLGFBR3ZELENBQ0w7WUFDTixrREFBSyxTQUFTLEVBQUUsYUFBYSxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQ2pELEtBQUs7Z0JBQ0osQ0FBQyxDQUFDLDZEQUE2RDtnQkFDL0QsQ0FBQyxDQUFDLFNBQVMsQ0FDVCxDQUNGLENBQ1AsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyxzQkFBc0I7WUFDbkMscURBQ0UsU0FBUyxFQUFDLGlCQUFpQixFQUMzQixLQUFLLEVBQUMsb0JBQW9CLEVBQzFCLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSx5QkFHZjtZQUlSLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLDZCQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQ3pFLENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBN0VILHFDQThFQztBQTdFUSw4QkFBVyxHQUFHLDBCQUEwQixDQUFDO0FBRXpDLDRCQUFTLEdBQUc7SUFDakIsS0FBSyxFQUFFLDhCQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7SUFDbEMsT0FBTyxFQUFFLDhCQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7Q0FDckMsQ0FBQyJ9