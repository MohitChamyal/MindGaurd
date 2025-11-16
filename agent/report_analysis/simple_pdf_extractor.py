"""
Simple PDF text extractor that doesn't require OCR
Works with text-based PDFs (not scanned images)
"""

import sys
import json

def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2 (handles most text-based PDFs)"""
    try:
        import PyPDF2
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
    except ImportError:
        return None
    except Exception as e:
        print(f"PyPDF2 extraction failed: {e}")
        return None

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber (better text extraction)"""
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except ImportError:
        return None
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
        return None

def extract_text_from_pdf(pdf_path, output_txt_path):
    """
    Extract text from PDF using available libraries
    Returns True if successful, False otherwise
    """
    print(f"Attempting to extract text from: {pdf_path}")
    
    # Try pdfplumber first (best quality)
    text = extract_text_pdfplumber(pdf_path)
    if text and len(text) > 50:  # Minimum length check
        print(f"Successfully extracted {len(text)} characters using pdfplumber")
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write(text)
        return True
    
    # Try PyPDF2 as fallback
    text = extract_text_pypdf2(pdf_path)
    if text and len(text) > 50:
        print(f"Successfully extracted {len(text)} characters using PyPDF2")
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write(text)
        return True
    
    # If both failed
    print("Could not extract text from PDF")
    print("Note: This PDF might be scanned/image-based and requires OCR")
    print("      Install Tesseract and Poppler for OCR support")
    
    # Write error message to output
    with open(output_txt_path, 'w', encoding='utf-8') as f:
        f.write("Error: Could not extract text. PDF might be scanned/image-based.\n")
        f.write("Install pdfplumber or PyPDF2: pip install pdfplumber PyPDF2\n")
    
    return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python simple_pdf_extractor.py <pdf_path> <output_txt_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    
    success = extract_text_from_pdf(pdf_path, output_path)
    sys.exit(0 if success else 1)
