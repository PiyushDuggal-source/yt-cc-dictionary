# YouTube Caption Dictionary

A Chrome extension that lets you click on any word in YouTube video captions to instantly see its definition.

![Extension Icon](icons/icon128.png)

## Features

- 📖 **Instant Definitions**: Click any word in YouTube captions to see its dictionary definition
- 🎯 **Smart Word Detection**: Uses MutationObserver to dynamically wrap caption words as they appear
- 🎨 **macOS-style Tooltip**: Beautiful, glassmorphic tooltip with blur effect
- 🔊 **Audio Pronunciation**: Listen to how the word is pronounced (when available)
- ⚡ **Fast & Lightweight**: No background service, minimal permissions

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `yt-cc-dict` folder
6. Navigate to any YouTube video with captions enabled

## Usage

1. Go to YouTube and play a video with captions/subtitles enabled
2. Hover over any word in the captions - it will show an underline
3. Click on the word to see its definition in a popup
4. Click the 🔊 button to hear the pronunciation
5. Press Escape or click outside to close the popup

## How It Works

The extension uses a `MutationObserver` to watch for YouTube's caption container changes. When new caption text appears, each word is wrapped in a clickable `<span>` element. Clicking a word sends a request to the [Free Dictionary API](https://dictionaryapi.dev/) to fetch the definition.

### Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **API**: Free Dictionary API (no API key required)
- **Rate Limit**: 1,000 requests/hour per IP (more than sufficient)
- **Permissions**: Minimal - only `activeTab`

## File Structure

```
yt-cc-dict/
├── manifest.json     # Extension configuration
├── content.js        # Main content script
├── api.js            # Dictionary API integration
├── tooltip.js        # Tooltip UI component
├── styles.css        # All styles
├── icons/            # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT License
