"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const thread_text_1 = require("./thread-text");
const claude_client_1 = require("./claude-client");
/*
 * Botón "Mejorar con Claude" en la barra de acciones del compositor.
 *
 * DEV-07: registro del botón (rol Composer:ActionButton).
 * DEV-08: lectura del texto plano del borrador actual (draft.body es HTML;
 *   se convierte con htmlToPlainText, sin tocar nunca el HTML del editor).
 * DEV-09: campo de instrucción libre + llamada a Claude (borrador + instrucción).
 * DEV-10: vista previa con Aplicar / Descartar. Aplicar reemplaza SOLO el texto
 *   del usuario: se corta el body actual en el primer marcador de firma o cita
 *   ('<signature', gmail_quote) y se conserva esa cola intacta — mismo patrón
 *   que el plugin interno composer-templates (verificado en el asar 1.22.0).
 */
class ImproveDraftButton extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onClick = event => {
            if (this.state.open) {
                this._closePanel();
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
            this.setState({
                open: true,
                stage: "input",
                extracted: text,
                improved: null,
                error: null,
                panelPos,
            });
        };
        this._closePanel = () => {
            this.setState({ open: false, stage: "input", extracted: null, improved: null, error: null });
        };
        this._onImprove = async () => {
            const { extracted, instruction } = this.state;
            if (!instruction.trim() || !extracted || !extracted.trim()) {
                return;
            }
            this.setState({ stage: "loading", improved: null, error: null });
            try {
                const improved = await claude_client_1.improveDraft(extracted, instruction.trim());
                if (this._unmounted || !this.state.open)
                    return;
                this.setState({ stage: "preview", improved });
            }
            catch (err) {
                if (this._unmounted || !this.state.open)
                    return;
                this.setState({ stage: "error", error: err.message });
            }
        };
        // DEV-10: reemplaza el texto del usuario en el editor por la versión mejorada,
        // conservando intactas la firma y la cita del mensaje original.
        this._onApply = () => {
            const { improved } = this.state;
            const { session } = this.props;
            // Se lee el body vigente de la sesión (no de props, que puede estar viejo
            // por el shouldComponentUpdate), igual que hace composer-templates.
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
            this._closePanel();
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
                this._closePanel();
            }
        };
        // stage: "input" | "loading" | "preview" | "error" (solo aplica con open)
        this.state = {
            open: false,
            stage: "input",
            extracted: null,
            instruction: "",
            improved: null,
            error: null,
            panelPos: null,
        };
    }
    shouldComponentUpdate(nextProps, nextState) {
        // El draft cambia en cada tecla; solo re-renderizamos por nuestro estado
        // o por cambio de sesión (mismo criterio que el starter).
        return nextState !== this.state || nextProps.session !== this.props.session;
    }
    componentWillUnmount() {
        this._unmounted = true;
    }
    _renderInput() {
        const { extracted, instruction } = this.state;
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
    _renderBody() {
        const { stage, improved, error } = this.state;
        if (stage === "loading") {
            return mailspring_exports_1.React.createElement("div", { className: "panel-body loading" }, "Mejorando el borrador con Claude\u2026");
        }
        if (stage === "error") {
            return (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body error" }, error),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: () => this.setState({ stage: "input", error: null }) }, "Volver"))));
        }
        if (stage === "preview") {
            return (mailspring_exports_1.React.createElement("div", null,
                mailspring_exports_1.React.createElement("div", { className: "panel-body" }, improved),
                mailspring_exports_1.React.createElement("div", { className: "panel-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._onDiscard }, "Descartar"),
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", onClick: this._onApply }, "Aplicar"))));
        }
        return this._renderInput();
    }
    _renderPanel() {
        return (mailspring_exports_1.React.createElement("div", { className: "claude-improve-panel", style: this.state.panelPos },
            mailspring_exports_1.React.createElement("div", { className: "panel-header" },
                mailspring_exports_1.React.createElement("span", { className: "panel-title" }, "Mejorar con Claude"),
                mailspring_exports_1.React.createElement("button", { className: "btn panel-close", onClick: this._closePanel }, "\u2715")),
            this._renderBody()));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQWdFO0FBQ2hFLCtDQUFzRTtBQUN0RSxtREFBK0M7QUFFL0M7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFxQixrQkFBbUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFRN0QsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBdUJmLGFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRTtZQUNqQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNuQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87YUFDUjtZQUNELHNFQUFzRTtZQUN0RSxvRUFBb0U7WUFDcEUsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3pELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUN4QixNQUFNLFFBQVEsR0FBRztnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUMsQ0FBQztZQUNGLHVFQUF1RTtZQUN2RSx1RUFBdUU7WUFDdkUsTUFBTSxJQUFJLEdBQUcsNkJBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFD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