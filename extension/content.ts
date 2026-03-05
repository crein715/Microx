import type { SavedMedia } from './types';

const ATTR_PROCESSED = 'data-microx-processed';
const STORAGE_KEY = 'microx_saved_media';

const BOOKMARK_OUTLINE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const BOOKMARK_FILLED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

function generateMediaId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return 'mx_' + Math.abs(hash).toString(36);
}

function getHighResImageUrl(src: string): string {
  try {
    const url = new URL(src);
    url.searchParams.set('name', 'large');
    return url.toString();
  } catch {
    return src.replace(/&name=\w+/, '&name=large').replace(/\?name=\w+/, '?name=large');
  }
}

async function getSavedMedia(): Promise<SavedMedia[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

async function saveMediaItem(item: SavedMedia): Promise<void> {
  const existing = await getSavedMedia();
  const idx = existing.findIndex((m) => m.mediaUrl === item.mediaUrl);
  if (idx === -1) {
    existing.unshift(item);
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: existing });
}

async function removeMediaItem(mediaUrl: string): Promise<void> {
  const existing = await getSavedMedia();
  const filtered = existing.filter((m) => m.mediaUrl !== mediaUrl);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}

async function isMediaSaved(mediaUrl: string): Promise<boolean> {
  const existing = await getSavedMedia();
  return existing.some((m) => m.mediaUrl === mediaUrl);
}

function notifyBadge(): void {
  try {
    chrome.runtime.sendMessage({ type: 'updateBadge' });
  } catch {
    // background may not be listening
  }
}

function extractTweetMeta(article: HTMLElement) {
  const authorEl = article.querySelector('a[role="link"] span');
  const handleEl = article.querySelector('a[role="link"][href^="/"]');
  const tweetTextEl = article.querySelector('div[data-testid="tweetText"]');
  const timeEl = article.querySelector('time');
  const linkEl = timeEl?.closest('a');

  const authorName = authorEl?.textContent?.trim() || '';
  let authorHandle = '';
  if (handleEl) {
    const href = handleEl.getAttribute('href') || '';
    authorHandle = href.split('/')[1] || '';
  }
  const tweetText = tweetTextEl?.textContent?.trim() || '';
  const tweetUrl = linkEl?.getAttribute('href')
    ? `https://x.com${linkEl.getAttribute('href')}`
    : window.location.href;

  return { authorName, authorHandle, tweetText, tweetUrl };
}

interface MediaItem {
  mediaUrl: string;
  previewUrl: string;
  mediaType: 'image' | 'gif';
  element: HTMLElement;
}

function extractMediaFromTweet(article: HTMLElement): MediaItem[] {
  const items: MediaItem[] = [];

  const photoContainers = article.querySelectorAll('div[data-testid="tweetPhoto"]');
  photoContainers.forEach((container) => {
    const img = container.querySelector('img[src*="pbs.twimg.com"]') as HTMLImageElement | null;
    if (img && img.src) {
      items.push({
        mediaUrl: getHighResImageUrl(img.src),
        previewUrl: img.src,
        mediaType: 'image',
        element: container as HTMLElement,
      });
    }
  });

  const videos = article.querySelectorAll('video');
  videos.forEach((video) => {
    const src = video.src || video.querySelector('source')?.src || '';
    const poster = video.poster || '';
    if (src || poster) {
      const parentContainer = video.closest('div[data-testid="videoPlayer"]') || video.parentElement;
      items.push({
        mediaUrl: src || poster,
        previewUrl: poster || src,
        mediaType: 'gif',
        element: (parentContainer as HTMLElement) || video,
      });
    }
  });

  return items;
}

function showTooltip(anchor: HTMLElement, message: string): void {
  const existing = anchor.querySelector('.microx-tooltip');
  if (existing) existing.remove();

  const tip = document.createElement('span');
  tip.className = 'microx-tooltip';
  tip.textContent = message;
  anchor.appendChild(tip);

  setTimeout(() => tip.remove(), 1500);
}

function createMediaOverlayButton(
  article: HTMLElement,
  mediaItem: MediaItem
): HTMLElement {
  const meta = extractTweetMeta(article);

  const overlay = document.createElement('div');
  overlay.className = 'microx-media-overlay';

  const btn = document.createElement('button');
  btn.className = 'microx-media-save-btn';
  btn.innerHTML = BOOKMARK_OUTLINE;

  if (mediaItem.mediaType === 'gif') {
    const badge = document.createElement('span');
    badge.className = 'microx-gif-badge';
    badge.textContent = 'GIF';
    btn.appendChild(badge);
  }

  isMediaSaved(mediaItem.mediaUrl).then((saved) => {
    if (saved) {
      btn.classList.add('microx-saved');
      btn.innerHTML = BOOKMARK_FILLED;
      if (mediaItem.mediaType === 'gif') {
        const badge = document.createElement('span');
        badge.className = 'microx-gif-badge';
        badge.textContent = 'GIF';
        btn.appendChild(badge);
      }
    }
  });

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const saved = await isMediaSaved(mediaItem.mediaUrl);

    if (saved) {
      await removeMediaItem(mediaItem.mediaUrl);
      btn.classList.remove('microx-saved');
      btn.innerHTML = BOOKMARK_OUTLINE;
      if (mediaItem.mediaType === 'gif') {
        const badge = document.createElement('span');
        badge.className = 'microx-gif-badge';
        badge.textContent = 'GIF';
        btn.appendChild(badge);
      }
      showTooltip(overlay, 'Removed!');
    } else {
      const item: SavedMedia = {
        id: generateMediaId(mediaItem.mediaUrl),
        mediaUrl: mediaItem.mediaUrl,
        previewUrl: mediaItem.previewUrl,
        mediaType: mediaItem.mediaType,
        tweetText: meta.tweetText,
        authorHandle: meta.authorHandle,
        authorName: meta.authorName,
        tweetUrl: meta.tweetUrl,
        savedAt: Date.now(),
      };
      await saveMediaItem(item);
      btn.classList.add('microx-saved');
      btn.innerHTML = BOOKMARK_FILLED;
      if (mediaItem.mediaType === 'gif') {
        const badge = document.createElement('span');
        badge.className = 'microx-gif-badge';
        badge.textContent = 'GIF';
        btn.appendChild(badge);
      }
      showTooltip(overlay, 'Saved!');
    }

    notifyBadge();
  });

  overlay.appendChild(btn);
  return overlay;
}

