# MultiRoblox Manager

A modern, robust, and elegant version of the MultiRoblox utility. Built with **Tauri**, **React**, and **TypeScript**, this manager gives you total control over your Roblox sessions on Windows.

## 🚀 Features

- **Multiple Instances:** Open as many Roblox instances as you want simultaneously (via the `ROBLOX_singletonEvent` Mutex Bypass technique).
- **Account Manager:** Save multiple Roblox accounts and switch between them easily.
- **Game Library:** Search for games, discover new ones, and launch games on specific accounts or with different custom clients natively from the app. Includes support for specific Server Job IDs.
- **Custom Clients:** Compatibility and management of modified/custom Roblox executables (like Fishtrap, Ronix, etc).
- **Player Search:** Find profiles and track API status in real-time.
- **Real-Time Monitoring:** Track PIDs and execution time of actively open instances.

## 🛠️ Built With

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend (Desktop):** Rust via Tauri
- **APIs:** Direct integration with the new Roblox endpoints (Search API, Explore API, Auth, AssetGame)

## ⚙️ How It Works

Standard Roblox detects if the game is already open by looking for a specific Windows Mutex named `ROBLOX_singletonEvent`. The Rust backend of this application proactively holds and manipulates this Mutex, "tricking" Roblox when it tries to check for locks, allowing a limitless amount of sessions to operate simultaneously on the same PC seamlessly, utilizing Account Isolation techniques via individual `LocalStorage` directories for every account.

## 💻 How to Run the Project

```bash
# 1. Clone the repository
https://github.com/Dragons-Forge/dragons-manager.git

# 2. Install dependencies
npm install

# 3. Run in development environment (Starts frontend and backend webview/Rust)
npm run tauri dev

# 4. Build for production (generates the .msi/.exe installer)
npm run tauri build
```

## 📚 Credits / Inspiration

Authored by Dragons Forge with focus on UI/UX, stability, robustness, and multi-account tooling.
