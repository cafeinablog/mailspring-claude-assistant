import { React, localized } from "mailspring-exports";
import { CONFIG_KEYS, MODEL_DEFAULTS } from "./claude-client";
import { t } from "./i18n";

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
  { id: "claude-haiku-4-5", label: t("modelHaiku") },
  { id: "claude-sonnet-5", label: t("modelSonnet") },
  { id: "claude-opus-4-8", label: t("modelOpus") },
];

const MODEL_FIELDS = () => [
  { key: CONFIG_KEYS.modelSummary, task: "summary", label: t("modelSummaryLabel") },
  { key: CONFIG_KEYS.modelImprove, task: "improveDraft", label: t("modelImproveLabel") },
];

export default class PreferencesClaude extends React.Component {
  static displayName = "PreferencesClaude";

  constructor(props) {
    super(props);
    this.state = {
      apiKey: AppEnv.config.get(CONFIG_KEYS.apiKey) || "",
      defaultInstruction: AppEnv.config.get(CONFIG_KEYS.defaultInstruction) || "",
      showKey: false,
    };
  }

  _setConfig(key, value, stateKey) {
    this.setState({ [stateKey]: value });
    AppEnv.config.set(key, value);
  }

  _renderModelSelect({ key, task, label }) {
    const current = AppEnv.config.get(key) || MODEL_DEFAULTS[task];
    const options = MODEL_OPTIONS();
    const allOptions = options.some(o => o.id === current)
      ? options
      : [...options, { id: current, label: current }];
    return (
      <div className="pref-row" key={key}>
        <label htmlFor={key}>{label}</label>
        <select
          id={key}
          value={current}
          onChange={e => {
            AppEnv.config.set(key, e.target.value);
            this.forceUpdate();
          }}
        >
          {allOptions.map(o => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  render() {
    const { apiKey, defaultInstruction, showKey } = this.state;
    return (
      <div className="container-claude-preferences">
        <section>
          <h6>{t("apiSectionTitle")}</h6>
          <div className="pref-row">
            <label htmlFor={CONFIG_KEYS.apiKey}>{t("apiKeyLabel")}</label>
            <input
              id={CONFIG_KEYS.apiKey}
              type={showKey ? "text" : "password"}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => this._setConfig(CONFIG_KEYS.apiKey, e.target.value.trim(), "apiKey")}
            />
            <label className="show-key">
              <input
                type="checkbox"
                checked={showKey}
                onChange={e => this.setState({ showKey: e.target.checked })}
              />
              {localized("Show")}
            </label>
          </div>
          <div className="pref-note">{t("apiKeyNote")}</div>
        </section>

        <section>
          <h6>{t("modelsSectionTitle")}</h6>
          {MODEL_FIELDS().map(field => this._renderModelSelect(field))}
          <div className="pref-note">{t("modelsNote")}</div>
        </section>

        <section>
          <h6>{t("improveSectionTitle")}</h6>
          <div className="pref-row">
            <label htmlFor={CONFIG_KEYS.defaultInstruction}>{t("defaultInstructionLabel")}</label>
            <input
              id={CONFIG_KEYS.defaultInstruction}
              type="text"
              placeholder={t("defaultInstructionPlaceholder")}
              value={defaultInstruction}
              onChange={e =>
                this._setConfig(
                  CONFIG_KEYS.defaultInstruction,
                  e.target.value,
                  "defaultInstruction"
                )
              }
            />
          </div>
          <div className="pref-note">{t("defaultInstructionNote")}</div>
        </section>
      </div>
    );
  }
}
