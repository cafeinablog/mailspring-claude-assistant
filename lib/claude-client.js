"use strict";
/*
 * DEV-05: cliente de la API de Anthropic (Claude).
 *
 * Nota de implementación: se usa fetch/HTTP crudo en lugar del SDK oficial
 * (@anthropic-ai/sdk) porque Mailspring no empaqueta node_modules en runtime —
 * los plugins solo cargan JS plano desde lib/. Al correr en el renderer de
 * Electron se incluye el header anthropic-dangerous-direct-browser-access
 * para el manejo de CORS.
 *
 * ⚠️ La API key NUNCA se escribe en el código ni en el repo. Se lee de la
 * config local de Mailspring (config.json), donde Daniel la guarda una vez:
 *   AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")
 */
Object.defineProperty(exports, "__esModule", { value: true });
const i18n_1 = require("./i18n");
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
// DEV-11: claves de la config local de Mailspring (config.json) que usa el
// plugin. Todas editables desde Preferencias → Claude.
exports.CONFIG_KEYS = {
    apiKey: "mailspring-claude-assistant.apiKey",
    modelSummary: "mailspring-claude-assistant.modelSummary",
    modelImprove: "mailspring-claude-assistant.modelImprove",
    defaultInstruction: "mailspring-claude-assistant.defaultInstruction",
};
// Modelos por defecto por tarea. Configurables en Preferencias → Claude.
// El resumen usa por defecto el modelo económico (Haiku); quien quiera más
// calidad/detalle cambia el modelo en Preferencias (decisión S04: un solo
// botón "Generar resumen", el nivel de detalle se controla por el modelo).
exports.MODEL_DEFAULTS = {
    summary: "claude-haiku-4-5",
    improveDraft: "claude-sonnet-5",
};
const MODEL_CONFIG_KEY_BY_TASK = {
    summary: exports.CONFIG_KEYS.modelSummary,
    improveDraft: exports.CONFIG_KEYS.modelImprove,
};
// Modelo vigente para una tarea: el configurado o el default.
function getModel(task) {
    const value = AppEnv.config.get(MODEL_CONFIG_KEY_BY_TASK[task]);
    return typeof value === "string" && value.trim() ? value.trim() : exports.MODEL_DEFAULTS[task];
}
exports.getModel = getModel;
function getApiKey() {
    const key = AppEnv.config.get(exports.CONFIG_KEYS.apiKey);
    return typeof key === "string" && key.trim() ? key.trim() : null;
}
exports.getApiKey = getApiKey;
// Instrucción por defecto para "Mejorar respuesta" (opcional, DEV-11).
function getDefaultInstruction() {
    const value = AppEnv.config.get(exports.CONFIG_KEYS.defaultInstruction);
    return typeof value === "string" ? value.trim() : "";
}
exports.getDefaultInstruction = getDefaultInstruction;
function friendlyError(status, body) {
    const apiMessage = body && body.error && body.error.message ? ` (${body.error.message})` : "";
    switch (status) {
        case 401:
            return i18n_1.t("errApiKeyInvalid");
        case 403:
            return i18n_1.t("errForbidden", apiMessage);
        case 404:
            return i18n_1.t("errModelNotFound", apiMessage);
        case 429:
            return i18n_1.t("errRateLimit");
        case 500:
        case 529:
            return i18n_1.t("errOverloaded");
        default:
            return i18n_1.t("errGeneric", status, apiMessage);
    }
}
// Llamada genérica a /v1/messages. Devuelve el texto de la respuesta.
// Lanza Error con mensaje amigable (localizado) si algo falla.
async function callClaude({ model, system, userText, maxTokens = 1024 }) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error(i18n_1.t("errNoApiKey"));
    }
    let response;
    try {
        response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": API_VERSION,
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                system,
                messages: [{ role: "user", content: userText }],
            }),
        });
    }
    catch (err) {
        throw new Error(i18n_1.t("errNoConnection"));
    }
    let body = null;
    try {
        body = await response.json();
    }
    catch (err) {
        // Sin cuerpo JSON — se maneja abajo con el status.
    }
    if (!response.ok) {
        throw new Error(friendlyError(response.status, body));
    }
    const text = (body.content || [])
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n")
        .trim();
    if (!text) {
        throw new Error(i18n_1.t("errEmptyResponse"));
    }
    if (body.stop_reason === "max_tokens") {
        return `${text}${i18n_1.t("truncatedNote")}`;
    }
    return text;
}
exports.callClaude = callClaude;
// El panel renderiza texto plano, así que se pide explícitamente no usar
// Markdown (los ** y # se verían literales).
// I18N-04: los prompts de sistema van en inglés por neutralidad — la salida
// de Claude ya se adapta sola al idioma del hilo/borrador (instrucción
// explícita más abajo), así que esto no cambia el comportamiento observado.
const PLAIN_TEXT_RULE = " Write in plain text with no Markdown formatting: no asterisks, hashes or bold; use a " +
    "simple dash (-) for bullet points and UPPERCASE followed by a colon for section titles.";
