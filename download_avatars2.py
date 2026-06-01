import urllib.request
import os

urls = {
    'bateman': 'https://upload.wikimedia.org/wikipedia/en/c/c2/Patrick_Bateman.png',
    'homelander': 'https://upload.wikimedia.org/wikipedia/en/c/cb/Homelander.png',
    'tywin': 'https://upload.wikimedia.org/wikipedia/en/2/25/Tywin_Lannister_Charles_Dance.jpg',
    'kendall': 'https://upload.wikimedia.org/wikipedia/en/9/9c/Kendall_Roy.jpg',
    'ron': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Ron_Swanson_from_Parks_and_Recreation.JPG',
    'michael': 'https://upload.wikimedia.org/wikipedia/en/d/dc/MichaelScott.png',
}

out_dir = "/Users/anthonyedwards/.gemini/antigravity/scratch/context-finance/public/avatars"
os.makedirs(out_dir, exist_ok=True)

for key, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = response.read()
        ext = url.split('.')[-1]
        with open(f"{out_dir}/{key}.{ext}", 'wb') as f:
            f.write(data)
        print(f"Downloaded {key}")
    except Exception as e:
        print(f"Failed {key}: {e}")