function addMediaOverlayButtons(article: HTMLElement, mediaItems: MediaItem[]): void {
  for (const mediaItem of mediaItems) {
    const container = mediaItem.element;
    const style = window.getComputedStyle(container);
    if (style.position === 'static' || style.position === '') {
      (container as HTMLElement).style.position = 'relative';
    }
    container.classList.add('microx-media-container');

    const overlay = createMediaOverlayButton(article, mediaItem);
    container.appendChild(overlay);
  }
}

function updateButtonState(btn: HTMLElement, saved: boolean, isGif: boolean): void {
  if (saved) {
    btn.classList.add('microx-saved');
    btn.innerHTML = BOOKMARK_FILLED;
  } else {
    btn.classList.remove('microx-saved');
    btn.innerHTML = BOOKMARK_OUTLINE;
  }
  if (isGif) {
    const badge = document.createElement('span');
    badge.className = 'microx-gif-badge';
    badge.textContent = 'GIF';
    btn.appendChild(badge);
  }
}

function createSaveAllButton(article: HTMLElement, mediaItems: MediaItem[]): HTMLElement {
  const meta = extractTweetMeta(article);

  const wrapper = document.createElement('div');
  wrapper.className = 'microx-save-wrapper';

  const btn = document.createElement('button');
  btn.className = 'microx-save-btn';
  btn.innerHTML = BOOKMARK_OUTLINE;
  btn.title = 'Save all media';

  Promise.all(mediaItems.map((m) => isMediaSaved(m.mediaUrl))).then((results) => {
    if (results.every(Boolean)) {
      btn.classList.add('microx-saved');
      btn.innerHTML = BOOKMARK_FILLED;
    }
  });

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const savedStates = await Promise.all(mediaItems.map((m) => isMediaSaved(m.mediaUrl)));
    const allSaved = savedStates.every(Boolean);

    if (allSaved) {
      for (const mediaItem of mediaItems) {
        await removeMediaItem(mediaItem.mediaUrl);
      }
      btn.classList.remove('microx-saved');
      btn.innerHTML = BOOKMARK_OUTLINE;
      showTooltip(wrapper, 'All removed!');

      article.querySelectorAll('.microx-media-save-btn').forEach((overlayBtn) => {
        overlayBtn.classList.remove('microx-saved');
        overlayBtn.innerHTML = BOOKMARK_OUTLINE;
      });
    } else {
      for (let i = 0; i < mediaItems.length; i++) {
        if (!savedStates[i]) {
          const mediaItem = mediaItems[i];
          const item: SavedMedia = {
            id: generateMediaId(mediaItem.mediaUrl),
            mediaUrl: mediaItem.mediaUrl,
            previewUrl: mediaItem.previewUrl,
            mediaType: mediaItem.mediaType,
            tweetText: meta.tweetText,
            authorHandle: meta.authorHandle,
            authorName: meta.authorName,
            tweetUrl: meta.tweetUrl,
            savedAt: Date.now(),
          };
          await saveMediaItem(item);
        }
      }
      btn.classList.add('microx-saved');
      btn.innerHTML = BOOKMARK_FILLED;
      showTooltip(wrapper, `Saved ${mediaItems.length} item${mediaItems.length > 1 ? 's' : ''}!`);

      article.querySelectorAll('.microx-media-save-btn').forEach((overlayBtn) => {
        overlayBtn.classList.add('microx-saved');
        overlayBtn.innerHTML = BOOKMARK_FILLED;
      });
    }

    notifyBadge();
  });

  wrapper.appendChild(btn);
  return wrapper;
}

function processTweet(article: HTMLElement): void {
  if (article.getAttribute(ATTR_PROCESSED)) return;
  article.setAttribute(ATTR_PROCESSED, 'true');

  const mediaItems = extractMediaFromTweet(article);
  if (mediaItems.length === 0) return;

  addMediaOverlayButtons(article, mediaItems);

  const actionBar = article.querySelector('div[role="group"]');
  if (actionBar) {
    const saveAllBtn = createSaveAllButton(article, mediaItems);
    actionBar.appendChild(saveAllBtn);
  }
}

function scanForTweets(): void {
  const articles = document.querySelectorAll(`article[data-testid="tweet"]:not([${ATTR_PROCESSED}])`);
  articles.forEach((article) => processTweet(article as HTMLElement));
}

const observer = new MutationObserver(() => {
  scanForTweets();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

scanForTweets();
