# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-10
### Added
- Automatic update check via GitHub releases with semantic comparison.
- Alert banner when a newer version is available.
- Current version displayed in the sidebar header and footer with quick link to the latest release.

## [1.1.0] - 2026-03-10
### Added
- Full Internationalization in Portuguese and English using `react-i18next`.
- Real-time language switching directly from the User Interface (UI).
- Optional Job ID target field integrated inside the Game Launch modal.

### Fixed
- Broken translations and hardcoded texts throughout the player profile and game browser panels.
- Cosmetic fixes and proper link attributions inside the About page.

## [1.0.0] - 2026-03-10
### Added
- Initial implementation of the modern UI built with React, TypeScript, TailwindCSS, and Framer Motion.
- Integration of native Rust backend (Tauri) with `ROBLOX_singletonEvent` Mutex bypass technique.
- Multi-instance Account isolation system utilizing individual `LocalStorage` directories.
- Persistent Multi-Account Roblox Manager with secure cookie login.
- Fully-featured Game Library integrating Roblox's official Search and Explore APIs.
- Custom Roblox Client support (detection and manual addition of Bloxstrap, Fishtrap, etc).
- Specific Server/Job ID launch capabilities directly from the Game Modal.
- Live Dashboard for actively tracking process IDs (PIDs) and uptime of instances.
- Dynamic Player Profile section with status monitoring.
- Comprehensive English & Portuguese bilingual READMEs.
- **[NEW]** Changelog system initiated to track all future app versions.
