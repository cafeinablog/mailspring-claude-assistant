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
const SUMMARY_SYSTEM = "Eres un asistente que resume hilos de correo electrónico. Responde siempre en el idioma " +
    "predominante del hilo. Produce un resumen claro y accionable: una o dos oraciones de contexto, " +
    "los puntos clave en viñetas (qué se discutió y qué se decidió), y al final una línea " +
    "'Pendientes:' con las acciones abiertas y quién debe hacerlas (si las hay). Ignora firmas, " +
    "avisos legales y texto repetido. No inventes información que no esté en el hilo." +
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
// DEV-05 / S04: resumen del hilo. Un solo modelo (configurable) y un solo
// prompt; la profundidad se ajusta cambiando el modelo en Preferencias.
function summarizeThread(threadText) {
    return callClaude({
        model: getModel("summary"),
        system: SUMMARY_SYSTEM,
        userText: `Resume este hilo de correo:\n\n${threadText}`,
        maxTokens: 1536,
    });
}
exports.summarizeThread = summarizeThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGF1ZGUtY2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7O0FBRUgsTUFBTSxPQUFPLEdBQUcsdUNBQXVDLENBQUM7QUFDeEQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBRWpDLDJFQUEyRTtBQUMzRSx1REFBdUQ7QUFDMUMsUUFBQSxXQUFXLEdBQUc7SUFDekIsTUFBTSxFQUFFLG9DQUFvQztJQUM1QyxZQUFZLEVBQUUsMENBQTBDO0lBQ3hELFlBQVksRUFBRSwwQ0FBMEM7SUFDeEQsa0JBQWtCLEVBQUUsZ0RBQWdEO0NBQ3JFLENBQUM7QUFFRix5RUFBeUU7QUFDekUsMkVBQTJFO0FBQzNFLDBFQUEwRTtBQUMxRSwyRUFBMkU7QUFDOUQsUUFBQSxjQUFjLEdBQUc7SUFDNUIsT0FBTyxFQUFFLGtCQUFrQjtJQUMzQixZQUFZLEVBQUUsaUJBQWlCO0NBQ2hDLENBQUM7QUFFRixNQUFNLHdCQUF3QixHQUFHO0lBQy9CLE9BQU8sRUFBRSxtQkFBVyxDQUFDLFlBQVk7SUFDakMsWUFBWSxFQUFFLG1CQUFXLENBQUMsWUFBWTtDQUN2QyxDQUFDO0FBRUYsOERBQThEO0FBQzlELFNBQWdCLFFBQVEsQ0FBQyxJQUFJO0lBQzNCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDaEUsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLHNCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekYsQ0FBQztBQUhELDRCQUdDO0FBRUQsU0FBZ0IsU0FBUztJQUN2QixNQUFNLEdBQUcsR0FBRyxNQUFNLENB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