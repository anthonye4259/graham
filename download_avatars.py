import urllib.request
import json
import os

titles = {
    'graham': 'Benjamin_Graham',
    'bateman': 'Patrick_Bateman',
    'homelander': 'Homelander',
    'tywin': 'Tywin_Lannister',
    'jordan': 'Jordan_Belfort',
    'kendall': 'Kendall_Roy',
    'ron': 'Ron_Swanson',
    'michael': 'Michael_Scott_(The_Office)',
    'spongebob': 'SpongeBob_SquarePants_(character)'
}

out_dir = "/Users/anthonyedwards/.gemini/antigravity/scratch/context-finance/public/avatars"
os.makedirs(out_dir, exist_ok=True)

for key, title in titles.items():
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=400"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            r = json.loads(response.read().decode())
        
        pages = r['query']['pages']
        page = list(pages.values())[0]
        if 'thumbnail' in page:
            img_url = page['thumbnail']['source']
            print(f"Downloading {key} from {img_url}")
            
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req) as img_response:
                img_data = img_response.read()
                
            ext = img_url.split('.')[-1].split('?')[0]
            with open(f"{out_dir}/{key}.{ext}", 'wb') as f:
                f.write(img_data)
        else:
            print(f"No image found for {key}")
    except Exception as e:
        print(f"Failed for {key}: {e}")
