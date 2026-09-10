#!/usr/bin/env python3
import sys
from markitdown import MarkItDown

if len(sys.argv) < 2:
    sys.stderr.write("Usage: convert_to_markdown.py <file_path>\n")
    sys.exit(1)

file_path = sys.argv[1]
try:
    md = MarkItDown()
    result = md.convert(file_path)
    print(result.text_content)
except Exception as e:
    sys.stderr.write(f"Error: {e}\n")
    sys.exit(2)
