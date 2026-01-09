import json
import os

# Create placeholder chapters 2-17
for i in range(2, 18):
    chapter_data = {
        "chapter": i,
        "title": f"Chapter {i}",
        "words": []
    }
    
    filename = f"data/chapters/chapter{i}.json"
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(chapter_data, f, indent=2, ensure_ascii=False)
    
    print(f"Created {filename}")