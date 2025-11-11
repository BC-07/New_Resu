/**
 * Clean Upload Module - Simple and Reliable File Upload
 * Focuses on Excel files (.xlsx, .xls) with straightforward functionality
 */

const UploadModule = {
    // State management
    state: {
        selectedJobId: null,
        uploadedFiles: [],
        sessionId: null,
        isUploading: false,
        isAnalyzing: false,
        isInitialized: false
    },

    /**
     * Initialize the upload module
     */
    init() {
        console.log('🚀 Initializing Clean Upload Module');
        
        // Prevent duplicate initialization
        if (this.state.isInitialized) {
            console.log('⚠️ Upload module already initialized, skipping...');
            return;
        }
        
        this.setupEventListeners();
        this.loadJobPostings();
        
        // Mark as initialized
        this.state.isInitialized = true;
        console.log('✅ Clean Upload Module initialized successfully');
        
        // Add debugging support for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.uploadDebug = {
                module: this,
                state: this.state,
                reloadJobs: () => this.loadJobPostings(),
                checkElements: () => this.debugCheckElements(),
                getState: () => this.state
            };
            console.log('📋 Upload debug tools available at window.uploadDebug');
        }
    },

    /**
     * Debug helper to check element availability
     */
    debugCheckElements() {
        const elements = {
            positionTypesUpload: document.getElementById('positionTypesUpload'),
            regularUploadZone: document.getElementById('regularUploadZone'),
            bulkUploadZone: document.getElementById('bulkUploadZone'),
            regularFileUpload: document.getElementById('regularFileUpload'),
            bulkFileUpload: document.getElementById('bulkFileUpload'),
            uploadInstructions: document.getElementById('uploadInstructions'),
            selectedPositionInfo: document.getElementById('selectedPositionInfo')
        };
        
        console.log('📍 Element availability check:');
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            console.log(`  ${key}: ${element ? '✅ Found' : '❌ Missing'}`);
        });
        
        return elements;
    },

    /**
     * Setup event listeners for upload zones and file inputs
     */
    setupEventListeners() {
        // Get upload zones
        const regularUploadZone = document.getElementById('regularUploadZone');
        const bulkUploadZone = document.getElementById('bulkUploadZone');
        
        // Get file inputs
        const regularFileInput = document.getElementById('regularFileUpload');
        const bulkFileInput = document.getElementById('bulkFileUpload');

        // Regular upload zone
        if (regularUploadZone) {
            regularUploadZone.addEventListener('click', () => {
                console.log('📁 Regular upload zone clicked');
                this.openFileDialog('regular');
            });

            regularUploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                regularUploadZone.classList.add('drag-over');
            });

            regularUploadZone.addEventListener('dragleave', () => {
                regularUploadZone.classList.remove('drag-over');
            });

            regularUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                regularUploadZone.classList.remove('drag-over');
                this.handleFileSelection(e.dataTransfer.files, 'regular');
            });
        }

        // Bulk upload zone  
        if (bulkUploadZone) {
            bulkUploadZone.addEventListener('click', () => {
                console.log('📁 Bulk upload zone clicked');
                this.openFileDialog('bulk');
            });

            bulkUploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                bulkUploadZone.classList.add('drag-over');
            });

            bulkUploadZone.addEventListener('dragleave', () => {
                bulkUploadZone.classList.remove('drag-over');
            });

            bulkUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                bulkUploadZone.classList.remove('drag-over');
                this.handleFileSelection(e.dataTransfer.files, 'bulk');
            });
        }

        // File input change events
        if (regularFileInput) {
            regularFileInput.addEventListener('change', (e) => {
                console.log('📄 Regular file input changed');
                this.handleFileSelection(e.target.files, 'regular');
            });
        }

        if (bulkFileInput) {
            bulkFileInput.addEventListener('change', (e) => {
                console.log('📄 Bulk file input changed');
                this.handleFileSelection(e.target.files, 'bulk');
            });
        }

        // Start analysis button
        const startAnalysisBtn = document.getElementById('startAnalysisBtn');
        if (startAnalysisBtn) {
            startAnalysisBtn.addEventListener('click', () => {
                this.startAnalysis();
            });
        }

        console.log('✅ Event listeners setup complete');
    },

    /**
     * Open file dialog for upload type
     */
    openFileDialog(type) {
        const fileInputId = type === 'regular' ? 'regularFileUpload' : 'bulkFileUpload';
        const fileInput = document.getElementById(fileInputId);
        
        console.log(`📂 Opening file dialog for ${type} (${fileInputId})`);
        
        if (fileInput) {
            console.log('✅ File input found, triggering click');
            fileInput.click();
        } else {
            console.error(`❌ File input not found: ${fileInputId}`);
            this.showError(`File input not available. Please refresh the page.`);
        }
    },

    /**
     * Handle file selection from input or drop
     */
    handleFileSelection(files, type) {
        console.log(`📁 Handling file selection: ${files.length} files for ${type}`);
        
        if (files.length === 0) {
            console.log('📭 No files selected');
            return;
        }

        if (!this.state.selectedJobId) {
            this.showError('Please select a job position first');
            return;
        }

        // Validate and filter files
        const validFiles = Array.from(files).filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showError('No valid files selected. Only Excel files (.xlsx, .xls) are supported.');
            return;
        }

        console.log(`✅ ${validFiles.length} valid files selected`);
        this.uploadFiles(validFiles);
    },

    /**
     * Validate individual file
     */
    validateFile(file) {
        const validExtensions = ['.xlsx', '.xls'];
        const maxSize = 16 * 1024 * 1024; // 16MB
        
        const fileName = file.name.toLowerCase();
        const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
        const isValidSize = file.size <= maxSize;
        
        if (!isValidType) {
            console.warn(`❌ Invalid file type: ${file.name}`);
            return false;
        }
        
        if (!isValidSize) {
            console.warn(`❌ File too large: ${file.name} (${(file.size / (1024*1024)).toFixed(2)}MB)`);
            return false;
        }
        
        console.log(`✅ Valid file: ${file.name}`);
        return true;
    },

    /**
     * Upload files to server
     */
    async uploadFiles(files) {
        if (this.state.isUploading) {
            console.log('Upload already in progress');
            return;
        }

        this.state.isUploading = true;
        console.log('Starting upload of ' + files.length + ' files');
        console.log('Using job ID: ' + this.state.selectedJobId + ' (type: ' + typeof this.state.selectedJobId + ')');

        // Show loading indicator
        this.showLoadingState('upload', 'Uploading files...');

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files[]', file);
            });
            formData.append('jobId', this.state.selectedJobId);
            console.log('FormData jobId: ' + formData.get('jobId'));

            const response = await fetch('/api/upload-files', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Upload successful:', result);
                this.state.sessionId = result.session_id;
                this.state.uploadedFiles = result.files;
                this.displayUploadedFiles(result.files);
                this.showAnalysisControls();
                this.showMessage('Successfully uploaded ' + result.file_count + ' files', 'success');
                this.hideLoadingState('upload');
            } else {
                console.error('Upload failed:', result.error);
                this.showError(result.error || 'Upload failed');
                this.hideLoadingState('upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Upload failed. Please try again.');
            this.hideLoadingState('upload');
        } finally {
            this.state.isUploading = false;
        }
    },

    /**
     * Display uploaded files in enhanced preview container
     */
    displayUploadedFiles(files) {
        const container = document.getElementById('uploadPreviewContainer');
        if (!container) return;

        if (!files || files.length === 0) {
            container.style.display = 'none';
            return;
        }

        // Create enhanced preview with header and clear functionality
        container.innerHTML = `
            <div class="upload-preview-header">
                <div class="preview-title">
                    <i class="fas fa-file-excel text-success me-2"></i>
                    <span>Uploaded Files (${files.length})</span>
                </div>
                <div class="preview-actions">
                    <button class="btn btn-sm btn-outline-secondary" onclick="UploadModule.clearUploadedFiles()" title="Clear all files">
                        <i class="fas fa-trash-alt me-1"></i>Clear All
                    </button>
                </div>
            </div>
            <div class="upload-preview-body">
                ${files.map((file, index) => `
                    <div class="uploaded-file-item" data-file-index="${index}">
                        <div class="file-icon-container">
                            <div class="file-icon excel">
                                <i class="${file.icon || 'fas fa-file-excel'}"></i>
                            </div>
                        </div>
                        <div class="file-info-container">
                            <div class="file-main-info">
                                <div class="file-name" title="${file.name}">${file.name}</div>
                                <div class="file-status">
                                    <span class="status-badge ${file.status === 'ready' ? 'success' : 'info'}">
                                        <i class="fas ${file.status === 'ready' ? 'fa-check-circle' : 'fa-clock'}"></i>
                                        ${file.status === 'ready' ? 'Ready' : file.status}
                                    </span>
                                </div>
                            </div>
                            <div class="file-details">
                                <span class="file-type">
                                    <i class="fas fa-tag me-1"></i>${file.description || 'Excel Spreadsheet'}
                                </span>
                                ${file.size ? `
                                    <span class="file-size">
                                        <i class="fas fa-weight me-1"></i>${this.formatFileSize(file.size)}
                                    </span>
                                ` : ''}
                                <span class="upload-time">
                                    <i class="fas fa-clock me-1"></i>${this.formatUploadTime(file.uploaded_at)}
                                </span>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn btn-sm btn-outline-danger" onclick="UploadModule.removeUploadedFile(${index})" title="Remove this file">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.style.display = 'block';
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Format upload time for display
     */
    formatUploadTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        try {
            const uploadTime = new Date(timestamp);
            const now = new Date();
            const diffMs = now - uploadTime;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            return uploadTime.toLocaleDateString();
        } catch (e) {
            return 'Just now';
        }
    },

    /**
     * Clear all uploaded files
     */
    clearUploadedFiles() {
        console.log('🗑️ Clearing all uploaded files');
        
        // Reset state
        this.state.uploadedFiles = [];
        this.state.sessionId = null;
        
        // Hide preview container
        const container = document.getElementById('uploadPreviewContainer');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
        
        // Hide analysis controls
        const analysisControls = document.getElementById('analysisControls');
        if (analysisControls) {
            analysisControls.style.display = 'none';
        }
        
        // Hide analysis results
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.style.display = 'none';
        }
        
        // Reset upload state flags
        this.state.isUploading = false;
        this.state.isAnalyzing = false;
        
        this.showMessage('All files cleared successfully', 'info');
    },

    /**
     * Remove a single uploaded file
     */
    removeUploadedFile(index) {
        console.log(`🗑️ Removing file at index: ${index}`);
        
        if (index >= 0 && index < this.state.uploadedFiles.length) {
            const removedFile = this.state.uploadedFiles[index];
            this.state.uploadedFiles.splice(index, 1);
            
            console.log(`✅ Removed file: ${removedFile.name}`);
            
            // Update display
            if (this.state.uploadedFiles.length === 0) {
                this.clearUploadedFiles();
            } else {
                this.displayUploadedFiles(this.state.uploadedFiles);
            }
            
            this.showMessage(`File "${removedFile.name}" removed`, 'info');
        }
    },

    /**
     * Show analysis controls
     */
    showAnalysisControls() {
        const controls = document.getElementById('analysisControls');
        if (controls) {
            controls.style.display = 'block';
        }
    },

    /**
     * Start analysis of uploaded files
     */
    async startAnalysis() {
        if (!this.state.sessionId) {
            this.showError('No files to analyze');
            return;
        }

        if (this.state.isAnalyzing) {
            console.log('Analysis already in progress');
            return;
        }

        this.state.isAnalyzing = true;
        console.log('Starting analysis...');
        
        // Show analysis progress
        this.showLoadingState('analysis', 'Analyzing files... This may take a few minutes.');
        this.showMessage('Starting analysis...', 'info');

        try {
            const response = await fetch('/api/start-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.state.sessionId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Analysis completed:', result);
                this.displayAnalysisResults(result.results);
                this.showMessage('Analysis completed: ' + result.successful_analyses + ' candidates processed', 'success');
                this.hideLoadingState('analysis');
            } else {
                console.error('Analysis failed:', result.error);
                this.showError(result.error || 'Analysis failed');
                this.hideLoadingState('analysis');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analysis failed. Please try again.');
            this.hideLoadingState('analysis');
        } finally {
            this.state.isAnalyzing = false;
        }
    },

    /**
     * Display analysis results
     */
    displayAnalysisResults(results) {
        const container = document.getElementById('analysisResults');
        if (!container) return;

        // Handle cases where results might be undefined or empty
        const safeResults = results || [];
        const resultCount = safeResults.length;

        container.innerHTML = 
            '<div class="analysis-summary">' +
                '<h4>Analysis Complete</h4>' +
                '<p>Processed ' + resultCount + ' candidates successfully</p>' +
                '<div class="results-list">' +
                    (resultCount > 0 ? safeResults.map(result => 
                        '<div class="result-item">' +
                            '<span class="candidate-name">' + (result.name || 'Unknown') + '</span>' +
                            '<span class="match-score">' + (result.matchScore || 0) + '%</span>' +
                        '</div>'
                    ).join('') : '<p class="no-results">No candidates were successfully processed.</p>') +
                '</div>' +
                '<div class="analysis-actions mt-3">' +
                    '<button class="btn btn-primary" onclick="UploadModule.redirectToCandidates()">' +
                        '<i class="fas fa-users me-2"></i>View Applications' +
                    '</button>' +
                '</div>' +
            '</div>';

        container.style.display = 'block';
        
        // Auto-redirect to candidates section after showing results
        if (resultCount > 0) {
            setTimeout(() => {
                this.redirectToCandidates();
            }, 3000);
        }
    },

    /**
     * Redirect to candidates section and refresh data
     */
    redirectToCandidates() {
        try {
            // Use NavigationModule if available
            if (window.NavigationModule) {
                window.NavigationModule.showSection('candidates');
            } else {
                // Fallback - direct URL change
                window.location.hash = '#candidates';
            }
            
            // Refresh candidates data if module is available
            if (window.CandidatesModule) {
                setTimeout(() => {
                    window.CandidatesModule.loadCandidates();
                }, 500);
            }
            
            this.showMessage('Redirecting to Applications section...', 'info');
        } catch (error) {
            console.error('Error redirecting to candidates:', error);
        }
    },

    /**
     * Load job postings
     */
    async loadJobPostings() {
        try {
            console.log('📋 Loading job postings...');
            
            // Check if DOM element exists first
            const container = document.getElementById('positionTypesUpload');
            if (!container) {
                console.error('❌ Position types grid not found! Expected element with ID: positionTypesUpload');
                // Retry after a short delay in case DOM isn't ready
                setTimeout(() => this.loadJobPostings(), 500);
                return;
            }
            
            // Try LSPU job postings first
            let response = await fetch('/api/job-postings');
            console.log('📋 Job postings response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📋 Raw API response:', data);
            
            // Handle the wrapped response format
            let jobs = [];
            if (data.success && data.postings) {
                jobs = data.postings;
            } else if (data.success && data.data) {
                jobs = data.data;
            } else if (Array.isArray(data)) {
                jobs = data;
            } else {
                console.warn('⚠️ Unexpected job postings format:', data);
                jobs = [];
            }
            
            console.log('📋 Extracted jobs:', jobs);
            
            if (jobs && jobs.length > 0) {
                this.displayJobPostings(jobs);
                console.log(`✅ Loaded ${jobs.length} job postings`);
            } else {
                console.warn('⚠️ No job postings found');
                this.displayNoJobsMessage();
            }
        } catch (error) {
            console.error('❌ Error loading job postings:', error);
            this.displayJobLoadError();
        }
    },

    /**
     * Display no jobs message
     */
    displayNoJobsMessage() {
        const container = document.getElementById('positionTypesUpload');
        if (container) {
            container.innerHTML = `
                <div class="no-jobs-message">
                    <i class="fas fa-briefcase fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No job postings available.</p>
                    <p class="text-muted small">Please contact your administrator to add job postings.</p>
                </div>
            `;
        }
    },

    /**
     * Display job loading error
     */
    displayJobLoadError() {
        const container = document.getElementById('positionTypesUpload');
        if (container) {
            container.innerHTML = `
                <div class="job-error-message">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <p class="text-warning">Failed to load job postings.</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="UploadModule.loadJobPostings()">
                        <i class="fas fa-refresh me-1"></i>Retry
                    </button>
                </div>
            `;
        }
    },

    /**
     * Display job postings
     */
    displayJobPostings(jobs) {
        const container = document.getElementById('positionTypesUpload');
        if (!container) {
            console.error('Position types grid not found! Expected element with ID: positionTypesUpload');
            return;
        }

        console.log('Found position grid element, rendering jobs...');

        if (jobs.length === 0) {
            this.displayNoJobsMessage();
            return;
        }

        // Convert jobs to expected format
        const formattedJobs = jobs.map(job => ({
            id: job.id,
            position_title: job.title || job.position_title || 'University Position',
            campus_location: job.campus || job.campus_location || job.campus_name || 'Main Campus',
            description: job.description || job.position_category || 'University position',
            position_type_name: job.position_type_name || job.category || 'University Position'
        }));

        // Create job cards with simplified event handling
        container.innerHTML = formattedJobs.map(job => `
            <div class="position-type-card" data-job-id="${job.id}">
                <div class="position-icon">
                    <i class="fas fa-university"></i>
                </div>
                <div class="position-info">
                    <h4>${job.position_title}</h4>
                    <p class="position-description">${job.description}</p>
                    <div class="position-meta">
                        <span class="campus-badge">
                            <i class="fas fa-map-marker-alt"></i>
                            ${job.campus_location}
                        </span>
                    </div>
                </div>
                <div class="position-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `).join('');

        // Add click event listeners
        const jobCards = container.querySelectorAll('.position-type-card');
        jobCards.forEach(card => {
            card.addEventListener('click', () => {
                const jobId = parseInt(card.dataset.jobId);
                const job = formattedJobs.find(j => j.id === jobId);
                if (job) {
                    this.selectJob(jobId, job);
                }
            });
        });

        console.log('Displayed ' + formattedJobs.length + ' job postings');
    },

    /**
     * Select a job for upload
     */
    selectJob(jobId, jobData) {
        console.log('Job selected: ' + jobId, jobData);
        
        // Update state
        this.state.selectedJobId = jobId;
        
        // Update UI
        const cards = document.querySelectorAll('.position-type-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            if (parseInt(card.dataset.jobId) === jobId) {
                card.classList.add('selected');
            }
        });
        
        // Show next step
        this.showUploadStep();
        this.showMessage('Job selected: ' + jobData.position_title + '. You can now upload files.', 'success');
    },

    /**
     * Show upload step
     */
    showUploadStep() {
        const uploadStep = document.getElementById('fileUploadStep');
        if (uploadStep) {
            uploadStep.style.display = 'block';
            uploadStep.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Set selected job (compatibility method)
     */
    setSelectedJob(jobId) {
        console.log('setSelectedJob called with:', jobId);
        this.state.selectedJobId = jobId;
        this.showMessage('Job selected. You can now upload files.', 'info');
    },
    setSelectedJob(jobId) {
        console.log('🎯 setSelectedJob called with:', jobId, 'type:', typeof jobId);
        this.state.selectedJobId = jobId;
        console.log('🎯 Job selected for upload. State updated:', this.state.selectedJobId);
        this.showMessage('Job selected. You can now upload files.', 'info');
    },

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        console.log(type.toUpperCase() + ': ' + message);
        
        // Try to find existing message container or create one
        let messageContainer = document.getElementById('uploadMessages');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'uploadMessages';
            messageContainer.className = 'upload-messages';
            
            const uploadSection = document.getElementById('uploadSection');
            if (uploadSection) {
                uploadSection.insertBefore(messageContainer, uploadSection.firstChild);
            }
        }
        
        const alertClass = type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'info');
        messageContainer.innerHTML = 
            '<div class="alert alert-' + alertClass + ' alert-dismissible fade show">' +
                message +
                '<button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>' +
            '</div>';
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageContainer.firstElementChild) {
                messageContainer.firstElementChild.remove();
            }
        }, 5000);
    },

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    },

    /**
     * Show loading state
     */
    showLoadingState(type, message) {
        const loadingId = type + 'Loading';
        let loadingContainer = document.getElementById(loadingId);
        
        if (!loadingContainer) {
            loadingContainer = document.createElement('div');
            loadingContainer.id = loadingId;
            loadingContainer.className = 'loading-state';
            
            const uploadSection = document.getElementById('uploadSection');
            if (uploadSection) {
                uploadSection.appendChild(loadingContainer);
            }
        }
        
        loadingContainer.innerHTML = 
            '<div class="loading-spinner-container">' +
                '<div class="spinner-border text-primary" role="status">' +
                    '<span class="visually-hidden">Loading...</span>' +
                '</div>' +
                '<div class="loading-message mt-2">' + message + '</div>' +
            '</div>';
        
        loadingContainer.style.display = 'block';
    },

    /**
     * Hide loading state
     */
    hideLoadingState(type) {
        const loadingId = type + 'Loading';
        const loadingContainer = document.getElementById(loadingId);
        
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }
};

// Auto-initialize when DOM is ready and make globally available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UploadModule.init();
        window.uploadModuleInstance = UploadModule;
    });
} else {
    UploadModule.init();
    window.uploadModuleInstance = UploadModule;
}

// Make UploadModule globally available
window.UploadModule = UploadModule;

// Debug logging to track module availability
console.log('📦 UploadModule defined and attached to window');
console.log('🔍 UploadModule methods:', Object.keys(UploadModule));