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
// Icono del botón (sunburst) como data-URI: el protocolo mailspring:// sirve
// los archivos SIN Content-Type y Chromium se niega a usar un SVG como imagen
// sin su MIME, así que no se puede referenciar assets/icon-composer-claude.svg
// (ese archivo queda como fuente editable). El data-URI sí trae el MIME.
const COMPOSER_ICON_URL = "data:image/svg+xml;base64," +
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8ZyBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMi42IiBzdHJva2UtbGluZWNhcD0icm91bmQiPgogICAgPGxpbmUgeDE9IjE3LjUiIHkxPSIxMiIgeDI9IjIzIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSIxNS45IiB5MT0iMTUuOSIgeDI9IjE5LjgiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iMTIiIHkxPSIxNy41IiB4Mj0iMTIiIHkyPSIyMyIvPgogICAgPGxpbmUgeDE9IjguMSIgeTE9IjE1LjkiIHgyPSI0LjIiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iNi41IiB5MT0iMTIiIHgyPSIxIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSI4LjEiIHkxPSI4LjEiIHgyPSI0LjIiIHkyPSI0LjIiLz4KICAgIDxsaW5lIHgxPSIxMiIgeTE9IjYuNSIgeDI9IjEyIiB5Mj0iMSIvPgogICAgPGxpbmUgeDE9IjE1LjkiIHkxPSI4LjEiIHgyPSIxOS44IiB5Mj0iNC4yIi8+CiAgPC9nPgo8L3N2Zz4K";
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
        // tabIndex={-1}: el FixedPopover cierra por blur y su decorador
        // auto-focuses solo enfoca 'input, textarea, [contenteditable], [tabIndex]'.
        // Sin un elemento enfocable (estado "borrador vacío") el popover nunca
        // recibía foco y el clic fuera no lo cerraba.
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-popover", tabIndex: -1 },
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
            mailspring_exports_1.React.createElement(mailspring_component_kit_1.RetinaImg, { url: COMPOSER_ICON_URL, mode: mailspring_component_kit_1.RetinaImg.Mode.ContentIsMask, "aria-hidden": "true" })));
    }
}
exports.default = ImproveDraftButton;
ImproveDraftButton.displayName = "ClaudeImproveDraftButton";
ImproveDraftButton.propTypes = {
    draft: mailspring_exports_1.PropTypes.object.isRequired,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQXlFO0FBQ3pFLHVFQUFxRDtBQUNyRCwrQ0FBc0U7QUFDdEUsbURBQXNFO0FBRXRFOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBRUgsNkVBQTZFO0FBQzdFLDhFQUE4RTtBQUM5RSwrRUFBK0U7QUFDL0UseUVBQXlFO0FBQ3pFLE1BQU0saUJBQWlCLEdBQ3JCLDRCQUE0QjtJQUM1QixzdEJBQXN0QixDQUFDO0FBRXp0Qix3RUFBd0U7QUFDeEUsNkVBQTZFO0FBQzdFLG1FQUFtRTtBQUNuRSxNQUFNLG1CQUFvQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQVEvQyxZQUFZLEtBQUs7UUFDZixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFjZixlQUFVLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDakMsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDMUQsT0FBTzthQUNSO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRSxJQUFJO2dCQUNGLE1BQU0sUUFBUSxHQUFHLE1BQU0sNEJBQVksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ25FLElBQUksSUFBSSxDQUFDLFVBQVU7b0JBQUUsT0FBTztnQkFD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