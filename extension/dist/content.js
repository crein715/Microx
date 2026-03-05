"use strict";
(() => {
    const STORAGE_KEY = 'savedMedia';
    const ATTR_PROCESSED = 'data-microx-processed';
    const ATTR_SAVE_BTN = 'data-microx-save';
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    function getStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(STORAGE_KEY, (result) => {
                resolve(result[STORAGE_KEY] || []);
            });
        });
    }
    function setStorage(items) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEY]: items }, resolve);
        });
    }
    function notifyBadge() {
        chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' });
    }
    function extractMediaFromTweet(article) {
        const media = [];
        const videoElements = article.querySelectorAll('video');
        videoElements.forEach((video) => {
            const src = video.src || video.querySelector('source')?.src;
            if (src && (src.includes('video.twimg.com') || src.includes('tweet_video'))) {
                media.push({
                    url: src,
                    preview: video.poster || src,
                    type: 'gif',
                });
            }
        });
        const photoContainers = article.querySelectorAll('div[data-testid="tweetPhoto"]');
        photoContainers.forEach((container) => {
            const img = container.querySelector('img[src*="pbs.twimg.com"]');
            if (img) {
                const isGifThumbnail = media.some((m) => m.type === 'gif');
                if (!isGifThumbnail || !img.src.includes('tweet_video_thumb')) {
                    let fullUrl = img.src;
                    try {
                        const u = new URL(fullUrl);
                        u.searchParams.set('name', 'large');
                        fullUrl = u.toString();
                    }
                    catch { }
                    let previewUrl = img.src;
                    try {
                        const u = new URL(previewUrl);
                        u.searchParams.set('name', 'small');
                        previewUrl = u.toString();
                    }
                    catch { }
                    media.push({
                        url: fullUrl,
                        preview: previewUrl,
                        type: 'image',
                    });
                }
            }
        });
        if (media.length === 0) {
            const allImgs = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
            allImgs.forEach((img) => {
                const imgEl = img;
                let fullUrl = imgEl.src;
                try {
                    const u = new URL(fullUrl);
                    u.searchParams.set('name', 'large');
                    fullUrl = u.toString();
                }
                catch { }
                media.push({
                    url: fullUrl,
                    preview: imgEl.src,
                    type: 'image',
                });
            });
        }
        return media;
    }
    function extractTweetText(article) {
        const textEl = article.querySelector('div[data-testid="tweetText"]');
        return textEl?.textContent?.trim() || '';
    }
    function extractAuthor(article) {
        const userLinks = article.querySelectorAll('a[role="link"]');
        let handle = '';
        let name = '';
        for (const link of userLinks) {
            const href = link.href;
            if (href && /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+$/.test(href)) {
                const match = href.match(/\/([A-Za-z0-9_]+)$/);
                if (match && match[1] !== 'home' && match[1] !== 'explore' && match[1] !== 'notifications') {
                    handle = `@${match[1]}`;
                    const spans = link.querySelectorAll('span');
                    for (const span of spans) {
                        if (span.textContent && !span.textContent.startsWith('@')) {
                            name = span.textContent.trim();
                            break;
                        }
                    }
                    break;
                }
            }
        }
        return { handle, name };
    }
    function extractTweetUrl(article) {
        const timeLink = article.querySelector('a[href*="/status/"]');
        if (timeLink) {
            return timeLink.href;
        }
        const allLinks = article.querySelectorAll('a[role="link"]');
        for (const link of allLinks) {
            const href = link.href;
            if (href && href.includes('/status/')) {
                return href;
            }
        }
        return window.location.href;
    }
    function showTooltip(button, text) {
        const existing = button.querySelector('.microx-tooltip');
        if (existing)
            existing.remove();
        const tooltip = document.createElement('div');
        tooltip.className = 'microx-tooltip';
        tooltip.textContent = text;
        button.style.position = 'relative';
        button.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 1500);
    }
    function createSaveButton(article, mediaItems) {
        const wrapper = document.createElement('div');
        wrapper.className = 'microx-save-wrapper';
        wrapper.setAttribute(ATTR_SAVE_BTN, 'true');
        const button = document.createElement('button');
        button.className = 'microx-save-btn';
        button.setAttribute('aria-label', 'Save media');
        button.type = 'button';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'microx-save-icon';
        iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
        button.appendChild(iconSpan);
        wrapper.appendChild(button);
        const primaryUrl = mediaItems[0]?.url || '';
        getStorage().then((saved) => {
            const alreadySaved = saved.some((item) => item.mediaUrl === primaryUrl);
            if (alreadySaved) {
                button.classList.add('microx-saved');
            }
        });
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const saved = await getStorage();
            const isSaved = saved.some((item) => item.mediaUrl === primaryUrl);
            if (isSaved) {
                const updated = saved.filter((item) => item.mediaUrl !== primaryUrl);
                await setStorage(updated);
                button.classList.remove('microx-saved');
                showTooltip(wrapper, 'Removed!');
            }
            else {
                const tweetText = extractTweetText(article);
                const { handle, name } = extractAuthor(article);
                const tweetUrl = extractTweetUrl(article);
                for (const m of mediaItems) {
                    const exists = saved.some((item) => item.mediaUrl === m.url);
                    if (!exists) {
                        saved.push({
                            id: generateId(),
                            mediaUrl: m.url,
                            previewUrl: m.preview,
                            mediaType: m.type,
                            tweetText,
                            authorHandle: handle,
                            authorName: name,
                            tweetUrl,
                            savedAt: Date.now(),
                        });
                    }
                }
                await setStorage(saved);
                button.classList.add('microx-saved');
                showTooltip(wrapper, 'Saved!');
            }
            notifyBadge();
        });
        return wrapper;
    }
    function processTweet(article) {
        if (article.getAttribute(ATTR_PROCESSED))
            return;
        article.setAttribute(ATTR_PROCESSED, 'true');
        const mediaItems = extractMediaFromTweet(article);
        if (mediaItems.length === 0)
            return;
        const actionBar = article.querySelector('div[role="group"]');
        if (!actionBar)
            return;
        const saveBtn = createSaveButton(article, mediaItems);
        actionBar.appendChild(saveBtn);
    }
    function scanForTweets() {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach((tweet) => processTweet(tweet));
    }
    scanForTweets();
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldScan = true;
                break;
            }
        }
        if (shouldScan) {
            requestAnimationFrame(scanForTweets);
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
