import { MessageStore, QuotedHTMLTransformer } from "mailspring-exports";

/*
 * DEV-04: extracción de texto plano del hilo enfocado.
 *
 * Lee los mensajes del hilo actual vía MessageStore (que ya incluye los
 * bodies en su query) y produce un solo string de texto plano listo para
 * mandarse a Claude en DEV-05. Nunca manipulamos ni devolvemos HTML.
 */

// Convierte el HTML de un mensaje a texto plano razonable:
// 1) quita las citas de mensajes anteriores (QuotedHTMLTransformer),
// 2) convierte saltos de bloque en newlines,
// 3) colapsa el exceso de líneas en blanco.
function htmlToPlainText(html) {
  if (!html) {
    return "";
  }
  let cleaned = html;
  try {
    cleaned = QuotedHTMLTransformer.removeQuotedHTML(html, {
      keepIfWholeBodyIsQuote: true,
    });
  } catch (err) {
    // Si el transformer falla con algún HTML raro, seguimos con el original.
  }
  const doc = new DOMParser().parseFromString(cleaned, "text/html");
  doc.querySelectorAll("style, script, head, title").forEach(el => el.remove());
  // Newlines para elementos de bloque y <br>, para no perder la estructura.
  doc.querySelectorAll("br").forEach(el => el.replaceWith("\n"));
  doc
    .querySelectorAll("p, div, li, tr, h1, h2, h3, h4, h5, h6, blockquote, pre")
    .forEach(el => el.append("\n"));
  const text = doc.body ? doc.body.textContent : "";
  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function contactLabel(contact) {
  if (!contact) {
    return "(desconocido)";
  }
  const name = contact.displayName ? contact.displayName() : contact.name;
  return name && name !== contact.email ? `${name} <${contact.email}>` : contact.email;
}

// Devuelve { subject, messageCount, text } del hilo enfocado,
// o null si no hay hilo abierto / los mensajes siguen cargando.
export function getFocusedThreadPlainText() {
  const thread = MessageStore.thread();
  if (!thread || MessageStore.itemsLoading()) {
    return null;
  }
  const messages = MessageStore.items().filter(m => !m.draft);
  if (messages.length === 0) {
    return null;
  }

  const parts = messages.map((msg, idx) => {
    const from = contactLabel(msg.from && msg.from[0]);
    const date = msg.date ? new Date(msg.date).toLocaleString() : "";
    const body = htmlToPlainText(msg.body) || (msg.snippet || "").trim();
    return `[Mensaje ${idx + 1} de ${messages.length}] De: ${from} — ${date}\n${body}`;
  });

  return {
    subject: thread.subject || "(sin asunto)",
    messageCount: messages.length,
    text: `Asunto: ${thread.subject || "(sin asunto)"}\n\n${parts.join("\n\n---\n\n")}`,
  };
}
