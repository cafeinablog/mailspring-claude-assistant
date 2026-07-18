# CLAUDE.md — Mailspring Claude Assistant

Contexto permanente para sesiones de Claude Code. Léelo al inicio de cada sesión junto con
`Mailspring_Claude_Plugin_-_Estado.md` (archivo local, ignorado por git) para saber en qué vamos.

## ⚠️ Regla crítica de seguridad

**NUNCA escribir la API key real de Anthropic en ningún archivo del repo, ni en prompts, ni en
commits.** La key vive únicamente en la configuración local del plugin (fuera del repo) o en el
gestor de contraseñas de Daniel. En código y documentación usar siempre placeholders
(`sk-ant-...`) o referencias genéricas ("la key configurada en settings del plugin").

## Qué es este proyecto

Plugin **personal** de Mailspring (cliente de correo open source, Electron + React; Daniel usa
cuentas Gmail, Google Workspace y Office 365) que integra la API de Claude para dos funciones:

1. **Resumir hilo** — botón en la vista del hilo que genera un resumen de todos los mensajes.
2. **Mejorar respuesta** — botón en la barra del compositor que toma el texto plano del borrador +
   una instrucción libre de Daniel (ej. "hazlo más formal", "acórtalo") y devuelve una versión
   mejorada en un panel de vista previa, con opción de **Aplicar** o **Descartar**.

No es un producto público. No se publica en ninguna galería de plugins por ahora.

## Decisiones de arquitectura (CERRADAS — no re-discutir)

- **Nombre del paquete:** `mailspring-claude-assistant` (sin espacios).
- **Starter base:** `Foundry376/Mailspring-Plugin-Starter` (ya integrado). Trae
  `windowTypes: { default, composer }`, un botón de compositor y un sidebar de mensaje de ejemplo.
- **Texto plano únicamente:** no se manipula el HTML del compositor ni del hilo. Se extrae texto
  plano, se manda a Claude, y el resultado en texto plano reemplaza (tras Aplicar) el contenido.
- **"Mejorar respuesta"** siempre con vista previa (Aplicar / Descartar), nunca reemplazo directo.
- **Instrucción de mejora:** campo de texto libre en cada uso, no una mejora genérica fija.
- **API:** API de Anthropic directa (console.anthropic.com), pago por uso. Corre en el proceso
  Electron, así que no hay problema de CORS: se llama con `fetch` directo.
- **Almacenamiento de la API key:** config del plugin en texto plano local. Mailspring **no soporta
  módulos nativos** (tipo `keytar`), así que no hay opción de almacenamiento cifrado nativo.
- **Patrón para extender el compositor:** plugin interno `composer-templates` de Mailspring
  (usa `DraftStore` extension API) — referencia directa para leer/reemplazar el borrador.
- **Modelo(s) de Claude:** por definir en fase de features. Evaluar modelo económico para resumen
  vs. modelo de mayor calidad para redacción, revisando precios vigentes al implementar.

## Ideas futuras (alcance separado — NO trabajar sin que Daniel lo pida)

- **Redactar con Claude (idea de Daniel, S04):** tercera función, dentro o junto a "Mejorar con
  Claude". El usuario da un resumen/brief de lo que quiere decir; si el borrador es respuesta a un
  hilo, Claude lee además el hilo completo (reutilizar `getFocusedThreadPlainText` de DEV-04) y
  propone una redacción completa manteniendo el tono y el contexto de la conversación. Reutiliza la
  vista previa Aplicar/Descartar de DEV-10. Definir en su momento: botón propio vs. modo dentro del
  panel actual, y cómo distinguir "mejorar lo escrito" de "redactar desde un brief".

## Pendientes de diseño (abiertos, para fase DES)

- **Ubicación del panel de resumen (feedback de Daniel, S03):** el rol
  `MessageListSidebar:ContactCard` funciona pero compite con el sidebar de contactos integrado de
  Mailspring y se ve apretado. Evaluar alternativas: panel arriba del hilo (p.ej. rol tipo header
  del message list) u otro contenedor propio. La lógica de datos/API es independiente de dónde se
  monte, así que DEV-04..06 no se bloquean por esto.

## Estructura y build

- `src/` — código fuente TypeScript/JSX. **Se edita aquí.**
- `lib/` — salida compilada (ES2017 plano). **Es lo que Mailspring carga y lo que se commitea.**
  Mailspring NO transpila; hay que compilar antes de shippear.
- `npm run build` ejecuta `tsc` (config en `tsconfig.json`: target es2017, jsx react, outDir lib).
- Runtime deps (`react`, `electron`, `mailspring-exports`) los provee Mailspring — no se shippean.
  `node_modules/` es solo para compilar (typescript, @types/react) y está gitignored.
- **Sin módulos nativos** (no compilan bajo Electron de Mailspring).

## Entorno de Daniel

- **SO:** Windows 11 (PowerShell). Usuario: `chowk`. Bash (Git Bash) también disponible.
- **Node.js** v24.15.0 · **npm** 11.12.1 · **Git** 2.55.
- **Mailspring** 1.22.0, interfaz en **español**. Menú "Desarrollador" → "Ejecutar en modo
  depuración". También existe "Instalar un complemento..." para instalar desde carpeta.
- **Carpeta de packages de Mailspring:** `C:\Users\chowk\AppData\Roaming\Mailspring\packages`.
  El plugin se instala ahí (junction/symlink al repo para desarrollo iterativo).
- **DevTools:** Ctrl+Shift+I · **Recargar plugins/ventana:** Ctrl+Shift+R.
- **Repo GitHub:** `chowkaideng/mailspring-claude-assistant` (privado). Auth ya configurada vía Git
  Credential Manager.

## Reglas operativas de sesión

- Trabajar por tareas del checklist (`DEV-##`), una o dos por sesión; commit al completar cada una.
- **No re-discutir** las decisiones de arquitectura cerradas de arriba.
- Revisar los diffs antes de aprobar cambios.
- **Nunca** escribir la API key real (ver regla crítica arriba).
- Al cierre de sesión, proponer el texto actualizado del archivo de estado, pero el archivo maestro
  lo mantiene Daniel (reemplaza el local y lo vuelve a subir al proyecto de planeación).
