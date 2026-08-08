# Changelog

Todas las novedades relevantes de este proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el proyecto sigue [versionado semántico](https://semver.org/lang/es/).

## [0.1.1] - 2026-08-08

### Corregido
- **Mejorar respuesta**: el prompt ahora recibe el remitente y los destinatarios del
  borrador, así que la concordancia de género en la respuesta generada ya no queda
  al azar (antes podía escribir "quedo atenta" firmando como Daniel). Ante nombres
  ambiguos, usa fórmulas neutras en vez de adivinar.

### Cambiado
- Más aire interno en la caja de resumen (cabecera y pie del compositor), para que
  se sienta menos apretada frente a una fila de mensaje nativa.

[0.1.1]: https://github.com/cafeinablog/mailspring-claude-assistant/releases/tag/v0.1.1

## [0.1.0] - 2026-07-18

Primera versión pública.

### Añadido
- **Resumir hilo**: recuadro de resumen en la cabecera del hilo y en el pie del
  compositor, que comparten el mismo resultado (caché por hilo). Un botón
  "Generar resumen" con modelo configurable.
- **Mejorar respuesta**: campo de instrucción libre en el compositor, con vista
  previa Aplicar/Descartar. Al aplicar conserva intactas la firma y la cita.
- **Preferencias → Claude**: configuración de la API key, los modelos por tarea
  y una instrucción de mejora por defecto.
- Todo el procesamiento es en texto plano; nunca se manipula el HTML del correo.
- Probado en Gmail, Google Workspace y Office 365 sobre Mailspring 1.22.

[0.1.0]: https://github.com/cafeinablog/mailspring-claude-assistant/releases/tag/v0.1.0
