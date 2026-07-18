"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
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
        cleaned = mailspring_exports_1.QuotedHTMLTransformer.removeQuotedHTML(html, {
            keepIfWholeBodyIsQuote: true,
        });
    }
    catch (err) {
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
function getFocusedThreadPlainText() {
    const thread = mailspring_exports_1.MessageStore.thread();
    if (!thread || mailspring_exports_1.MessageStore.itemsLoading()) {
        return null;
    }
    const messages = mailspring_exports_1.MessageStore.items().filter(m => !m.draft);
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
exports.getFocusedThreadPlainText = getFocusedThreadPlainText;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXRleHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGhyZWFkLXRleHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBeUU7QUFFekU7Ozs7OztHQU1HO0FBRUgsMkRBQTJEO0FBQzNELHFFQUFxRTtBQUNyRSw2Q0FBNkM7QUFDN0MsNENBQTRDO0FBQzVDLFNBQVMsZUFBZSxDQUFDLElBQUk7SUFDM0IsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDbkIsSUFBSTtRQUNGLE9BQU8sR0FBRywwQ0FBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7WUFDckQsc0JBQXNCLEVBQUUsSUFBSTtTQUM3QixDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1oseUVBQXlFO0tBQzFFO0lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2xFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzlFLDBFQUEwRTtJQUMxRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9ELEdBQUc7U0FDQSxnQkFBZ0IsQ0FBQyx5REFBeUQsQ0FBQztTQUMzRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUks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