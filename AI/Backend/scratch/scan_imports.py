import ast
import os
import sys
from pathlib import Path

def get_all_imports(dir_path: Path):
    imports = set()
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.py'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        tree = ast.parse(f.read(), filename=str(file_path))
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                imports.add(alias.name.split('.')[0])
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                imports.add(node.module.split('.')[0])
                except Exception as e:
                    print(f"Error parsing {file_path}: {e}")
    return imports

if __name__ == '__main__':
    project_dir = Path(__file__).resolve().parents[1]
    app_dir = project_dir / 'app'
    print(f"Scanning imports in: {app_dir}")
    all_imports = get_all_imports(app_dir)
    print("\nAll top-level imported modules:")
    for imp in sorted(all_imports):
        print(f"  - {imp}")
