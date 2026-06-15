.PHONY: serve test lint clean sync-runtime-requirements check-runtime-requirements

serve:
	PYTHONWARNINGS=ignore uvicorn app.main:app --reload --port 8000

test:
	pytest tests/ -v

lint:
	ruff check app tests
	mypy app

clean:
	rm -rf .pytest_cache .mypy_cache .ruff_cache

sync-runtime-requirements:
	python scripts/sync_runtime_requirements.py

check-runtime-requirements:
	python scripts/sync_runtime_requirements.py --check
