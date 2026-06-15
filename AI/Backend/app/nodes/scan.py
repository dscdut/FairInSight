from __future__ import annotations
import asyncio
import pypdf
from pathlib import Path
from app.graphs.state import GraphState

def _extract_pdf_text_sync(path: Path) -> tuple[str, str, bool]:
    reader = pypdf.PdfReader(str(path))
    text_parts = []
    doc_title = ""
    
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            if i == 0 and not doc_title:
                lines = [line.strip() for line in page_text.split("\n") if line.strip()]
                # Skip common headers like "CỘNG HÒA XÃ HỘI...", "Độc lập - Tự do..."
                for line_idx, line in enumerate(lines[:10]): # Check first 10 lines
                    if any(k in line.upper() for k in ["LUẬT", "NGHỊ ĐỊNH", "THÔNG TƯ", "QUYẾT ĐỊNH"]):
                        # Found the main type line, title is usually this or next line
                        doc_title = line
                        if line_idx + 1 < len(lines) and len(line) < 30: # Title might be on next line
                            doc_title += " " + lines[line_idx+1]
                        break
            
            text_parts.append(page_text.strip())
    
    raw_text = "\n\n".join(text_parts)
    needs_ocr = len(raw_text.strip()) < 100
    return raw_text, doc_title, needs_ocr

async def _ocr_image_async(img, lang_to_use: str) -> str:
    import pytesseract
    return await asyncio.to_thread(pytesseract.image_to_string, img, lang=lang_to_use)

async def run(state: GraphState) -> GraphState:
    file_path = state.get("file_path")
    if not file_path:
        return {**state, "error": "file_path is required"}

    path = Path(file_path)
    if not path.exists():
        return {**state, "error": f"File not found: {file_path}"}

    try:
        # Extract text using pypdf in a background thread to prevent event loop blocking
        raw_text, doc_title, needs_ocr = await asyncio.to_thread(_extract_pdf_text_sync, path)

        # Fallback to Tesseract OCR if text is empty or too short (scanned document)
        if needs_ocr:
            import pytesseract
            # pyrefly: ignore [missing-import]
            from pdf2image import convert_from_path

            # Determine available languages to check if 'vie' is present
            try:
                available_langs = await asyncio.to_thread(pytesseract.get_languages)
            except Exception:
                available_langs = ["eng"]
            lang_to_use = "vie" if "vie" in available_langs else "eng"

            # Convert PDF pages to PIL images using local pdftoppm in a background thread
            images = await asyncio.to_thread(convert_from_path, str(path))
            
            # Run OCR in parallel with a concurrency limit (semaphore) to prevent high system load
            semaphore = asyncio.Semaphore(4)
            
            async def ocr_task(img) -> str:
                async with semaphore:
                    return await _ocr_image_async(img, lang_to_use)
            
            ocr_results = await asyncio.gather(*(ocr_task(img) for img in images))
            ocr_parts = [text.strip() for text in ocr_results if text.strip()]
            
            if ocr_parts:
                raw_text = "\n\n".join(ocr_parts)
                
                # Attempt to extract title from first page OCR text
                first_page_text = ocr_parts[0]
                lines = [line.strip() for line in first_page_text.split("\n") if line.strip()]
                for line_idx, line in enumerate(lines[:15]):
                    if any(k in line.upper() for k in ["LUẬT", "NGHỊ ĐỊNH", "THÔNG TƯ", "QUYẾT ĐỊNH"]):
                        doc_title = line
                        if line_idx + 1 < len(lines) and len(line) < 30:
                            doc_title += " " + lines[line_idx+1]
                        break

    except Exception as exc:
        return {**state, "error": f"PDF extraction / OCR failed: {str(exc)}"}

    return {**state, "raw_text": raw_text, "doc_title": doc_title or path.stem}
