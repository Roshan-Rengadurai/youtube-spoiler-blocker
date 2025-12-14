# YouTube Spoiler Guard

Keep YouTube comments from spoiling movies, shows, or games. This extension hides comments on videos from channels or topics you specify and gives you a one-click way to reveal them when you are ready.

## Features
- Hides YouTube comments on selected channels or when video titles contain certain keywords/topics
- Clear overlay warning with a single button to reveal comments for the current video
- Lightweight popup to manage your channel and topic lists
- Stores your preferences in Chrome sync storage so they travel with your profile

## Install (unpacked)
1) Clone or download this repository.
2) In Chrome, go to `chrome://extensions/` and enable **Developer mode**.
3) Click **Load unpacked** and select this folder.
4) Pin the extension (optional) to keep the popup handy.

## Usage
1) Open the popup.
2) Add channels (one per line). You can use channel names or handles like `@marvel`.
3) Add topics/keywords to match against video titles (one per line), e.g., `star wars`, `season finale`.
4) Click **Save**.
5) Visit a YouTube video. If the channel or title matches your list, comments are blurred with a warning. Click **Reveal comments** to view them for that page.

## How it works
- `content.js` checks the current YouTube page, compares the channel name and video title to your saved lists, and locks the comments section with an overlay when there is a match.
- `popup.js` + `popup.html` provide the UI for editing channels/topics and saving them to `chrome.storage.sync`.
- Minimal CSS (`popup.css` + injected styles) keeps the UI compact and readable.

## Permissions
- `storage`: Save your channel/topic lists in Chrome sync storage.
- `https://www.youtube.com/*`: Read the channel name and video title on YouTube pages to decide when to show the warning.

## Development
- Update files, then reload the extension from `chrome://extensions/` (use the **Reload** button on the card).
- Use the background service worker/devtools console for logs if you add debugging.

## Troubleshooting
- If comments do not hide after changing lists, reload the YouTube tab (or click **Reload** in the extension card).
- Ensure channel names/handles and topics are lowercase for best matching (the popup lowercases them on save).
- YouTube’s layout changes frequently; if the guard stops working, check selectors in `content.js`.
