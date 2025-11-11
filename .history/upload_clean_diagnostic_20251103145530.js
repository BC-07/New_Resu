// Upload Clean Module Diagnostic Tool
// Paste this into browser console (F12) when on the upload page

console.log('🔍 Starting Upload Clean Module Diagnostics...');

// Check if UploadModule exists
if (typeof UploadModule !== 'undefined') {
    console.log('✅ UploadModule is available');
    
    // Check initialization state
    console.log('🔄 Initialization state:', UploadModule.state?.isInitialized || 'undefined');
    
    // Check state
    console.log('📊 Current state:', UploadModule.state);
    
    // Check debug tools
    if (window.uploadDebug) {
        console.log('🛠️ Debug tools available');
        console.log('📍 Element check:');
        window.uploadDebug.checkElements();
    } else {
        console.log('⚠️ Debug tools not available');
        
        // Manual element check
        const keyElements = [
            'positionTypesUpload',
            'regularUploadZone', 
            'bulkUploadZone',
            'regularFileUpload',
            'bulkFileUpload',
            'uploadInstructions',
            'selectedPositionInfo'
        ];
        
        console.log('📋 Manual DOM Elements Check:');
        keyElements.forEach(id => {
            const element = document.getElementById(id);
            const isVisible = element && element.style.display !== 'none' && 
                              getComputedStyle(element).display !== 'none';
            console.log(`  ${id}: ${element ? '✅' : '❌'} ${element ? '(visible: ' + isVisible + ')' : ''}`);
        });
    }
    
    // Try to reload jobs manually
    console.log('🔄 Attempting to reload job postings...');
    UploadModule.loadJobPostings().then(() => {
        console.log('✅ Job postings reload completed');
    }).catch(error => {
        console.error('❌ Job postings reload failed:', error);
    });
    
    // Test API endpoint directly
    console.log('🌐 Testing API endpoint directly...');
    fetch('/api/job-postings')
        .then(response => {
            console.log('📡 API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📋 API Response Data:', data);
        })
        .catch(error => {
            console.error('❌ API Test failed:', error);
        });
    
} else {
    console.error('❌ UploadModule not found!');
    
    // Check if scripts are loaded
    const scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.includes('upload'));
    console.log('📜 Upload-related scripts:', scripts);
    
    // Check for script loading errors
    console.log('🔍 Checking for script errors...');
    const scriptErrors = window.uploadScriptErrors || [];
    if (scriptErrors.length > 0) {
        console.error('📜 Script loading errors found:', scriptErrors);
    } else {
        console.log('📜 No script loading errors recorded');
    }
}

// Check navigation module
if (typeof NavigationModule !== 'undefined') {
    console.log('✅ NavigationModule is available');
    
    // Try to trigger upload section manually
    console.log('🔄 Triggering upload section manually...');
    try {
        NavigationModule.showSection('upload');
        console.log('✅ Upload section triggered successfully');
    } catch (error) {
        console.error('❌ Upload section trigger failed:', error);
    }
} else {
    console.error('❌ NavigationModule not found!');
}

console.log('🏁 Diagnostic complete. Check results above.');