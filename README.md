<div align="center">

# GitHub Productivity Booster

**A Chrome extension for quick GitHub navigation, repository insights, and streamlined workflow access.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![GitHub API](https://img.shields.io/badge/GitHub-API-181717?logo=github)](https://docs.github.com/en/rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

GitHub Productivity Booster puts your most important GitHub data one click away. Pin your key repositories, monitor open PRs, check notifications, and navigate to any GitHub page instantly—all from your browser toolbar.

**Built with:** Vanilla JavaScript, Chrome Extension APIs (Manifest V3), GitHub REST API

---

## Features

### 🔐 Secure Authentication
- Token-based login with GitHub Personal Access Tokens (PAT)
- Client-side token format validation before API calls
- Persistent sessions via `chrome.storage.local`

### 📊 Dashboard
- Profile display with avatar and username
- Repository count and unread notification badge
- One-click navigation to Repos, Stars, Gists, and Notifications

### 📌 Pinned Repositories
- Select up to 5 repositories to display on the home screen
- Live open PR count per repository
- Slide-in detail panel: stars, forks, watchers, issues, last updated
- Filter by owner/organization and visibility (public/private)

### ⚙️ Settings
- Light/Dark mode toggle
- Repository selector with org and visibility filters
- Token update and cache clear options

### 🎨 UI/UX
- Hamburger dropdown menu for quick navigation
- Auto-shrinking text for long repository names
- Smooth hover transitions and responsive design
- GitHub API rate limit handling with user feedback

---

## Screenshots

<!-- Add screenshots here -->
| Home | Repository Details | Settings |
|:----:|:------------------:|:--------:|
| ![Home](screenshots/home.png) | ![Details](screenshots/details.png) | ![Settings](screenshots/settings.png) |

---

## Installation

### Load Unpacked (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/jasperHall10/github-productivity-extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder
5. The extension icon will appear in your toolbar

### Generate a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)** or **Fine-grained token**
3. Select the required scopes:

   | Scope | Purpose |
   |-------|---------|
   | `repo` | Access private repos and PR counts |
   | `notifications` | Read notifications |
   | `read:org` | List organizations for filtering |

4. Copy the token and paste it into the extension login screen

---

## Project Structure

```
github-productivity-extension/
├── manifest.json        # Extension configuration (Manifest V3)
├── icons/
│   └── icon128.png      # Toolbar icon
└── popup/
    ├── popup.html       # Extension popup markup
    ├── popup.css        # Styles (dark/light themes)
    └── popup.js         # Core logic and GitHub API integration
```

---

## Technical Highlights

| Area | Implementation |
|------|----------------|
| **API Integration** | Async/await fetch calls to GitHub REST API with rate limit tracking |
| **Token Security** | Regex validation for PAT formats (`ghp_`, `github_pat_`, `gho_`, legacy hex) |
| **State Management** | `chrome.storage.local` for persistence, `chrome.storage.session` for transient data |
| **Error Handling** | User-friendly toast messages and graceful degradation on API errors |
| **Performance** | Caching to minimize API calls and respect rate limits |

---

## Roadmap

- [ ] OAuth login flow (replace manual token entry)
- [ ] Notification preview and mark-as-read from extension
- [ ] Extension badge showing unread notification count
- [ ] Recent commits display per repository
- [ ] Custom theme support beyond light/dark
- [ ] Keyboard navigation for accessibility

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**[Report Bug](../../issues) · [Request Feature](../../issues)**

© 2026 Jasper Hall

*This project is not affiliated with, endorsed by, or sponsored by GitHub, Inc.*

</div>

---

## File Structure

```
github-productivity-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── devlog.md           # Development log
├── README.md           # This file
├── icons/
│   └── icon128.png     # Extension icon
└── popup/
    ├── popup.html      # Main popup structure
    ├── popup.css       # Styling
    ├── popup.js        # Logic and API calls
    └── toggle.css      # Toggle switch styles
```

---

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the project folder
5. Click the extension icon and enter your GitHub PAT

---

## Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with scopes: `repo`, `notifications`
3. Copy the token and paste it into the extension login
