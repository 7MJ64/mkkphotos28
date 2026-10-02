"""Download Mayank's photos from his Google Sites pages into photos/ and write photos.json."""
import html, io, json, pathlib, re, sys, urllib.request
from PIL import Image

BASE = "https://sites.google.com/view/mkkphotos28-portfolio/"
PAGES = {"Street": "street", "Sports": "sports", "Portraits": "portraits"}
STREET = ["Street photography", "Bus in Washington DC", "Overlook, Empire State Building",
          "Sunset at the Empire State Building", "Space Needle", "Sunset at the Empire State Building",
          "World Trade Center", "Empire State Building", "Niagara Falls", "Arlington Memorial Bridge",
          "Trinity Church, NYC", "Brooklyn Bridge", "Grand Central Oyster Bar"]
ROOT = pathlib.Path(__file__).resolve().parent.parent
(ROOT / "photos" / "thumb").mkdir(parents=True, exist_ok=True)
(ROOT / "photos" / "full").mkdir(parents=True, exist_ok=True)

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read()

def image_urls(page_html):
    t = html.unescape(page_html).replace("\\u003d", "=").replace("\\/", "/")
    seen, out = set(), []
    for m in re.finditer(r"https://sites\.google\.com/sitesv-images-rt/([A-Za-z0-9_\-]+)(=w\d+)?", t):
        token, size = m.group(1), m.group(2) or ""
        if size == "=w16383" or token in seen:
            continue
        seen.add(token); out.append(token)
    return out

photos = []
for cat, slug in PAGES.items():
    tokens = image_urls(get(BASE + slug).decode("utf-8", "ignore"))
    print(cat, len(tokens), "images")
    for i, tok in enumerate(tokens):
        name = f"{slug}-{i + 1:02d}.webp"
        try:
            im = Image.open(io.BytesIO(get(f"https://sites.google.com/sitesv-images-rt/{tok}=w1800"))).convert("RGB")
        except Exception as e:
            print("skip", name, e); continue
        full = im.copy(); full.thumbnail((1800, 1800)); full.save(ROOT / "photos/full" / name, quality=82)
        th = im.copy(); th.thumbnail((900, 900)); th.save(ROOT / "photos/thumb" / name, quality=78)
        if cat == "Street": cap = STREET[i] if i < len(STREET) else "Street photography"
        elif cat == "Sports": cap = "Game day"
        else: cap = "Crowd" if i >= len(tokens) - 3 else "Portrait"
        photos.append({"cat": cat, "cap": cap, "thumb": f"photos/thumb/{name}", "full": f"photos/full/{name}", "w": th.width, "h": th.height})

if not photos:
    sys.exit("No photos downloaded")
(ROOT / "photos.json").write_text(json.dumps(photos, indent=1))
print("Wrote", len(photos), "photos")
