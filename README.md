# Cloudflare Stream Upload Interface

A simple, beautiful web interface for uploading videos to Cloudflare Stream via URL.

## Features

- 📤 Upload videos to Cloudflare Stream by URL
- 🖼️ Set custom thumbnail timestamps (in seconds)
- ✅ Video requirements validation
- 🎨 Modern, responsive UI
- ⚡ Fast and lightweight

## Video Requirements

- **Dimensions:** Must be exactly **1482 × 1080** pixels (no more, no less)
- **File Size:** Compressed to **under 10 MB** recommended for fast loading

## Usage

1. Enter the video URL
2. Enter a video name
3. (Optional) Enter a thumbnail timestamp in seconds to set a specific frame as the thumbnail
4. Click "Upload to Stream"

## Deployment

This project is configured for Netlify deployment. Simply connect your GitHub repository to Netlify and it will automatically deploy.

### Netlify Setup

1. Go to [Netlify](https://www.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select the `baltay` repository
4. Netlify will automatically detect the `netlify.toml` configuration
5. Deploy!

The site will be live at `https://your-site-name.netlify.app`

## Configuration

The API endpoint and Bearer token are configured in `index.html`. Update these if needed:

- API Endpoint: `https://api.cloudflare.com/client/v4/accounts/b5f7bbc74ed9bf4c44b19d1f3b937e22/stream/copy`
- Bearer Token: Configured in the JavaScript code

## License

MIT

