# PDF Questionnaire Analyzer

This module provides functionality to extract health questionnaire information from uploaded PDF reports and convert them into structured data for analysis in the MindGuard application.

## Components

- **pdf_questionnaire_analyzer.py**: Main script for analyzing PDFs and extracting health data
- **ocr.py**: OCR (Optical Character Recognition) utility for extracting text from PDF documents
- **setup_pdf_analyzer.py**: Setup script to check dependencies and configure paths
- **Tesseract-OCR/**: Directory containing the Tesseract OCR engine (needs to be downloaded separately)
- **poppler-24.08.0/**: Directory containing the Poppler PDF tools (needs to be downloaded separately)

## Dependencies

### Python Packages

- pytesseract
- pdf2image
- Pillow
- nltk
- numpy
- argparse

### External Tools

1. **Tesseract OCR Engine** - Required for text extraction from PDFs
   - Windows: Download from [UB-Mannheim's GitHub repository](https://github.com/UB-Mannheim/tesseract/wiki)
   - Linux: `sudo apt install tesseract-ocr`
   - macOS: `brew install tesseract`

2. **Poppler PDF Tools** - Required for PDF-to-image conversion
   - Windows: Download from [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases)
   - Linux: `sudo apt install poppler-utils`
   - macOS: `brew install poppler`

## Setup Instructions

1. Install Python 3.7 or higher

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up external tools:
   - For Windows:
     - Download and extract Tesseract-OCR into the `report_analysis/Tesseract-OCR/` directory
     - Download and extract Poppler into the `report_analysis/poppler-24.08.0/` directory

4. Run the setup script to verify installation:
   ```
   python setup_pdf_analyzer.py
   ```

5. Test the PDF analyzer with a sample file:
   ```
   python pdf_questionnaire_analyzer.py mental_health_report.pdf
   ```

## Usage

The PDF analyzer is automatically used when a user uploads a PDF through the MindGuard application interface. It can also be run manually for testing:

```
python pdf_questionnaire_analyzer.py --input <pdf_file> --output <json_output>
```

### Parameters

- `--input`: Path to the PDF file to analyze
- `--output`: Path to save the JSON output
- `--debug`: Enable debug output
- `--user-id`: Specify user ID for the results
- `--generate-report`: Generate emotion report
- `--format`: Output format (`raw` or `healthdata`)
- `--test`: Run with sample data for testing (no PDF needed)

## Troubleshooting

If you encounter issues:

1. Verify the paths to Tesseract and Poppler are correctly set in `ocr.py`
2. Run the setup script to diagnose issues: `python setup_pdf_analyzer.py`
3. Check console logs for error messages
4. Ensure all dependencies are correctly installed

## Integration with MindGuard

This module is called by the backend when a PDF file is uploaded through the `/api/health-tracking/pdf-analysis` endpoint. The extracted data is then stored in MongoDB via the `HealthReport` and `UserInteraction` models, making it available for viewing in the History page. 