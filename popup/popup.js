document.addEventListener("DOMContentLoaded", function() {
    const loginView = document.getElementById('login-view');
    const mainView = document.getElementById('main-view');
    const tokenInput = document.getElementById('token-input');
    const saveTokenBtn = document.getElementById('save-token');

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

    saveTokenBtn.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
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
        } catch (error) {
            console.error('Network or unexpected error validating token:', error);
        }
    }

    async function updateInfo() {
        await getData();
        const username = await chrome.storage.session.get('user');
        setNavButtons(username);
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
    }
})