const SUMMARY_SYSTEM = "You are an assistant that summarizes email threads. Always respond in the thread's " +
    "predominant language. Produce a clear, actionable summary: one or two sentences of " +
    "context, the key points as bullets (what was discussed and what was decided), and a " +
    "final 'Pending:' line with open action items and who owns them (if any). Ignore " +
    "signatures, legal notices and repeated text. Don't invent information that isn't in " +
    "the thread." +
    PLAIN_TEXT_RULE;
const IMPROVE_SYSTEM = "You are an email drafting assistant. You will receive the plain text of an email draft " +
    "and an improvement instruction from the user. Rewrite the draft following the " +
    "instruction. Respond ONLY with the improved email text: no explanations, no subject " +
    "line, no comments before or after. Keep the draft's language unless the instruction " +
    "asks to change it, and don't invent information that isn't in the draft. Write in " +
    "plain text, with no Markdown formatting (no asterisks or hashes). " +
    // BUG-01: sin esto el modelo elegía el género al azar y firmaba "Quedo atenta"
    // en un correo de un hombre.
    "When a sender is given, always write in first person as that person and match the " +
    "grammatical gender of any adjectives or participles referring to them in the target " +
    "language (for example, in Spanish, 'quedo atento' if the sender is a man and 'quedo " +
    "atenta' if a woman); apply the same to recipients in the greeting and sign-off. If a " +
    "name doesn't clearly reveal gender, use neutral phrasing instead of guessing. Never " +
    "change the signature or the sender's name.";
// DEV-09: mejora del borrador según una instrucción libre del usuario.
// BUG-01: `identity` ({ from, to }) le dice a Claude quién firma y a quién le
// escribe, para que la concordancia de género no salga al azar. Es opcional:
// si el borrador no trae remitente, el prompt simplemente omite esas líneas.
function improveDraft(draftText, instruction, identity = {}) {
    const context = [];
    if (identity.from) {
        context.push(`Sender (who is writing and signing this email): ${identity.from}`);
    }
    if (identity.to) {
        context.push(`Recipient(s): ${identity.to}`);
    }
    const header = context.length ? `${context.join("\n")}\n\n` : "";
    return callClaude({
        model: getModel("improveDraft"),
        system: IMPROVE_SYSTEM,
        userText: `${header}Improvement instruction: ${instruction}\n\nDraft:\n${draftText}`,
        maxTokens: 2048,
    });
}
exports.improveDraft = improveDraft;
// DEV-05 / S04: resumen del hilo. Un solo modelo (configurable) y un solo
// prompt; la profundidad se ajusta cambiando el modelo en Preferencias.
function summarizeThread(threadText) {
    return callClaude({
        model: getModel("summary"),
        system: SUMMARY_SYSTEM,
        userText: `Summarize this email thread:\n\n${threadText}`,
        maxTokens: 1536,
    });
}
exports.summarizeThread = summarizeThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGF1ZGUtY2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7O0FBRUgsaUNBQTJCO0FBRTNCLE1BQU0sT0FBTyxHQUFHLHVDQUF1QyxDQUFDO0FBQ3hELE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQztBQUVqQywyRUFBMkU7QUFDM0UsdURBQXVEO0FBQzFDLFFBQUEsV0FBVyxHQUFHO0lBQ3pCLE1BQU0sRUFBRSxvQ0FBb0M7SUFDNUMsWUFBWSxFQUFFLDBDQUEwQztJQUN4RCxZQUFZLEVBQUUsMENBQTBDO0lBQ3hELGtCQUFrQixFQUFFLGdEQUFnRDtDQUNyRSxDQUFDO0FBRUYseUVBQXlFO0FBQ3pFLDJFQUEyRTtBQUMzRSwwRUFBMEU7QUFDMUUsMkVBQTJFO0FBQzlELFFBQUEsY0FBYyxHQUFHO0lBQzVCLE9BQU8sRUFBRSxrQkFBa0I7SUFDM0IsWUFBWSxFQUFFLGlCQUFpQjtDQUNoQyxDQUFDO0FBRUYsTUFBTSx3QkFBd0IsR0FBRztJQUMvQixPQUFPLEVBQUUsbUJBQVcsQ0FBQyxZQUFZO0lBQ2pDLFlBQVksRUFBRSxtQkFBVyxDQUFDLFlBQVk7Q0FDdkMsQ0FBQztBQUVGLDhEQUE4RDtBQUM5RCxTQUFnQixRQUFRLENBQUMsSUFBSTtJQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxzQkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUFIRCw0QkFHQztBQUVELFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxHQUFH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