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

import { t } from "./i18n";

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
      return t("errApiKeyInvalid");
    case 403:
      return t("errForbidden", apiMessage);
    case 404:
      return t("errModelNotFound", apiMessage);
    case 429:
      return t("errRateLimit");
    case 500:
    case 529:
      return t("errOverloaded");
    default:
      return t("errGeneric", status, apiMessage);
  }
}

// Llamada genérica a /v1/messages. Devuelve el texto de la respuesta.
// Lanza Error con mensaje amigable (localizado) si algo falla.
export async function callClaude({ model, system, userText, maxTokens = 1024 }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(t("errNoApiKey"));
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
    throw new Error(t("errNoConnection"));
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
    throw new Error(t("errEmptyResponse"));
  }
  if (body.stop_reason === "max_tokens") {
    return `${text}${t("truncatedNote")}`;
  }
  return text;
}

// El panel renderiza texto plano, así que se pide explícitamente no usar
// Markdown (los ** y # se verían literales).
// I18N-04: los prompts de sistema van en inglés por neutralidad — la salida
// de Claude ya se adapta sola al idioma del hilo/borrador (instrucción
// explícita más abajo), así que esto no cambia el comportamiento observado.
const PLAIN_TEXT_RULE =
  " Write in plain text with no Markdown formatting: no asterisks, hashes or bold; use a " +
  "simple dash (-) for bullet points and UPPERCASE followed by a colon for section titles.";

const SUMMARY_SYSTEM =
  "You are an assistant that summarizes email threads. Always respond in the thread's " +
  "predominant language. Produce a clear, actionable summary: one or two sentences of " +
  "context, the key points as bullets (what was discussed and what was decided), and a " +
  "final 'Pending:' line with open action items and who owns them (if any). Ignore " +
  "signatures, legal notices and repeated text. Don't invent information that isn't in " +
  "the thread." +
  PLAIN_TEXT_RULE;

const IMPROVE_SYSTEM =
  "You are an email drafting assistant. You will receive the plain text of an email draft " +
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
export function improveDraft(draftText, instruction, identity = {}) {
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

// DEV-05 / S04: resumen del hilo. Un solo modelo (configurable) y un solo
// prompt; la profundidad se ajusta cambiando el modelo en Preferencias.
export function summarizeThread(threadText) {
  return callClaude({
    model: getModel("summary"),
    system: SUMMARY_SYSTEM,
    userText: `Summarize this email thread:\n\n${threadText}`,
    maxTokens: 1536,
  });
}
