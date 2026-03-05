(() => {
  const STORAGE_KEY = 'savedMedia';

  interface _SavedMedia {
    id: string;
    mediaUrl: string;
    previewUrl: string;
    mediaType: 'image' | 'gif';
    tweetText: string;
    authorHandle: string;
    authorName: string;
    tweetUrl: string;
    savedAt: number;
  }

  function updateBadge(): void {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const items: _SavedMedia[] = (result[STORAGE_KEY] as _SavedMedia[]) || [];
      const count = items.length;
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#1d9bf0' });
    });
  }

  chrome.runtime.onMessage.addListener(
    (message: { type: string }, _sender: chrome.runtime.MessageSender, _sendResponse: (response?: unknown) => void) => {
      if (message.type === 'UPDATE_BADGE') {
        updateBadge();
      }
      return false;
    }
  );

  chrome.runtime.onInstalled.addListener(() => {
    updateBadge();
  });

  chrome.runtime.onStartup.addListener(() => {
    updateBadge();
  });
})();
