# CLAUDE.md — Mailspring Claude Assistant

Contexto permanente para sesiones de Claude Code. Léelo al inicio de cada sesión.

**El archivo de estado NO vive en el repo.** Daniel lo mantiene fuera (unidad compartida) y lo
pasa al inicio de cada sesión con "lee mi estado md". No crear ni versionar copias aquí: una copia
en el repo se queda vieja y contradice al maestro.

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

## Identidad en "Mejorar respuesta" (BUG-01, resuelto S08)

`improveDraft(draftText, instruction, identity)` recibe `{ from, to }` construidos por
`draftIdentity()` en `improve-draft-button.jsx` a partir de `draft.from[0]` y `draft.to` (con el
`contactLabel` exportado de `thread-text.js`). Se lee del **borrador, no de la firma**: el `De:`
está siempre, la firma puede no estar configurada. El system prompt exige primera persona como el
remitente, concordancia de género en adjetivos/participios (también en el saludo al destinatario),
**fórmulas neutras cuando el nombre no permite deducir el género** y no tocar la firma.

## Tareas pendientes (registradas, no trabajadas aún)

- **UI-04b** · UI-04 se aplicó en S08 (12px arriba/abajo, 8px entre bloques) y Daniel lo dio por
  "suficientemente bien, pero no perfecto". Queda margen de ajuste fino: las variables son
  `@cs-pad-box` y `@cs-pad-gap` en `styles/main.less`. Sin urgencia; requiere que Daniel diga qué
  le sigue chirriando.

- **UX-01** (reclasificada S08: es DOC, no bug de código) · El placeholder del código está bien
  (`opcional, ej. "corrige ortografía y hazlo más claro"`). Lo que confunde es que la captura
  publicada `docs/screenshots/preferencias.png` muestra un **valor guardado** de la config local de
  Daniel — "Resumir el texto" — bajo el encabezado MEJORAR RESPUESTA. No hay nada que tocar en
  `preferences-claude.jsx`. Arreglo: vaciar el campo (para que se vea el placeholder real y quede
  claro que es opcional), recapturar y regenerar las anotaciones. Tarea de la sesión de planeación,
  donde vive el script de anotación.
- **DOC-01** (opcional) · Recortar el `demo.gif`: los frames 13-48 (~4.25 s de scroll por el hilo)
  no aportan; bajaría la duración de 26 a 22 s. Reemplazar `docs/screenshots/demo.gif`.

### Fase 14 — Internacionalización ✅ COMPLETA (S09)

I18N-01 a I18N-05 cerradas en S09, más portugués (fuera del plan original). Verificado por Daniel
en Mailspring 1.23 en español, inglés y portugués de Brasil. Ver el hallazgo técnico abajo.

### Fase 15 — Documentación bilingüe

- **DOC-04** ✅ **S09** · `README.md` a inglés (canónico) + `README.es.md`, con selector de idioma
  arriba. GitHub no tiene i18n nativo de README; ésta es la convención de facto.
- **DOC-05** · Regenerar las 5 capturas anotadas en inglés — la leyenda va **incrustada en el
  pixel**, así que hace falta un set duplicado. Absorbe DOC-02. Es la ruta crítica de la difusión.
  Daniel las rehará cuando tenga tiempo; mientras tanto el README en inglés lleva una nota que
  avisa que las capturas están en español, para que no se lea como descuido.
- **DOC-06** ✅ **S09** · `CHANGELOG.md` a inglés (incluidas las entradas viejas: mitad y mitad se
  veía descuidado en un repo público) y solo inglés de aquí en adelante.

### Fase 16 — Difusión (reemplaza PUB-04)

- **PUB-04a** · Leer las convenciones de los topics existentes de la categoría Plugins.
- **PUB-04b** · Redactar el post en inglés: qué hace, capturas/GIF, instalación, y aviso explícito
  de que requiere API key propia de Anthropic (de pago).
- **PUB-04c** · Publicar y atender respuestas (Issues ya está activo).

> **Orden obligatorio: I18N → DOC → PUB.** Publicar antes de tener el inglés listo sería quemar la
> única presentación disponible. Expectativa realista: con ~17 topics en toda la categoría, el
> tráfico será modesto; se hace por tenerlo publicado y bien hecho, no por volumen.

## Internacionalización — IMPLEMENTADA en S09

Arquitectura final en `src/i18n.js`: diccionario propio `{ en, es, pt, pt-BR }` (46 claves cada
uno) y `t(key, ...args)`. Los valores son strings, o funciones cuando llevan variable
(`updateWithNew: n => ...`), para no necesitar un motor de interpolación.

