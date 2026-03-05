import type { SavedMedia } from './types';

const STORAGE_KEY = 'microx_saved_media';
const contentEl = document.getElementById('content')!;
const countEl = document.getElementById('count')!;
const clearBtn = document.getElementById('clearAll')!;

function render(items: SavedMedia[]): void {
  countEl.textContent = `${items.length} saved`;

  if (items.length === 0) {
    contentEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📑</div>
        <p>No saved media yet.<br>Click the bookmark icon on images &amp; GIFs on X to save them here.</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid';

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'media-card';

    if (item.mediaType === 'gif') {
      const badge = document.createElement('span');
      badge.className = 'type-badge';
      badge.textContent = 'GIF';
      card.appendChild(badge);
    }

    if (item.mediaType === 'gif' && item.mediaUrl) {
      const video = document.createElement('video');
      video.src = item.previewUrl || item.mediaUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      card.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.previewUrl || item.mediaUrl;
      img.alt = item.tweetText?.slice(0, 60) || 'Saved media';
      img.loading = 'lazy';
      card.appendChild(img);
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const author = document.createElement('span');
    author.className = 'author';
    author.textContent = item.authorHandle ? `@${item.authorHandle}` : '';
    overlay.appendChild(author);
    card.appendChild(overlay);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const existing = await getItems();
      const filtered = existing.filter((m) => m.mediaUrl !== item.mediaUrl);
      await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
      render(filtered);
    });
    card.appendChild(removeBtn);

    card.addEventListener('click', () => {
      if (item.tweetUrl) {
        chrome.tabs.create({ url: item.tweetUrl });
      }
    });

    grid.appendChild(card);
  }

  contentEl.innerHTML = '';
  contentEl.appendChild(grid);
}

async function getItems(): Promise<SavedMedia[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

clearBtn.addEventListener('click', async () => {
  if (confirm('Remove all saved media?')) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    render([]);
  }
});

getItems().then(render);
