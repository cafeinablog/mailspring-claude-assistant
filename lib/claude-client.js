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
const CONFIG_KEY_API_KEY = "mailspring-claude-assistant.apiKey";
// Modelos por tarea (decisión S03). Serán configurables en DEV-11.
exports.MODELS = {
    summaryFast: "claude-haiku-4-5",
    summaryDetailed: "claude-sonnet-5",
    improveDraft: "claude-sonnet-5",
};
function getApiKey() {
    const key = AppEnv.config.get(CONFIG_KEY_API_KEY);
    return typeof key === "string" && key.trim() ? key.trim() : null;
}
exports.getApiKey = getApiKey;
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
// DEV-05: resumen del hilo. `detailed` elige modelo y estilo.
function summarizeThread(threadText, { detailed = false } = {}) {
    return callClaude({
        model: detailed ? exports.MODELS.summaryDetailed : exports.MODELS.summaryFast,
        system: detailed ? SUMMARY_SYSTEM_DETAILED : SUMMARY_SYSTEM_FAST,
        userText: `Resume este hilo de correo:\n\n${threadText}`,
        maxTokens: detailed ? 2048 : 1024,
    });
}
exports.summarizeThread = summarizeThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGF1ZGUtY2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7O0FBRUgsTUFBTSxPQUFPLEdBQUcsdUNBQXVDLENBQUM7QUFDeEQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sa0JBQWtCLEdBQUcsb0NBQW9DLENBQUM7QUFFaEUsbUVBQW1FO0FBQ3RELFFBQUEsTUFBTSxHQUFHO0lBQ3BCLFdBQVcsRUFBRSxrQkFBa0I7SUFDL0IsZUFBZSxFQUFFLGlCQUFpQjtJQUNsQyxZQUFZLEVBQUUsaUJBQWlCO0NBQ2hDLENBQUM7QUFFRixTQUFnQixTQUFTO0lBQ3ZCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDbEQsT0FBTyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNuRSxDQUFDO0FBSEQsOEJBR0M7QUFFRCxTQUFTLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSTtJQUNqQyxNQUFNLFVBQVUsR0FDZCxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDN0UsUUFBUSxNQUFNLEVBQUU7UUFDZCxLQUFLLEdBQUc7WUFDTixPQUFPLDRFQUE0RSxDQUFDO1FBQ3RGLEtBQUssR0FBRztZQUNOLE9BQU8sa0RBQWtELFVBQVUsR0FBRyxDQUFDO1FBQ3pFLEtBQUssR0FBRztZQUNOLE9BQU8sdUJBQXVCLFVB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