document.addEventListener("DOMContentLoaded", function() {
    const loginView = document.getElementById('login-view');
    const mainView = document.getElementById('main-view');
    const saveTokenBtns = document.querySelectorAll('.save-token');

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
            if (token) {
                const isValid = await validateToken(token);
                if (isValid) {
                    await chrome.storage.local.set({ githubToken: token });
                    showMainView();
                } else {
                    alert('Invalid token. Please try again.');
                }
            }
        });
    });
    

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
            const totalRepos = data.public_repos + (data.total_private_repos || 0);
            await chrome.storage.session.set({repos: totalRepos});

            const notiRes = await fetch('https://api.github.com/notifications', {
                headers: { 'Authorization': `token ${token}` }
            });
            const notis = await notiRes.json();
            await chrome.storage.session.set({notis: notis.length});
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
        document.getElementById('repos').innerHTML = `Repos: ${repos.repos}`;
        const notis = await chrome.storage.session.get('notis');
        document.getElementById('notis').innerHTML = `Notis: ${notis.notis}`;
    }

    async function showMainView() {
        await updateInfo();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';
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
    };

    function shrinkTextToFit(el, minSize = 12, maxSize = 18) {
        let size = maxSize;
        el.style.fontSize = `${size}px`;
        while (el.scrollWidth > el.clientWidth && size > minSize) {
            size -= 0.5;
            el.style.fontSize = `${size}px`;
        }
    }

    document.querySelectorAll(".repo-name").forEach(el => {
        shrinkTextToFit(el)
    });

    document.getElementById('settings').onclick = async () => {
        const settings = document.getElementById('settings-view');
        settings.style.display = 'block';
        
        const height = document.getElementById('main-view').getBoundingClientRect().height;
        settings.style.height = height + 'px';

        await setUpRepoSelector();
    };

    document.getElementById("settings-back").onclick = () => {
        document.getElementById("settings-view").style.display = 'none';
    };

    async function getAllRepos(token) {
        let repos = [];
        let page = 1;
        const perPage = 100;

        while (true) {

            let response = await fetch(
                `https://api.github.com/user/repos?per_page=${perPage}&page=${page}`,
                {
                    headers: { 'Authorization': `token ${ token }` }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("GitHub API error details:", errorText);
                throw new Error(`GitHub API error: ${response.status}`);
            }

            let data = await response.json();
            if (data.length === 0) break;

            repos = repos.concat(data);
            page++;
        }

        return repos;
    }

    async function setUpRepoSelector(){
        try {
            let result = await chrome.storage.local.get('githubToken');
            const repos = await getAllRepos(result.githubToken);

            result = await chrome.storage.local.get('chosenRepos'); 
            const nameList = result.chosenRepos;

            const repoList = document.getElementById("repo-list");
            repoList.innerHTML = "";

            repos.forEach(repo => {
                const div = document.createElement("div");
                div.className = "repo-item";

                const input = document.createElement("input");
                input.type = "checkbox";
                input.className = "repo-checkbox";
                input.value = repo.name;

                if (nameList.includes(repo.name)) {
                    input.checked = true;
                }

                input.onchange = async () => {
                    repoChanged(input);
                };

                const span = document.createElement("span");
                span.textContent = repo.name;

                div.appendChild(input);
                div.appendChild(span);

                repoList.appendChild(div);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function repoChanged(input) {
        let result = await chrome.storage.local.get('repoCount');
        const count = result.repoCount;
        if (!count) {
            await chrome.storage.local.set({ repoCount: 0 });
        }

        result = await chrome.storage.local.get('chosenRepos');
        let repos = result.chosenRepos;
        if (!repos) {
            await chrome.storage.local.set({ chosenRepos: [] });
        }

        if (!input.checked) {
            await chrome.storage.local.set({ repoCount: count-1 });
            const removed = repos.indexOf(input.value);
            if (removed !== -1) {
                repos.splice(removed, 1);
            }
            await chrome.storage.local.set({ chosenRepos: repos });
            console.log(await chrome.storage.local.get('chosenRepos'));

            return;
        }

        if (count == 5) {
            const removed = repos.shift();
            const checkboxes = document.querySelectorAll('.repo-checkbox');
            for(const checkbox of checkboxes) {
                if (checkbox.value == removed) {
                    checkbox.checked = false;
                    break;
                }
            }
            await chrome.storage.local.set({ repoCount: 4 });
        }

        await chrome.storage.local.set({ repoCount: count+1 });
        repos.push(input.value);
        await chrome.storage.local.set({ chosenRepos: repos });
        const a = await chrome.storage.local.get('chosenRepos');
    }

    async function showRepos(){
        const divList = document.getElementById("top-repos");
        const response = await chrome.storage.local.get("chosenRepos");
        const repoList = response.chosenRepos;

        //Each 'const repo' is just the repo name (stored as repo.name)
        for (const repo of repoList) {
            //GET REPO INFORMATION FROM GIT API

            const outerDiv = document.createElement('div');
            outerDiv.className = 'repo-inline';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'repo-name';
            nameSpan.innerHTML = repo;
        }
    }
});