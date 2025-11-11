// Navigation Module
const NavigationModule = {
    // Initialize navigation functionality
    init() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.content-section');
        this.sectionTitle = document.getElementById('sectionTitle');
        
        this.setupEventListeners();
        this.loadInitialSection();
        
        // Add debugging for development
        this.addDebugSupport();
    },

    // Add debugging support for development
    addDebugSupport() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.navDebug = {
                showSection: (section) => this.showSection(section),
                getValidSections: () => ['dashboard', 'upload', 'candidates', 'analytics', 'job-postings', 'settings', 'user-management'],
                getCurrentSection: () => window.location.hash.slice(1) || 'dashboard',
                testFallback: (invalidSection) => this.showNotFoundFallback(invalidSection)
            };
            console.log('Navigation debug tools available at window.navDebug');
        }
    },

    // Show a specific section
    showSection(sectionId) {
        // Validate section ID and provide fallback
        const validSections = ['dashboard', 'upload', 'candidates', 'analytics', 'job-postings', 'settings', 'user-management'];
        
        // Check if the section is valid
        if (!validSections.includes(sectionId)) {
            console.warn(`Invalid section: ${sectionId}. Redirecting to dashboard.`);
            this.showNotFoundFallback(sectionId);
            return;
        }

        // Hide all sections first
        this.sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Remove active class from all nav links
        this.navLinks.forEach(link => link.classList.remove('active'));

        // Show the target section
        const targetSection = document.getElementById(`${sectionId}Section`);
        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);

        if (targetSection && targetLink) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            targetLink.classList.add('active');
            
            // Update page title
            if (this.sectionTitle) {
                const titleSpan = targetLink.querySelector('span');
                this.sectionTitle.textContent = titleSpan ? titleSpan.textContent : sectionId;
            }
            
            // Update URL hash without triggering navigation
            this.updateUrlHash(sectionId);
            
            // Load section-specific data
            this.loadSectionData(sectionId);
        } else {
            // Section exists in valid list but DOM element not found
            console.error(`Section DOM element not found for: ${sectionId}`);
            this.showNotFoundFallback(sectionId);
        }
    },

    // Load data for specific sections
    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'upload':
                if (typeof UploadModule !== 'undefined' && UploadModule.init) {
                    UploadModule.init();
                }
                if (typeof loadJobCategoriesForUpload === 'function') {
                    loadJobCategoriesForUpload();
                }
                break;
            case 'candidates':
                if (typeof loadCandidatesSection === 'function') {
                    loadCandidatesSection();
                }
                break;
            case 'dashboard':
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                break;
            case 'analytics':
                if (typeof loadAnalytics === 'function') {
                    loadAnalytics();
                }
                break;
            case 'job-postings':
                if (typeof jobPostingManager !== 'undefined' && jobPostingManager.loadJobPostings) {
                    // Show the job posting management section
                    const jobPostingSection = document.getElementById('jobPostingManagement');
                    if (jobPostingSection) {
                        jobPostingSection.style.display = 'block';
                        jobPostingManager.loadJobPostings();
                    }
                }
                break;
            case 'user-management':
                if (typeof UserManagementModule !== 'undefined' && UserManagementModule.loadUsers) {
                    UserManagementModule.loadUsers();
                }
                break;
        }
    },

    // Show fallback for invalid sections
    showNotFoundFallback(invalidSection) {
        // Show dashboard as fallback
        const dashboardSection = document.getElementById('dashboardSection');
        const dashboardLink = document.querySelector('[data-section="dashboard"]');
        
        if (dashboardSection && dashboardLink) {
            // Hide all sections first
            this.sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            // Remove active class from all nav links
            this.navLinks.forEach(link => link.classList.remove('active'));
            
            // Show dashboard
            dashboardSection.style.display = 'block';
            dashboardSection.classList.add('active');
            dashboardLink.classList.add('active');
            
            // Update page title
            if (this.sectionTitle) {
                this.sectionTitle.textContent = 'Dashboard';
            }
            
            // Update URL to dashboard
            this.updateUrlHash('dashboard');
            
            // Show error notification
            this.showErrorNotification(invalidSection);
            
            // Load dashboard data
            this.loadSectionData('dashboard');
        }
    },

    // Update URL hash without triggering hashchange event
    updateUrlHash(sectionId) {
        try {
            // Use replaceState to update URL without triggering navigation
            if (window.history && window.history.replaceState) {
                const newUrl = window.location.pathname + window.location.search + '#' + sectionId;
                window.history.replaceState(null, '', newUrl);
            } else {
                // Fallback for older browsers
                window.location.hash = sectionId;
            }
        } catch (error) {
            console.warn('Failed to update URL hash:', error);
        }
    },

    // Show error notification for invalid URLs
    showErrorNotification(invalidSection) {
        // Create or get notification container
        let notificationContainer = document.getElementById('navigationErrorNotifications');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'navigationErrorNotifications';
            notificationContainer.className = 'navigation-error-notifications';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }

        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning alert-dismissible fade show navigation-error-alert';
        notification.style.cssText = `
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid #ffc107;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                    <strong>Page Not Found</strong><br>
                    <small>The section "${invalidSection}" doesn't exist. Redirected to Dashboard.</small>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        notificationContainer.appendChild(notification);

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 150);
            }
        }, 5000);
    },

    // Handle browser back/forward navigation
    handleHashChange() {
        const hash = window.location.hash.slice(1);
        let section = hash || 'dashboard';
        
        // Clean up hash - remove query parameters and sanitize
        section = this.sanitizeSection(section);
        
        // Don't trigger if we're already on this section (prevents loops)
        const currentActiveSection = document.querySelector('.content-section.active');
        const currentSectionId = currentActiveSection ? currentActiveSection.id.replace('Section', '') : null;
        
        if (currentSectionId !== section) {
            this.showSection(section);
        }
    },

    // Sanitize section input
    sanitizeSection(section) {
        if (!section || typeof section !== 'string') {
            return 'dashboard';
        }
        
        // Remove query parameters, fragments, and special characters
        section = section.split('?')[0].split('&')[0].split('#')[0];
        
        // Convert to lowercase and trim
        section = section.toLowerCase().trim();
        
        // Remove any non-alphanumeric characters except hyphens
        section = section.replace(/[^a-z0-9-]/g, '');
        
        // Limit length to prevent extremely long section names
        if (section.length > 50) {
            section = section.substring(0, 50);
        }
        
        return section || 'dashboard';
    },

    // Setup event listeners
    setupEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const section = link.getAttribute('data-section');
                if (section) {
                    // Only prevent default for section-based navigation
                    e.preventDefault();
                    this.showSection(section);
                }
                // Allow normal navigation for links without data-section (like logout, user-management)
            });
        });

        // Listen for browser back/forward navigation
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Listen for direct URL access with invalid routes
        window.addEventListener('load', () => {
            this.loadInitialSection();
        });
    },

    // Load initial section with better error handling
    loadInitialSection() {
        const hash = window.location.hash.slice(1);
        let initialSection = this.sanitizeSection(hash || 'dashboard');
        
        // Validate and show section
        this.showSection(initialSection);
    }
};

// Make globally available
window.NavigationModule = NavigationModule;
window.showSection = NavigationModule.showSection.bind(NavigationModule);

// Backward compatibility
window.setupNavigation = NavigationModule.init.bind(NavigationModule);
