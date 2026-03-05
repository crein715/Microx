const STORAGE_KEY = 'microx_saved_media';

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateBadge') {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const items = result[STORAGE_KEY] || [];
      const count = items.length;
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#1d9bf0' });
    });
  }
});

chrome.storage.local.get(STORAGE_KEY, (result) => {
  const items = result[STORAGE_KEY] || [];
  const count = items.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#1d9bf0' });
});
