"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const claude_client_1 = require("./claude-client");
const i18n_1 = require("./i18n");
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
const MODEL_OPTIONS = () => [
    { id: "claude-haiku-4-5", label: i18n_1.t("modelHaiku") },
    { id: "claude-sonnet-5", label: i18n_1.t("modelSonnet") },
    { id: "claude-opus-4-8", label: i18n_1.t("modelOpus") },
];
const MODEL_FIELDS = () => [
    { key: claude_client_1.CONFIG_KEYS.modelSummary, task: "summary", label: i18n_1.t("modelSummaryLabel") },
    { key: claude_client_1.CONFIG_KEYS.modelImprove, task: "improveDraft", label: i18n_1.t("modelImproveLabel") },
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
        const options = MODEL_OPTIONS();
        const allOptions = options.some(o => o.id === current)
            ? options
            : [...options, { id: current, label: current }];
        return (mailspring_exports_1.React.createElement("div", { className: "pref-row", key: key },
            mailspring_exports_1.React.createElement("label", { htmlFor: key }, label),
            mailspring_exports_1.React.createElement("select", { id: key, value: current, onChange: e => {
                    AppEnv.config.set(key, e.target.value);
                    this.forceUpdate();
                } }, allOptions.map(o => (mailspring_exports_1.React.createElement("option", { key: o.id, value: o.id }, o.label))))));
    }
    render() {
        const { apiKey, defaultInstruction, showKey } = this.state;
        return (mailspring_exports_1.React.createElement("div", { className: "container-claude-preferences" },
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, i18n_1.t("apiSectionTitle")),
                mailspring_exports_1.React.createElement("div", { className: "pref-row" },
                    mailspring_exports_1.React.createElement("label", { htmlFor: claude_client_1.CONFIG_KEYS.apiKey }, i18n_1.t("apiKeyLabel")),
                    mailspring_exports_1.React.createElement("input", { id: claude_client_1.CONFIG_KEYS.apiKey, type: showKey ? "text" : "password", placeholder: "sk-ant-...", value: apiKey, onChange: e => this._setConfig(claude_client_1.CONFIG_KEYS.apiKey, e.target.value.trim(), "apiKey") }),
                    mailspring_exports_1.React.createElement("label", { className: "show-key" },
                        mailspring_exports_1.React.createElement("input", { type: "checkbox", checked: showKey, onChange: e => this.setState({ showKey: e.target.checked }) }),
                        mailspring_exports_1.localized("Show"))),
                mailspring_exports_1.React.createElement("div", { className: "pref-note" }, i18n_1.t("apiKeyNote"))),
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, i18n_1.t("modelsSectionTitle")),
                MODEL_FIELDS().map(field => this._renderModelSelect(field)),
                mailspring_exports_1.React.createElement("div", { className: "pref-note" }, i18n_1.t("modelsNote"))),
            mailspring_exports_1.React.createElement("section", null,
                mailspring_exports_1.React.createElement("h6", null, i18n_1.t("improveSectionTitle")),
                mailspring_exports_1.React.createElement("div", { className: "pref-row" },
                    mailspring_exports_1.React.createElement("label", { htmlFor: claude_client_1.CONFIG_KEYS.defaultInstruction }, i18n_1.t("defaultInstructionLabel")),
                    mailspring_exports_1.React.createElement("input", { id: claude_client_1.CONFIG_KEYS.defaultInstruction, type: "text", placeholder: i18n_1.t("defaultInstructionPlaceholder"), value: defaultInstruction, onChange: e => this._setConfig(claude_client_1.CONFIG_KEYS.defaultInstruction, e.target.value, "defaultInstruction") })),
                mailspring_exports_1.React.createElement("div", { className: "pref-note" }, i18n_1.t("defaultInstructionNote")))));
    }
}
exports.default = PreferencesClaude;
PreferencesClaude.displayName = "PreferencesClaude";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtY2xhdWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3ByZWZlcmVuY2VzLWNsYXVkZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBc0Q7QUFDdEQsbURBQThEO0FBQzlELGlDQUEyQjtBQUUzQjs7Ozs7Ozs7Ozs7R0FXRztBQUVILDZFQUE2RTtBQUM3RSw4RUFBOEU7QUFDOUUsNEJBQTRCO0FBQzVCLE1BQU0sYUFBYSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzFCLEVBQUUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxRQUFDLENBQUMsWUFBWSxDQUFDLEVBQUU7SUFDbEQsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLFFBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUNsRCxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsUUFBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFO0NBQ2pELENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUN6QixFQUFFLEdBQUcsRUFBRSwyQkFBVyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFDLENBQUMsbUJBQW1CLENBQUMsRUFBRTtJQUNqRixFQUFFLEdBQUcsRUFBRSwyQkFBVyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxRQUFDLENBQUMsbUJBQW1CLENBQUMsRUFBRTtDQUN2RixDQUFDO0FBRUYsTUFBcUIsaUJBQWtCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBRzVELFlBQVksS0FBSztRQUNmLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNiLElBQUksQ0FBQyxLQUFLLEdBQUc7WUFDWCxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ25ELGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDJCQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFO1lBQzNFLE9BQU8sRUFBRSxLQUFLO1NBQ2YsQ0FBQztJQUNKLENBQUM7SUFFRCxVQUFVLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRO1FBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0QsTUFBTSxPQUFPLEdBQUcsYUFBYSxFQUFFLENBQUM7UUFDaEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssT0FBTyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxPQUFPO1lBQ1QsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sQ0FDTCxrREFBSyxTQUFTLEVBQUMsVUFBVSxFQUFDLEdBQUcsRUFBRSxHQUFHO1lBQ2hDLG9EQUFPLE9BQU8sRUFBRSxHQUFHLElBQUcsS0FBSyxDQUFTO1lBQ3BDLHFEQUNFLEVBQUUsRUFBRSxHQUFHLEVBQ1AsS0FBSyxFQUFFLE9BQU8sRUFDZCxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ1osTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDckIsQ0FBQyxJQUVBLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUNuQixxREFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FDRCxDQUNWLENBQUMsQ0FDSyxDQUNMLENBQ1AsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNO1FBQ0osTUFBTSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNELE9BQU8sQ0FDTCxrREFBSyxTQUFTLEVBQUMsOEJBQThCO1lBQzNDO2dCQUNFLHFEQUFLLFFBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFNO2dCQUMvQixrREFBSyxTQUFTLEVBQUMsVUFBVTtvQkFDdkIsb0RBQU8sT0FBTyxFQUFFLDJCQUFXLENBQUMsTUFBTSxJQUFHLFFBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBUztvQkFDOUQsb0RBQ0UsRUFBRSxFQUFFLDJCQUFXLENBQUMsTUFBTSxFQUN0QixJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFDbkMsV0FBVyxFQUFDLFlBQVksRUFDeEIsS0FBSyxFQUFFLE1BQU0sRUFDYixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLDJCQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBQyxHQUNuRjtvQkFDRixvREFBTyxTQUFTLEVBQUMsVUFBVTt3QkFDekIsb0RBQ0UsSUFBSSxFQUFDLFVBQVUsRUFDZixPQUFPLEVBQUUsT0FBTyxFQUNoQixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsR0FDM0Q7d0JBQ0QsOEJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FDWixDQUNKO2dCQUNOLGtEQUFLLFNBQVMsRUFBQyxXQUFXLElBQUUsUUFBQyxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQzFDO1lBRVY7Z0JBQ0UscURBQUssUUFBQyxDQUFDLG9CQUFvQixDQUFDLENBQU07Z0JBQ2pDLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUQsa0RBQUssU0FBUyxFQUFDLFdBQVcsSUFBRSxRQUFDLENBQUMsWUFBWSxDQUFDLENBQU8sQ0FDMUM7WUFFVjtnQkFDRSxxREFBSyxRQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBTTtnQkFDbkMsa0RBQUssU0FBUyxFQUFDLFVBQVU7b0JBQ3ZCLG9EQUFPLE9BQU8sRUFBRSwyQkFBVyxDQUFDLGtCQUFrQixJQUFHLFFBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFTO29CQUN0RixvREFDRSxFQUFFLEVBQUUsMkJBQVcsQ0FBQyxrQkFBa0IsRUFDbEMsSUFBSSxFQUFDLE1BQU0sRUFDWCxXQUFXLEVBQUUsUUFBQyxDQUFDLCtCQUErQixDQUFDLEVBQy9DLEtBQUssRUFBRSxrQkFBa0IsRUFDekIsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQ1osSUFBSSxDQUFDLFVBQVUsQ0FDYiwyQkFBVyxDQUFDLGtCQUFrQixFQUM5QixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFDZCxvQkFBb0IsQ0FDckIsR0FFSCxDQUNFO2dCQUNOLGtEQUFLLFNBQVMsRUFBQyxXQUFXLElBQUUsUUFBQyxDQUFDLHdCQUF3QixDQUFDLENBQU8sQ0FDdEQsQ0FDTixDQUNQLENBQUM7SUFDSixDQUFDOztBQW5HSCxvQ0FvR0M7QUFuR1EsNkJBQVcsR0FBRyxtQkFBbUIsQ0FBQyJ9