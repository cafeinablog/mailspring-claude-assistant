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

1. **Resumir hilo** — recuadro de resumen en dos ubicaciones que comparten el mismo resultado:
   la cabecera del hilo (rol `MessageListHeaders`) y el pie del compositor (rol `Composer:Footer`).
   Un solo botón "Generar resumen" con un único modelo configurable (el detalle se sube cambiando
   el modelo en Preferencias). El resumen se cachea por `threadId` en `localStorage`.
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

## Ubicación del panel de resumen (RESUELTO S04)

Se descartó `MessageListSidebar:ContactCard` (competía con el sidebar Pro, apretado). Decisión:
mostrar el mismo recuadro en **dos** roles nativos que comparten caché — `MessageListHeaders`
(cabecera del hilo, opción A) y `Composer:Footer` (pie del compositor, opción C). Se descartó
poner algo debajo del área de respuesta: Mailspring no ofrece rol de inyección ahí.
Módulos: `summary-store.js` (caché/LRU/dedupe/sync), `thread-summary-panel.jsx` (recuadro
compartido), `thread-summary-header.jsx` (A), `composer-summary-footer.jsx` (C, carga por
`threadId` con `DatabaseStore.findAll(Message)`).

Pulido de UI de S04 (icono de pestaña, botón-icono del compositor, popover nativo) ya implementado
en UI-01/02/03; nota técnica: el protocolo `mailspring://` sirve sin Content-Type, así que los
iconos SVG del plugin van como **data-URI base64** (Chromium no acepta SVG como imagen sin MIME).

## Tareas pendientes (registradas, no trabajadas aún)

- **UI-04** · Espaciado interno de la caja de resumen: los botones "Regenerar" y "Ocultar" (y el
  contenido en general) se ven pegados al borde de la caja. Dar más aire — comparar con el botón
  "Responder" de los mensajes, que respira más. Revisar el padding de `.cs-head` (arriba/derecha)
  en `styles/main.less` y/o margen de los botones. Solo estético; la funcionalidad está lista.
- **BUG-01** · "Mejorar respuesta" no le dice a Claude quién es el remitente, así que puede fallar
  la concordancia de género: generó "Quedo atenta" firmando Daniel (hombre). Visible en 2 capturas
  del README. Arreglo: pasar el remitente/identidad en el prompt de `improveDraft` (leer `De:` del
  borrador o la firma) para que respete género y persona.
- **UX-01** · La instrucción por defecto de ejemplo/guardada en Preferencias dice algo tipo
  "Resumir el texto", que confunde bajo el encabezado "Mejorar respuesta" (esa función reescribe,
  no resume). Ajustar el placeholder/ejemplo a algo coherente (p. ej. "hazlo más formal").
- **DOC-01** (opcional) · Recortar el `demo.gif`: los frames 13-48 (~4.25 s de scroll por el hilo)
  no aportan; bajaría la duración de 26 a 22 s. Reemplazar `docs/screenshots/demo.gif`.
- **PUB-01b** (pendiente parcial) · Falta la captura `preferencias.png` (pestaña Claude con la API
  key enmascarada) para la sección Configuración del README; hay un `<!-- TODO -->` marcado ahí.

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
- **Repo GitHub principal (público, distribución):** `cafeinablog/mailspring-claude-assistant` —
  remote `origin`. El repo viejo `chowkaideng/mailspring-claude-assistant` (privado) sigue como
  remote `privado`, solo de respaldo. Credenciales por-repo (`credential.useHttpPath true`) para
  que ambas cuentas convivan; identidad de commits repo-local: `cafeinablog`
  (`306714372+cafeinablog@users.noreply.github.com`).

## Distribución pública (desde S05)

- El plugin ya no es solo personal: se distribuye desde `cafeinablog/mailspring-claude-assistant`
  (público, MIT, topics configurados, Issues activo, ruleset `proteger-main` bloquea force-push y
  borrado de `main`).
- **Flujo de ramas:** se trabaja en `develop`; al liberar, merge a `main` + tag `vX.Y.Z` + Release
  en GitHub con zip adjunto. `main` es lo estable/publicado.
- **Zip de release:** carpeta `mailspring-claude-assistant/` con SOLO runtime: `package.json`,
  `lib/`, `styles/`, `assets/`, `LICENSE`, `README.md`, `CHANGELOG.md` (sin `src/`, `CLAUDE.md`,
  configs de dev). Los usuarios lo descomprimen en la carpeta `packages` de Mailspring.
- Al liberar: actualizar `CHANGELOG.md` y subir `version` en `package.json` (semver).
- ⚠️ El repo es público: cuidar aún más que nunca se cuele la API key ni datos personales en
  commits, y mantener el README de cara a usuarios finales.

## Reglas operativas de sesión

- Trabajar por tareas del checklist (`DEV-##`), una o dos por sesión; commit al completar cada una.
- **No re-discutir** las decisiones de arquitectura cerradas de arriba.
- Revisar los diffs antes de aprobar cambios.
- **Nunca** escribir la API key real (ver regla crítica arriba).
- Al cierre de sesión, proponer el texto actualizado del archivo de estado, pero el archivo maestro
  lo mantiene Daniel (reemplaza el local y lo vuelve a subir al proyecto de planeación).