⚠️ **`getCurrentLocale()` devuelve el locale COMPLETO con región** (`es-MX`, `es_419`, `pt-BR`,
`en-US`), **no el idioma base.** Esto costó una iteración: la primera versión hacía
`STRINGS[locale]`, nunca acertaba con una variante regional y todo salía en inglés aunque
Mailspring estuviera en español. `dict()` ahora normaliza partiendo por `-` **y** por `_` (sus
locales mezclan ambos separadores: `es_419` convive con `pt-BR`) y resuelve
**locale exacto → idioma base → inglés**.

**Por qué `pt` y `pt-BR` van separados:** el propio Mailspring traduce `Thread` como "Tópico" (pt)
vs "Conversa" (pt-BR) y `Back` como "Recuar" vs "Voltar" — y son justo nuestro título de panel y un
botón. Además pt-PT usa "estar a + infinitivo" ("A gerar…") donde pt-BR usa gerundio ("Gerando…").
Que `dict()` busque el locale exacto **antes** que el idioma base es lo que permite tenerlos
separados sin tocar la lógica; el mismo mecanismo servirá para `zh-CN` vs `zh-TW`.

**Regla para sumar idiomas:** una entrada por familia cubre las variantes regionales (`es` atiende
a es-MX/es_419/es-ES; un `pt` solo cubriría ambos portugueses). Solo se desdobla cuando las
variantes divergen de verdad. Para los 18 idiomas "Contribuidos" de Mailspring bastarían ~16
entradas. Hay 109 `lang/*.json` en total (18 verificados + 91 experimentales).

**Verificación mecánica antes de dar por buena una traducción:** comprobar que todas las entradas
tengan el mismo juego de claves y los mismos tipos (una función que quede como string sale como
`[object Function]` en pantalla). Un olvido ahí se ve como texto en inglés suelto en medio de la UI
traducida.

### Investigación previa (S08) — sigue vigente

Mailspring **sí** tiene i18n: `lang/*.json` con decenas de idiomas y `localized()`,
`getCurrentLocale()`, `isRTL` exportados en `mailspring-exports` (disponibles para plugins).

⚠️ **Pero un plugin NO puede registrar sus propias traducciones.** En `intl.js` (asar 1.23, líneas
190-198) `localizations` se carga una sola vez desde `static/lang/` de la app; `localized(texto)`
busca ahí y, si no encuentra la clave, **devuelve el texto tal cual**. No hay hook para packages.

Cobertura medida contra `es.json` (884 claves): aciertan los genéricos (Hide, Show, Cancel,
Preferences, Error, Default); NO están Summary, Generate, Regenerate, Improve, Apply, Discard,
Model, API Key, Loading, Optional.

**Arquitectura correcta:** escribir el plugin en **inglés como idioma base** + diccionario propio
del plugin elegido con `getCurrentLocale()`, usando `localized()` encima para que los genéricos
salgan gratis en todos los idiomas de Mailspring.

**Volumen real:** ~15 strings de UI (4 compositor, 8 Preferencias, 3 panel) + ~10 mensajes de error
en `claude-client.js`. Es poco.

**Los prompts ya son agnósticos de idioma:** `SUMMARY_SYSTEM` pide responder "en el idioma
predominante del hilo" e `IMPROVE_SYSTEM` "conserva el idioma del borrador" — la salida de Claude
ya se adapta sola. Solo la cáscara está en español. (Aun así conviene pasar los prompts a inglés
por neutralidad: un system prompt en español sesga sutilmente aunque instruya lo contrario.)

## Publicación en la comunidad — hallazgo (investigado S08)

**No existe galería ni registro oficial de plugins.** El "listado" es una categoría de foro
(`community.getmailspring.com/c/plugins/8`) con ~17 topics; sin proceso de envío, sin aprobación,
sin vetting. El "plugin gallery" prometido (Foundry376/Mailspring#363) nunca se materializó.
Publicar = abrir un topic. **El foro es 100% en inglés**, así que difundir depende de tener antes
la internacionalización y el README en inglés.

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
- **Mailspring** 1.23.0 (actualizado; hasta S07 era 1.22.0), interfaz en **español**. Menú
  "Desarrollador" → "Ejecutar en modo depuración". También existe "Instalar un complemento..."
  para instalar desde carpeta. Al verificar APIs contra el asar, usar la carpeta de la versión
  vigente: `%LOCALAPPDATA%\Mailspring\app-1.23.0\resources\app.asar`.
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
