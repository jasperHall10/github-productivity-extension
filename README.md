# GitHub Productivity Booster

A Chrome extension for quick GitHub navigation and insights.

---

## Current Features

### Authentication
- **Token-based login** – Users authenticate via a GitHub Personal Access Token (PAT)
- **Token validation** – Validates token against the GitHub API before storing
- **Persistent login** – Token stored in `chrome.storage.local` to persist across sessions
- **Token update** – Users can update their token from the settings page

### User Dashboard
- **User info display** – Shows username and avatar fetched from GitHub API
- **Repository count** – Displays total repos (public + private)
- **Notification count** – Shows unread notification count

### Quick Navigation
- **Repositories** – Opens user's repositories tab on GitHub
- **Starred** – Opens user's starred repositories
- **Gists** – Opens user's gists page
- **Notifications** – Opens GitHub notifications

### Main Repos Section
- **Pinned repositories** – Display up to 5 user-selected repositories on the home screen
- **Repository selector** – Settings page allows choosing which repos to display
- **PR count display** – Shows actual open PR count for each pinned repo
- **Repo detail view** – Slide-in panel showing stars, forks, watchers, issues, and last updated
- **Owner/Org filtering** – Filter repos by personal or specific organizations
- **Visibility filtering** – Filter repos by public/private

### Settings
- **Light/Dark mode toggle** – Switch between dark (default) and light themes
- **Repository preferences** – Select up to 5 repos to display on home screen
- **Update token** – Change the stored GitHub token
- **Clear cache** – Clears all local and session storage, logs user out

### UI/UX
- **Hamburger menu** – Dropdown navigation with quick links
- **Responsive text** – Repository names auto-shrink to fit available space
- **Smooth transitions** – Hover effects and color transitions on buttons

---

## Requirements

### GitHub Token Scopes
| Scope | Purpose |
|-------|---------|
| `repo` | Access private repositories and PR counts |
| `notifications` | Read notifications list |
| `read:org` | List user's organizations for repo filtering |

### Chrome Permissions
- `tabs` – Open new tabs for navigation links
- `storage` – Store token and user preferences

### Browser Compatibility
- Chrome (Manifest V3)
- Chromium-based browsers (Edge, Brave, etc.)

---

## Roadmap

### Done
- [x] **Fetch actual PR counts** – Real open PR count for each pinned repo
- [x] **Repo quick links** – Arrow button opens repo detail view
- [x] **Loading states** – Loading indicators during API calls
- [x] **Owner/Org filtering** – Filter repos by personal or specific organizations
- [x] **Visibility filtering** – Filter repos by public/private
- [x] **Rate limit handling** – Respect GitHub API rate limits with caching
- [x] **Input validation** – Validate GitHub token format before API calls
- [x] **Error handling UI** – Display user-friendly error toast messages
- [x] **Show repo stats** – Stars, forks, watchers, issues, last updated in slide-in detail view

### Coming Later

#### Repository Enhancements
- [ ] **Recent commits** – Display last commit message or date

#### Notifications
- [ ] **Notification preview** – Show notification titles/types in extension
- [ ] **Mark as read** – Mark notifications as read from the extension
- [ ] **Notification badges** – Show unread count on extension icon

#### User Experience
- [ ] **Offline detection** – Handle network errors gracefully
- [ ] **Keyboard navigation** – Accessibility improvements

#### GitHub Integration
- [ ] **OAuth login** – Replace manual token entry with OAuth flow
- [ ] **Contribution graph** – Show contribution activity
- [ ] **Quick actions** – Create new repo, gist, or issue from extension

#### Settings & Customization
- [ ] **Custom themes** – More color scheme options beyond light/dark
- [ ] **Repo sorting** – Sort pinned repos by name, activity, etc.
- [ ] **Configurable refresh interval** – Auto-refresh data periodically
- [ ] **Export/import settings** – Backup and restore preferences

#### Code Quality
- [ ] **Modular architecture** – Split JS into separate modules
- [ ] **Unit tests** – Add test coverage

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
