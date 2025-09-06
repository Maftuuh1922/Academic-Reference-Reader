class AcademicReader {
    constructor() {
        this.references = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.limit = 12;
        this.currentReference = null;
        this.currentView = 'dashboard';
        this.sidebarOpen = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkStorageType();
        this.loadDashboard();
        this.setupNavigation();
    }

    setupNavigation() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Sidebar overlay
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Add New Paper button
        document.getElementById('addNewPaperBtn').addEventListener('click', () => {
            this.switchView('upload');
        });
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (this.sidebarOpen) {
            sidebar.classList.add('open');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.add('hidden');
        }
    }

    closeSidebar() {
        this.sidebarOpen = false;
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }

    switchView(viewName) {
        // Update current view
        this.currentView = viewName;
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });

        // Show selected view
        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // Load view-specific content
        switch (viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'search':
                this.loadReferences();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'categories':
                this.loadCategories();
                break;
        }

        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }

    async loadDashboard() {
        try {
            // Load dashboard statistics
            const statsResponse = await fetch('/api/references/stats/overview');
            const stats = await statsResponse.json();
            
            // Update stats cards
            document.getElementById('totalPapers').textContent = stats.totalReferences.toLocaleString();
            document.getElementById('totalCategories').textContent = stats.disciplineStats.length;
            document.getElementById('totalTags').textContent = '2,341'; // Mock data for now

            // Calculate recent additions
            const recentCount = stats.recentReferences.length * 10; // Mock calculation
            document.getElementById('weeklyIncrease').textContent = `+${recentCount} this week`;

            // Load category distribution
            this.renderCategoryDistribution(stats.disciplineStats, stats.totalReferences);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    renderCategoryDistribution(disciplines, total) {
        const container = document.getElementById('categoryDistribution');
        
        // Map disciplines to colors
        const colorMap = {
            'Computer Science': 'bg-stem',
            'Social Sciences': 'bg-social', 
            'Health Sciences': 'bg-health',
            'Business': 'bg-business',
            'Arts': 'bg-arts',
            'Education': 'bg-education',
            'Law': 'bg-law',
            'Interdisciplinary': 'bg-interdisciplinary'
        };

        const defaultColors = ['bg-stem', 'bg-social', 'bg-health', 'bg-business', 'bg-arts', 'bg-education', 'bg-law', 'bg-interdisciplinary'];

        container.innerHTML = disciplines.slice(0, 8).map((discipline, index) => {
            const percentage = Math.round((discipline.count / total) * 100);
            const color = colorMap[discipline._id] || defaultColors[index % defaultColors.length];
            
            return `
                <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                        <span class="font-medium text-gray-900">${discipline._id}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-gray-500">${discipline.count} papers</span>
                            <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">+${Math.floor(Math.random() * 20)}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full ${color}"></div>
                        <div class="flex-1 progress-bar h-2">
                            <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs text-gray-500 w-10 text-right">${percentage}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/references/stats/overview');
            const stats = await response.json();
            
            const content = document.getElementById('analyticsView').querySelector('.bg-white');
            content.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-book text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.totalReferences}</div>
                                <div class="text-sm opacity-80">Total References</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-chart-line text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.typeStats.length}</div>
                                <div class="text-sm opacity-80">Types</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-graduation-cap text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.disciplineStats.length}</div>
                                <div class="text-sm opacity-80">Disciplines</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-orange-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.recentReferences.length}</div>
                                <div class="text-sm opacity-80">Recent</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-gray-50 p-6 rounded-lg border">
                        <h3 class="text-lg font-semibold mb-4">By Type</h3>
                        <div class="space-y-3">
                            ${stats.typeStats.map(type => `
                                <div class="flex items-center justify-between">
                                    <span class="type-badge type-${type._id}">${type._id.toUpperCase()}</span>
                                    <span class="font-semibold">${type.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-6 rounded-lg border">
                        <h3 class="text-lg font-semibold mb-4">By Discipline</h3>
                        <div class="space-y-3">
                            ${stats.disciplineStats.slice(0, 8).map(discipline => `
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-700">${discipline._id}</span>
                                    <span class="font-semibold">${discipline.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    loadCategories() {
        // Show folder management
        const folderSection = document.getElementById('folderSection');
        if (folderSection) {
            folderSection.classList.remove('hidden');
        }
    }

    async checkStorageType() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            if (health.storage === 'in-memory') {
                // Show clear data button for in-memory storage
                document.getElementById('clearDataBtn').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error checking storage type:', error);
        }
    }

    bindEvents() {
        // Form submissions
        document.getElementById('urlForm').addEventListener('submit', this.handleAddURL.bind(this));
        document.getElementById('uploadForm').addEventListener('submit', this.handleUploadPDF.bind(this));
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', this.debounce(this.handleSearch.bind(this), 500));
        document.getElementById('filterType').addEventListener('change', this.handleFilter.bind(this));
        document.getElementById('filterDiscipline').addEventListener('change', this.handleFilter.bind(this));
        document.getElementById('sortBy').addEventListener('change', this.handleFilter.bind(this));
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('uploadBtn').addEventListener('click', this.openUploadModal.bind(this));
        document.getElementById('cancelUpload').addEventListener('click', this.closeUploadModal.bind(this));
        document.getElementById('statsBtn').addEventListener('click', this.openStatsModal.bind(this));
        document.getElementById('closeStats').addEventListener('click', this.closeStatsModal.bind(this));
        document.getElementById('clearDataBtn').addEventListener('click', this.clearAllData.bind(this));
        
        // Upload drag and drop
        this.setupDragAndDrop();
        
        // Close modals on background click
        this.setupModalBackgroundClose();
    }

    setupDragAndDrop() {
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('pdfFile');
        
        dropArea.addEventListener('click', () => fileInput.click());
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
        });
        
        dropArea.addEventListener('drop', this.handleDrop.bind(this), false);
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    setupModalBackgroundClose() {
        ['readerModal', 'uploadModal', 'statsModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            document.getElementById('pdfFile').files = files;
            this.updateFileDisplay(files[0]);
        } else {
            this.showNotification('Please drop a PDF file', 'error');
        }
    }

    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            this.updateFileDisplay(e.target.files[0]);
        }
    }

    updateFileDisplay(file) {
        const dropArea = document.getElementById('dropArea');
        dropArea.innerHTML = `
            <i class="fas fa-file-pdf text-4xl text-red-500 mb-4"></i>
            <p class="text-gray-700 font-medium">${file.name}</p>
            <p class="text-sm text-gray-500">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        `;
    }

    async handleAddURL(e) {
        e.preventDefault();
        
        const url = document.getElementById('urlInput').value.trim();
        
        if (!url) {
            this.showNotification('Please enter a URL', 'error');
            return;
        }
        
        try {
            this.showLoading('Extracting content from URL...');
            
            const response = await fetch('/api/references/add-from-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(
                    `Reference added successfully! Detected as: ${result.reference.type.toUpperCase()}`, 
                    'success'
                );
                document.getElementById('urlInput').value = '';
                this.loadReferences();
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Network error: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleUploadPDF(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('pdfFile');
        const title = document.getElementById('pdfTitle').value.trim();
        const authors = document.getElementById('pdfAuthors').value.trim();
        const type = document.getElementById('pdfType').value;
        
        if (!fileInput.files.length) {
            this.showNotification('Please select a PDF file', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('pdf', fileInput.files[0]);
        if (title) formData.append('title', title);
        if (authors) formData.append('authors', authors);
        formData.append('type', type);
        
        try {
            this.showLoading('Processing PDF file...');
            
            const response = await fetch('/api/upload/upload-pdf', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('PDF uploaded and processed successfully!', 'success');
                this.closeUploadModal();
                this.resetUploadForm();
                this.loadReferences();
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Upload error: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleSearch() {
        this.currentPage = 1;
        this.loadReferences();
    }

    handleFilter() {
        this.currentPage = 1;
        this.loadReferences();
    }

    async loadReferences() {
        try {
            const params = this.buildQueryParams();
            const response = await fetch(`/api/references?${params}`);
            const data = await response.json();
            
            this.references = data.references;
            this.totalPages = data.pagination.pages;
            this.renderReferences(data.references);
            this.renderPagination(data.pagination);
        } catch (error) {
            console.error('Error loading references:', error);
            this.showNotification('Error loading references', 'error');
        }
    }

    buildQueryParams() {
        const params = new URLSearchParams();
        
        const search = document.getElementById('searchInput').value.trim();
        const type = document.getElementById('filterType').value;
        const discipline = document.getElementById('filterDiscipline').value;
        const sortBy = document.getElementById('sortBy').value;
        
        if (search) params.append('search', search);
        if (type) params.append('type', type);
        if (discipline) params.append('discipline', discipline);
        if (sortBy) params.append('sortBy', sortBy);
        
        params.append('page', this.currentPage);
        params.append('limit', this.limit);
        
        return params.toString();
    }

    renderReferences(references) {
        const grid = document.getElementById('referencesGrid');
        
        if (references.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500">No references found</p>
                    <p class="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = references.map(ref => `
            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow card">
                <div class="flex justify-between items-start mb-3">
                    <span class="type-badge type-${ref.type}">
                        ${ref.type.toUpperCase()}
                    </span>
                    <div class="flex items-center space-x-2">
                        ${ref.bookmarked ? '<i class="fas fa-bookmark text-yellow-500"></i>' : ''}
                        ${ref.rating ? this.renderStarsSmall(ref.rating) : ''}
                    </div>
                </div>
                
                <span class="text-xs text-gray-500 block mb-2">
                    <i class="fas fa-tag mr-1"></i>${ref.discipline || 'General'}
                </span>
                
                <h3 class="font-bold text-lg mb-2 line-clamp-2 text-gray-800">${this.escapeHtml(ref.title)}</h3>
                
                <p class="text-sm text-gray-600 mb-2">
                    <i class="fas fa-user mr-1"></i>
                    ${ref.authors?.length ? ref.authors.join(', ') : 'Unknown Author'}
                </p>
                
                ${ref.publicationYear ? `
                    <p class="text-sm text-gray-500 mb-3">
                        <i class="fas fa-calendar mr-1"></i>${ref.publicationYear}
                    </p>
                ` : ''}
                
                <p class="text-sm text-gray-700 mb-4 line-clamp-3">${this.escapeHtml(ref.abstract || 'No abstract available')}</p>
                
                <div class="flex gap-2">
                    <button onclick="academicReader.openReader('${ref._id}')" 
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm btn-hover">
                        <i class="fas fa-book-open mr-1"></i>Read
                    </button>
                    ${ref.url ? `
                        <a href="${ref.url}" target="_blank" 
                           class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm btn-hover">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                    <button onclick="academicReader.toggleBookmark('${ref._id}')" 
                            class="bg-yellow-100 text-yellow-700 px-4 py-2 rounded hover:bg-yellow-200 text-sm btn-hover">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        
        if (pagination.pages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div class="flex items-center space-x-2">';
        
        // Previous button
        if (pagination.page > 1) {
            html += `<button onclick="academicReader.goToPage(${pagination.page - 1})" 
                            class="px-3 py-2 border rounded hover:bg-gray-50">
                        <i class="fas fa-chevron-left"></i>
                    </button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        if (startPage > 1) {
            html += `<button onclick="academicReader.goToPage(1)" class="px-3 py-2 border rounded hover:bg-gray-50">1</button>`;
            if (startPage > 2) html += '<span class="px-2">...</span>';
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="academicReader.goToPage(${i})" 
                            class="px-3 py-2 border rounded ${i === pagination.page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}">
                        ${i}
                    </button>`;
        }
        
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) html += '<span class="px-2">...</span>';
            html += `<button onclick="academicReader.goToPage(${pagination.pages})" class="px-3 py-2 border rounded hover:bg-gray-50">${pagination.pages}</button>`;
        }
        
        // Next button
        if (pagination.page < pagination.pages) {
            html += `<button onclick="academicReader.goToPage(${pagination.page + 1})" 
                            class="px-3 py-2 border rounded hover:bg-gray-50">
                        <i class="fas fa-chevron-right"></i>
                    </button>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    async openReader(referenceId) {
        try {
            this.showLoading('Loading reference...');
            
            const response = await fetch(`/api/references/${referenceId}`);
            const reference = await response.json();
            
            this.currentReference = reference;
            
            document.getElementById('modalTitle').textContent = reference.title;
            document.getElementById('modalAuthors').textContent = reference.authors?.join(', ') || 'Unknown Author';
            
            // Setup bookmark button
            const bookmarkBtn = document.getElementById('bookmarkBtn');
            bookmarkBtn.innerHTML = `<i class="fas fa-bookmark ${reference.bookmarked ? 'text-yellow-500' : 'text-gray-400'}"></i>`;
            bookmarkBtn.onclick = () => this.toggleBookmark(reference._id);
            
            // Setup rating
            this.setupRatingStars(reference.rating || 0);
            
            // Build tab headers (Details + PDF if available)
            const hasPdf = !!reference.pdfPath; // backend model field
            const tabs = [];
            tabs.push({ id: 'detailsTab', label: 'DETAILS', active: true });
            if (hasPdf) tabs.push({ id: 'pdfTab', label: 'PDF VIEW', active: false });

            const tabButtonsHtml = `
                <div class="reader-tabs ${tabs.length === 1 ? 'hidden' : ''}">
                    ${tabs.map(t => `<button data-tab="${t.id}" class="reader-tab-btn ${t.active ? 'active' : ''}">${t.label}</button>`).join('')}
                </div>`;

            // Details section
            const detailsHtml = `
                <div id="detailsTab" class="fade-section show">
                    <div class="prose max-w-none">
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg metadata-grid">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><strong>Type:</strong> <span class="type-badge type-${reference.type}">${reference.type.toUpperCase()}</span></div>
                                <div><strong>Discipline:</strong> ${reference.discipline || 'General'}</div>
                                ${reference.publicationYear ? `<div><strong>Year:</strong> ${reference.publicationYear}</div>` : ''}
                                ${reference.journal ? `<div><strong>Journal:</strong> ${reference.journal}</div>` : ''}
                                ${reference.doi ? `<div><strong>DOI:</strong> ${reference.doi}</div>` : ''}
                                <div><strong>Added:</strong> ${new Date(reference.createdAt).toLocaleDateString()}</div>
                            </div>
                            ${reference.keywords?.length ? `
                                <div class="mt-4">
                                    <strong>Keywords:</strong>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        ${reference.keywords.map(keyword => 
                                            `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${keyword}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        ${reference.abstract ? `
                            <div class="mb-6">
                                <h4 class="font-semibold text-lg mb-3">Abstract</h4>
                                <p class="text-gray-700 leading-relaxed">${this.escapeHtml(reference.abstract)}</p>
                            </div>
                        ` : ''}
                        ${reference.fullText ? `
                            <div class="mb-6">
                                <h4 class="font-semibold text-lg mb-3">Full Content (Extracted)</h4>
                                <div class="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto border p-4 rounded">
                                    ${this.escapeHtml(reference.fullText)}
                                </div>
                            </div>
                        ` : '<p class="text-gray-500 italic">Full text not available</p>'}
                        ${reference.url ? `
                            <div class="mt-6 pt-6 border-t">
                                <a href="${reference.url}" target="_blank" 
                                   class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    View Original Source
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>`;

            // PDF tab section (embed inline view/popup)
            const pdfHtml = hasPdf ? `
                <div id="pdfTab" class="fade-section hidden h-full">
                    <div class="pdf-frame-wrapper h-full">
                        <div class="pdf-embed-container h-[70vh] md:h-full mt-2">
                            <iframe src="/api/upload/view/${reference._id}#toolbar=1&navpanes=0" title="PDF Viewer" allowfullscreen></iframe>
                        </div>
                        <div class="flex gap-2 mt-3 text-sm">
                            <a href="/api/upload/download/${reference._id}" class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"><i class="fas fa-download mr-1"></i>Download PDF</a>
                            ${reference.url ? `<a target="_blank" href="${reference.url}" class="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"><i class=\"fas fa-external-link-alt mr-1\"></i>Source</a>` : ''}
                        </div>
                    </div>
                </div>` : '';

            document.getElementById('modalContent').innerHTML = tabButtonsHtml + detailsHtml + pdfHtml;

            // Add tab switching logic
            if (hasPdf) {
                document.querySelectorAll('.reader-tab-btn').forEach(btn => {
                    btn.onclick = () => {
                        const target = btn.getAttribute('data-tab');
                        // toggle buttons
                        document.querySelectorAll('.reader-tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        // toggle sections
                        ['detailsTab','pdfTab'].forEach(id => {
                            const el = document.getElementById(id);
                            if (!el) return;
                            if (id === target) {
                                el.classList.remove('hidden');
                                setTimeout(()=>el.classList.add('show'),10);
                            } else {
                                el.classList.add('hidden');
                                el.classList.remove('show');
                            }
                        });
                    };
                });
            }
            
            document.getElementById('readerModal').classList.remove('hidden');
        } catch (error) {
            this.showNotification('Error loading reference: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    setupRatingStars(currentRating) {
        const container = document.getElementById('ratingStars');
        container.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = `fas fa-star star ${i <= currentRating ? 'active text-yellow-500' : 'text-gray-300'}`;
            star.onclick = () => this.rateReference(i);
            container.appendChild(star);
        }
    }

    async rateReference(rating) {
        if (!this.currentReference) return;
        
        try {
            const response = await fetch(`/api/references/${this.currentReference._id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.setupRatingStars(rating);
                this.showNotification('Rating saved!', 'success');
            }
        } catch (error) {
            this.showNotification('Error saving rating', 'error');
        }
    }

    async toggleBookmark(referenceId) {
        try {
            const response = await fetch(`/api/references/${referenceId}/bookmark`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update UI
                if (this.currentReference && this.currentReference._id === referenceId) {
                    this.currentReference.bookmarked = result.bookmarked;
                    const bookmarkBtn = document.getElementById('bookmarkBtn');
                    bookmarkBtn.innerHTML = `<i class="fas fa-bookmark ${result.bookmarked ? 'text-yellow-500' : 'text-gray-400'}"></i>`;
                }
                
                this.loadReferences(); // Refresh grid
                this.showNotification(result.bookmarked ? 'Bookmarked!' : 'Bookmark removed', 'success');
            }
        } catch (error) {
            this.showNotification('Error updating bookmark', 'error');
        }
    }

    async openStatsModal() {
        try {
            this.showLoading('Loading statistics...');
            
            const response = await fetch('/api/references/stats/overview');
            const stats = await response.json();
            
            document.getElementById('statsContent').innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stats-card text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-book text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.totalReferences}</div>
                                <div class="text-sm opacity-80">Total References</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-chart-line text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.typeStats.length}</div>
                                <div class="text-sm opacity-80">Types</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-graduation-cap text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.disciplineStats.length}</div>
                                <div class="text-sm opacity-80">Disciplines</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-orange-500 text-white p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-3xl mr-4"></i>
                            <div>
                                <div class="text-2xl font-bold">${stats.recentReferences.length}</div>
                                <div class="text-sm opacity-80">Recent</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-lg border">
                        <h3 class="text-lg font-semibold mb-4">By Type</h3>
                        <div class="space-y-3">
                            ${stats.typeStats.map(type => `
                                <div class="flex items-center justify-between">
                                    <span class="type-badge type-${type._id}">${type._id.toUpperCase()}</span>
                                    <span class="font-semibold">${type.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg border">
                        <h3 class="text-lg font-semibold mb-4">By Discipline</h3>
                        <div class="space-y-3">
                            ${stats.disciplineStats.slice(0, 8).map(discipline => `
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-700">${discipline._id}</span>
                                    <span class="font-semibold">${discipline.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                ${stats.recentReferences.length > 0 ? `
                    <div class="mt-8 bg-white p-6 rounded-lg border">
                        <h3 class="text-lg font-semibold mb-4">Recent References</h3>
                        <div class="space-y-3">
                            ${stats.recentReferences.map(ref => `
                                <div class="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <div class="font-medium">${this.escapeHtml(ref.title)}</div>
                                        <div class="text-sm text-gray-600">${ref.authors?.join(', ') || 'Unknown Author'}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="type-badge type-${ref.type}">${ref.type.toUpperCase()}</div>
                                        <div class="text-xs text-gray-500 mt-1">${new Date(ref.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
            
            document.getElementById('statsModal').classList.remove('hidden');
        } catch (error) {
            this.showNotification('Error loading statistics', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderStarsSmall(rating) {
        let html = '<div class="flex text-xs">';
        for (let i = 1; i <= 5; i++) {
            html += `<i class="fas fa-star ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}"></i>`;
        }
        html += '</div>';
        return html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadReferences();
    }

    closeModal() {
        document.getElementById('readerModal').classList.add('hidden');
        this.currentReference = null;
    }

    openUploadModal() {
        document.getElementById('uploadModal').classList.remove('hidden');
    }

    closeUploadModal() {
        document.getElementById('uploadModal').classList.add('hidden');
    }

    closeStatsModal() {
        document.getElementById('statsModal').classList.add('hidden');
    }

    resetUploadForm() {
        document.getElementById('uploadForm').reset();
        document.getElementById('dropArea').innerHTML = `
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 mb-2">Drag and drop PDF file here or click to browse</p>
            <p class="text-sm text-gray-500">Maximum file size: 50MB</p>
        `;
    }

    showLoading(message) {
        document.getElementById('loadingText').textContent = message;
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const id = Date.now();
        
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `notification ${bgColor} text-white p-4 rounded-lg shadow-lg mb-4`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icon} mr-3"></i>
                <span class="flex-1">${this.escapeHtml(message)}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all references? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading('Clearing all data...');
            
            const response = await fetch('/api/references/clear-all', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('All references cleared successfully!', 'success');
                this.loadReferences();
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error clearing data: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.academicReader = new AcademicReader();
});
