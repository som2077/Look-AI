import json

data = json.loads(open('graphify-out/.graphify_analysis.json').read())
communities = data['communities']
labels = {}

# We'll just generate simple descriptive names for all of them based on the most common word in their nodes,
# or default to "Community {cid}" if it's hard to tell.
import collections, re

for cid_str, nodes in communities.items():
    cid = int(cid_str)
    # Extract words from node IDs and labels
    words = []
    for node_id in nodes:
        words.extend(re.findall(r'[a-zA-Z]+', node_id))
    
    # Filter out common stop words
    stop_words = {'src', 'app', 'ts', 'js', 'md', 'components', 'features', 'shared', 'index', 'tsx', 'api', 'ui', 'model'}
    words = [w.lower() for w in words if w.lower() not in stop_words and len(w) > 2]
    
    if words:
        counter = collections.Counter(words)
        top_words = [word for word, count in counter.most_common(2)]
        name = " ".join(top_words).title() + " Components"
        labels[cid] = name
    else:
        labels[cid] = f"Community {cid}"

with open('labels.json', 'w') as f:
    json.dump(labels, f)
