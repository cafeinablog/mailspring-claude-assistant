# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-08-08

### Added
- **Interface localization.** The plugin now follows Mailspring's own language
  setting (Preferences → General → Interface Language), with translations for
  English, Spanish, Portuguese and Brazilian Portuguese. Any other language
  falls back to English. All user-facing strings live in a single file
  (`src/i18n.js`), so adding a language means copying one block and translating
  its values.
- English `README.md` as the canonical version, with `README.es.md` alongside it
  and a language switcher at the top.

### Changed
- **English is now the base language of the interface.** Previously the UI was
  Spanish-only; existing users whose Mailspring is set to Spanish will see no
  difference, but the default for everyone else is now English.
- System prompts sent to Claude are now written in English, for neutrality.
  This does not change the output language: summaries still follow the thread's
  language and improved replies still keep the draft's language.
- Generic terms (Show / Hide) now use Mailspring's own translations, so they are
  localized in every language Mailspring ships.

### Fixed
- Singular/plural agreement in the summary panel, which previously produced
  phrasing like "1 messages".

## [0.1.1] - 2026-08-08

### Fixed
- **Improve reply**: the prompt now receives the draft's sender and recipients,
  so grammatical gender agreement in the generated reply is no longer left to
  chance (it could previously sign off in the wrong gender). When a name doesn't
  clearly reveal gender, it uses neutral phrasing instead of guessing.

### Changed
- More internal padding in the summary box (both in the thread header and the
  composer footer), so it feels less cramped next to a native message row.

## [0.1.0] - 2026-07-18

First public release.

### Added
- **Summarize thread**: a summary panel in the thread header and in the composer
  footer, sharing a single result (cached per thread). One "Generate summary"
  button with a configurable model.
- **Improve reply**: a free-form instruction field in the composer, with an
  Apply/Discard preview. Applying leaves the signature and the quoted message
  untouched.
- **Preferences → Claude**: settings for the API key, the model per task and a
  default improvement instruction.
- All processing happens in plain text; the email's HTML is never manipulated.
- Tested on Gmail, Google Workspace and Office 365 with Mailspring 1.22.

[0.2.0]: https://github.com/cafeinablog/mailspring-claude-assistant/releases/tag/v0.2.0
[0.1.1]: https://github.com/cafeinablog/mailspring-claude-assistant/releases/tag/v0.1.1
[0.1.0]: https://github.com/cafeinablog/mailspring-claude-assistant/releases/tag/v0.1.0
