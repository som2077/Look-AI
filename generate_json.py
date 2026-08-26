import json
import re

files = [
    "/home/som2077/Desktop/look-ai-app/.github/ISSUE_TEMPLATE/bug_report.md",
    "/home/som2077/Desktop/look-ai-app/.github/ISSUE_TEMPLATE/feature_request.md",
    "/home/som2077/Desktop/look-ai-app/.github/PULL_REQUEST_TEMPLATE.md",
    "/home/som2077/Desktop/look-ai-app/.github/workflows/ci.yml",
    "/home/som2077/Desktop/look-ai-app/CONTRIBUTING.md",
    "/home/som2077/Desktop/look-ai-app/docs/CONTRIBUTING.md",
    "/home/som2077/Desktop/look-ai-app/docs/DEPLOYMENT.md",
    "/home/som2077/Desktop/look-ai-app/postman/globals/workspace.globals.yaml",
    "/home/som2077/Desktop/look-ai-app/scripts/loadtest/README.md",
    "/home/som2077/Desktop/look-ai-app/skills/analytics-tracking/skill.md",
    "/home/som2077/Desktop/look-ai-app/skills/imagegen-frontend-mobile/skill.md",
    "/home/som2077/Desktop/look-ai-app/skills/marketing-psychology/skill.md",
    "/home/som2077/Desktop/look-ai-app/skills/marketing-suite/skill.md",
    "/home/som2077/Desktop/look-ai-app/graphify-out/transcripts/loading_starting.txt",
    "/home/som2077/Desktop/look-ai-app/graphify-out/transcripts/analysis-complete.txt"
]

def make_id(path, entity):
    rel = path.replace("/home/som2077/Desktop/look-ai-app/", "")
    # Drop extension
    if '.' in rel:
        # handle case where the whole file starts with a dot, e.g. .github/something
        # we want to drop the last extension if it's a file extension
        parts = rel.rsplit('.', 1)
        if '/' not in parts[1]:
            rel = parts[0]
    
    stem = re.sub(r'[^a-z0-9]', '_', rel.lower())
    ent = re.sub(r'[^a-z0-9]', '_', entity.lower())
    return f"{stem}_{ent}"

nodes = []
edges = []
hyperedges = []

def add_node(path, entity, label, ftype):
    node_id = make_id(path, entity)
    nodes.append({
        "id": node_id,
        "label": label,
        "file_type": ftype,
        "source_file": path,
        "source_location": None,
        "source_url": None,
        "captured_at": None,
        "author": None,
        "contributor": None
    })
    return node_id

def add_edge(src, tgt, rel, conf, conf_score, source_file, weight=1.0):
    edges.append({
        "source": src,
        "target": tgt,
        "relation": rel,
        "confidence": conf,
        "confidence_score": conf_score,
        "source_file": source_file,
        "source_location": None,
        "weight": weight
    })

# Add nodes
n_bug = add_node(files[0], "bug_report", "Bug Report Template", "concept")
n_feat = add_node(files[1], "feature_request", "Feature Request Template", "concept")
n_pr = add_node(files[2], "pull_request", "Pull Request Template", "concept")
n_ci = add_node(files[3], "ci_workflow", "CI Workflow", "concept")
n_contrib = add_node(files[4], "contributing_guide", "Contributing Guide", "document")
n_docs_contrib = add_node(files[5], "detailed_contributing_guide", "Detailed Contributing Guide", "document")
n_deploy = add_node(files[6], "deployment_guide", "Deployment Guide", "document")
n_globals = add_node(files[7], "postman_globals", "Postman Globals", "concept")
n_loadtest = add_node(files[8], "load_test", "K6 Load Test", "concept")

n_gemini_proxy = add_node(files[6], "gemini_proxy", "Gemini Proxy Edge Function", "concept")
n_vto = add_node(files[6], "virtual_try_on", "Virtual Try On Edge Function", "concept")

n_analytics = add_node(files[9], "analytics_tracking", "Analytics Tracking", "concept")
n_imagegen = add_node(files[10], "imagegen_mobile", "Imagegen Frontend Mobile", "concept")
n_marketing_psych = add_node(files[11], "marketing_psychology", "Marketing Psychology", "concept")
n_marketing_suite = add_node(files[12], "marketing_suite", "Marketing Suite", "concept")

n_transcript_loading = add_node(files[13], "loading_starting", "Loading Starting Transcript", "concept")
n_transcript_analysis = add_node(files[14], "analysis_complete", "Analysis Complete Transcript", "concept")


# Edges
add_edge(n_contrib, n_docs_contrib, "semantically_similar_to", "INFERRED", 0.95, files[4])
add_edge(n_marketing_suite, n_marketing_psych, "cites", "INFERRED", 0.85, files[12])
add_edge(n_deploy, n_gemini_proxy, "conceptually_related_to", "EXTRACTED", 1.0, files[6])
add_edge(n_deploy, n_vto, "conceptually_related_to", "EXTRACTED", 1.0, files[6])
add_edge(n_marketing_suite, n_analytics, "cites", "INFERRED", 0.85, files[12])

# Hyperedges
hyperedges.append({
    "id": "marketing_skills",
    "label": "Marketing Skills",
    "nodes": [n_analytics, n_marketing_psych, n_marketing_suite],
    "relation": "participate_in",
    "confidence": "INFERRED",
    "confidence_score": 0.85,
    "source_file": files[12]
})

out = {
    "nodes": nodes,
    "edges": edges,
    "hyperedges": hyperedges,
    "input_tokens": 0,
    "output_tokens": 0
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)
