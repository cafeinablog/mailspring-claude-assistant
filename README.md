# mailspring-claude-assistant

Plugin **personal** de [Mailspring](https://getmailspring.com/) que integra la API de Claude
(Anthropic) para dos funciones:

1. **Resumir hilo** — tarjeta "Claude" en el sidebar del hilo con dos botones:
   *Resumen rápido* (Haiku) y *Resumen detallado* (Sonnet). Genera un resumen en texto plano
   con una sección final de pendientes.
2. **Mejorar respuesta** — icono en la barra del compositor que abre un popover: muestra el
   texto plano del borrador, recibe una instrucción libre (ej. *"hazlo más formal"*,
   *"acórtalo"*) y devuelve una versión mejorada con vista previa **Aplicar / Descartar**.
   Al aplicar se reemplaza solo el texto propio — la firma y la cita del mensaje original se
   conservan intactas.

No es un producto público: es una herramienta de uso personal y no está publicada en ninguna
galería de plugins.

## Requisitos

- Mailspring 1.22+ (probado en 1.22.0, Windows 11).
- Una API key de Anthropic ([console.anthropic.com](https://console.anthropic.com)), pago por uso.
- Para compilar: Node.js (el runtime lo pone Mailspring; `node_modules` es solo de build).

## Instalación (desarrollo)

```powershell
git clone https://github.com/chowkaideng/mailspring-claude-assistant.git
cd mailspring-claude-assistant
npm install
npm run build
```

Enlazar el repo a la carpeta de packages de Mailspring (Windows, PowerShell):

```powershell
New-Item -ItemType Junction `
  -Path "$env:APPDATA\Mailspring\packages\mailspring-claude-assistant" `
  -Target (Get-Location)
```

Alternativa: menú **Desarrollador → Instalar un complemento...** apuntando a la carpeta del repo.

Ciclo de desarrollo: editar en `src/` → `npm run build` → **Ctrl+Shift+R** en Mailspring.
Mailspring carga `lib/` (JS plano ES2017, commiteado); no transpila nada.

## Configuración

En Mailspring: **Preferencias → Claude**.

- **API key** — se guarda en texto plano en la config local de Mailspring (`config.json`),
  solo en esta computadora. Mailspring no soporta módulos nativos, así que no hay
  almacenamiento cifrado disponible. Recomendado: key con vencimiento y límite de gasto.
- **Modelos** — modelo por tarea (resumen rápido / detallado / mejorar respuesta).
- **Instrucción por defecto** — opcional; pre-llena el campo del popover de mejora.

⚠️ La API key nunca debe escribirse en el código, el repo ni los commits.

## Arquitectura (decisiones cerradas)

- **Texto plano únicamente**: nunca se manipula el HTML del compositor ni del hilo. Se extrae
  texto plano, se manda a Claude y, al aplicar, se inserta como HTML mínimo (texto escapado +
  `<br/>`), cortando el body en el primer marcador de firma/cita para conservarlos (patrón del
  plugin interno `composer-templates`).
- **API de Anthropic directa** con `fetch` crudo (sin SDK: Mailspring no empaqueta
  `node_modules` en runtime), con el header `anthropic-dangerous-direct-browser-access`.
- **Vista previa siempre**: "Mejorar respuesta" nunca reemplaza directo, siempre
  Aplicar / Descartar.
- UI nativa de Mailspring: `ComponentRegistry`, `Actions.openPopover`,
  `PreferencesUIStore.TabItem`.

## Estructura

| Ruta | Qué es |
|---|---|
| `src/` | Fuente TypeScript/JSX (aquí se edita) |
| `lib/` | Salida compilada que carga Mailspring (se commitea) |
| `styles/main.less` | Estilos (variables de tema de Mailspring) |
| `assets/` | Fuentes SVG de los iconos (en runtime van como data-URI) |
| `CLAUDE.md` | Contexto para sesiones de Claude Code |

## Licencia

MIT
