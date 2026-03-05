"use strict";
(() => {
    const STORAGE_KEY = 'savedMedia';
    function updateBadge() {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            const items = result[STORAGE_KEY] || [];
            const count = items.length;
            chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
            chrome.action.setBadgeBackgroundColor({ color: '#1d9bf0' });
        });
    }
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message.type === 'UPDATE_BADGE') {
            updateBadge();
        }
        return false;
    });
    chrome.runtime.onInstalled.addListener(() => {
        updateBadge();
    });
    chrome.runtime.onStartup.addListener(() => {
        updateBadge();
    });
})();
