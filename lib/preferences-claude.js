"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const claude_client_1 = require("./claude-client");
/*
 * DEV-11: pestaña "Claude" en Preferencias (PreferencesUIStore.TabItem).
 *
 * Edita las claves del plugin en la config local de Mailspring (config.json):
 * API key, modelo por tarea e instrucción de mejora por defecto (opcional).
 * Los valores se guardan al momento con AppEnv.config.set — igual que las
 * preferencias nativas, sin botón de guardar.
 *
 * ⚠️ La key se guarda en texto plano en config.json (Mailspring no soporta
 * módulos nativos de almacenamiento cifrado); el campo la enmascara en
 * pantalla, pero nunca debe salir de la config local.
 */
// Opciones de modelo ofrecidas en los selects. Si en la config hay un modelo
// que no está en la lista (p. ej. editado a mano), se agrega como opción para
// no pisarlo al renderizar.
const MODEL_OPTIONS = [
    { id: "claude-haiku-4-5", label: "Haiku 4.5 (rápido y económico)" },
    { id: "claude-sonnet-5", label: "Sonnet 5 (equilibrado)" },
    { id: "claude-opus-4-8", label: "Opus 4.8 (máxima calidad)" },
];
const MODEL_FIELDS = [
    { key: claude_client_1.CONFIG_KEYS.modelSummaryFast, task: "summaryFast", label: "Resumen rápido" },
    { key: claude_client_1.CONFIG_KEYS.modelSummaryDetailed, task: "summaryDetailed", label: "Resumen detallado" },
    { key: claude_client_1.CONFIG_KEYS.modelImprove, task: "improveDraft", label: "Mejorar respuesta" },
];
class PreferencesClaude extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this.state = {
            apiKey: AppEnv.config.get(claude_client_1.CONFIG_KEYS.apiKey) || "",
            defaultInstruction: AppEnv.config.get(claude_client_1.CONFIG_KEYS.defaultInstruction) || "",
            showKey: false,
        };
    }
    _setConfig(key, value, stateKey) {
        this.setState({ [stateKey]: value });
        AppEnv.config.set(key, value);
    }
    _renderModelSelect({ key, task, label }) {
        const current = AppEnv.config.get(key) || claude_client_1.MODEL_DEFAULTS[task];
        const options = MODEL_OPTIONS.some(o => o.id === current)
            ? MODEL_OPTIONS
            : [...MODEL_OPTIONS, { id: current, label: current }];
        return (mailspring_exports_1.React.createElement("div", { className: "pref-row", key: key },
            mailspring_exports_1.React.createElement("label", { htmlFor: key }, label),
            mailspring_exports_1.React.createElement("select", { id: key, value: current, onChange: e => {
                    AppEnv.config.set(key, e.target.value);
                    this.forceUpdate();
                } }, options.map(o => (mailspring_exports_1.React.createElement("option", { key: o.id, value: o.id }, o.label))))));
    }
    render() {
        const { apiKey, defaultInstruction, showKey } = this.state;
        return (mailspring_exports_1.React.createElement("div", { className: "container-claude-preferences" },
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, "API DE ANTHROPIC"),
                mailspring_exports_1.React.createElement("div", { className: "pref-row" },
                    mailspring_exports_1.React.createElement("label", { htmlFor: claude_client_1.CONFIG_KEYS.apiKey }, "API key"),
                    mailspring_exports_1.React.createElement("input", { id: claude_client_1.CONFIG_KEYS.apiKey, type: showKey ? "text" : "password", placeholder: "sk-ant-...", value: apiKey, onChange: e => this._setConfig(claude_client_1.CONFIG_KEYS.apiKey, e.target.value.trim(), "apiKey") }),
                    mailspring_exports_1.React.createElement("label", { className: "show-key" },
                        mailspring_exports_1.React.createElement("input", { type: "checkbox", checked: showKey, onChange: e => this.setState({ showKey: e.target.checked }) }),
                        "Mostrar")),
                mailspring_exports_1.React.createElement("div", { className: "pref-note" }, "Se genera en console.anthropic.com. Se guarda en texto plano en la configuraci\u00F3n local de Mailspring (config.json) \u2014 solo en esta computadora.")),
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, "MODELOS"),
                MODEL_FIELDS.map(field => this._renderModelSelect(field))),
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, "MEJORAR RESPUESTA"),
                mailspring_exports_1.React.createElement("div", { className: "pref-row" },
                    mailspring_exports_1.React.createElement("label", { htmlFor: claude_client_1.CONFIG_KEYS.defaultInstruction }, "Instrucci\u00F3n por defecto"),
                    mailspring_exports_1.React.createElement("input", { id: claude_client_1.CONFIG_KEYS.defaultInstruction, type: "text", placeholder: 'opcional, ej. "corrige ortograf\u00EDa y hazlo m\u00E1s claro"', value: defaultInstruction, onChange: e => this._setConfig(claude_client_1.CONFIG_KEYS.defaultInstruction, e.target.value, "defaultInstruction") })),
                mailspring_exports_1.React.createElement("div", { className: "pref-note" }, "Si la defines, el panel \"Mejorar con Claude\" la trae pre-escrita; siempre puedes editarla antes de enviar."))));
    }
}
exports.default = PreferencesClaude;
PreferencesClaude.displayName = "PreferencesClaude";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtY2xhdWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3ByZWZlcmVuY2VzLWNsYXVkZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBMkM7QUFDM0MsbURBQThEO0FBRTlEOzs7Ozs7Ozs7OztHQVdHO0FBRUgsNkVBQTZFO0FBQzdFLDhFQUE4RTtBQUM5RSw0QkFBNEI7QUFDNUIsTUFBTSxhQUFhLEdBQUc7SUFDcEIsRUFBRSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLGdDQUFnQyxFQUFFO0lBQ25FLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRTtJQUMxRCxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsMkJBQTJCLEVBQUU7Q0FDOUQsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHO0lBQ25CLEVBQUUsR0FBRyxFQUFFLDJCQUFXLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUU7SUFDbkYsRUFBRSxHQUFHLEVBQUUsMkJBQVcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFO0lBQzlGLEVBQUUsR0FBRyxFQUFFLDJCQUFXLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFO0NBQ3BGLENBQUM7QUFFRixNQUFxQixpQkFBa0IsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFHNUQsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywyQkFBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbkQsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUU7WUFDM0UsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDO0lBQ0osQ0FBQztJQUVELFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVE7UUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELGtCQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDckMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksOEJBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvRCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUM7WUFDdkQsQ0FBQyxDQUFDLGFBQWE7WUFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLGFBQWEsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyxVQUFVLEVBQUMsR0FBRyxFQUFFLEdBQUc7WUFDaEMsb0RBQU8sT0FBTyxFQUFFLEdBQUcsSUFBRyxLQUFLLENBQVM7WUFDcEMscURBQ0UsRUFBRSxFQUFFLEdBQUcsRUFDUCxLQUFLLEVBQUUsT0FBTyxFQUNkLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDWixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNyQixDQUFDLElBRUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ2hCLHFEQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxJQUMzQixDQUFDLENBQUMsS0FBSyxDQUNELENBQ1YsQ0FBQyxDQUNLLENBQ0wsQ0FDUCxDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU07UUFDSixNQUFNLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDM0QsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyw4QkFBOEI7WUFDM0M7Z0JBQ0Usd0VBQXlCO2dCQUN6QixrREFBSyxTQUFTLEVBQUMsVUFBVTtvQkFDdkIsb0RBQU8sT0FBTyxFQUFFLDJCQUFXLENBQUMsTUFBTSxjQUFpQjtvQkFDbkQsb0RBQ0UsRUFBRSxFQUFFLDJCQUFXLENBQUMsTUFBTSxFQUN0QixJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFDbkMsV0FBVyxFQUFDLFlBQVksRUFDeEIsS0FBSyxFQUFFLE1BQU0sRUFDYixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLDJCQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBQyxHQUNuRjtvQkFDRixvREFBTyxTQUFTLEVBQUMsVUFBVTt3QkFDekIsb0RBQ0UsSUFBSSxFQUFDLFVBQVUsRUFDZixPQUFPLEVBQUUsT0FBTyxFQUNoQixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsR0FDM0Q7a0NBRUksQ0FDSjtnQkFDTixrREFBSyxTQUFTLEVBQUMsV0FBVywrSkFHcEIsQ0FDRTtZQUVWO2dCQUNFLCtEQUFnQjtnQkFDZixZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQ2xEO1lBRVY7Z0JBQ0UseUVBQTBCO2dCQUMxQixrREFBSyxTQUFTLEVBQUMsVUFBVTtvQkFDdkIsb0RBQU8sT0FBTyxFQUFFLDJCQUFXLENBQUMsa0JBQWtCLG1DQUFpQztvQkFDL0Usb0RBQ0UsRUFBRSxFQUFFLDJCQUFXLENBQUMsa0JBQWtCLEVBQ2xDLElBQUksRUFBQyxNQUFNLEVBQ1gsV0FBVyxFQUFDLGdFQUFzRCxFQUNsRSxLQUFLLEVBQUUsa0JBQWtCLEVBQ3pCLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUNaLElBQUksQ0FBQyxVQUFVLENBQ2IsMkJBQVcsQ0FBQyxrQkFBa0IsRUFDOUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQ2Qsb0JBQW9CLENBQ3JCLEdBRUgsQ0FDRTtnQkFDTixrREFBSyxTQUFTLEVBQUMsV0FBVyxtSEFHcEIsQ0FDRSxDQUNOLENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBdkdILG9DQXdHQztBQXZHUSw2QkFBVyxHQUFHLG1CQUFtQixDQUFDIn0=