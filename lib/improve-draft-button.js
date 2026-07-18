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
                // DEV-11: si hay instrucción por defecto en settings, se trae pre-escrita
                // (solo si el campo está vacío; si el usuario ya escribió algo en esta
                // ventana, se respeta lo suyo).
                instruction: this.state.instruction.trim()
                    ? this.state.instruction
                    : claude_client_1.getDefaultInstruction(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wcm92ZS1kcmFmdC1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW1wcm92ZS1kcmFmdC1idXR0b24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQWdFO0FBQ2hFLCtDQUFzRTtBQUN0RSxtREFBc0U7QUFFdEU7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFxQixrQkFBbUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFRN0QsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBdUJmLGFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRTtZQUNqQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNuQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87YUFDUjtZQUNELHNFQUFzRTtZQUN0RSxvRUFBb0U7WUFDcEUsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3pELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUN4QixNQUFNLFFBQVEsR0FBRztnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUMsQ0FBQztZQUNGLHVFQUF1RTtZQUN2RSx1RUFBdUU7WUFDdkUsTUFBTSxJQUFJLEdBQUcsNkJBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFD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