import pytesseract
from pdf2image import convert_from_path
from PIL import Image, ImageFilter, ImageOps
import os
import sys

# Get the absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Configure paths for Tesseract-OCR and Poppler
TESSERACT_PATH = os.path.join(current_dir, "Tesseract-OCR", "tesseract.exe")
POPPLER_PATH = os.path.join(current_dir, "poppler-24.08.0", "Library", "bin")

# Set Tesseract path if the executable exists at the expected location
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    print(f"Using Tesseract from: {TESSERACT_PATH}")
else:
    print("Tesseract not found at expected path. Assuming it's in system PATH.")

# Check if Poppler path exists
if not os.path.exists(POPPLER_PATH):
    # Try parent directory
    POPPLER_PATH = os.path.join(os.path.dirname(current_dir), "poppler-24.08.0", "Library", "bin")
    if not os.path.exists(POPPLER_PATH):
        print("Warning: Poppler not found at expected paths. PDF conversion may fail.")
    else:
        print(f"Using Poppler from: {POPPLER_PATH}")
else:
    print(f"Using Poppler from: {POPPLER_PATH}")

def preprocess_image(image: Image.Image) -> Image.Image:
    """Preprocess image for better OCR results"""
    image = image.convert("L")
    image = ImageOps.autocontrast(image)
    image = image.filter(ImageFilter.MedianFilter())
    return image

def ocr_pdf_to_text(pdf_path, output_txt_path):
    """Extract text from PDF using OCR"""
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return False

    try:
        # Convert PDF to images
        convert_kwargs = {}
        if os.path.exists(POPPLER_PATH):
            convert_kwargs["poppler_path"] = POPPLER_PATH
        
        images = convert_from_path(pdf_path, **convert_kwargs)
        print(f"Successfully converted {len(images)} pages from PDF")
    except Exception as e:
        print(f"Failed to convert PDF: {e}")
        return False

    full_text = ""

    for i, image in enumerate(images):
        try:
            preprocessed = preprocess_image(image)
            text = pytesseract.image_to_string(preprocessed)
            full_text += f"\n--- Page {i + 1} ---\n{text.strip()}\n"
            print(f"Processed page {i+1}/{len(images)}")
        except Exception as e:
            print(f"Error processing page {i+1}: {e}")
            full_text += f"\n--- Page {i + 1} ---\n[Error: Could not process page]\n"

    try:
        with open(output_txt_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"Text extracted and saved to {output_txt_path}")
        return True
    except Exception as e:
        print(f"Failed to save output: {e}")
        return False

# if __name__ == "__main__":
#     pdf_path = r"C:\Users\HARSHIT BHATT\Downloads\mental_health_report.pdf"  # Replace with your PDF path
#     output_txt_path = "new.txt"
#     ocr_pdf_to_text(pdf_path, output_txt_path)