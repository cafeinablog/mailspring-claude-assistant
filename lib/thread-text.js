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
// Exportada: también la usa el botón del compositor (DEV-08) para leer
// el texto plano del borrador.
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
    // <signature> es el wrapper con el que Mailspring marca la firma en los
    // borradores (verificado en composer-signature/signature-utils del asar).
    doc.querySelectorAll("style, script, head, title, signature").forEach(el => el.remove());
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
exports.htmlToPlainText = htmlToPlainText;
// DEV-10: convierte el texto plano devuelto por Claude al HTML mínimo que
// acepta el editor del compositor (texto escapado + <br/>). No es
// "manipular HTML": solo se genera el envoltorio más simple posible.
function plainTextToDraftHtml(text) {
    const escaped = (text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<div>${escaped.replace(/\n/g, "<br/>")}</div>`;
}
exports.plainTextToDraftHtml = plainTextToDraftHtml;
// Exportada: la usa también el botón del compositor (BUG-01) para describirle
// a Claude quién firma el borrador y a quién va dirigido.
function contactLabel(contact) {
    if (!contact) {
        return "(unknown)";
    }
    const name = contact.displayName ? contact.displayName() : contact.name;
    return name && name !== contact.email ? `${name} <${contact.email}>` : contact.email;
}
exports.contactLabel = contactLabel;
// Construye el texto plano de un hilo a partir de su asunto y una lista de
// mensajes (ya sin borradores). Compartido por el hilo enfocado (MessageStore)
// y por la opción A / C, que reciben los mensajes por otras vías.
function buildThreadText(subject, messages) {
    const subj = subject || "(no subject)";
    const parts = messages.map((msg, idx) => {
        const from = contactLabel(msg.from && msg.from[0]);
        const date = msg.date ? new Date(msg.date).toLocaleString() : "";
        const body = htmlToPlainText(msg.body) || (msg.snippet || "").trim();
        return `[Message ${idx + 1} of ${messages.length}] From: ${from} — ${date}\n${body}`;
    });
    return `Subject: ${subj}\n\n${parts.join("\n\n---\n\n")}`;
}
exports.buildThreadText = buildThreadText;
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
    return {
        subject: thread.subject || "(no subject)",
        messageCount: messages.length,
        text: buildThreadText(thread.subject, messages),
    };
}
exports.getFocusedThreadPlainText = getFocusedThreadPlainText;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLXRleHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGhyZWFkLXRleHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBeUU7QUFFekU7Ozs7OztHQU1HO0FBRUgsMkRBQTJEO0FBQzNELHFFQUFxRTtBQUNyRSw2Q0FBNkM7QUFDN0MsNENBQTRDO0FBQzVDLHVFQUF1RTtBQUN2RSwrQkFBK0I7QUFDL0IsU0FBZ0IsZUFBZSxDQUFDLElBQUk7SUFDbEMsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDbkIsSUFBSTtRQUNGLE9BQU8sR0FBRywwQ0FBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7WUFDckQsc0JBQXNCLEVBQUUsSUFBSTtTQUM3QixDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1oseUVBQXlFO0tBQzFFO0lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2xFLHdFQUF3RTtJQUN4RSwwRUFBMEU7SUFDMUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHVDQUF1QyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDekYsMEVBQTBFO0lBQzFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0QsR0FBRztTQUNBLGdCQUFnQixDQUFDLHlEQUF5RCxDQUFDO1NBQzNFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2xELE9BQU8sSUFBSTtTQUNSLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO1NBQ2xCLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDO1NBQzFCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO1NBQzFCLElBQUksRUFBRSxDQUFDO0FBQ1osQ0FBQztBQTNCRCwwQ0EyQkM7QUFFRCwwRUFBMEU7QUFDMUUsa0VBQWtFO0FBQ2xFLHFFQUFxRTtBQUNyRSxTQUFnQixvQkFBb0IsQ0FBQyxJQUFJO0lBQ3ZDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztTQUN6QixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztTQUN0QixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztTQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pCLE9BQU8sUUFBUSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pELENBQUM7QUFORCxvREFNQztBQUVELDhFQUE4RTtBQUM5RSwwREFBMEQ7QUFDMUQsU0FBZ0IsWUFBWSxDQUFDLE9BQU87SUFDbEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sV0FBVyxDQUFDO0tBQ3BCO0lBQ0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQ3hFLE9BQU8sSUFBSSxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksS0FBSyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDdkYsQ0FBQztBQU5ELG9DQU1DO0FBRUQsMkVBQTJFO0FBQzNFLCtFQUErRTtBQUMvRSxrRUFBa0U7QUFDbEUsU0FBZ0IsZUFBZSxDQUFDLE9BQU8sRUFBRSxRQUFRO0lBQy9DLE1BQU0sSUFBSSxHQUFHLE9BQU8sSUFBSSxjQUFjLENBQUM7SUFDdkMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUN0QyxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDakUsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDckUsT0FBTyxZQUFZLEdBQUcsR0FBRyxDQUFDLE9BQU8sUUFBUSxDQUFDLE1BQU0sV0FBVyxJQUFJLE1BQU0sSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO0lBQ3ZGLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxZQUFZLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7QUFDNUQsQ0FBQztBQVRELDBDQVNDO0FBRUQsOERBQThEO0FBQzlELGdFQUFnRTtBQUNoRSxTQUFnQix5QkFBeUI7SUFDdkMsTUFBTSxNQUFNLEdBQUcsaUNBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNyQyxJQUFJLENBQUMsTUFBTSxJQUFJLGlDQUFZLENBQUMsWUFBWSxFQUFFLEVBQUU7UUFDMUMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sUUFBUSxHQUFHLGlDQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUQsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsT0FBTztRQUNMLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLGNBQWM7UUFDekMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQzdCLElBQUksRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7S0FDaEQsQ0FBQztBQUNKLENBQUM7QUFkRCw4REFjQyJ9