document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("repo").onclick = function() {
        chrome.tabs.create({ url: "https://github.com/jasperHall10?tab=repositories" });
    };
    document.getElementById("gist").onclick = function() {
        chrome.tabs.create({ url: "https://gist.github.com/jasperHall10" });
    };
    document.getElementById("star").onclick = function() {
        chrome.tabs.create({ url: "https://github.com/jasperHall10?tab=stars" });
    };
    document.getElementById("noti").onclick = function() {
        chrome.tabs.create({ url: "https://github.com/notifications" });
    };
})