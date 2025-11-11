#!/usr/bin/env python3
"""
Test script to verify Excel-only upload functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from clean_upload_handler import CleanUploadHandler
from werkzeug.datastructures import FileStorage
import io

def test_excel_validation():
    """Test that only Excel files are accepted"""
    handler = CleanUploadHandler()
    
    # Test valid Excel files
    test_files = [
        ('test.xlsx', True),
        ('test.xls', True), 
        ('TEST.XLSX', True),  # Case insensitive
        ('document.pdf', False),  # Should be rejected
        ('document.docx', False),  # Should be rejected
        ('file.txt', False),  # Should be rejected
        ('data.csv', False),  # Should be rejected
    ]
    
    print("🧪 Testing file validation...")
    
    for filename, should_pass in test_files:
        # Create mock file
        file_content = b"fake file content"
        mock_file = FileStorage(
            stream=io.BytesIO(file_content),
            filename=filename,
            content_type='application/octet-stream'
        )
        
        is_valid, error_msg, file_info = handler.validate_file(mock_file)
        
        if should_pass:
            if is_valid:
                print(f"✅ {filename}: Correctly accepted")
            else:
                print(f"❌ {filename}: Should have been accepted but was rejected: {error_msg}")
        else:
            if not is_valid:
                print(f"✅ {filename}: Correctly rejected: {error_msg}")
            else:
                print(f"❌ {filename}: Should have been rejected but was accepted")
    
    print("\n📊 Testing allowed extensions...")
    print(f"Allowed extensions: {handler.allowed_extensions}")
    
    expected_extensions = {'.xlsx', '.xls'}
    if handler.allowed_extensions == expected_extensions:
        print("✅ Allowed extensions are correct")
    else:
        print(f"❌ Expected {expected_extensions}, got {handler.allowed_extensions}")

if __name__ == "__main__":
    test_excel_validation()
    print("\n🎉 Test completed!")