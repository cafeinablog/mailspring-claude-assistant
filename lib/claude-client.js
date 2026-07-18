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
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
// DEV-11: claves de la config local de Mailspring (config.json) que usa el
// plugin. Todas editables desde Preferencias → Claude.
exports.CONFIG_KEYS = {
    apiKey: "mailspring-claude-assistant.apiKey",
    modelSummaryFast: "mailspring-claude-assistant.modelSummaryFast",
    modelSummaryDetailed: "mailspring-claude-assistant.modelSummaryDetailed",
    modelImprove: "mailspring-claude-assistant.modelImprove",
    defaultInstruction: "mailspring-claude-assistant.defaultInstruction",
};
// Modelos por defecto por tarea (decisión S03). Configurables en DEV-11.
exports.MODEL_DEFAULTS = {
    summaryFast: "claude-haiku-4-5",
    summaryDetailed: "claude-sonnet-5",
    improveDraft: "claude-sonnet-5",
};
const MODEL_CONFIG_KEY_BY_TASK = {
    summaryFast: exports.CONFIG_KEYS.modelSummaryFast,
    summaryDetailed: exports.CONFIG_KEYS.modelSummaryDetailed,
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
            return "API key inválida o revocada. Verifica la key guardada en la configuración.";
        case 403:
            return `La API key no tiene permiso para esta operación${apiMessage}.`;
        case 404:
            return `Modelo no encontrado${apiMessage}.`;
        case 429:
            return "Límite de uso alcanzado (rate limit o presupuesto). Espera un momento e inténtalo de nuevo.";
        case 500:
        case 529:
            return "El servicio de Anthropic está sobrecargado o con errores. Inténtalo de nuevo en unos minutos.";
        default:
            return `Error ${status} de la API de Claude${apiMessage}.`;
    }
}
// Llamada genérica a /v1/messages. Devuelve el texto de la respuesta.
// Lanza Error con mensaje amigable (en español) si algo falla.
async function callClaude({ model, system, userText, maxTokens = 1024 }) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("No hay API key configurada. Abre la consola de desarrollador (Ctrl+Shift+I) y ejecuta:\n" +
            'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")');
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
        throw new Error("No se pudo conectar con la API de Claude. Revisa tu conexión a internet.");
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
        throw new Error("Claude devolvió una respuesta vacía. Inténtalo de nuevo.");
    }
    if (body.stop_reason === "max_tokens") {
        return `${text}\n\n[Nota: la respuesta fue recortada por el límite de tokens.]`;
    }
    return text;
}
exports.callClaude = callClaude;
// El panel renderiza texto plano, así que se pide explícitamente no usar
// Markdown (los ** y # se verían literales).
const PLAIN_TEXT_RULE = " Escribe en texto plano sin formato Markdown: nada de asteriscos, almohadillas ni " +
    "negritas; para viñetas usa un guion simple (-) y para títulos de sección usa " +
    "MAYÚSCULAS seguidas de dos puntos.";
const SUMMARY_SYSTEM_FAST = "Eres un asistente que resume hilos de correo electrónico. Responde siempre en el idioma " +
    "predominante del hilo. Produce un resumen breve y accionable: 1-2 oraciones de contexto, " +
    "puntos clave en viñetas, y al final una línea 'Pendientes:' con las acciones abiertas y " +
    "quién debe hacerlas (si las hay). Ignora firmas, avisos legales y texto repetido. " +
    "No inventes información que no esté en el hilo." +
    PLAIN_TEXT_RULE;
const SUMMARY_SYSTEM_DETAILED = "Eres un asistente que resume hilos de correo electrónico. Responde siempre en el idioma " +
    "predominante del hilo. Produce un resumen completo y bien organizado: contexto y propósito " +
    "del hilo, cronología de lo discutido (qué dijo cada participante y cuándo, si es relevante), " +
    "decisiones tomadas, y una sección final 'Pendientes:' con acciones abiertas, responsables y " +
    "fechas mencionadas. Ignora firmas, avisos legales y texto repetido. " +
    "No inventes información que no esté en el hilo." +
    PLAIN_TEXT_RULE;
const IMPROVE_SYSTEM = "Eres un asistente de redacción de correos electrónicos. Recibirás el texto plano del " +
    "borrador de un correo y una instrucción de mejora del usuario. Reescribe el borrador " +
    "siguiendo la instrucción. Responde ÚNICAMENTE con el texto mejorado del correo: sin " +
    "explicaciones, sin asunto y sin comentarios antes o después. Conserva el idioma del " +
    "borrador salvo que la instrucción pida cambiarlo, y no inventes información que no esté " +
    "en el borrador. Escribe en texto plano, sin formato Markdown (nada de asteriscos ni " +
    "almohadillas).";
// DEV-09: mejora del borrador según una instrucción libre del usuario.
function improveDraft(draftText, instruction) {
    return callClaude({
        model: getModel("improveDraft"),
        system: IMPROVE_SYSTEM,
        userText: `Instrucción de mejora: ${instruction}\n\nBorrador:\n${draftText}`,
        maxTokens: 2048,
    });
}
exports.improveDraft = improveDraft;
// DEV-05: resumen del hilo. `detailed` elige modelo y estilo.
function summarizeThread(threadText, { detailed = false } = {}) {
    return callClaude({
        model: detailed ? getModel("summaryDetailed") : getModel("summaryFast"),
        system: detailed ? SUMMARY_SYSTEM_DETAILED : SUMMARY_SYSTEM_FAST,
        userText: `Resume este hilo de correo:\n\n${threadText}`,
        maxTokens: detailed ? 2048 : 1024,
    });
}
exports.summarizeThread = summarizeThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGF1ZGUtY2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7O0FBRUgsTUFBTSxPQUFPLEdBQUcsdUNBQXVDLENBQUM7QUFDeEQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBRWpDLDJFQUEyRTtBQUMzRSx1REFBdUQ7QUFDMUMsUUFBQSxXQUFXLEdBQUc7SUFDekIsTUFBTSxFQUFFLG9DQUFvQztJQUM1QyxnQkFBZ0IsRUFBRSw4Q0FBOEM7SUFDaEUsb0JBQW9CLEVBQUUsa0RBQWtEO0lBQ3hFLFlBQVksRUFBRSwwQ0FBMEM7SUFDeEQsa0JBQWtCLEVBQUUsZ0RBQWdEO0NBQ3JFLENBQUM7QUFFRix5RUFBeUU7QUFDNUQsUUFBQSxjQUFjLEdBQUc7SUFDNUIsV0FBVyxFQUFFLGtCQUFrQjtJQUMvQixlQUFlLEVBQUUsaUJBQWlCO0lBQ2xDLFlBQVksRUFBRSxpQkFBaUI7Q0FDaEMsQ0FBQztBQUVGLE1BQU0sd0JBQXdCLEdBQUc7SUFDL0IsV0FBVyxFQUFFLG1CQUFXLENBQUMsZ0JBQWdCO0lBQ3pDLGVBQWUsRUFBRSxtQkFBVyxDQUFDLG9CQUFvQjtJQUNqRCxZQUFZLEVBQUUsbUJBQVcsQ0FBQyxZQUFZO0NBQ3ZDLENBQUM7QUFFRiw4REFBOEQ7QUFDOUQsU0FBZ0IsUUFBUSxDQUFDLElBQUk7SUFDM0IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNoRSxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6RixDQUFDO0FBSEQsNEJB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