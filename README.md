# YouTube Saved Shorts URL Extractor

A robust, client-side automation tool designed to extract every single video link from the YouTube **Saved Shorts** private collection into a clean `.txt` file.

Runs directly inside your browser's Developer Tools Console without installing extra software or browser extensions.

---

## ⚠️ A NOTE FOR DEVELOPERS (YES, I KNOW ABOUT THE API)

> **BEFORE YOU OPEN AN ISSUE OR PR ASKING "WHY DIDN'T YOU JUST USE THE API / YT-DLP / GOOGLE TAKEOUT":**
>
> **I AM FULLY AWARE OF YOUTUBE DATA API V3, INNERTUBE APIS, YT-DLP, AND GOOGLE TAKEOUT.**
> **NONE OF THEM CURRENTLY WORK FOR THIS SPECIFIC FEATURE.**
>
> 1. **YouTube Data API v3 (`playlistItems`):** The `YS...` collection is a brand-new internal system entity. Attempting to fetch it via the official API returns `404 playlistNotFound` (even with full OAuth scopes, similar to how `WL` / Watch Later has been locked down).
> 2. **yt-dlp:** Fails during authentication checks because YouTube does not serve a standard playlist webpage (`/playlist?list=YS...`) for this endpoint. Bypassing auth checks still fails to parse the pagination.
> 3. **Google Takeout:** As of now, Google Takeout exports older playlists, history, and liked videos, but **completely omits** the newer `YS` Saved Shorts table.
> 4. **Standard DOM Scraping:** The desktop viewer artificially terminates infinite scroll pagination after ~100–170 items, and mobile web (`m.youtube.com`) cuts off after ~20 items.
>
> Simulating active player playback and sequentially advancing through the reels stream is the **only reliable way** to pull thousands of saved shorts from YouTube's virtualized backend.

---

## Features

- **No limits:** Extracts entire collections (hundreds or thousands of videos) until the feed truly ends.
- **CSP & Trusted Types Compliant:** Bypasses strict YouTube Content Security Policies (`require-trusted-types-for 'script'`) by building DOM elements natively without string injection sinks (`innerHTML`).
- **Chunk-Boundary Handling:** Features an adaptive backoff and jiggle mechanism to force YouTube to fetch subsequent network batches when the player halts at virtualized boundaries (typically every 10–12 videos).
- **Auto-Mute:** Automatically silences video elements on the page so your ears don't suffer while hundreds of videos advance.
- **Floating HUD:** Real-time counter and an instant **"Export .txt"** button that lets you download captured links mid-run.

---

## How to Use

1. Open your browser and navigate to your **Saved Shorts** section on YouTube.
2. Click on the **first video** in the list so you are in the full-screen vertical Shorts player (`https://www.youtube.com/shorts/...`).
3. Press `F12` (or `Ctrl + Shift + I` / `Cmd + Option + I`) to open **Developer Tools** and switch to the **Console** tab.
4. Copy the entire contents of [`extractor.js`](./extractor.js), paste it into the console, and hit `Enter`.
5. Sit back and watch the counter. When finished (or whenever you click **Export .txt** / **Stop**), a `.txt` file containing all direct `https://www.youtube.com/shorts/<id>` links will download automatically.

---

## Configuration

You can tweak the constants at the top of `extractor.js` if needed:

| Parameter | Default | Description |
|---|---|---|
| `baseDelay` | `320` | Milliseconds to wait before advancing after a successful video detection. |
| `maxStuckRetries` | `10` | Consecutive failed attempts before declaring the end of the collection. |
| `autoMute` | `true` | Keeps audio at zero volume during extraction. |
| `exportPrefix` | `"youtube_saved_shorts"` | Prefix for the exported text file. |

---

## License

MIT
