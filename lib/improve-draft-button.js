"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_component_kit_1 = require("mailspring-component-kit");
const thread_text_1 = require("./thread-text");
const claude_client_1 = require("./claude-client");
const i18n_1 = require("./i18n");
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
 * BUG-01: se le pasa a Claude quién firma el borrador (y a quién va dirigido);
 *   sin esa información elegía el género al azar y devolvía "Quedo atenta" en
 *   un correo firmado por un hombre.
 */
// Icono del botón (sunburst) como data-URI: el protocolo mailspring:// sirve
// los archivos SIN Content-Type y Chromium se niega a usar un SVG como imagen
// sin su MIME, así que no se puede referenciar assets/icon-composer-claude.svg
// (ese archivo queda como fuente editable). El data-URI sí trae el MIME.
const COMPOSER_ICON_URL = "data:image/svg+xml;base64," +
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8ZyBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMi42IiBzdHJva2UtbGluZWNhcD0icm91bmQiPgogICAgPGxpbmUgeDE9IjE3LjUiIHkxPSIxMiIgeDI9IjIzIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSIxNS45IiB5MT0iMTUuOSIgeDI9IjE5LjgiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iMTIiIHkxPSIxNy41IiB4Mj0iMTIiIHkyPSIyMyIvPgogICAgPGxpbmUgeDE9IjguMSIgeTE9IjE1LjkiIHgyPSI0LjIiIHkyPSIxOS44Ii8+CiAgICA8bGluZSB4MT0iNi41IiB5MT0iMTIiIHgyPSIxIiB5Mj0iMTIiLz4KICAgIDxsaW5lIHgxPSI4LjEiIHkxPSI4LjEiIHgyPSI0LjIiIHkyPSI0LjIiLz4KICAgIDxsaW5lIHgxPSIxMiIgeTE9IjYuNSIgeDI9IjEyIiB5Mj0iMSIvPgogICAgPGxpbmUgeDE9IjE1LjkiIHkxPSI4LjEiIHgyPSIxOS44IiB5Mj0iNC4yIi8+CiAgPC9nPgo8L3N2Zz4K";
// BUG-01: identidad del borrador para el prompt. `from` es la cuenta con la que
// se envía (la que firma) y `to` los destinatarios, que definen el género del
// saludo. Se lee del borrador, no de la firma, porque es el dato fiable incluso
// cuando el usuario no tiene firma configurada.
function draftIdentity(draft) {
    if (!draft) {
        return {};
    }
    const sender = draft.from && draft.from[0];
    const recipients = draft.to || [];
    return {
        from: sender ? thread_text_1.contactLabel(sender) : null,
        to: recipients.length ? recipients.map(thread_text_1.contactLabel).join(", ") : null,
    };
}
// Contenido del popover. Vive montado dentro del FixedPopover nativo de
// Mailspring, que se encarga de posición, fondo, sombra y cierre (clic fuera
// o Escape). Recibe el texto ya extraído y la sesión del borrador.
class ImproveDraftPopover extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onImprove = async () => {
            const { extracted, identity } = this.props;
            const { instruction } = this.state;
            if (!instruction.trim() || !extracted || !extracted.trim()) {
                return;
            }
            this.setState({ stage: "loading", improved: null, error: null });
            try {
                const improved = await claude_client_1.improveDraft(extracted, instruction.trim(), identity);
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
            return mailspring_exports_1.React.createElement("div", { className: "panel-body empty" }, i18n_1.t("draftEmpty"));
        }
        return (mailspring_exports_1.React.createElement("div", null,
            mailspring_exports_1.React.createElement("div", { className: "panel-body draft-preview" }, extracted),
            mailspring_exports_1.React.createElement("textarea", { className: "instruction-input", placeholder: i18n_1.t("instructionPlaceholder"), value: instruction, autoFocus: true, rows: 2, onChange: e => this.setState({ instruction: e.target.value }), onKeyDown: this._onInstructionKeyDown }),
            mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", disabled: !instruction.trim(), onClick: this._onImprove }, i18n_1.t("improve")))));
    }
    render() {
        const { stage, improved, error } = this.state;
        let body;
        if (stage === "loading") {
            body = mailspring_exports_1.React.createElement("div", { className: "panel-body loading" }, i18n_1.t("improvingWithClaude"));
        }
        else if (stage === "error") {
            body = (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body error" }, error),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: () => this.setState({ stage: "input", error: null }) }, i18n_1.t("back")))));
        }
        else if (stage === "preview") {
            body = (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body" }, improved),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._onDiscard }, i18n_1.t("discard")),
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", onClick: this._onApply }, i18n_1.t("apply")))));
        }
        else {
            body = this._renderInput();
        }
        // tabIndex={-1}: el FixedPopover cierra por blur y su decorador
        // auto-focuses solo enfoca 'input, textarea, [contenteditable], [tabIndex]'.
        // Sin un elemento enfocable (estado "borrador vacío") el popover nunca
        // recibía foco y el clic fuera no lo cerraba.
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-popover", tabIndex: -1 },
            mailspring_exports_1.React.createElement("div", { className: "panel-title" }, i18n_1.t("improveWithClaude")),
            body));
    }
}
ImproveDraftPopover.displayName = "ClaudeImproveDraftPopover";
ImproveDraftPopover.propTypes = {
    extracted: mailspring_exports_1.PropTypes.string,
    identity: mailspring_exports_1.PropTypes.object,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
ImproveDraftPopover.defaultProps = {
    identity: {},
};
class ImproveDraftButton extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this._onClick = () => {
            // DEV-08: extraer el texto plano del borrador. Se quitan las citas del
            // mensaje al que se responde (el usuario mejora SU texto, no la cita).
            const text = thread_text_1.htmlToPlainText(this.props.draft.body || "");
            const buttonRect = mailspring_exports_1.ReactDOM.findDOMNode(this).getBoundingClientRect();
            mailspring_exports_1.Actions.openPopover(mailspring_exports_1.React.createElement(ImproveDraftPopover, { extracted: text, identity: draftIdentity(this.props.draft), session: this.props.session }), { originRect: buttonRect, direction: "up" });
        };
    }
    shouldComponentUpdate(nextProps) {
        // El draft cambia en cada tecla; solo re-renderizamos por cambio de sesión
        // (mismo criterio que el starter).
        return nextProps.session !== this.props.session;
    }
    render() {
        return (mailspring_exports_1.React.createElement("button", { tabIndex: -1, className: "btn btn-toolbar narrow claude-improve-btn", title: i18n_1.t("improveWithClaude"), "aria-label": i18n_1.t("improveWithClaude"), onClick: this._onClick },
            mailspring_exports_1.React.createElement(mailspring_component_kit_1.RetinaImg, { url: COMPOSER_ICON_URL, mode: mailspring_component_kit_1.RetinaImg.Mode.ContentIsMask, "aria-hidden": "true" })));
    }
}
exports.default = ImproveDraftButton;
ImproveDraftButton.displayName = "ClaudeImproveDraftButton";
ImproveDraftButton.propTypes = {
    draft: mailspring_exports_1.PropTypes.object.isRequired,
    session: mailspring_exports_1.PropTypes.object.isRequired,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQXlFO0FBQ3pFLHVFQUFxRDtBQUNyRCwrQ0FBb0Y7QUFDcEYsbURBQXNFO0FBQ3RFLGlDQUEyQjtBQUUzQjs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCw2RUFBNkU7QUFDN0UsOEVBQThFO0FBQzlFLCtFQUErRTtBQUMvRSx5RUFBeUU7QUFDekUsTUFBTSxpQkFBaUIsR0FDckIsNEJBQTRCO0lBQzVCLHN0QkFBc3RCLENBQUM7QUFFenRCLGdGQUFnRjtBQUNoRiw4RUFBOEU7QUFDOUUsZ0ZBQWdGO0FBQ2hGLGdEQUFnRDtBQUNoRCxTQUFTLGFBQWEsQ0FBQyxLQUFLO0lBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ2xDLE9BQU87UUFDTCxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQywwQkFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQzFDLEVBQUUsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLDBCQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7S0FDdkUsQ0FBQztBQUNKLENBQUM7QUFFRCx3RUFBd0U7QUFDeEUsNkVBQTZFO0FBQzdFLG1FQUFtRTtBQUNuRSxNQUFNLG1CQUFvQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQWEvQyxZQUFZLEtBQUs7UUFDZixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFjZixlQUFVLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzNDLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQzFELE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakUsSUFBSTtnQkFDRixNQUFNLFFBQVEsR0FBRyxNQUFNLDRCQUFZLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0UsSUFBSSxJQUFJLENBQUMsVUFBVTtvQkFBRSxPQUFPO2dCQUM1QixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQy9DO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxJQUFJLENBQUMsVUFBVTtvQkFBRSxPQUFPO2dCQUM1QixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDdkQ7UUFDSCxDQUFDLENBQUM7UUFFRiwrRUFBK0U7UUFDL0UsZ0VBQWdFO1FBQ2hFLGFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDZCxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMvQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUMzQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQy9CLEtBQUssTUFBTSxNQUFNLElBQUk7Z0JBQ25CLFlBQVk7Z0JBQ1osc0NBQXNDO2dCQUN0QyxpQ0FBaUM7YUFDbEMsRUFBRTtnQkFDRCxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDWixTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3BDO2FBQ0Y7WUFDRCxNQUFNLElBQUksR0FBRyxrQ0FBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLDRCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFDO1FBRUYsd0VBQXdFO1FBQ3hFLDBDQUEwQztRQUMxQyxlQUFVLEdBQUcsR0FBRyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQztRQUVGLDBCQUFxQixHQUFHLEtBQUssQ0FBQyxFQUFFO1lBQzlCLCtEQUErRDtZQUMvRCxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDNUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7YUFDbkI7aUJBQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLFFBQVEsRUFBRTtnQkFDakMsNEJBQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQzthQUN4QjtRQUNILENBQUMsQ0FBQztRQWxFQSxtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLEtBQUssRUFBRSxPQUFPO1lBQ2QsV0FBVyxFQUFFLHFDQUFxQixFQUFFO1lBQ3BDLFFBQVEsRUFBRSxJQUFJO1lBQ2QsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDO0lBQ0osQ0FBQztJQUVELG9CQUFvQjtRQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN6QixDQUFDO0lBeURELFlBQVk7UUFDVixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNqQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQyxNQUFNLEtBQUssR0FBRyxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5QyxJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sa0RBQUssU0FBUyxFQUFDLGtCQUFrQixJQUFFLFFBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1NBQ2xFO1FBQ0QsT0FBTyxDQUNMO1lBQ0Usa0RBQUssU0FBUyxFQUFDLDBCQUEwQixJQUFFLFNBQVMsQ0FBTztZQUMzRCx1REFDRSxTQUFTLEVBQUMsbUJBQW1CLEVBQzdCLFdBQVcsRUFBRSxRQUFDLENBQUMsd0JBQXdCLENBQUMsRUFDeEMsS0FBSyxFQUFFLFdBQVcsRUFDbEIsU0FBUyxRQUNULElBQUksRUFBRSxDQUFDLEVBQ1AsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQzdELFNBQVMsRUFBRSxJQUFJLENBQUMscUJBQXFCLEdBQ3JDO1lBQ0Ysa0RBQUssU0FBUyxFQUFDLGVBQWU7Z0JBQzVCLHFEQUNFLFNBQVMsRUFBQyxrQkFBa0IsRUFDNUIsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxFQUM3QixPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFFdkIsUUFBQyxDQUFDLFNBQVMsQ0FBQyxDQUNOLENBQ0wsQ0FDRixDQUNQLENBQUM7SUFDSixDQUFDO0lBRUQsTUFBTTtRQUNKLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDOUMsSUFBSSxJQUFJLENBQUM7UUFDVCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsSUFBSSxHQUFHLGtEQUFLLFNBQVMsRUFBQyxvQkFBb0IsSUFBRSxRQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBTyxDQUFDO1NBQzdFO2FBQU0sSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFO1lBQzVCLElBQUksR0FBRyxDQUNMO2dCQUNFLGtEQUFLLFNBQVMsRUFBQyxrQkFBa0IsSUFBRSxLQUFLLENBQU87Z0JBQy9DLGtEQUFLLFNBQVMsRUFBQyxlQUFlO29CQUM1QixxREFBUSxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFDbEYsUUFBQyxDQUFDLE1BQU0sQ0FBQyxDQUNILENBQ0wsQ0FDRixDQUNQLENBQUM7U0FDSDthQUFNLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUM5QixJQUFJLEdBQUcsQ0FDTDtnQkFDRSxrREFBSyxTQUFTLEVBQUMsWUFBWSxJQUFFLFFBQVEsQ0FBTztnQkFDNUMsa0RBQUssU0FBUyxFQUFDLGVBQWU7b0JBQzVCLHFEQUFRLFNBQVMsRUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLElBQzdDLFFBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDTjtvQkFDVCxxREFBUSxTQUFTLEVBQUMsa0JBQWtCLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQ3hELFFBQUMsQ0FBQyxPQUFPLENBQUMsQ0FDSixDQUNMLENBQ0YsQ0FDUCxDQUFDO1NBQ0g7YUFBTTtZQUNMLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDNUI7UUFDRCxnRUFBZ0U7UUFDaEUsNkVBQTZFO1FBQzdFLHVFQUF1RTtRQUN2RSw4Q0FBOEM7UUFDOUMsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyx3QkFBd0IsRUFBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELGtEQUFLLFNBQVMsRUFBQyxhQUFhLElBQUUsUUFBQyxDQUFDLG1CQUFtQixDQUFDLENBQU87WUFDMUQsSUFBSSxDQUNELENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBN0pNLCtCQUFXLEdBQUcsMkJBQTJCLENBQUM7QUFFMUMsNkJBQVMsR0FBRztJQUNqQixTQUFTLEVBQUUsOEJBQVMsQ0FBQyxNQUFNO0lBQzNCLFFBQVEsRUFBRSw4QkFBUyxDQUFDLE1BQU07SUFDMUIsT0FBTyxFQUFFLDhCQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7Q0FDckMsQ0FBQztBQUVLLGdDQUFZLEdBQUc7SUFDcEIsUUFBUSxFQUFFLEVBQUU7Q0FDYixDQUFDO0FBc0pKLE1BQXFCLGtCQUFtQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUEvRDs7UUFjRSxhQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ2QsdUVBQXVFO1lBQ3ZFLHVFQUF1RTtZQUN2RSxNQUFNLElBQUksR0FBRyw2QkFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxRCxNQUFNLFVBQVUsR0FBRyw2QkFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3RFLDRCQUFPLENBQUMsV0FBVyxDQUNqQix5Q0FBQyxtQkFBbUIsSUFDbEIsU0FBUyxFQUFFLElBQUksRUFDZixRQUFRLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQ3pDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FDM0IsRUFDRixFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUM1QyxDQUFDO1FBQ0osQ0FBQyxDQUFDO0lBZUosQ0FBQztJQWxDQyxxQkFBcUIsQ0FBQyxTQUFTO1FBQzdCLDJFQUEyRTtRQUMzRSxtQ0FBbUM7UUFDbkMsT0FBTyxTQUFTLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO0lBQ2xELENBQUM7SUFpQkQsTUFBTTtRQUNKLE9BQU8sQ0FDTCxxREFDRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQ1osU0FBUyxFQUFDLDJDQUEyQyxFQUNyRCxLQUFLLEVBQUUsUUFBQyxDQUFDLG1CQUFtQixDQUFDLGdCQUNqQixRQUFDLENBQUMsbUJBQW1CLENBQUMsRUFDbEMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO1lBRXRCLHlDQUFDLG9DQUFTLElBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxvQ0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLGlCQUFjLE1BQU0sR0FBRyxDQUNyRixDQUNWLENBQUM7SUFDSixDQUFDOztBQXpDSCxxQ0EwQ0M7QUF6Q1EsOEJBQVcsR0FBRywwQkFBMEIsQ0FBQztBQUV6Qyw0QkFBUyxHQUFHO0lBQ2pCLEtBQUssRUFBRSw4QkFBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVO0lBQ2xDLE9BQU8sRUFBRSw4QkFBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVO0NBQ3JDLENBQUMifQ==