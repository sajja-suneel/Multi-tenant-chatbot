import os
import logging
from typing import List, Dict, Any
import pymupdf  # PyMuPDF
from docx import Document

logger = logging.getLogger("app.rag.document_loader")

_ocr_engine = None

def get_ocr_engine():
    """Lazy initialize RapidOCR engine."""
    global _ocr_engine
    if _ocr_engine is None:
        disable_ocr = os.getenv("DISABLE_OCR", "true").lower() == "true"
        enable_ocr = os.getenv("ENABLE_OCR", "false").lower() == "true"
        if disable_ocr and not enable_ocr:
            logger.info("OCR is disabled to conserve memory and prevent request timeouts on cloud deployments.")
            _ocr_engine = False
            return None
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
            logger.info("RapidOCR engine initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize RapidOCR: {str(e)}")
            _ocr_engine = False
    return _ocr_engine if _ocr_engine else None

def perform_ocr_on_bytes(image_bytes: bytes) -> str:
    """Perform OCR on raw image bytes and return extracted text string."""
    engine = get_ocr_engine()
    if not engine:
        return ""
    try:
        result, _ = engine(image_bytes)
        if result:
            lines = [item[1] for item in result if item and len(item) > 1 and item[1]]
            return "\n".join(lines).strip()
    except Exception as e:
        logger.error(f"OCR extraction error: {str(e)}")
    return ""

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from PDF file page by page using PyMuPDF (pymupdf).
    Automatically applies lightweight OCR fallback for scanned/image PDF pages.
    """
    pages = []
    ocr_count = 0
    MAX_OCR_PAGES = 3  # Cap OCR scans per document to avoid HTTP request timeouts
    try:
        doc = pymupdf.open(file_path)
        for idx, page in enumerate(doc):
            page_num = idx + 1
            # 1. Native text extraction using PyMuPDF
            text = page.get_text().strip()

            # 2. If no text or low text density (scanned page), run OCR (capped to MAX_OCR_PAGES)
            if len(text) < 15 and ocr_count < MAX_OCR_PAGES:
                engine = get_ocr_engine()
                if engine:
                    logger.info(f"Page {page_num} of '{file_path}' has low text density ({len(text)} chars). Running OCR ({ocr_count+1}/{MAX_OCR_PAGES})...")
                    try:
                        pix = page.get_pixmap(dpi=100)  # Use 100 DPI for faster inference
                        img_bytes = pix.tobytes("png")
                        ocr_text = perform_ocr_on_bytes(img_bytes)
                        if ocr_text:
                            logger.info(f"OCR successfully extracted {len(ocr_text)} chars from page {page_num}.")
                            text = ocr_text
                        ocr_count += 1
                    except Exception as ocr_err:
                        logger.warning(f"OCR failed for page {page_num}: {str(ocr_err)}")

            if text and text.strip():
                pages.append({
                    "text": text.strip(),
                    "page_number": page_num
                })
        doc.close()
    except Exception as e:
        logger.error(f"PyMuPDF error reading PDF '{file_path}': {str(e)}")
        raise e
    return pages

def extract_text_from_image(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from standalone image files (.png, .jpg, .jpeg, .tiff, .bmp) using OCR.
    """
    try:
        with open(file_path, "rb") as f:
            img_bytes = f.read()
        logger.info(f"Running OCR on standalone image file '{file_path}'...")
        ocr_text = perform_ocr_on_bytes(img_bytes)
        if ocr_text:
            return [{"text": ocr_text, "page_number": 1}]
        else:
            logger.warning(f"No OCR text detected in image '{file_path}'.")
            return []
    except Exception as e:
        logger.error(f"Error reading image file '{file_path}': {str(e)}")
        raise e

def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from a Word DOCX file."""
    sections = []
    try:
        doc = Document(file_path)
        full_text = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                full_text.append(paragraph.text.strip())
        
        content = "\n\n".join(full_text)
        if content.strip():
            sections.append({
                "text": content.strip(),
                "page_number": 1
            })
    except Exception as e:
        logger.error(f"Error reading DOCX '{file_path}': {str(e)}")
        raise e
    return sections

def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from a plain TXT or MD file."""
    sections = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if content.strip():
                sections.append({
                    "text": content.strip(),
                    "page_number": 1
                })
    except Exception as e:
        logger.error(f"Error reading TXT '{file_path}': {str(e)}")
        raise e
    return sections

def load_document(file_path: str) -> List[Dict[str, Any]]:
    """
    General document loading helper. 
    Routes file path to correct extractor based on extension.
    Uses PyMuPDF exclusively for PDF parsing with OCR fallback for scanned pages.
    """
    _, ext = os.path.splitext(file_path.lower())
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
        return extract_text_from_image(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext in [".txt", ".md"]:
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")