// Upload Module Diagnostic Tool
// Paste this into browser console (F12) when on the upload page

console.log('🔍 Starting Upload Module Diagnostics...');

// Check if UploadModule exists
if (typeof UploadModule !== 'undefined') {
    console.log('✅ UploadModule is available');
    
    // Check initialization state
    console.log('🔄 Initialization state:', UploadModule.isInitialized || 'undefined');
    
    // Check debug tools
    if (window.uploadDebug) {
        console.log('🛠️ Debug tools available');
        console.log('📊 Current state:', window.uploadDebug.getState());
        console.log('📍 Element check:', window.uploadDebug.checkElements());
    } else {
        console.log('⚠️ Debug tools not available');
    }
    
    // Check key DOM elements
    const keyElements = [
        'positionTypesUpload',
        'regularUploadZone', 
        'regularFileUpload',
        'uploadInstructions',
        'selectedPositionInfo',
        'startUploadBtn'
    ];
    
    console.log('📋 DOM Elements Check:');
    keyElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅' : '❌'} ${element ? '(visible: ' + (element.style.display !== 'none') + ')' : ''}`);
    });
    
    // Check if jobs are loaded
    console.log('📄 Jobs loaded:', UploadModule.jobs ? UploadModule.jobs.length : 'undefined');
    
    // Try to reload jobs
    console.log('🔄 Attempting to reload job postings...');
    UploadModule.loadJobPostings().then(() => {
        console.log('✅ Job postings reload completed');
    }).catch(error => {
        console.error('❌ Job postings reload failed:', error);
    });
    
} else {
    console.error('❌ UploadModule not found!');
    
    // Check if scripts are loaded
    const scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.includes('upload'));
    console.log('📜 Upload-related scripts:', scripts);
}

console.log('🏁 Diagnostic complete. Check results above.');