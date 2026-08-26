import os
import re

files = [
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/feature_request.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    ".github/workflows/ci.yml",
    "CONTRIBUTING.md",
    "docs/CONTRIBUTING.md",
    "docs/DEPLOYMENT.md",
    "postman/globals/workspace.globals.yaml",
    "scripts/loadtest/README.md",
    "skills/analytics-tracking/skill.md",
    "skills/imagegen-frontend-mobile/skill.md",
    "skills/marketing-psychology/skill.md",
    "skills/marketing-suite/skill.md",
    "graphify-out/transcripts/loading_starting.txt",
    "graphify-out/transcripts/analysis-complete.txt"
]

for f in files:
    try:
        with open(f, "r") as fp:
            content = fp.read()
            print(f"--- {f} ---")
            lines = content.split('\n')
            # Extract headers, names, etc
            headings = [line for line in lines if line.startswith('#') or line.startswith('name:') or line.startswith('jobs:')]
            print('\n'.join(headings[:20]))
            
    except Exception as e:
        print(f"Error reading {f}: {e}")
