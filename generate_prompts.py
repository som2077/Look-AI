import os
from pathlib import Path

spec = Path('/home/som2077/.gemini/config/skills/graphify/references/extraction-spec.md').read_text()
spec_content = spec.split('```')[1] if '```' in spec else spec

cwd = os.getcwd()
total_chunks = 12

for i in range(1, total_chunks + 1):
    chunk_file = Path(f'graphify-out/chunk_{i}.txt')
    if not chunk_file.exists(): continue
    file_list = chunk_file.read_text().strip()
    
    prompt = spec_content
    prompt = prompt.replace('CHUNK_NUM', str(i))
    prompt = prompt.replace('TOTAL_CHUNKS', str(total_chunks))
    prompt = prompt.replace('FILE_LIST', file_list)
    prompt = prompt.replace('DEEP_MODE', '')
    
    # "CHUNK_PATH must be an absolute path"
    chunk_path = os.path.join(cwd, f'graphify-out/.graphify_chunk_{i:02d}.json')
    prompt = prompt.replace('CHUNK_PATH', chunk_path)
    
    Path(f'graphify-out/prompt_{i}.txt').write_text(prompt)

print("Generated prompt files.")
