"use strict";
(() => {
    const STORAGE_KEY = 'savedMedia';
    let allItems = [];
    let activeFilter = 'all';
    let searchQuery = '';
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
    function showToast(text) {
        const toast = document.getElementById('toast');
        toast.textContent = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
    }
    function getFilteredItems() {
        let items = [...allItems];
        if (activeFilter !== 'all') {
            items = items.filter((item) => item.mediaType === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter((item) => item.tweetText.toLowerCase().includes(q) ||
                item.authorHandle.toLowerCase().includes(q) ||
                item.authorName.toLowerCase().includes(q));
        }
        items.sort((a, b) => b.savedAt - a.savedAt);
        return items;
    }
    function truncateText(text, maxLen) {
        if (text.length <= maxLen)
            return text;
        return text.slice(0, maxLen) + '...';
    }
    function renderGallery() {
        const gallery = document.getElementById('gallery');
        const emptyState = document.getElementById('emptyState');
        const countEl = document.getElementById('itemCount');
        countEl.textContent = `${allItems.length} saved`;
        const filtered = getFilteredItems();
        const existingGrid = gallery.querySelector('.microx-grid');
        if (existingGrid)
            existingGrid.remove();
        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
            if (allItems.length > 0 && (searchQuery || activeFilter !== 'all')) {
                emptyState.querySelector('p').textContent = 'No matching items';
                emptyState.querySelector('span').textContent = 'Try a different search or filter';
            }
            else {
                emptyState.querySelector('p').textContent = 'No saved media yet';
                emptyState.querySelector('span').textContent = 'Browse X and click the bookmark icon on tweets with images or GIFs';
            }
            return;
        }
        emptyState.style.display = 'none';
        const grid = document.createElement('div');
        grid.className = 'microx-grid';
        for (const item of filtered) {
            const card = document.createElement('div');
            card.className = 'microx-card';
            const badge = document.createElement('div');
            badge.className = `microx-card-badge ${item.mediaType}`;
            badge.textContent = item.mediaType === 'gif' ? 'GIF' : 'IMG';
            card.appendChild(badge);
            if (item.mediaType === 'gif' && item.mediaUrl.endsWith('.mp4')) {
                const video = document.createElement('video');
                video.src = item.previewUrl || item.mediaUrl;
                video.muted = true;
                video.loop = true;
                video.autoplay = false;
                video.playsInline = true;
                video.preload = 'metadata';
                card.addEventListener('mouseenter', () => video.play().catch(() => { }));
                card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
                card.appendChild(video);
            }
            else {
                const img = document.createElement('img');
                img.src = item.previewUrl || item.mediaUrl;
                img.alt = item.tweetText || 'Saved media';
                img.loading = 'lazy';
                card.appendChild(img);
            }
            const overlay = document.createElement('div');
            overlay.className = 'microx-card-overlay';
            const info = document.createElement('div');
            info.className = 'microx-card-info';
            if (item.authorHandle) {
                const author = document.createElement('div');
                author.className = 'microx-card-author';
                author.textContent = item.authorHandle;
                info.appendChild(author);
            }
            if (item.tweetText) {
                const text = document.createElement('div');
                text.className = 'microx-card-text';
                text.textContent = truncateText(item.tweetText, 80);
                info.appendChild(text);
            }
            overlay.appendChild(info);
            const actions = document.createElement('div');
            actions.className = 'microx-card-actions';
            const copyBtn = document.createElement('button');
            copyBtn.className = 'microx-card-action copy';
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>URL`;
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(item.mediaUrl).then(() => showToast('URL copied!'));
            });
            actions.appendChild(copyBtn);
            const openBtn = document.createElement('button');
            openBtn.className = 'microx-card-action open';
            openBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.tweetUrl) {
                    chrome.tabs.create({ url: item.tweetUrl });
                }
            });
            actions.appendChild(openBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'microx-card-action delete';
            deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                allItems = allItems.filter((i) => i.id !== item.id);
                await setStorage(allItems);
                notifyBadge();
                renderGallery();
                showToast('Item deleted');
            });
            actions.appendChild(deleteBtn);
            overlay.appendChild(actions);
            card.appendChild(overlay);
            grid.appendChild(card);
        }
        gallery.appendChild(grid);
    }
    function initFilters() {
        const filterBtns = document.querySelectorAll('.microx-filter-btn');
        filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                filterBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderGallery();
            });
        });
    }
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = searchInput.value;
                renderGallery();
            }, 200);
        });
    }
    function initFooter() {
        const copyAllBtn = document.getElementById('copyAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const confirmOverlay = document.getElementById('confirmOverlay');
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmDelete = document.getElementById('confirmDelete');
        copyAllBtn.addEventListener('click', () => {
            if (allItems.length === 0) {
                showToast('No items to copy');
                return;
            }
            const urls = allItems.map((item) => item.mediaUrl).join('\n');
            navigator.clipboard.writeText(urls).then(() => {
                showToast(`${allItems.length} URLs copied!`);
            });
        });
        clearAllBtn.addEventListener('click', () => {
            if (allItems.length === 0) {
                showToast('Nothing to clear');
                return;
            }
            confirmOverlay.classList.add('show');
        });
        confirmCancel.addEventListener('click', () => {
            confirmOverlay.classList.remove('show');
        });
        confirmDelete.addEventListener('click', async () => {
            allItems = [];
            await setStorage(allItems);
            notifyBadge();
            confirmOverlay.classList.remove('show');
            renderGallery();
            showToast('All items cleared');
        });
        confirmOverlay.addEventListener('click', (e) => {
            if (e.target === confirmOverlay) {
                confirmOverlay.classList.remove('show');
            }
        });
    }
    async function init() {
        allItems = await getStorage();
        renderGallery();
        initFilters();
        initSearch();
        initFooter();
    }
    document.addEventListener('DOMContentLoaded', init);
})();
