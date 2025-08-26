## Development Log – GitHub Productivity Extension

# Day 1 – Chrome Extension Fundamentals

- Understood what Chrome Extensions are, and popular ways in which they can be useful
- Understood Manifest V3 structure, and how Chrome Extensions are developed
- Created a manifest.json file, and placeholder popup.html, popup.css, and popup.js files
- Checked that the empty extension could load onto Chrome
- Commit: "Day 1: Project scaffold with manifest and basic popup"

# Day 2 - Initializing Buttons

- Popups simply smaller websites
- chrome.tab.create triggers a new tab to be opened with a given url
- chrome.tab requires the tab perm in manifest
- Added Repositories, Gists, Starred, and Notification buttons with functional links
- Began to style
- Commit: "Day 2: Implemented popup UI with navigation buttons"

# Day 3 - Token Login

- Altered appearance of popup
- Added hamburger dropdown button
- Understood GitHub tokens
- Worked with GitHub API to validate token login
- Fethced information regarding username, avatar, repository count, etc. from GitHub API
- Worked with chrome.storage.local and chrome.storage.session to update information and remain logged in
- Commit: "Day 3: Updated UI and implemented login and personal data features"

# Day 4 - Main Repository Placeholder

- Created a new home screen main section
- Main section includes 5 repositories with buttons which will link to more information on each
- Created placeholders for each
- Unified all buttons, and altered appearance slightly
- Moved button nav to dropdown from hamburger button
- Commit: "Day 4: Updated UI to include placeholders for repository information and navigation dropdown"
