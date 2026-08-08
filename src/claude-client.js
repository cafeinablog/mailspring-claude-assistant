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

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

// DEV-11: claves de la config local de Mailspring (config.json) que usa el
// plugin. Todas editables desde Preferencias → Claude.
export const CONFIG_KEYS = {
  apiKey: "mailspring-claude-assistant.apiKey",
  modelSummary: "mailspring-claude-assistant.modelSummary",
  modelImprove: "mailspring-claude-assistant.modelImprove",
  defaultInstruction: "mailspring-claude-assistant.defaultInstruction",
};

// Modelos por defecto por tarea. Configurables en Preferencias → Claude.
// El resumen usa por defecto el modelo económico (Haiku); quien quiera más
// calidad/detalle cambia el modelo en Preferencias (decisión S04: un solo
// botón "Generar resumen", el nivel de detalle se controla por el modelo).
export const MODEL_DEFAULTS = {
  summary: "claude-haiku-4-5", // Resumen del hilo (económico por defecto)
  improveDraft: "claude-sonnet-5", // Mejorar respuesta (Fase 4)
};

const MODEL_CONFIG_KEY_BY_TASK = {
  summary: CONFIG_KEYS.modelSummary,
  improveDraft: CONFIG_KEYS.modelImprove,
};

// Modelo vigente para una tarea: el configurado o el default.
export function getModel(task) {
  const value = AppEnv.config.get(MODEL_CONFIG_KEY_BY_TASK[task]);
  return typeof value === "string" && value.trim() ? value.trim() : MODEL_DEFAULTS[task];
}

export function getApiKey() {
  const key = AppEnv.config.get(CONFIG_KEYS.apiKey);
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

// Instrucción por defecto para "Mejorar respuesta" (opcional, DEV-11).
export function getDefaultInstruction() {
  const value = AppEnv.config.get(CONFIG_KEYS.defaultInstruction);
  return typeof value === "string" ? value.trim() : "";
}

function friendlyError(status, body) {
  const apiMessage =
    body && body.error && body.error.message ? ` (${body.error.message})` : "";
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
export async function callClaude({ model, system, userText, maxTokens = 1024 }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "No hay API key configurada. Abre la consola de desarrollador (Ctrl+Shift+I) y ejecuta:\n" +
        'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")'
    );
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
  } catch (err) {
    throw new Error("No se pudo conectar con la API de Claude. Revisa tu conexión a internet.");
  }

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
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

// El panel renderiza texto plano, así que se pide explícitamente no usar
// Markdown (los ** y # se verían literales).
const PLAIN_TEXT_RULE =
  " Escribe en texto plano sin formato Markdown: nada de asteriscos, almohadillas ni " +
  "negritas; para viñetas usa un guion simple (-) y para títulos de sección usa " +
  "MAYÚSCULAS seguidas de dos puntos.";

const SUMMARY_SYSTEM =
  "Eres un asistente que resume hilos de correo electrónico. Responde siempre en el idioma " +
  "predominante del hilo. Produce un resumen claro y accionable: una o dos oraciones de contexto, " +
  "los puntos clave en viñetas (qué se discutió y qué se decidió), y al final una línea " +
  "'Pendientes:' con las acciones abiertas y quién debe hacerlas (si las hay). Ignora firmas, " +
  "avisos legales y texto repetido. No inventes información que no esté en el hilo." +
  PLAIN_TEXT_RULE;

const IMPROVE_SYSTEM =
  "Eres un asistente de redacción de correos electrónicos. Recibirás el texto plano del " +
  "borrador de un correo y una instrucción de mejora del usuario. Reescribe el borrador " +
  "siguiendo la instrucción. Responde ÚNICAMENTE con el texto mejorado del correo: sin " +
  "explicaciones, sin asunto y sin comentarios antes o después. Conserva el idioma del " +
  "borrador salvo que la instrucción pida cambiarlo, y no inventes información que no esté " +
  "en el borrador. Escribe en texto plano, sin formato Markdown (nada de asteriscos ni " +
  "almohadillas). " +
  // BUG-01: sin esto el modelo elegía el género al azar y firmaba "Quedo atenta"
  // en un correo de un hombre.
  "Cuando se indique el remitente, escribe siempre en primera persona como esa persona y " +
  "concuerda en género los adjetivos y participios que se refieran a ella (por ejemplo " +
  "'quedo atento' si es hombre y 'quedo atenta' si es mujer); aplica el mismo criterio a los " +
  "destinatarios en el saludo y la despedida. Si un nombre no permite deducir el género con " +
  "certeza, usa fórmulas neutras ('quedo pendiente', 'un saludo') en vez de adivinar. Nunca " +
  "cambies la firma ni el nombre del remitente.";

// DEV-09: mejora del borrador según una instrucción libre del usuario.
// BUG-01: `identity` ({ from, to }) le dice a Claude quién firma y a quién le
// escribe, para que la concordancia de género no salga al azar. Es opcional:
// si el borrador no trae remitente, el prompt simplemente omite esas líneas.
export function improveDraft(draftText, instruction, identity = {}) {
  const context = [];
  if (identity.from) {
    context.push(`Remitente (quien escribe y firma este correo): ${identity.from}`);
  }
  if (identity.to) {
    context.push(`Destinatario(s): ${identity.to}`);
  }
  const header = context.length ? `${context.join("\n")}\n\n` : "";
  return callClaude({
    model: getModel("improveDraft"),
    system: IMPROVE_SYSTEM,
    userText: `${header}Instrucción de mejora: ${instruction}\n\nBorrador:\n${draftText}`,
    maxTokens: 2048,
  });
}

// DEV-05 / S04: resumen del hilo. Un solo modelo (configurable) y un solo
// prompt; la profundidad se ajusta cambiando el modelo en Preferencias.
export function summarizeThread(threadText) {
  return callClaude({
    model: getModel("summary"),
    system: SUMMARY_SYSTEM,
    userText: `Resume este hilo de correo:\n\n${threadText}`,
    maxTokens: 1536,
  });
}
