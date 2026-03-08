document.addEventListener("DOMContentLoaded", function() {
    const loginView = document.getElementById('login-view');
    const mainView = document.getElementById('main-view');
    const saveTokenBtns = document.querySelectorAll('.save-token');

    // Rate limit tracking
    let rateLimitRemaining = null;
    let rateLimitReset = null;

    // Wrapper for API calls with rate limit handling
    async function fetchWithRateLimit(url, options) {
        // Check if we're already rate limited
        if (rateLimitRemaining === 0 && rateLimitReset) {
            const now = Date.now();
            if (now < rateLimitReset * 1000) {
                const waitMinutes = Math.ceil((rateLimitReset * 1000 - now) / 60000);
                throw new Error(`Rate limited. Resets in ${waitMinutes} min.`);
            }
        }

        const res = await fetch(url, options);
        
        // Update rate limit tracking
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const reset = res.headers.get('X-RateLimit-Reset');
        if (remaining !== null) rateLimitRemaining = parseInt(remaining, 10);
        if (reset !== null) rateLimitReset = parseInt(reset, 10);

        // Handle rate limit response
        if (res.status === 403 && rateLimitRemaining === 0) {
            const waitMinutes = Math.ceil((rateLimitReset * 1000 - Date.now()) / 60000);
            throw new Error(`Rate limited. Resets in ${waitMinutes} min.`);
        }

        return res;
    }

    checkLogin();

    async function checkLogin() {
        const result = await chrome.storage.local.get('githubToken');
        const token = result.githubToken;

        if (token) {
            const isValid = await validateToken(token);
            if (isValid) {
                showMainView();
                return;
            } else {
                await chrome.storage.local.remove('githubToken');
            }
        }
        showLoginView();
    }

    saveTokenBtns.forEach(el => {
        const tokenMap = {'settings-button': 'settings-input', 'login-button': 'login-input'};
        el.addEventListener('click', async () => {
            const tokenId = tokenMap[el.id];
            const token = document.getElementById(tokenId).value.trim();
            document.getElementById(tokenId).value = '';
            
            if (!token) {
                return;
            }

            // Validate token format before API call
            if (!isValidTokenFormat(token)) {
                alert('Invalid token format. GitHub tokens start with ghp_, github_pat_, or gho_');
                return;
            }

            const isValid = await validateToken(token);
            if (isValid) {
                await chrome.storage.local.set({ githubToken: token });
                showMainView();
            } else {
                alert('Invalid token. Please try again.');
            }
        });
    });

    // Validate GitHub token format (doesn't verify with API, just format check)
    function isValidTokenFormat(token) {
        // Classic PAT: ghp_ + 36 alphanumeric
        // Fine-grained PAT: github_pat_ + alphanumeric (variable length)
        // OAuth token: gho_ + alphanumeric
        // Old format: 40 hex characters
        const patterns = [
            /^ghp_[a-zA-Z0-9]{36}$/,           // Classic PAT
            /^github_pat_[a-zA-Z0-9_]{22,}$/,  // Fine-grained PAT
            /^gho_[a-zA-Z0-9]{36}$/,           // OAuth
            /^[a-f0-9]{40}$/                    // Legacy 40-char hex
        ];
        return patterns.some(pattern => pattern.test(token));
    }
    

    async function validateToken(token) {
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Logged in as:', data.login);
                return true;
            } else {
                console.warn('Token validation failed:', res.status);
                return false;
            }
        } catch (err) {
            console.error('Error validating token:', err);
            return false;
        }
    }

    function showLoginView() {
        loginView.style.display = 'flex';
        mainView.style.display = 'none';
    }

    async function getData() {
        try{
            const gitTok = await chrome.storage.local.get('githubToken');
            const token = gitTok.githubToken;
            const res = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });
            const data = await res.json();
            await chrome.storage.session.set({user: data.login});
            await chrome.storage.session.set({avatar: data.avatar_url});
            await chrome.storage.session.set({repos: data.public_repos});

            const notiRes = await fetch('https://api.github.com/notifications', {
                headers: { 'Authorization': `token ${token}` }
            });
            const notis = await notiRes.json();
            await chrome.storage.session.set({notis: notis.length});

            let result = await chrome.storage.local.get('repoCount');
            let count = result.repoCount;
            if (!count) {
                await chrome.storage.local.set({ repoCount: 0 });
            }
            } catch (error) {
            console.error('Network or unexpected error validating token:', error);
        }
    }

    async function updateInfo() {
        await getData();
        const username = await chrome.storage.session.get('user');
        setNavButtons(username.user);
        document.getElementById('user').innerHTML = `@${username.user}`;
        const avatar_url = await chrome.storage.session.get('avatar');
        document.getElementById('avatar').src = avatar_url.avatar;
        const repos = await chrome.storage.session.get('repos');
        document.getElementById('repos').innerHTML = `Public Repos: ${repos.repos}`;
        const notis = await chrome.storage.session.get('notis');
        document.getElementById('notis').innerHTML = `Notis: ${notis.notis}`;
    }

    async function showMainView() {
        await updateInfo();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';
        await showRepos();
        await setUpAppearance();
        repoNameFitText();
    }

    function setNavButtons(user) {
        document.getElementById("repo").onclick = function() {
            chrome.tabs.create({ url: `https://github.com/${user}?tab=repositories` });
        };
        document.getElementById("gist").onclick = function() {
            chrome.tabs.create({ url: `https://gist.github.com/${user}` });
        };
        document.getElementById("star").onclick = function() {
            chrome.tabs.create({ url: `https://github.com/${user}?tab=stars` });
        };
        document.getElementById("noti").onclick = function() {
            chrome.tabs.create({ url: 'https://github.com/notifications' });
        };
    }

    document.getElementById("refresh").onclick = async () => {
        await updateInfo();
        await showRepos(); // Also refresh pinned repos and PR counts
        repoNameFitText();
    };

    function shrinkTextToFit(el, minSize = 12, maxSize = 18) {
        let size = maxSize;
        el.style.fontSize = `${size}px`;
        while (el.scrollWidth > el.clientWidth && size > minSize) {
            size -= 0.5;
            el.style.fontSize = `${size}px`;
        }
    }

    function repoNameFitText() {
        document.querySelectorAll(".repo-name").forEach(el => {
            shrinkTextToFit(el);
        });
    }

    document.getElementById('settings').onclick = async () => {
        const settings = document.getElementById('settings-view');
        settings.style.display = 'block';

        await lightModeBox();
        
        const height = document.getElementById('main-view').getBoundingClientRect().height;
        settings.style.height = height + 'px';

        await setUpRepoSelector();
    };

    document.getElementById("settings-back").onclick = async () => {
        document.getElementById("settings-view").style.display = 'none';
        await showRepos();
        repoNameFitText();
    };

    async function lightModeBox() {
        result = await chrome.storage.local.get('lightMode');
        checked = result.lightMode;

        if (!checked) {
            checked = await chrome.storage.local.set({ 'lightMode': false});
        }

        box = document.getElementById('light-mode-box')
        if  (checked) {
            box.checked = true;
        }
    }

    document.getElementById('light-mode-box').onchange = async function() {
        if (this.checked){
            const elements = document.querySelectorAll('.dark-mode');
            elements.forEach(e => {
                e.classList.remove('dark-mode');
                e.classList.add('light-mode');
            });
            await chrome.storage.local.set({ 'lightMode': true });
        } else {
            const elements = document.querySelectorAll('.light-mode');
            elements.forEach(e => {
                e.classList.remove('light-mode');
                e.classList.add('dark-mode');
            });
            await chrome.storage.local.set({ 'lightMode': false });
        }
    }

    async function setUpAppearance() {
        result = await chrome.storage.local.get('lightMode');
        lightMode = result.lightMode;
        if (lightMode) {
            const elements = document.querySelectorAll('.dark-mode');
            elements.forEach(e => {
                e.classList.remove('dark-mode');
                e.classList.add('light-mode');
            });
        } else {
            const elements = document.querySelectorAll('.light-mode');
            elements.forEach(e => {
                e.classList.remove('light-mode');
                e.classList.add('dark-mode');
            });
        }
    }

    async function* getPersonalRepos(token, visibility = 'all') {
        const perPage = 100;
        const visParam = visibility === 'all' ? '' : `&visibility=${visibility}`;
        let page = 1;

        while (true) {
            let response = await fetch(
                `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&affiliation=owner${visParam}`,
                {
                    headers: { 'Authorization': `token ${token}` }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("GitHub API error details:", errorText);
                throw new Error(`GitHub API error: ${response.status}`);
            }

            let data = await response.json();
            if (data.length === 0) break;

            yield data;
            page++;
        }
    }

    async function* getOrgRepos(token, orgName, visibility = 'all') {
        const perPage = 100;
        const typeParam = visibility === 'all' ? '' : `&type=${visibility}`;
        let page = 1;

        while (true) {
            let response = await fetch(
                `https://api.github.com/orgs/${orgName}/repos?per_page=${perPage}&page=${page}${typeParam}`,
                {
                    headers: { 'Authorization': `token ${token}` }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("GitHub API error details:", errorText);
                throw new Error(`GitHub API error: ${response.status}`);
            }

            let data = await response.json();
            if (data.length === 0) break;

            yield data;
            page++;
        }
    }

    async function fetchAllSelectedRepos(token, { includePersonal = true, selectedOrgs = [], visibility = 'all' } = {}) {
        const allRepos = [];

        // Fetch personal repos if selected
        if (includePersonal) {
            for await (const page of getPersonalRepos(token, visibility)) {
                allRepos.push(...page);
            }
        }

        // Fetch repos for each selected org
        for (const org of selectedOrgs) {
            for await (const page of getOrgRepos(token, org, visibility)) {
                allRepos.push(...page);
            }
        }

        return allRepos;
    }

    async function fetchUserOrgs(token) {
        const res = await fetch('https://api.github.com/user/orgs', {
            headers: { 'Authorization': `token ${token}` }
        });
        if (!res.ok) return [];
        return await res.json();
    }

    let allReposCache = [];
    let currentNameList = [];
    let currentUsername = '';

    async function setUpRepoSelector(){
        try {
            let result = await chrome.storage.local.get('githubToken');
            const token = result.githubToken;

            // Get current username
            const userResult = await chrome.storage.session.get('user');
            currentUsername = userResult.user;

            result = await chrome.storage.local.get('chosenRepos');
            currentNameList = result.chosenRepos || [];
            if (!result.chosenRepos) {
                await chrome.storage.local.set({ chosenRepos: [] });
            }

            // Fetch and populate orgs
            const orgs = await fetchUserOrgs(token);
            const orgList = document.getElementById('org-list');
            orgList.innerHTML = '';
            orgs.forEach(org => {
                const label = document.createElement('label');
                label.className = 'org-option';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'org-checkbox';
                input.value = org.login;
                input.onchange = () => {
                    updateOrgButtonText();
                };
                label.appendChild(input);
                label.appendChild(document.createTextNode(org.login));
                orgList.appendChild(label);
            });

            // Set up dropdown toggle
            const dropdownBtn = document.getElementById('org-dropdown-btn');
            const dropdownMenu = document.getElementById('org-dropdown-menu');
            dropdownBtn.onclick = (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            };
            document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
            dropdownMenu.onclick = (e) => e.stopPropagation();

            // Set up filter event listeners
            document.getElementById('include-personal').onchange = () => {
                updateOrgButtonText();
            };

            // Load button
            document.getElementById('load-repos-btn').onclick = () => fetchAndRenderRepos(token);

            // Show initial message
            document.getElementById('repo-list').innerHTML = '<div style="text-align:center;">Select filters and click Load</div>';
        } catch (err) {
            console.error(err);
        }
    }

    function updateOrgButtonText() {
        const includePersonal = document.getElementById('include-personal').checked;
        const selectedOrgs = [...document.querySelectorAll('.org-checkbox:checked')].map(c => c.value);
        const total = (includePersonal ? 1 : 0) + selectedOrgs.length;
        
        const btn = document.getElementById('org-dropdown-btn');
        if (total === 0) {
            btn.textContent = 'None selected';
        } else if (includePersonal && selectedOrgs.length === 0) {
            btn.textContent = 'Personal only';
        } else if (!includePersonal && selectedOrgs.length === 1) {
            btn.textContent = selectedOrgs[0];
        } else {
            btn.textContent = `${total} selected`;
        }
    }

    async function fetchAndRenderRepos(token) {
        const includePersonal = document.getElementById('include-personal').checked;
        const selectedOrgs = [...document.querySelectorAll('.org-checkbox:checked')].map(c => c.value);
        const visibility = document.getElementById('visibility-filter').value;

        const repoList = document.getElementById("repo-list");
        
        if (!includePersonal && selectedOrgs.length === 0) {
            repoList.innerHTML = '<div style="text-align:center;">Select at least one owner</div>';
            return;
        }

        repoList.innerHTML = '<div style="text-align:center;">Loading...</div>';

        // Refresh chosen repos from storage
        const result = await chrome.storage.local.get('chosenRepos');
        currentNameList = result.chosenRepos || [];

        allReposCache = await fetchAllSelectedRepos(token, { includePersonal, selectedOrgs, visibility });

        repoList.innerHTML = "";

        allReposCache.forEach(repo => {
            const div = document.createElement("div");
            div.className = "repo-item";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "repo-checkbox";
            input.value = repo.full_name; // Store full_name (owner/repo)

            if (currentNameList.includes(repo.full_name)) {
                input.checked = true;
            }

            input.onchange = async () => {
                repoChanged(input);
            };

            const span = document.createElement("span");
            span.textContent = repo.name; // Display just the name

            div.appendChild(input);
            div.appendChild(span);

            repoList.appendChild(div);
        });

        if (allReposCache.length === 0) {
            repoList.innerHTML = '<div style="text-align:center;">No repos found</div>';
        }
    }

    async function repoChanged(input) {
        let result = await chrome.storage.local.get('repoCount');
        let count = result.repoCount;

        result = await chrome.storage.local.get('chosenRepos');
        let repos = result.chosenRepos;

        if (!input.checked) {
            count -= 1;
            await chrome.storage.local.set({ repoCount: count });
            const removed = repos.indexOf(input.value);
            if (removed !== -1) {
                repos.splice(removed, 1);
            }
            await chrome.storage.local.set({ chosenRepos: repos });
            currentNameList = repos; // Keep in sync
        } else {
            if (count > 4) {
                const removed = repos.shift();
                const checkboxes = document.querySelectorAll('.repo-checkbox');
                for(const checkbox of checkboxes) {
                    if (checkbox.value == removed) {
                        checkbox.checked = false;
                        break;
                    }
                }
                count -= 1;
                await chrome.storage.local.set({ repoCount: count });
            }

            count += 1;
            await chrome.storage.local.set({ repoCount: count });
            repos.push(input.value);
            await chrome.storage.local.set({ chosenRepos: repos });
            currentNameList = repos; // Keep in sync
        }
    }

    async function showRepos(){
        const divList = document.getElementById("top-repos");
        divList.innerHTML = "";
        const response = await chrome.storage.local.get("chosenRepos");
        const repoList = response.chosenRepos;

        if (!repoList || repoList.length === 0) {
            const header = document.createElement('h1');
            header.innerHTML = 'Pick up to five of your repos to display from the settings tab.'
            header.style = 'text-align: center;'
            divList.appendChild(header);
            return;
        }

        const gitTok = await chrome.storage.local.get('githubToken');
        const token = gitTok.githubToken;

        // Each 'repo' is now full_name (owner/repo)
        for (const repoFullName of repoList) {
            const repoName = repoFullName.split('/').pop(); // Get just the repo name for display
            
            const outerDiv = document.createElement('div');
            outerDiv.className = 'repo-inline';

            const lightMode = document.getElementById('light-mode-box').checked;

            let innerDiv;
            let nameSpan;

            if (lightMode) {
                nameSpan = document.createElement('span');
                nameSpan.className = 'repo-name light-mode';
                nameSpan.innerHTML = repoName;

                innerDiv = document.createElement('div');
                innerDiv.className = 'repo-inline-extra light-mode';
            } else {
                nameSpan = document.createElement('span');
                nameSpan.className = 'repo-name dark-mode';
                nameSpan.innerHTML = repoName;

                innerDiv = document.createElement('div');
                innerDiv.className = 'repo-inline-extra dark-mode';
            }

            const prSpan = document.createElement('span');
            prSpan.className = 'repo-prs';
            prSpan.innerHTML = 'PRs: ...';

            // Fetch PR count asynchronously
            fetchPRCount(token, repoFullName).then(count => {
                prSpan.innerHTML = `PRs: ${count}`;
            });

            const button = document.createElement('button');
            button.className = 'symbol-button';
            button.onclick = () => {
                openRepoDetail(token, repoFullName);
            };

            const buttonSpan = document.createElement('span');
            buttonSpan.className = 'symbol-icon';
            buttonSpan.innerHTML = '→';

            button.appendChild(buttonSpan);

            innerDiv.appendChild(prSpan);
            innerDiv.appendChild(button);

            outerDiv.appendChild(nameSpan);
            outerDiv.appendChild(innerDiv);

            divList.appendChild(outerDiv);
        }
    }

    async function fetchPRCount(token, repoFullName) {
        const cacheKey = `pr_${repoFullName.replace('/', '_')}`;
        
        try {
            const res = await fetchWithRateLimit(
                `https://api.github.com/repos/${repoFullName}/pulls?state=open&per_page=1`,
                {
                    headers: { 'Authorization': `token ${token}` }
                }
            );
            if (!res.ok) {
                console.log('PR fetch failed:', res.status);
                // Try to return cached value
                const cached = await chrome.storage.session.get(cacheKey);
                return cached[cacheKey] ?? 0;
            }
            
            // GitHub returns total count in Link header, or we can check array length
            const linkHeader = res.headers.get('Link');
            let count = 0;
            if (linkHeader) {
                // Parse last page number from Link header
                const match = linkHeader.match(/page=(\d+)>; rel="last"/);
                if (match) {
                    count = parseInt(match[1], 10);
                }
            } else {
                // Fallback: count the items (but this only works for small counts)
                const data = await res.json();
                count = data.length;
            }
            
            // Cache the result
            await chrome.storage.session.set({ [cacheKey]: count });
            return count;
        } catch (err) {
            console.error('Error fetching PR count:', err.message);
            // Return cached value on error (including rate limit)
            const cached = await chrome.storage.session.get(cacheKey);
            return cached[cacheKey] ?? '?';
        }
    }

    document.getElementById('clear-cache').onclick = async () => {
        await chrome.storage.session.clear();
        await chrome.storage.local.clear();
        document.getElementById("settings-view").style.display = 'none';
        showLoginView();
    }

    // Error handling
    function showError(message) {
        const toast = document.getElementById('error-toast');
        const msgEl = document.getElementById('error-message');
        msgEl.textContent = message;
        toast.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    }

    document.getElementById('error-close').onclick = () => {
        document.getElementById('error-toast').classList.add('hidden');
    };

    // Repo Detail View
    let currentRepoFullName = '';

    async function openRepoDetail(token, repoFullName) {
        currentRepoFullName = repoFullName;
        const repoName = repoFullName.split('/').pop();
        
        // Update title
        document.getElementById('repo-detail-title').textContent = repoName;
        
        // Reset stats to loading state
        document.getElementById('stat-stars').textContent = '...';
        document.getElementById('stat-forks').textContent = '...';
        document.getElementById('stat-watchers').textContent = '...';
        document.getElementById('stat-issues').textContent = '...';
        document.getElementById('stat-updated').textContent = '...';
        document.getElementById('stat-prs').textContent = '...';
        
        // Apply correct theme
        const lightMode = document.getElementById('light-mode-box').checked;
        const container = document.getElementById('repo-detail-container');
        container.classList.remove('dark-mode', 'light-mode');
        container.classList.add(lightMode ? 'light-mode' : 'dark-mode');
        
        // Match height to main view
        const height = document.getElementById('main-view').getBoundingClientRect().height;
        document.getElementById('repo-detail-view').style.height = height + 'px';
        
        // Show the view with slide animation
        document.getElementById('repo-detail-view').classList.add('show');
        
        // Fetch stats
        try {
            const stats = await fetchRepoStats(token, repoFullName);
            document.getElementById('stat-stars').textContent = stats.stars.toLocaleString();
            document.getElementById('stat-forks').textContent = stats.forks.toLocaleString();
            document.getElementById('stat-watchers').textContent = stats.watchers.toLocaleString();
            document.getElementById('stat-issues').textContent = stats.openIssues.toLocaleString();
            document.getElementById('stat-updated').textContent = stats.updatedAt;
            document.getElementById('stat-prs').textContent = stats.openPRs.toLocaleString();
        } catch (err) {
            showError('Failed to load repo stats: ' + err.message);
        }
    }

    async function fetchRepoStats(token, repoFullName) {
        const res = await fetchWithRateLimit(
            `https://api.github.com/repos/${repoFullName}`,
            {
                headers: { 'Authorization': `token ${token}` }
            }
        );
        
        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Get PR count (reuse existing function)
        const openPRs = await fetchPRCount(token, repoFullName);
        
        // Format date
        const updatedDate = new Date(data.updated_at);
        const now = new Date();
        const diffDays = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        let updatedAt;
        if (diffDays === 0) {
            updatedAt = 'Today';
        } else if (diffDays === 1) {
            updatedAt = 'Yesterday';
        } else if (diffDays < 7) {
            updatedAt = `${diffDays} days ago`;
        } else {
            updatedAt = updatedDate.toLocaleDateString();
        }
        
        return {
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            openIssues: data.open_issues_count,
            updatedAt,
            openPRs: typeof openPRs === 'number' ? openPRs : 0
        };
    }

    document.getElementById('repo-detail-close').onclick = () => {
        document.getElementById('repo-detail-view').classList.remove('show');
    };

    document.getElementById('repo-link-btn').onclick = () => {
        if (currentRepoFullName) {
            chrome.tabs.create({ url: `https://github.com/${currentRepoFullName}` });
        }
    };
});