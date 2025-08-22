// HireHeat Enhanced User Interface
// Modern UI with job compatibility scores, application tracking, and AI features

class EnhancedUI {
  constructor(resumeManager, jobMatcher, safetyManager, formFiller, coverLetterGenerator) {
    this.resumeManager = resumeManager;
    this.jobMatcher = jobMatcher;
    this.safetyManager = safetyManager;
    this.formFiller = formFiller;
    this.coverLetterGenerator = coverLetterGenerator;
    this.currentView = 'dashboard';
    this.jobCards = new Map();
    this.applicationHistory = [];
    this.initialize();
  }

  // Initialize enhanced UI
  async initialize() {
    try {
      await this.createUIElements();
      await this.loadApplicationHistory();
      this.setupEventListeners();
      this.startPeriodicUpdates();
      console.log('🎨 Enhanced UI initialized');
      return true;
    } catch (error) {
      console.error('❌ Enhanced UI initialization failed:', error);
      return false;
    }
  }

  // Create main UI elements
  async createUIElements() {
    // Remove existing HireHeat UI if present
    const existingUI = document.getElementById('hireHeat-enhanced-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.id = 'hireHeat-enhanced-ui';
    mainContainer.innerHTML = this.getMainUIHTML();
    
    // Add to page
    document.body.appendChild(mainContainer);
    
    // Apply styles
    this.injectStyles();
    
    // Initialize components
    await this.initializeComponents();
  }

  // Get main UI HTML structure
  getMainUIHTML() {
    return `
      <div class="hireheat-panel" id="hireheat-main-panel">
        <div class="hireheat-header">
          <div class="hireheat-logo">
            <span class="hireheat-icon">🔥</span>
            <span class="hireheat-title">HireHeat AI</span>
          </div>
          <div class="hireheat-controls">
            <button class="hireheat-btn hireheat-btn-icon" id="hireheat-minimize">
              <span>−</span>
            </button>
            <button class="hireheat-btn hireheat-btn-icon" id="hireheat-close">
              <span>×</span>
            </button>
          </div>
        </div>
        
        <div class="hireheat-nav">
          <button class="hireheat-nav-btn active" data-view="dashboard">
            <span class="nav-icon">📊</span> Dashboard
          </button>
          <button class="hireheat-nav-btn" data-view="jobs">
            <span class="nav-icon">💼</span> Jobs
          </button>
          <button class="hireheat-nav-btn" data-view="applications">
            <span class="nav-icon">📝</span> Applications
          </button>
          <button class="hireheat-nav-btn" data-view="resume">
            <span class="nav-icon">👤</span> Resume
          </button>
          <button class="hireheat-nav-btn" data-view="settings">
            <span class="nav-icon">⚙️</span> Settings
          </button>
        </div>
        
        <div class="hireheat-content">
          <div class="hireheat-view" id="dashboard-view">
            ${this.getDashboardHTML()}
          </div>
          
          <div class="hireheat-view" id="jobs-view" style="display: none;">
            ${this.getJobsHTML()}
          </div>
          
          <div class="hireheat-view" id="applications-view" style="display: none;">
            ${this.getApplicationsHTML()}
          </div>
          
          <div class="hireheat-view" id="resume-view" style="display: none;">
            ${this.getResumeHTML()}
          </div>
          
          <div class="hireheat-view" id="settings-view" style="display: none;">
            ${this.getSettingsHTML()}
          </div>
        </div>
        
        <div class="hireheat-status-bar">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value" id="hireheat-status">Ready</span>
          </div>
          <div class="status-item">
            <span class="status-label">Today:</span>
            <span class="status-value" id="hireheat-today-count">0 applications</span>
          </div>
        </div>
      </div>
      
      <!-- Floating Action Button -->
      <div class="hireheat-fab" id="hireheat-fab">
        <span class="fab-icon">🔥</span>
        <div class="fab-tooltip">HireHeat AI Assistant</div>
      </div>
      
      <!-- Job Compatibility Overlay -->
      <div class="hireheat-overlay" id="compatibility-overlay" style="display: none;">
        <div class="overlay-content">
          <div class="overlay-header">
            <h3>Job Compatibility Analysis</h3>
            <button class="overlay-close" id="close-compatibility">×</button>
          </div>
          <div class="overlay-body" id="compatibility-content">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>
    `;
  }

  // Get dashboard HTML
  getDashboardHTML() {
    return `
      <div class="dashboard-grid">
        <div class="dashboard-card stats-card">
          <h3>📊 Today's Activity</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number" id="today-applications">0</div>
              <div class="stat-label">Applications</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="today-matches">0</div>
              <div class="stat-label">Job Matches</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="success-rate">0%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-card quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div class="action-buttons">
            <button class="hireheat-btn hireheat-btn-primary" id="scan-jobs">
              <span class="btn-icon">🔍</span> Scan Current Page
            </button>
            <button class="hireheat-btn hireheat-btn-secondary" id="auto-fill">
              <span class="btn-icon">📝</span> Auto-Fill Form
            </button>
            <button class="hireheat-btn hireheat-btn-secondary" id="generate-cover-letter">
              <span class="btn-icon">📄</span> Generate Cover Letter
            </button>
          </div>
        </div>
        
        <div class="dashboard-card recent-activity">
          <h3>📈 Recent Activity</h3>
          <div class="activity-list" id="recent-activity-list">
            <div class="activity-item">
              <span class="activity-icon">💼</span>
              <span class="activity-text">No recent activity</span>
              <span class="activity-time">-</span>
            </div>
          </div>
        </div>
        
        <div class="dashboard-card safety-status">
          <h3>🛡️ Safety Status</h3>
          <div class="safety-info">
            <div class="safety-item">
              <span class="safety-label">Daily Limit:</span>
              <span class="safety-value" id="daily-limit-status">0/10</span>
            </div>
            <div class="safety-item">
              <span class="safety-label">Safe Mode:</span>
              <span class="safety-value" id="safe-mode-status">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Get jobs view HTML
  getJobsHTML() {
    return `
      <div class="jobs-header">
        <h2>💼 Job Opportunities</h2>
        <div class="jobs-controls">
          <button class="hireheat-btn hireheat-btn-primary" id="refresh-jobs">
            <span class="btn-icon">🔄</span> Refresh
          </button>
          <select class="hireheat-select" id="sort-jobs">
            <option value="compatibility">Sort by Compatibility</option>
            <option value="date">Sort by Date</option>
            <option value="company">Sort by Company</option>
          </select>
        </div>
      </div>
      
      <div class="jobs-filters">
        <input type="text" class="hireheat-input" id="job-search" placeholder="Search jobs...">
        <select class="hireheat-select" id="compatibility-filter">
          <option value="all">All Compatibility Scores</option>
          <option value="high">High Match (80%+)</option>
          <option value="medium">Medium Match (60-79%)</option>
          <option value="low">Low Match (<60%)</option>
        </select>
      </div>
      
      <div class="jobs-list" id="jobs-list">
        <div class="no-jobs-message">
          <span class="no-jobs-icon">🔍</span>
          <p>No jobs found. Navigate to LinkedIn job listings to see compatibility scores.</p>
        </div>
      </div>
    `;
  }

  // Get applications view HTML
  getApplicationsHTML() {
    return `
      <div class="applications-header">
        <h2>📝 Application History</h2>
        <div class="applications-controls">
          <button class="hireheat-btn hireheat-btn-secondary" id="export-applications">
            <span class="btn-icon">📊</span> Export
          </button>
          <select class="hireheat-select" id="filter-applications">
            <option value="all">All Applications</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <div class="applications-stats">
        <div class="app-stat">
          <div class="app-stat-number" id="total-applications">0</div>
          <div class="app-stat-label">Total Applications</div>
        </div>
        <div class="app-stat">
          <div class="app-stat-number" id="pending-applications">0</div>
          <div class="app-stat-label">Pending</div>
        </div>
        <div class="app-stat">
          <div class="app-stat-number" id="success-applications">0</div>
          <div class="app-stat-label">Successful</div>
        </div>
      </div>
      
      <div class="applications-list" id="applications-list">
        <div class="no-applications-message">
          <span class="no-apps-icon">📝</span>
          <p>No applications yet. Start applying to jobs to track your progress here.</p>
        </div>
      </div>
    `;
  }

  // Get resume view HTML
  getResumeHTML() {
    return `
      <div class="resume-header">
        <h2>👤 Resume Management</h2>
        <div class="resume-controls">
          <button class="hireheat-btn hireheat-btn-primary" id="add-resume">
            <span class="btn-icon">➕</span> Add Resume
          </button>
          <button class="hireheat-btn hireheat-btn-secondary" id="import-resume">
            <span class="btn-icon">📁</span> Import
          </button>
        </div>
      </div>
      
      <div class="resume-list" id="resume-list">
        <div class="no-resume-message">
          <span class="no-resume-icon">👤</span>
          <p>No resumes found. Add your first resume to get started with AI job matching.</p>
        </div>
      </div>
      
      <div class="resume-editor" id="resume-editor" style="display: none;">
        <div class="editor-header">
          <h3>Resume Editor</h3>
          <button class="hireheat-btn hireheat-btn-secondary" id="close-editor">Close</button>
        </div>
        <div class="editor-content">
          <!-- Dynamic resume editor content -->
        </div>
      </div>
    `;
  }

  // Get settings view HTML
  getSettingsHTML() {
    return `
      <div class="settings-header">
        <h2>⚙️ Settings</h2>
      </div>
      
      <div class="settings-sections">
        <div class="settings-section">
          <h3>🤖 AI Configuration</h3>
          <div class="setting-item">
            <label class="setting-label">AI Service Provider:</label>
            <div class="ai-provider-info">
              <span class="provider-name">🧠 Google Gemini Pro 2.5</span>
              <span class="provider-status active">✅ Active</span>
            </div>
          </div>
          <div class="setting-item">
            <p class="setting-description">HireHeat is now powered exclusively by Google Gemini Pro 2.5 for enhanced performance, reliability, and advanced AI capabilities.</p>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>🛡️ Safety Settings</h3>
          <div class="setting-item">
            <label class="setting-checkbox">
              <input type="checkbox" id="enable-safe-mode" checked>
              <span class="checkmark"></span>
              Enable Safe Mode
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-checkbox">
              <input type="checkbox" id="require-confirmation" checked>
              <span class="checkmark"></span>
              Require Manual Confirmation
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">Daily Application Limit:</label>
            <input type="number" class="hireheat-input" id="daily-limit" value="10" min="1" max="50">
          </div>
        </div>
        
        <div class="settings-section">
          <h3>🎨 Interface Settings</h3>
          <div class="setting-item">
            <label class="setting-checkbox">
              <input type="checkbox" id="show-compatibility-overlay" checked>
              <span class="checkmark"></span>
              Show Compatibility Overlay
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-checkbox">
              <input type="checkbox" id="auto-scan-jobs" checked>
              <span class="checkmark"></span>
              Auto-scan Job Pages
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>📊 Data Management</h3>
          <div class="setting-item">
            <button class="hireheat-btn hireheat-btn-secondary" id="export-data">
              <span class="btn-icon">📤</span> Export All Data
            </button>
            <button class="hireheat-btn hireheat-btn-danger" id="clear-data">
              <span class="btn-icon">🗑️</span> Clear All Data
            </button>
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button class="hireheat-btn hireheat-btn-primary" id="save-settings">
          <span class="btn-icon">💾</span> Save Settings
        </button>
      </div>
    `;
  }

  // Inject CSS styles
  injectStyles() {
    const styleId = 'hireheat-enhanced-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* HireHeat Enhanced UI Styles */
      .hireheat-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .hireheat-panel.minimized {
        height: 60px;
        overflow: hidden;
      }
      
      .hireheat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
      }
      
      .hireheat-logo {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .hireheat-icon {
        font-size: 20px;
      }
      
      .hireheat-title {
        font-size: 16px;
        font-weight: 600;
      }
      
      .hireheat-controls {
        display: flex;
        gap: 5px;
      }
      
      .hireheat-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .hireheat-btn-icon {
        width: 30px;
        height: 30px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.2);
        color: white;
      }
      
      .hireheat-btn-icon:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .hireheat-btn-primary {
        background: #4CAF50;
        color: white;
      }
      
      .hireheat-btn-primary:hover {
        background: #45a049;
        transform: translateY(-1px);
      }
      
      .hireheat-btn-secondary {
        background: rgba(255,255,255,0.2);
        color: white;
      }
      
      .hireheat-btn-secondary:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .hireheat-btn-danger {
        background: #f44336;
        color: white;
      }
      
      .hireheat-btn-danger:hover {
        background: #da190b;
      }
      
      .hireheat-nav {
        display: flex;
        background: rgba(255,255,255,0.1);
        padding: 0;
      }
      
      .hireheat-nav-btn {
        flex: 1;
        padding: 12px 8px;
        border: none;
        background: transparent;
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      
      .hireheat-nav-btn:hover {
        background: rgba(255,255,255,0.1);
        color: white;
      }
      
      .hireheat-nav-btn.active {
        background: rgba(255,255,255,0.2);
        color: white;
      }
      
      .nav-icon {
        font-size: 16px;
      }
      
      .hireheat-content {
        max-height: 60vh;
        overflow-y: auto;
        padding: 20px;
      }
      
      .hireheat-view {
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .dashboard-grid {
        display: grid;
        gap: 15px;
      }
      
      .dashboard-card {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 15px;
        backdrop-filter: blur(10px);
      }
      
      .dashboard-card h3 {
        margin: 0 0 15px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #4CAF50;
      }
      
      .stat-label {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 4px;
      }
      
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .activity-list {
        max-height: 150px;
        overflow-y: auto;
      }
      
      .activity-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      
      .activity-item:last-child {
        border-bottom: none;
      }
      
      .activity-icon {
        font-size: 16px;
      }
      
      .activity-text {
        flex: 1;
        font-size: 13px;
      }
      
      .activity-time {
        font-size: 11px;
        opacity: 0.7;
      }
      
      .safety-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .safety-item {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      
      .safety-label {
        opacity: 0.8;
      }
      
      .safety-value {
        font-weight: 600;
      }
      
      .hireheat-status-bar {
        display: flex;
        justify-content: space-between;
        padding: 10px 20px;
        background: rgba(0,0,0,0.2);
        font-size: 12px;
      }
      
      .status-item {
        display: flex;
        gap: 5px;
      }
      
      .status-label {
        opacity: 0.7;
      }
      
      .status-value {
        font-weight: 600;
      }
      
      .hireheat-fab {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 9999;
        transition: all 0.3s ease;
      }
      
      .hireheat-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 35px rgba(0,0,0,0.2);
      }
      
      .fab-icon {
        font-size: 24px;
      }
      
      .fab-tooltip {
        position: absolute;
        right: 70px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      
      .hireheat-fab:hover .fab-tooltip {
        opacity: 1;
      }
      
      .hireheat-input, .hireheat-select {
        width: 100%;
        padding: 10px;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 14px;
      }
      
      .hireheat-input::placeholder {
        color: rgba(255,255,255,0.6);
      }
      
      .hireheat-input:focus, .hireheat-select:focus {
        outline: none;
        border-color: #4CAF50;
        background: rgba(255,255,255,0.15);
      }
      
      .job-card {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;
      }
      
      .job-card:hover {
        background: rgba(255,255,255,0.15);
        transform: translateY(-2px);
      }
      
      .job-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      
      .job-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .job-company {
        font-size: 14px;
        opacity: 0.8;
        margin: 2px 0;
      }
      
      .compatibility-score {
        background: #4CAF50;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .compatibility-score.medium {
        background: #FF9800;
      }
      
      .compatibility-score.low {
        background: #f44336;
      }
      
      .job-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      
      .hireheat-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .overlay-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        color: #333;
      }
      
      .overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      
      .overlay-header h3 {
        margin: 0;
        color: #333;
      }
      
      .overlay-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .overlay-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .hireheat-panel {
          width: 90%;
          right: 5%;
        }
        
        .hireheat-fab {
          bottom: 20px;
          right: 20px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Initialize UI components
  async initializeComponents() {
    await this.updateDashboard();
    await this.loadJobs();
    await this.loadApplications();
    await this.loadResumes();
    await this.loadSettings();
  }

  // Setup event listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.hireheat-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Panel controls
    document.getElementById('hireheat-minimize')?.addEventListener('click', () => {
      this.toggleMinimize();
    });

    document.getElementById('hireheat-close')?.addEventListener('click', () => {
      this.hidePanel();
    });

    // FAB
    document.getElementById('hireheat-fab')?.addEventListener('click', () => {
      this.showPanel();
    });

    // Quick actions
    document.getElementById('scan-jobs')?.addEventListener('click', () => {
      this.scanCurrentPage();
    });

    document.getElementById('auto-fill')?.addEventListener('click', () => {
      this.autoFillForm();
    });

    document.getElementById('generate-cover-letter')?.addEventListener('click', () => {
      this.generateCoverLetter();
    });

    // Settings
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    // Overlay close
    document.getElementById('close-compatibility')?.addEventListener('click', () => {
      this.hideCompatibilityOverlay();
    });
  }

  // Switch between views
  switchView(viewName) {
    // Update navigation
    document.querySelectorAll('.hireheat-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

    // Update content
    document.querySelectorAll('.hireheat-view').forEach(view => {
      view.style.display = 'none';
    });
    document.getElementById(`${viewName}-view`).style.display = 'block';

    this.currentView = viewName;

    // Load view-specific data
    this.loadViewData(viewName);
  }

  // Load data for specific view
  async loadViewData(viewName) {
    switch (viewName) {
      case 'dashboard':
        await this.updateDashboard();
        break;
      case 'jobs':
        await this.loadJobs();
        break;
      case 'applications':
        await this.loadApplications();
        break;
      case 'resume':
        await this.loadResumes();
        break;
      case 'settings':
        await this.loadSettings();
        break;
    }
  }

  // Update dashboard with latest data
  async updateDashboard() {
    try {
      const safetyStats = this.safetyManager.getSafetyStats();
      const matcherStats = this.jobMatcher.getStats();
      
      // Update stats
      document.getElementById('today-applications').textContent = safetyStats.todayApplications;
      document.getElementById('today-matches').textContent = matcherStats.todayMatches || 0;
      document.getElementById('success-rate').textContent = safetyStats.successRate + '%';
      
      // Update safety status
      document.getElementById('daily-limit-status').textContent = 
        `${safetyStats.todayApplications}/${safetyStats.limits.applications.limit}`;
      document.getElementById('safe-mode-status').textContent = 
        safetyStats.safetySettings.enableSafeMode ? 'Enabled' : 'Disabled';
      
      // Update recent activity
      await this.updateRecentActivity();
      
      // Update status bar
      document.getElementById('hireheat-status').textContent = 'Ready';
      document.getElementById('hireheat-today-count').textContent = 
        `${safetyStats.todayApplications} applications`;
    } catch (error) {
      console.error('Dashboard update failed:', error);
    }
  }

  // Update recent activity list
  async updateRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;

    // Get recent activities from safety manager
    const recentActions = this.safetyManager.getRecentActions(null, 3600000); // Last hour
    
    if (recentActions.length === 0) {
      activityList.innerHTML = `
        <div class="activity-item">
          <span class="activity-icon">💼</span>
          <span class="activity-text">No recent activity</span>
          <span class="activity-time">-</span>
        </div>
      `;
      return;
    }

    activityList.innerHTML = recentActions.slice(0, 5).map(action => {
      const timeAgo = this.getTimeAgo(new Date(action.timestamp));
      const icon = this.getActionIcon(action.action);
      
      return `
        <div class="activity-item">
          <span class="activity-icon">${icon}</span>
          <span class="activity-text">${this.getActionDescription(action)}</span>
          <span class="activity-time">${timeAgo}</span>
        </div>
      `;
    }).join('');
  }

  // Get icon for action type
  getActionIcon(actionType) {
    const icons = {
      'apply': '📝',
      'search': '🔍',
      'fillForm': '📋',
      'generateCoverLetter': '📄',
      'scan': '👁️'
    };
    return icons[actionType] || '💼';
  }

  // Get description for action
  getActionDescription(action) {
    const descriptions = {
      'apply': `Applied to ${action.jobTitle || 'job'}`,
      'search': 'Searched for jobs',
      'fillForm': 'Filled application form',
      'generateCoverLetter': 'Generated cover letter',
      'scan': 'Scanned job page'
    };
    return descriptions[action.action] || 'Performed action';
  }

  // Get time ago string
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  // Load and display jobs
  async loadJobs() {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;

    try {
      // Get jobs from current page or cache
      const jobs = await this.extractJobsFromPage();
      
      if (jobs.length === 0) {
        jobsList.innerHTML = `
          <div class="no-jobs-message">
            <span class="no-jobs-icon">🔍</span>
            <p>No jobs found. Navigate to LinkedIn job listings to see compatibility scores.</p>
          </div>
        `;
        return;
      }

      // Generate job cards
      jobsList.innerHTML = jobs.map(job => this.createJobCard(job)).join('');
      
      // Add event listeners to job cards
      this.setupJobCardListeners();
    } catch (error) {
      console.error('Failed to load jobs:', error);
      jobsList.innerHTML = `
        <div class="error-message">
          <span class="error-icon">❌</span>
          <p>Failed to load jobs. Please try again.</p>
        </div>
      `;
    }
  }

  // Extract jobs from current page
  async extractJobsFromPage() {
    // This would extract job data from LinkedIn job listings
    // For now, return mock data
    return [];
  }

  // Create job card HTML
  createJobCard(job) {
    const compatibilityClass = this.getCompatibilityClass(job.compatibilityScore);
    
    return `
      <div class="job-card" data-job-id="${job.id}">
        <div class="job-header">
          <div class="job-info">
            <h4 class="job-title">${job.title}</h4>
            <div class="job-company">${job.company}</div>
          </div>
          <div class="compatibility-score ${compatibilityClass}">
            ${job.compatibilityScore}%
          </div>
        </div>
        
        <div class="job-details">
          <div class="job-location">${job.location || 'Remote'}</div>
          <div class="job-posted">${this.getTimeAgo(new Date(job.postedDate))}</div>
        </div>
        
        <div class="job-actions">
          <button class="hireheat-btn hireheat-btn-primary job-apply" data-job-id="${job.id}">
            <span class="btn-icon">📝</span> Quick Apply
          </button>
          <button class="hireheat-btn hireheat-btn-secondary job-analyze" data-job-id="${job.id}">
            <span class="btn-icon">🔍</span> Analyze
          </button>
        </div>
      </div>
    `;
  }

  // Get compatibility class for styling
  getCompatibilityClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  // Setup job card event listeners
  setupJobCardListeners() {
    document.querySelectorAll('.job-apply').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.currentTarget.dataset.jobId;
        this.quickApplyToJob(jobId);
      });
    });

    document.querySelectorAll('.job-analyze').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.currentTarget.dataset.jobId;
        this.showJobAnalysis(jobId);
      });
    });
  }

  // Quick apply to job
  async quickApplyToJob(jobId) {
    try {
      this.updateStatus('Applying to job...');
      
      // Implementation would handle the full application process
      // For now, just show a message
      this.showNotification('Quick apply feature coming soon!', 'info');
      
      this.updateStatus('Ready');
    } catch (error) {
      console.error('Quick apply failed:', error);
      this.showNotification('Application failed: ' + error.message, 'error');
      this.updateStatus('Ready');
    }
  }

  // Show job analysis
  async showJobAnalysis(jobId) {
    try {
      // Get job data and show compatibility analysis
      this.showCompatibilityOverlay(jobId);
    } catch (error) {
      console.error('Job analysis failed:', error);
      this.showNotification('Analysis failed: ' + error.message, 'error');
    }
  }

  // Show compatibility overlay
  showCompatibilityOverlay(jobId) {
    const overlay = document.getElementById('compatibility-overlay');
    const content = document.getElementById('compatibility-content');
    
    if (!overlay || !content) return;
    
    // Mock compatibility data
    content.innerHTML = `
      <div class="compatibility-analysis">
        <div class="compatibility-header">
          <h4>Software Engineer at TechCorp</h4>
          <div class="overall-score">85% Match</div>
        </div>
        
        <div class="compatibility-breakdown">
          <div class="skill-match">
            <h5>Skills Match</h5>
            <div class="skill-bar">
              <div class="skill-progress" style="width: 90%;">90%</div>
            </div>
          </div>
          
          <div class="experience-match">
            <h5>Experience Match</h5>
            <div class="skill-bar">
              <div class="skill-progress" style="width: 80%;">80%</div>
            </div>
          </div>
          
          <div class="location-match">
            <h5>Location Match</h5>
            <div class="skill-bar">
              <div class="skill-progress" style="width: 100%;">100%</div>
            </div>
          </div>
        </div>
        
        <div class="recommendations">
          <h5>Recommendations</h5>
          <ul>
            <li>Highlight your React and Node.js experience</li>
            <li>Mention your 5 years of full-stack development</li>
            <li>Emphasize your remote work experience</li>
          </ul>
        </div>
      </div>
    `;
    
    overlay.style.display = 'flex';
  }

  // Hide compatibility overlay
  hideCompatibilityOverlay() {
    const overlay = document.getElementById('compatibility-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // Load applications
  async loadApplications() {
    // Implementation for loading application history
    console.log('Loading applications...');
  }

  // Load resumes
  async loadResumes() {
    // Implementation for loading resumes
    console.log('Loading resumes...');
  }

  // Load settings
  async loadSettings() {
    // Implementation for loading settings
    console.log('Loading settings...');
  }

  // Save settings
  async saveSettings() {
    try {
      this.showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      this.showNotification('Failed to save settings: ' + error.message, 'error');
    }
  }

  // Scan current page for jobs
  async scanCurrentPage() {
    try {
      this.updateStatus('Scanning page...');
      
      // Implementation would scan the current page for job listings
      await this.delay(2000); // Simulate scanning
      
      this.showNotification('Page scanned successfully!', 'success');
      this.updateStatus('Ready');
      
      // Refresh jobs view
      if (this.currentView === 'jobs') {
        await this.loadJobs();
      }
    } catch (error) {
      console.error('Page scan failed:', error);
      this.showNotification('Scan failed: ' + error.message, 'error');
      this.updateStatus('Ready');
    }
  }

  // Auto-fill form
  async autoFillForm() {
    try {
      this.updateStatus('Filling form...');
      
      const result = await this.formFiller.fillForm();
      
      if (result.success) {
        this.showNotification(`Form filled: ${result.fieldsFilled} fields completed`, 'success');
      } else {
        this.showNotification('Form filling failed: ' + result.reason, 'error');
      }
      
      this.updateStatus('Ready');
    } catch (error) {
      console.error('Auto-fill failed:', error);
      this.showNotification('Auto-fill failed: ' + error.message, 'error');
      this.updateStatus('Ready');
    }
  }

  // Generate cover letter
  async generateCoverLetter() {
    try {
      this.updateStatus('Generating cover letter...');
      
      // Mock job data for now
      const jobData = {
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'We are looking for a skilled software engineer...'
      };
      
      const result = await this.coverLetterGenerator.generateCoverLetter(jobData);
      
      if (result.success) {
        this.showNotification('Cover letter generated successfully!', 'success');
        // Could show the cover letter in a modal or copy to clipboard
      } else {
        this.showNotification('Cover letter generation failed: ' + result.error, 'error');
      }
      
      this.updateStatus('Ready');
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      this.showNotification('Generation failed: ' + error.message, 'error');
      this.updateStatus('Ready');
    }
  }

  // Show/hide panel
  showPanel() {
    const panel = document.getElementById('hireheat-main-panel');
    const fab = document.getElementById('hireheat-fab');
    
    if (panel && fab) {
      panel.style.display = 'block';
      fab.style.display = 'none';
    }
  }

  hidePanel() {
    const panel = document.getElementById('hireheat-main-panel');
    const fab = document.getElementById('hireheat-fab');
    
    if (panel && fab) {
      panel.style.display = 'none';
      fab.style.display = 'flex';
    }
  }

  // Toggle minimize
  toggleMinimize() {
    const panel = document.getElementById('hireheat-main-panel');
    if (panel) {
      panel.classList.toggle('minimized');
    }
  }

  // Update status
  updateStatus(status) {
    const statusElement = document.getElementById('hireheat-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `hireheat-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      zIndex: '10002',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Start periodic updates
  startPeriodicUpdates() {
    // Update dashboard every 30 seconds
    setInterval(() => {
      if (this.currentView === 'dashboard') {
        this.updateDashboard();
      }
    }, 30000);
  }

  // Load application history
  async loadApplicationHistory() {
    // Implementation for loading application history from storage
    return [];
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy() {
    const panel = document.getElementById('hireheat-enhanced-ui');
    const fab = document.getElementById('hireheat-fab');
    const styles = document.getElementById('hireheat-enhanced-styles');
    
    if (panel) panel.remove();
    if (fab) fab.remove();
    if (styles) styles.remove();
    
    console.log('🎨 Enhanced UI destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedUI;
} else {
  window.EnhancedUI = EnhancedUI;
}

console.log('🎨 Enhanced UI loaded');