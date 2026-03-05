# Microx 🔥

Personal X/Twitter engagement tool. Scrapes your For You feed, finds viral posts, and helps you rewrite them as your own content or generate clever replies.

## Features
- 🔥 Pulls viral posts from your X For You feed
- ✍️ AI rewrites viral tweets as your original content
- 💬 Generates clever reply options for engagement farming
- 🎭 5 tone presets: Spicy, Cool, Smart, Funny, Pro
- 🎬 GIF suggestions for each tweet (via GIPHY)
- 📋 One-click copy
- ✏️ Quick Write mode for freeform tweets
- 📱 Mobile responsive

## Getting Started

1. Clone and install:
   ```bash
   cd web && pnpm install
   ```

2. Set up environment:
   ```bash
   cp .env.local.example .env.local
   # Add your OpenAI API key (required)
   # Add your GIPHY API key (optional, for GIF suggestions)
   ```

3. Run:
   ```bash
   pnpm dev
   ```

4. Open the app and add your X cookies in Settings to load your feed.

## X Cookie Setup

To fetch your For You timeline, Microx needs your X session cookies:

1. Go to [x.com](https://x.com) and log in
2. Open DevTools (F12) → Application → Cookies → https://x.com
3. Copy `auth_token` and `ct0` values
4. Paste them in Microx Settings (or add to `.env.local`)

Cookies stay in your browser (localStorage) and are only used to call X's API.

## Deploy to Railway

1. Connect this repo to [Railway](https://railway.app)
2. Set root directory to `/web`
3. Add environment variables: `OPENAI_API_KEY`, `GIPHY_API_KEY`
4. Optionally add `X_AUTH_TOKEN` and `X_CSRF_TOKEN` for server-side auth
5. Railway auto-detects Next.js and deploys

## Tech Stack
- Next.js 14 + TypeScript
- Tailwind CSS
- OpenAI GPT-4o-mini
- GIPHY API
- X internal API (cookie auth)

## Author
Built by [@ualliku](https://x.com/ualliku)

## License
MIT
