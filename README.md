# Mayank | Photography portfolio

Static site (no build step). Photos are pulled from the old Google Sites pages by `scripts/fetch_photos.py`.

## Deploy on GitHub Pages
1. Create a repo, push these files to `main`.
2. Settings > Pages > Source: **GitHub Actions**.
3. The workflow downloads the photos, optimises them to WebP, and deploys. Re-run it any time from the Actions tab.

## Local preview
    pip install pillow
    python scripts/fetch_photos.py
    python -m http.server

To add new photos later, drop WebP/JPG files in `photos/full` and `photos/thumb` and add entries to `photos.json`.
