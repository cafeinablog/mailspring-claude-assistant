# Mailspring Claude Assistant

Un plugin no oficial para [Mailspring](https://getmailspring.com/) que integra la IA de Claude
(Anthropic) directamente en tu cliente de correo, con dos funciones:

- **Resumir hilo** — un recuadro que resume toda la conversación (con sus pendientes) y aparece
  tanto en la cabecera del hilo como dentro del compositor mientras redactas.
- **Mejorar respuesta** — escribe tu borrador, dale una instrucción libre ("hazlo más formal",
  "acórtalo", "tradúcelo al inglés") y Claude propone una versión mejorada que puedes **Aplicar**
  o **Descartar**. Tu firma y la cita del mensaje original se conservan intactas.

Todo el procesamiento es en **texto plano**: el plugin nunca modifica el HTML de tus correos.

> ⚠️ Este es un proyecto personal y no oficial, sin relación con Mailspring ni con Anthropic.
> Usa la API de Anthropic con **tu propia** clave (pago por uso).

---

## Requisitos

- **Mailspring 1.22** o superior.
- Una **API key de Anthropic**. Se obtiene en [console.anthropic.com](https://console.anthropic.com)
  (es de pago por uso). Recomendado: ponle un límite de gasto mensual.

## Instalación (usuarios)

No necesitas programar ni compilar nada: el plugin ya viene compilado.

1. Ve a la sección **[Releases](https://github.com/cafeinablog/mailspring-claude-assistant/releases)**
   y descarga el archivo `mailspring-claude-assistant.zip` de la última versión.
2. Descomprímelo. Obtendrás una carpeta llamada `mailspring-claude-assistant`.
3. Muévela a la carpeta de plugins de Mailspring, según tu sistema operativo:
   - **Windows:** `%APPDATA%\Mailspring\packages`
   - **macOS:** `~/Library/Application Support/Mailspring/packages`
   - **Linux:** `~/.config/Mailspring/packages`

   (En Windows puedes pegar `%APPDATA%\Mailspring\packages` en la barra de direcciones del
   Explorador para llegar directo.)
4. **Reinicia Mailspring.**
5. Abre **Preferencias → Claude** y pega tu API key. ¡Listo!

## Uso

- **Resumir un hilo:** abre cualquier conversación. En el recuadro "Resumen del hilo" (arriba del
  hilo, o dentro del compositor al responder) pulsa **Generar resumen**. El resultado se guarda,
  así que al volver al hilo aparece al instante; si llegan mensajes nuevos, te avisa para
  regenerarlo.
- **Mejorar una respuesta:** al redactar, pulsa el icono de Claude en la barra del compositor,
  escribe una instrucción y pulsa **Mejorar**. Revisa la propuesta y elige **Aplicar** o
  **Descartar**.

## Configuración

Todo se ajusta en **Preferencias → Claude**:

- **API key** — tu clave de Anthropic.
- **Modelos** — qué modelo usar para resumir y para mejorar. Para resúmenes más detallados, elige
  un modelo de mayor calidad; para ahorrar, uno más económico.
- **Instrucción por defecto** (opcional) — texto que aparece ya escrito en el panel de mejora.

## Privacidad y seguridad

- Tu API key se guarda **en texto plano** en la configuración local de Mailspring (`config.json`),
  únicamente en tu computadora. Mailspring no ofrece almacenamiento cifrado para plugins.
- El contenido de los correos que resumes o mejoras se envía a la API de Anthropic para su
  procesamiento. Revisa la [política de privacidad de Anthropic](https://www.anthropic.com/legal/privacy).
- Recomendado: usa una API key con **límite de gasto** y, si quieres, con vencimiento.

---

## Desarrollo

El código fuente está en `src/` (TypeScript/JSX) y se compila a `lib/` (JavaScript plano, que es lo
que Mailspring carga y lo que se versiona en el repo — Mailspring no transpila).

```bash
git clone https://github.com/cafeinablog/mailspring-claude-assistant.git
cd mailspring-claude-assistant
npm install
npm run build
```

Para desarrollo iterativo conviene enlazar el repo a la carpeta de plugins con un *junction*
(Windows) o *symlink*, y recargar Mailspring con **Ctrl+Shift+R** tras cada `npm run build`:

```powershell
New-Item -ItemType Junction `
  -Path "$env:APPDATA\Mailspring\packages\mailspring-claude-assistant" `
  -Target (Get-Location)
```

### Ramas

- **`main`** — versión estable y publicada (lo que se distribuye en *Releases*).
- **`develop`** — trabajo en curso. Los cambios se integran aquí y, cuando están listos, se
  promueven a `main` con una nueva versión.

## Contribuir

Las incidencias y sugerencias son bienvenidas en
[Issues](https://github.com/cafeinablog/mailspring-claude-assistant/issues). Si envías un Pull
Request, hazlo contra la rama `develop`.

## Licencia

[MIT](LICENSE)
