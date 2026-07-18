"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_component_kit_1 = require("mailspring-component-kit");
const thread_text_1 = require("./thread-text");
const claude_client_1 = require("./claude-client");
/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador (htmlToPlainText, sin tocar HTML).
 * DEV-09: campo de instrucción libre + llamada a Claude (borrador + instrucción).
 * DEV-10: vista previa con Aplicar / Descartar. Aplicar reemplaza SOLO el texto
 *   del usuario: se corta el body actual en el primer marcador de firma o cita
 *   ('<signature', gmail_quote) y se conserva esa cola intacta — mismo patrón
 *   que el plugin interno composer-templates (verificado en el asar 1.22.0).
 * UI-02: el botón es un icono monocromo (RetinaImg ContentIsMask), mismo estilo
 *   que el resto de la barra.
 * UI-03: el panel usa el sistema nativo de popovers (Actions.openPopover, como
 *   el popup de Plantillas) en lugar del panel flotante propio con portal.
 */
// Contenido del popover. Vive montado dentro del FixedPopover nativo de
// Mailspring, que se encarga de posición, fondo, sombra y cierre (clic fuera
// o Escape). Recibe el texto ya extraído y la sesión del borrador.
class ImproveDraftPopover extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onImprove = async () => {
            const { extracted } = this.props;
            const { instruction } = this.state;
            if (!instruction.trim() || !extracted || !extracted.trim()) {
                return;
            }
            this.setState({ stage: "loading", improved: null, error: null });
            try {
                const improved = await claude_client_1.improveDraft(extracted, instruction.trim());
                if (this._unmounted)
                    return;
                this.setState({ stage: "preview", improved });
            }
            catch (err) {
                if (this._unmounted)
                    return;
                this.setState({ stage: "error", error: err.message });
            }
        };
        // DEV-10: reemplaza el texto del usuario en el editor por la versión mejorada,
        // conservando intactas la firma y la cita del mensaje original.
        this._onApply = () => {
            const { improved } = this.state;
            const { session } = this.props;
            const current = session.draft().body || "";
            let insertion = current.length;
            for (const marker of [
                "<signature",
                '<div class="gmail_quote_attribution"',
                '<blockquote class="gmail_quote"',
            ]) {
                const i = current.indexOf(marker);
                if (i !== -1) {
                    insertion = Math.min(insertion, i);
                }
            }
            const html = thread_text_1.plainTextToDraftHtml(improved);
            session.changes.add({ body: `${html}${current.substr(insertion)}` });
            mailspring_exports_1.Actions.closePopover();
        };
        // Descartar vuelve a la etapa de instrucción (conservándola) para poder
        // ajustar y reintentar sin re-escribirla.
        this._onDiscard = () => {
            this.setState({ stage: "input", improved: null });
        };
        this._onInstructionKeyDown = event => {
            // Enter envía; Shift+Enter hace salto de línea; Escape cierra.
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this._onImprove();
            }
            else if (event.key === "Escape") {
                mailspring_exports_1.Actions.closePopover();
            }
        };
        // stage: "input" | "loading" | "preview" | "error"
        this.state = {
            stage: "input",
            instruction: claude_client_1.getDefaultInstruction(),
            improved: null,
            error: null,
        };
    }
    componentWillUnmount() {
        this._unmounted = true;
    }
    _renderInput() {
        const { extracted } = this.props;
        const { instruction } = this.state;
        const empty = !extracted || !extracted.trim();
        if (empty) {
            return (mailspring_exports_1.React.createElement("div", { className: "panel-body empty" }, "El borrador est\u00E1 vac\u00EDo. Escribe algo y vuelve a intentarlo."));
        }
        return (mailspring_exports_1.React.createElement("div", null,
            mailspring_exports_1.React.createElement("div", { className: "panel-body draft-preview" }, extracted),
            mailspring_exports_1.React.createElement("textarea", { className: "instruction-input", placeholder: '\u00BFC\u00F3mo lo mejoro? ej. "hazlo m\u00E1s formal", "ac\u00F3rtalo"', value: instruction, autoFocus: true, rows: 2, onChange: e => this.setState({ instruction: e.target.value }), onKeyDown: this._onInstructionKeyDown }),
            mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", disabled: !instruction.trim(), onClick: this._onImprove }, "Mejorar"))));
    }
    render() {
        const { stage, improved, error } = this.state;
        let body;
        if (stage === "loading") {
            body = mailspring_exports_1.React.createElement("div", { className: "panel-body loading" }, "Mejorando el borrador con Claude\u2026");
        }
        else if (stage === "error") {
            body = (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body error" }, error),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: () => this.setState({ stage: "input", error: null }) }, "Volver"))));
        }
        else if (stage === "preview") {
            body = (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body" }, improved),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._onDiscard }, "Descartar"),
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", onClick: this._onApply }, "Aplicar"))));
        }
        else {
            body = this._renderInput();
        }
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-popover" },
            mailspring_exports_1.React.createElement("div", { className: "panel-title" }, "Mejorar con Claude"),
            body));
    }
}
ImproveDraftPopover.displayName = "ClaudeImproveDraftPopover";
ImproveDraftPopover.propTypes = {
    extracted: mailspring_exports_1.PropTypes.string,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
class ImproveDraftButton extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this._onClick = () => {
            // DEV-08: extraer el texto plano del borrador. Se quitan las citas del
            // mensaje al que se responde (el usuario mejora SU texto, no la cita).
            const text = thread_text_1.htmlToPlainText(this.props.draft.body || "");
            const buttonRect = mailspring_exports_1.ReactDOM.findDOMNode(this).getBoundingClientRect();
            mailspring_exports_1.Actions.openPopover(mailspring_exports_1.React.createElement(ImproveDraftPopover, { extracted: text, session: this.props.session }), { originRect: buttonRect, direction: "up" });
        };
    }
    shouldComponentUpdate(nextProps) {
        // El draft cambia en cada tecla; solo re-renderizamos por cambio de sesión
        // (mismo criterio que el starter).
        return nextProps.session !== this.props.session;
    }
    render() {
        return (mailspring_exports_1.React.createElement("button", { tabIndex: -1, className: "btn btn-toolbar narrow claude-improve-btn", title: "Mejorar con Claude", "aria-label": "Mejorar con Claude", onClick: this._onClick },
            mailspring_exports_1.React.createElement(mailspring_component_kit_1.RetinaImg, { url: "mailspring://mailspring-claude-assistant/assets/icon-composer-claude.svg", mode: mailspring_component_kit_1.RetinaImg.Mode.ContentIsMask, "aria-hidden": "true" })));
    }
}
exports.default = ImproveDraftButton;
ImproveDraftButton.displayName = "ClaudeImproveDraftButton";
ImproveDraftButton.propTypes = {
    draft: mailspring_exports_1.PropTypes.object.isRequired,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQXlFO0FBQ3pFLHVFQUFxRDtBQUNyRCwrQ0FBc0U7QUFDdEUsbURBQXNFO0FBRXRFOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBRUgsd0VBQXdFO0FBQ3hFLDZFQUE2RTtBQUM3RSxtRUFBbUU7QUFDbkUsTUFBTSxtQkFBb0IsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFRL0MsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBY2YsZUFBVSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ3RCLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2pDLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQzFELE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakUsSUFBSTtnQkFDRixNQUFNLFFBQVEsR0FBRyxNQUFNLDRCQUFZLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLElBQUksQ0FBQyxVQUFVO29CQUFFLE9BQU87Z0JBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDL0M7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJ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