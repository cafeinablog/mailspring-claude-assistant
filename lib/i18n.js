"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
/*
 * I18N-01: diccionario propio del plugin.
 *
 * Mailspring expone getCurrentLocale()/localized() a los plugins, pero un
 * plugin NO puede registrar sus propias traducciones en localized() — esa
 * función solo busca en los lang/*.json estáticos de la app y, si no
 * encuentra la clave, devuelve el texto tal cual (investigado en S08, ver
 * CLAUDE.md). Por eso el plugin mantiene su propio diccionario, con inglés
 * como idioma base y español como primera traducción.
 *
 * Los términos genéricos que Mailspring ya trae traducidos (Show, Hide...)
 * se piden directamente con localized() en los componentes, en vez de
 * duplicarlos aquí.
 */
const STRINGS = {
    en: {
        summaryTitle: "Thread summary",
        generateSummary: "Generate summary",
        regenerate: "Regenerate",
        generating: "Generating…",
        updateWithNew: n => `Update (${n} new)`,
        threadUnreadable: "Couldn't read the thread (or its messages are still loading).",
        generatingWithClaude: "Generating summary with Claude…",
        newMessagesSince: n => `${n} new ${n === 1 ? "message" : "messages"} arrived since this summary.`,
        messageCount: n => `${n} ${n === 1 ? "message" : "messages"}`,
        noSummaryYet: "No summary yet for this thread.",
        justNow: "just now",
        minutesAgo: n => `${n} min ago`,
        hoursAgo: n => `${n} h ago`,
        daysAgo: n => `${n} d ago`,
        improveWithClaude: "Improve with Claude",
        draftEmpty: "The draft is empty. Write something and try again.",
        instructionPlaceholder: 'How should I improve it? e.g. "make it more formal", "shorten it"',
        improve: "Improve",
        improvingWithClaude: "Improving the draft with Claude…",
        back: "Back",
        discard: "Discard",
        apply: "Apply",
        apiSectionTitle: "ANTHROPIC API",
        apiKeyLabel: "API key",
        apiKeyNote: "Generated at console.anthropic.com. Stored in plain text in Mailspring's local " +
            "config (config.json) — on this computer only.",
        modelsSectionTitle: "MODELS",
        modelSummaryLabel: "Thread summary",
        modelImproveLabel: "Improve response",
        modelHaiku: "Haiku 4.5 (fast and economical)",
        modelSonnet: "Sonnet 5 (balanced)",
        modelOpus: "Opus 4.8 (highest quality)",
        modelsNote: "Summaries use a single model. For more detailed summaries, pick a higher-quality " +
            "model (Sonnet or Opus); to save on cost, use Haiku.",
        improveSectionTitle: "IMPROVE RESPONSE",
        defaultInstructionLabel: "Default instruction",
        defaultInstructionPlaceholder: 'optional, e.g. "fix spelling and make it clearer"',
        defaultInstructionNote: 'If you set it, the "Improve with Claude" panel comes pre-filled with it; you can ' +
            "always edit it before sending.",
        errNoApiKey: "No API key is configured yet. Open the developer console (Ctrl+Shift+I) and run:\n" +
            'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")',
        errApiKeyInvalid: "Invalid or revoked API key. Check the key saved in settings.",
        errForbidden: apiMessage => `The API key doesn't have permission for this operation${apiMessage}.`,
        errModelNotFound: apiMessage => `Model not found${apiMessage}.`,
        errRateLimit: "Usage limit reached (rate limit or budget). Wait a moment and try again.",
        errOverloaded: "Anthropic's service is overloaded or having errors. Try again in a few minutes.",
        errGeneric: (status, apiMessage) => `Error ${status} from the Claude API${apiMessage}.`,
        errNoConnection: "Couldn't connect to the Claude API. Check your internet connection.",
        errEmptyResponse: "Claude returned an empty response. Try again.",
        truncatedNote: "\n\n[Note: the response was truncated by the token limit.]",
    },
    es: {
        summaryTitle: "Resumen del hilo",
        generateSummary: "Generar resumen",
        regenerate: "Regenerar",
        generating: "Generando…",
        updateWithNew: n => `Actualizar (${n} ${n === 1 ? "nuevo" : "nuevos"})`,
        threadUnreadable: "No se pudo leer el hilo (o sus mensajes siguen cargando).",
        generatingWithClaude: "Generando resumen con Claude…",
        newMessagesSince: n => n === 1
            ? "Llegó 1 mensaje nuevo desde este resumen."
            : `Llegaron ${n} mensajes nuevos desde este resumen.`,
        messageCount: n => `${n} ${n === 1 ? "mensaje" : "mensajes"}`,
        noSummaryYet: "Aún no hay resumen de este hilo.",
        justNow: "hace un momento",
        minutesAgo: n => `hace ${n} min`,
        hoursAgo: n => `hace ${n} h`,
        daysAgo: n => `hace ${n} d`,
        improveWithClaude: "Mejorar con Claude",
        draftEmpty: "El borrador está vacío. Escribe algo y vuelve a intentarlo.",
        instructionPlaceholder: '¿Cómo lo mejoro? ej. "hazlo más formal", "acórtalo"',
        improve: "Mejorar",
        improvingWithClaude: "Mejorando el borrador con Claude…",
        back: "Volver",
        discard: "Descartar",
        apply: "Aplicar",
        apiSectionTitle: "API DE ANTHROPIC",
        apiKeyLabel: "API key",
        apiKeyNote: "Se genera en console.anthropic.com. Se guarda en texto plano en la configuración " +
            "local de Mailspring (config.json) — solo en esta computadora.",
        modelsSectionTitle: "MODELOS",
        modelSummaryLabel: "Resumen del hilo",
        modelImproveLabel: "Mejorar respuesta",
        modelHaiku: "Haiku 4.5 (rápido y económico)",
        modelSonnet: "Sonnet 5 (equilibrado)",
        modelOpus: "Opus 4.8 (máxima calidad)",
        modelsNote: "El resumen usa un solo modelo. Para resúmenes más detallados, elige un modelo de mayor " +
            "calidad (Sonnet u Opus); para ahorrar, Haiku.",
        improveSectionTitle: "MEJORAR RESPUESTA",
        defaultInstructionLabel: "Instrucción por defecto",
        defaultInstructionPlaceholder: 'opcional, ej. "corrige ortografía y hazlo más claro"',
        defaultInstructionNote: 'Si la defines, el panel "Mejorar con Claude" la trae pre-escrita; siempre puedes ' +
            "editarla antes de enviar.",
        errNoApiKey: "No hay API key configurada. Abre la consola de desarrollador (Ctrl+Shift+I) y ejecuta:\n" +
            'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")',
        errApiKeyInvalid: "API key inválida o revocada. Verifica la key guardada en la configuración.",
        errForbidden: apiMessage => `La API key no tiene permiso para esta operación${apiMessage}.`,
        errModelNotFound: apiMessage => `Modelo no encontrado${apiMessage}.`,
        errRateLimit: "Límite de uso alcanzado (rate limit o presupuesto). Espera un momento e inténtalo de nuevo.",
        errOverloaded: "El servicio de Anthropic está sobrecargado o con errores. Inténtalo de nuevo en unos minutos.",
        errGeneric: (status, apiMessage) => `Error ${status} de la API de Claude${apiMessage}.`,
        errNoConnection: "No se pudo conectar con la API de Claude. Revisa tu conexión a internet.",
        errEmptyResponse: "Claude devolvió una respuesta vacía. Inténtalo de nuevo.",
        truncatedNote: "\n\n[Nota: la respuesta fue recortada por el límite de tokens.]",
    },
    // Portugués europeo y brasileño van por separado (no como un único "pt")
    // porque divergen en términos que aquí son centrales: Mailspring traduce
    // Thread como "Tópico" en pt y "Conversa" en pt-BR, y Back como "Recuar" vs
    // "Voltar". Además pt-PT usa la perífrasis "estar a + infinitivo" ("A gerar…")
    // donde pt-BR usa gerundio ("Gerando…"). dict() busca el locale exacto antes
    // que el idioma base, así que pt-BR toma esta entrada y pt-PT/pt la otra.
    pt: {
        summaryTitle: "Resumo do tópico",
        generateSummary: "Gerar resumo",
        regenerate: "Gerar novamente",
        generating: "A gerar…",
        updateWithNew: n => `Atualizar (${n} ${n === 1 ? "nova" : "novas"})`,
        threadUnreadable: "Não foi possível ler o tópico (ou as mensagens ainda estão a carregar).",
        generatingWithClaude: "A gerar resumo com o Claude…",
        newMessagesSince: n => n === 1
            ? "Chegou 1 nova mensagem desde este resumo."
            : `Chegaram ${n} novas mensagens desde este resumo.`,
        messageCount: n => `${n} ${n === 1 ? "mensagem" : "mensagens"}`,
        noSummaryYet: "Ainda não há resumo deste tópico.",
        justNow: "agora mesmo",
        minutesAgo: n => `há ${n} min`,
        hoursAgo: n => `há ${n} h`,
        daysAgo: n => `há ${n} d`,
        improveWithClaude: "Melhorar com o Claude",
        draftEmpty: "O rascunho está vazio. Escreva algo e tente novamente.",
        instructionPlaceholder: 'Como devo melhorá-lo? ex.: "torne-o mais formal", "encurte-o"',
        improve: "Melhorar",
        improvingWithClaude: "A melhorar o rascunho com o Claude…",
        back: "Recuar",
        discard: "Descartar",
        apply: "Aplicar",
        apiSectionTitle: "API DA ANTHROPIC",
        apiKeyLabel: "Chave da API",
        apiKeyNote: "Gerada em console.anthropic.com. Guardada em texto simples na configuração local " +
            "do Mailspring (config.json) — apenas neste computador.",
        modelsSectionTitle: "MODELOS",
        modelSummaryLabel: "Resumo do tópico",
        modelImproveLabel: "Melhorar resposta",
        modelHaiku: "Haiku 4.5 (rápido e económico)",
        modelSonnet: "Sonnet 5 (equilibrado)",
        modelOpus: "Opus 4.8 (máxima qualidade)",
        modelsNote: "O resumo usa um único modelo. Para resumos mais detalhados, escolha um modelo de maior " +
            "qualidade (Sonnet ou Opus); para poupar, use o Haiku.",
        improveSectionTitle: "MELHORAR RESPOSTA",
        defaultInstructionLabel: "Instrução predefinida",
        defaultInstructionPlaceholder: 'opcional, ex.: "corrija a ortografia e torne-o mais claro"',
        defaultInstructionNote: 'Se a definir, o painel "Melhorar com o Claude" já vem preenchido com ela; pode ' +
            "sempre editá-la antes de enviar.",
        errNoApiKey: "Não há nenhuma chave de API configurada. Abra a consola de programador (Ctrl+Shift+I) " +
            "e execute:\n" +
            'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")',
        errApiKeyInvalid: "Chave de API inválida ou revogada. Verifique a chave guardada nas definições.",
        errForbidden: apiMessage => `A chave de API não tem permissão para esta operação${apiMessage}.`,
        errModelNotFound: apiMessage => `Modelo não encontrado${apiMessage}.`,
        errRateLimit: "Limite de utilização atingido (limite de taxa ou orçamento). Aguarde um momento e tente novamente.",
        errOverloaded: "O serviço da Anthropic está sobrecarregado ou com erros. Tente novamente dentro de alguns minutos.",
        errGeneric: (status, apiMessage) => `Erro ${status} da API do Claude${apiMessage}.`,
        errNoConnection: "Não foi possível ligar à API do Claude. Verifique a sua ligação à Internet.",
        errEmptyResponse: "O Claude devolveu uma resposta vazia. Tente novamente.",
        truncatedNote: "\n\n[Nota: a resposta foi truncada pelo limite de tokens.]",
    },
    "pt-BR": {
        summaryTitle: "Resumo da conversa",
        generateSummary: "Gerar resumo",
        regenerate: "Gerar novamente",
        generating: "Gerando…",
        updateWithNew: n => `Atualizar (${n} ${n === 1 ? "nova" : "novas"})`,
        threadUnreadable: "Não foi possível ler a conversa (ou as mensagens ainda estão carregando).",
        generatingWithClaude: "Gerando resumo com o Claude…",
        newMessagesSince: n => n === 1
            ? "Chegou 1 nova mensagem desde este resumo."
            : `Chegaram ${n} novas mensagens desde este resumo.`,
        messageCount: n => `${n} ${n === 1 ? "mensagem" : "mensagens"}`,
        noSummaryYet: "Ainda não há resumo desta conversa.",
        justNow: "agora mesmo",
        minutesAgo: n => `há ${n} min`,
        hoursAgo: n => `há ${n} h`,
        daysAgo: n => `há ${n} d`,
        improveWithClaude: "Melhorar com o Claude",
        draftEmpty: "O rascunho está vazio. Escreva algo e tente novamente.",
        instructionPlaceholder: 'Como devo melhorar? ex.: "deixe mais formal", "encurte"',
        improve: "Melhorar",
        improvingWithClaude: "Melhorando o rascunho com o Claude…",
        back: "Voltar",
        discard: "Descartar",
        apply: "Aplicar",
        apiSectionTitle: "API DA ANTHROPIC",
        apiKeyLabel: "Chave da API",
        apiKeyNote: "Gerada em console.anthropic.com. Armazenada em texto simples na configuração local " +
            "do Mailspring (config.json) — apenas neste computador.",
        modelsSectionTitle: "MODELOS",
        modelSummaryLabel: "Resumo da conversa",
        modelImproveLabel: "Melhorar resposta",
        modelHaiku: "Haiku 4.5 (rápido e econômico)",
        modelSonnet: "Sonnet 5 (equilibrado)",
        modelOpus: "Opus 4.8 (máxima qualidade)",
        modelsNote: "O resumo usa um único modelo. Para resumos mais detalhados, escolha um modelo de maior " +
            "qualidade (Sonnet ou Opus); para economizar, use o Haiku.",
        improveSectionTitle: "MELHORAR RESPOSTA",
        defaultInstructionLabel: "Instrução padrão",
        defaultInstructionPlaceholder: 'opcional, ex.: "corrija a ortografia e deixe mais claro"',
        defaultInstructionNote: 'Se você defini-la, o painel "Melhorar com o Claude" já vem preenchido com ela; você ' +
            "sempre pode editá-la antes de enviar.",
        errNoApiKey: "Nenhuma chave de API configurada. Abra o console do desenvolvedor (Ctrl+Shift+I) " +
            "e execute:\n" +
            'AppEnv.config.set("mailspring-claude-assistant.apiKey", "sk-ant-...")',
        errApiKeyInvalid: "Chave de API inválida ou revogada. Verifique a chave salva nas configurações.",
        errForbidden: apiMessage => `A chave de API não tem permissão para esta operação${apiMessage}.`,
        errModelNotFound: apiMessage => `Modelo não encontrado${apiMessage}.`,
        errRateLimit: "Limite de uso atingido (limite de taxa ou orçamento). Aguarde um momento e tente novamente.",
        errOverloaded: "O serviço da Anthropic está sobrecarregado ou com erros. Tente novamente em alguns minutos.",
        errGeneric: (status, apiMessage) => `Erro ${status} da API do Claude${apiMessage}.`,
        errNoConnection: "Não foi possível conectar à API do Claude. Verifique sua conexão com a internet.",
        errEmptyResponse: "O Claude retornou uma resposta vazia. Tente novamente.",
        truncatedNote: "\n\n[Nota: a resposta foi truncada pelo limite de tokens.]",
    },
};
// getCurrentLocale() devuelve el locale COMPLETO con región tal como lo
// resuelve Mailspring (es-MX, es_419, pt-BR, en-US), no el idioma base — así
// que buscar STRINGS[locale] a secas nunca acierta con una variante regional.
// El propio Mailspring normaliza igual (intl.js: locale.split('-')[0]) antes
// de cargar su lang/*.json. Se parte por '-' y por '_' porque sus locales
// mezclan ambos separadores (es_419 convive con pt-BR).
// Precedencia: locale exacto → idioma base → inglés.
function dict() {
    const locale = typeof mailspring_exports_1.getCurrentLocale === "function" ? mailspring_exports_1.getCurrentLocale() : null;
    if (!locale) {
        return STRINGS.en;
    }
    const base = String(locale).split(/[-_]/)[0];
    return STRINGS[locale] || STRINGS[base] || STRINGS.en;
}
// Resuelve una clave del diccionario del locale actual (getCurrentLocale, la
// misma preferencia que Idioma en Preferencias → General). Si el locale no
// tiene esa clave, cae al inglés; si tampoco está ahí, devuelve la clave.
function t(key, ...args) {
    const value = dict()[key] || STRINGS.en[key] || key;
    return typeof value === "function" ? value(...args) : value;
}
exports.t = t;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pMThuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQXNEO0FBRXREOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFFSCxNQUFNLE9BQU8sR0FBRztJQUNkLEVBQUUsRUFBRTtRQUNGLFlBQVksRUFBRSxnQkFBZ0I7UUFDOUIsZUFBZSxFQUFFLGtCQUFrQjtRQUNuQyxVQUFVLEVBQUUsWUFBWTtRQUN4QixVQUFVLEVBQUUsYUFBYTtRQUN6QixhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTztRQUN2QyxnQkFBZ0IsRUFBRSwrREFBK0Q7UUFDakYsb0JBQW9CLEVBQUUsaUNBQWlDO1FBQ3ZELGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLDhCQUE4QjtRQUNqRyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRTtRQUM3RCxZQUFZLEVBQUUsaUNBQWlDO1FBQy9DLE9BQU8sRUFBRSxVQUFVO1FBQ25CLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1FBQy9CLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRO1FBQzNCLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRO1FBRTFCLGlCQUFpQixFQUFFLHFCQUFxQjtRQUN4QyxVQUFVLEVBQUUsb0RBQW9EO1FBQ2hFLHNCQUFzQixFQUFFLG1FQUFtRTtRQUMzRixPQUFPLEVBQUUsU0FBUztRQUNsQixtQkFBbUIsRUFBRSxrQ0FBa0M7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