// HireHeat LinkedIn Job Search Automation
// Advanced automation for LinkedIn job search with intelligent filtering and navigation

class LinkedInAutomation {
  constructor(jobMatcher, safetyManager, privacyManager) {
    this.jobMatcher = jobMatcher;
    this.safetyManager = safetyManager;
    this.privacyManager = privacyManager;
    this.isRunning = false;
    this.currentSearch = null;
    this.discoveredJobs = new Map();
    this.searchHistory = [];
    this.filters = {
      keywords: [],
      location: '',
      experienceLevel: '',
      jobType: '',
      datePosted: '',
      salary: '',
      companySize: '',
      industry: '',
      remoteWork: false
    };
    this.navigationState = {
      currentPage: 1,
      totalPages: 0,
      totalJobs: 0,
      processedJobs: 0
    };
    this.initialize();
  }

  // Initialize LinkedIn automation
  async initialize() {
    try {
      await this.loadSearchHistory();
      await this.loadFilters();
      this.setupPageObserver();
      this.setupJobCardObserver();
      console.log('🔍 LinkedIn Automation initialized');
      return true;
    } catch (error) {
      console.error('❌ LinkedIn Automation initialization failed:', error);
      return false;
    }
  }

  // Check if we're on LinkedIn
  isLinkedInPage() {
    return window.location.hostname.includes('linkedin.com');
  }

  // Check if we're on a job search page
  isJobSearchPage() {
    return this.isLinkedInPage() && 
           (window.location.pathname.includes('/jobs/search') || 
            window.location.pathname.includes('/jobs/collections'));
  }

  // Check if we're on a job detail page
  isJobDetailPage() {
    return this.isLinkedInPage() && 
           window.location.pathname.includes('/jobs/view/');
  }

  // Start automated job search
  async startAutomatedSearch(searchParams = {}) {
    if (!this.isLinkedInPage()) {
      throw new Error('Not on LinkedIn. Please navigate to LinkedIn first.');
    }

    if (this.isRunning) {
      throw new Error('Search is already running. Stop current search first.');
    }

    // Check safety limits
    const canProceed = await this.safetyManager.checkDailyLimits('search');
    if (!canProceed.allowed) {
      throw new Error(`Search limit reached: ${canProceed.reason}`);
    }

    // Check privacy consent
    const hasConsent = await this.privacyManager.checkConsent('dataProcessing');
    if (!hasConsent) {
      throw new Error('Data processing consent required for job search.');
    }

    try {
      this.isRunning = true;
      this.currentSearch = {
        id: this.generateId(),
        startTime: new Date(),
        params: { ...this.filters, ...searchParams },
        status: 'running',
        jobsFound: 0,
        jobsProcessed: 0
      };

      console.log('🚀 Starting automated job search:', this.currentSearch.params);
      
      // Navigate to job search if not already there
      if (!this.isJobSearchPage()) {
        await this.navigateToJobSearch();
      }

      // Apply search filters
      await this.applySearchFilters(this.currentSearch.params);
      
      // Start job discovery process
      await this.discoverJobs();
      
      // Log search completion
      this.currentSearch.status = 'completed';
      this.currentSearch.endTime = new Date();
      this.searchHistory.push(this.currentSearch);
      await this.saveSearchHistory();
      
      await this.safetyManager.logAction('search', {
        jobsFound: this.currentSearch.jobsFound,
        duration: this.currentSearch.endTime - this.currentSearch.startTime
      });

      console.log(`✅ Search completed: ${this.currentSearch.jobsFound} jobs found`);
      return this.currentSearch;
      
    } catch (error) {
      this.currentSearch.status = 'failed';
      this.currentSearch.error = error.message;
      console.error('❌ Automated search failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Stop current search
  stopSearch() {
    if (this.isRunning && this.currentSearch) {
      this.currentSearch.status = 'stopped';
      this.currentSearch.endTime = new Date();
      this.isRunning = false;
      console.log('⏹️ Search stopped by user');
    }
  }

  // Navigate to LinkedIn job search
  async navigateToJobSearch() {
    const jobSearchUrl = 'https://www.linkedin.com/jobs/search/';
    
    if (window.location.href !== jobSearchUrl) {
      window.location.href = jobSearchUrl;
      
      // Wait for page to load
      await this.waitForPageLoad();
    }
  }

  // Apply search filters
  async applySearchFilters(filters) {
    try {
      console.log('🔧 Applying search filters:', filters);
      
      // Apply keywords
      if (filters.keywords && filters.keywords.length > 0) {
        await this.setKeywords(filters.keywords.join(' '));
      }
      
      // Apply location
      if (filters.location) {
        await this.setLocation(filters.location);
      }
      
      // Apply experience level filter
      if (filters.experienceLevel) {
        await this.setExperienceLevel(filters.experienceLevel);
      }
      
      // Apply job type filter
      if (filters.jobType) {
        await this.setJobType(filters.jobType);
      }
      
      // Apply date posted filter
      if (filters.datePosted) {
        await this.setDatePosted(filters.datePosted);
      }
      
      // Apply remote work filter
      if (filters.remoteWork) {
        await this.setRemoteWork(true);
      }
      
      // Apply salary filter
      if (filters.salary) {
        await this.setSalaryRange(filters.salary);
      }
      
      // Wait for filters to be applied
      await this.delay(2000);
      
      console.log('✅ Filters applied successfully');
    } catch (error) {
      console.error('❌ Failed to apply filters:', error);
      throw error;
    }
  }

  // Set search keywords
  async setKeywords(keywords) {
    const keywordInput = document.querySelector('input[aria-label*="Search by title, skill, or company"]') ||
                        document.querySelector('.jobs-search-box__text-input') ||
                        document.querySelector('input[placeholder*="Search jobs"]');
    
    if (keywordInput) {
      await this.clearAndType(keywordInput, keywords);
      await this.delay(500);
      
      // Press Enter or click search button
      const searchButton = document.querySelector('.jobs-search-box__submit-button') ||
                          document.querySelector('button[aria-label*="Search"]');
      
      if (searchButton) {
        searchButton.click();
      } else {
        keywordInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }
      
      await this.waitForSearchResults();
    }
  }

  // Set location filter
  async setLocation(location) {
    const locationInput = document.querySelector('input[aria-label*="City"]') ||
                         document.querySelector('.jobs-search-box__text-input--location') ||
                         document.querySelector('input[placeholder*="Location"]');
    
    if (locationInput) {
      await this.clearAndType(locationInput, location);
      await this.delay(1000);
      
      // Select first suggestion if available
      const firstSuggestion = document.querySelector('.basic-typeahead__triggered-content li:first-child');
      if (firstSuggestion) {
        firstSuggestion.click();
        await this.delay(500);
      }
    }
  }

  // Set experience level filter
  async setExperienceLevel(level) {
    await this.clickFilterButton('Experience level');
    
    const levelMap = {
      'internship': 'Internship',
      'entry': 'Entry level',
      'associate': 'Associate',
      'mid': 'Mid-Senior level',
      'director': 'Director',
      'executive': 'Executive'
    };
    
    const targetLevel = levelMap[level.toLowerCase()] || level;
    const levelOption = document.querySelector(`label[for*="experience"] span:contains("${targetLevel}")`);
    
    if (levelOption) {
      levelOption.closest('label').click();
      await this.delay(500);
      await this.applyFilter();
    }
  }

  // Set job type filter
  async setJobType(type) {
    await this.clickFilterButton('Job type');
    
    const typeMap = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'volunteer': 'Volunteer',
      'internship': 'Internship'
    };
    
    const targetType = typeMap[type.toLowerCase()] || type;
    const typeOption = document.querySelector(`label span:contains("${targetType}")`);
    
    if (typeOption) {
      typeOption.closest('label').click();
      await this.delay(500);
      await this.applyFilter();
    }
  }

  // Set date posted filter
  async setDatePosted(dateRange) {
    await this.clickFilterButton('Date posted');
    
    const dateMap = {
      'past-24-hours': 'Past 24 hours',
      'past-week': 'Past week',
      'past-month': 'Past month',
      'any-time': 'Any time'
    };
    
    const targetDate = dateMap[dateRange.toLowerCase()] || dateRange;
    const dateOption = document.querySelector(`label span:contains("${targetDate}")`);
    
    if (dateOption) {
      dateOption.closest('label').click();
      await this.delay(500);
      await this.applyFilter();
    }
  }

  // Set remote work filter
  async setRemoteWork(enabled) {
    if (!enabled) return;
    
    await this.clickFilterButton('Remote');
    
    const remoteOption = document.querySelector('label span:contains("Remote")');
    if (remoteOption) {
      remoteOption.closest('label').click();
      await this.delay(500);
      await this.applyFilter();
    }
  }

  // Set salary range filter
  async setSalaryRange(salaryRange) {
    await this.clickFilterButton('Salary');
    
    // Handle different salary range formats
    const salaryOption = document.querySelector(`label span:contains("${salaryRange}")`);
    if (salaryOption) {
      salaryOption.closest('label').click();
      await this.delay(500);
      await this.applyFilter();
    }
  }

  // Click filter button
  async clickFilterButton(filterName) {
    const filterButton = document.querySelector(`button:contains("${filterName}")`) ||
                        document.querySelector(`button[aria-label*="${filterName}"]`) ||
                        Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent.includes(filterName)
                        );
    
    if (filterButton) {
      filterButton.click();
      await this.delay(1000);
    }
  }

  // Apply filter after selection
  async applyFilter() {
    const applyButton = document.querySelector('button[data-control-name="filter_show_results"]') ||
                       document.querySelector('button:contains("Show results")') ||
                       document.querySelector('.artdeco-button--primary');
    
    if (applyButton) {
      applyButton.click();
      await this.waitForSearchResults();
    }
  }

  // Discover jobs from search results
  async discoverJobs() {
    try {
      console.log('🔍 Starting job discovery...');
      
      // Get total number of results
      await this.updateNavigationState();
      
      let processedCount = 0;
      let currentPage = 1;
      
      while (currentPage <= this.navigationState.totalPages && this.isRunning) {
        console.log(`📄 Processing page ${currentPage} of ${this.navigationState.totalPages}`);
        
        // Extract jobs from current page
        const pageJobs = await this.extractJobsFromCurrentPage();
        
        for (const job of pageJobs) {
          if (!this.isRunning) break;
          
          // Process each job
          await this.processJob(job);
          processedCount++;
          
          // Update progress
          this.currentSearch.jobsProcessed = processedCount;
          
          // Respect rate limits
          await this.delay(this.getRandomDelay(1000, 3000));
        }
        
        // Navigate to next page if available
        if (currentPage < this.navigationState.totalPages && this.isRunning) {
          await this.navigateToNextPage();
          currentPage++;
          await this.delay(this.getRandomDelay(2000, 4000));
        } else {
          break;
        }
      }
      
      console.log(`✅ Job discovery completed: ${processedCount} jobs processed`);
      
    } catch (error) {
      console.error('❌ Job discovery failed:', error);
      throw error;
    }
  }

  // Extract jobs from current page
  async extractJobsFromCurrentPage() {
    const jobs = [];
    
    // Different selectors for job cards
    const jobCardSelectors = [
      '.jobs-search__results-list .result-card',
      '.jobs-search-results-list .result-card',
      '.jobs-search__results-list .job-result-card',
      '[data-job-id]',
      '.job-card-container'
    ];
    
    let jobCards = [];
    for (const selector of jobCardSelectors) {
      jobCards = document.querySelectorAll(selector);
      if (jobCards.length > 0) break;
    }
    
    console.log(`Found ${jobCards.length} job cards on current page`);
    
    for (const card of jobCards) {
      try {
        const job = await this.extractJobFromCard(card);
        if (job && job.id) {
          jobs.push(job);
        }
      } catch (error) {
        console.warn('Failed to extract job from card:', error);
      }
    }
    
    return jobs;
  }

  // Extract job data from job card
  async extractJobFromCard(card) {
    try {
      const job = {
        id: this.extractJobId(card),
        title: this.extractJobTitle(card),
        company: this.extractCompanyName(card),
        location: this.extractLocation(card),
        description: this.extractJobDescription(card),
        postedDate: this.extractPostedDate(card),
        url: this.extractJobUrl(card),
        salary: this.extractSalary(card),
        jobType: this.extractJobType(card),
        experienceLevel: this.extractExperienceLevel(card),
        extractedAt: new Date().toISOString(),
        source: 'linkedin'
      };
      
      // Validate required fields
      if (!job.id || !job.title || !job.company) {
        console.warn('Job missing required fields:', job);
        return null;
      }
      
      return job;
    } catch (error) {
      console.error('Failed to extract job data:', error);
      return null;
    }
  }

  // Extract job ID from card
  extractJobId(card) {
    // Try different methods to get job ID
    const jobId = card.getAttribute('data-job-id') ||
                  card.getAttribute('data-entity-urn')?.split(':').pop() ||
                  card.querySelector('[data-job-id]')?.getAttribute('data-job-id') ||
                  card.querySelector('a[href*="/jobs/view/"]')?.href.match(/\/jobs\/view\/(\d+)/)?.[1];
    
    return jobId;
  }

  // Extract job title from card
  extractJobTitle(card) {
    const titleSelectors = [
      '.result-card__title',
      '.job-result-card__title',
      '.job-card-container__title',
      'h3 a',
      '.job-title'
    ];
    
    for (const selector of titleSelectors) {
      const element = card.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  // Extract company name from card
  extractCompanyName(card) {
    const companySelectors = [
      '.result-card__subtitle',
      '.job-result-card__subtitle',
      '.job-card-container__company-name',
      '.company-name',
      'h4 a'
    ];
    
    for (const selector of companySelectors) {
      const element = card.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  // Extract location from card
  extractLocation(card) {
    const locationSelectors = [
      '.job-result-card__location',
      '.result-card__location',
      '.job-card-container__metadata-item',
      '.job-location'
    ];
    
    for (const selector of locationSelectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.includes(',')) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  // Extract job description from card
  extractJobDescription(card) {
    const descSelectors = [
      '.job-result-card__snippet',
      '.result-card__snippet',
      '.job-card-container__job-insight',
      '.job-description'
    ];
    
    for (const selector of descSelectors) {
      const element = card.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  // Extract posted date from card
  extractPostedDate(card) {
    const dateSelectors = [
      '.job-result-card__listdate',
      '.result-card__listdate',
      '.job-card-container__metadata-item time',
      '.posted-date'
    ];
    
    for (const selector of dateSelectors) {
      const element = card.querySelector(selector);
      if (element) {
        const dateText = element.textContent.trim();
        return this.parseRelativeDate(dateText);
      }
    }
    
    return new Date().toISOString();
  }

  // Extract job URL from card
  extractJobUrl(card) {
    const linkElement = card.querySelector('a[href*="/jobs/view/"]') ||
                       card.querySelector('.result-card__title a') ||
                       card.querySelector('.job-result-card__title a');
    
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      return href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
    }
    
    return null;
  }

  // Extract salary from card
  extractSalary(card) {
    const salarySelectors = [
      '.job-result-card__salary-info',
      '.result-card__salary',
      '.salary-info'
    ];
    
    for (const selector of salarySelectors) {
      const element = card.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  // Extract job type from card
  extractJobType(card) {
    const typeElement = card.querySelector('.job-result-card__job-type') ||
                       card.querySelector('.job-type');
    
    return typeElement ? typeElement.textContent.trim() : null;
  }

  // Extract experience level from card
  extractExperienceLevel(card) {
    const levelElement = card.querySelector('.job-result-card__seniority') ||
                        card.querySelector('.experience-level');
    
    return levelElement ? levelElement.textContent.trim() : null;
  }

  // Process individual job
  async processJob(job) {
    try {
      // Skip if already processed
      if (this.discoveredJobs.has(job.id)) {
        return;
      }
      
      console.log(`🔍 Processing job: ${job.title} at ${job.company}`);
      
      // Calculate compatibility score
      const compatibilityScore = await this.jobMatcher.calculateCompatibility(job);
      job.compatibilityScore = compatibilityScore;
      
      // Store job data
      this.discoveredJobs.set(job.id, job);
      
      // Save to storage if high compatibility
      if (compatibilityScore >= 70) {
        await this.saveJobData(job);
      }
      
      // Update search stats
      this.currentSearch.jobsFound++;
      
      // Emit job discovered event
      this.emitJobDiscovered(job);
      
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
    }
  }

  // Save job data to storage
  async saveJobData(job) {
    try {
      const encryptedJob = await this.privacyManager.encryptData(job);
      const storageKey = `hireHeat_job_${job.id}`;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [storageKey]: encryptedJob });
      } else {
        localStorage.setItem(storageKey, JSON.stringify(encryptedJob));
      }
    } catch (error) {
      console.error('Failed to save job data:', error);
    }
  }

  // Update navigation state
  async updateNavigationState() {
    try {
      // Get total results count
      const resultsCountElement = document.querySelector('.results-context-header__job-count') ||
                                 document.querySelector('.jobs-search-results-list__text') ||
                                 document.querySelector('[data-test="results-context-header"]');
      
      if (resultsCountElement) {
        const countText = resultsCountElement.textContent;
        const totalMatch = countText.match(/([\d,]+)\s+results?/);
        if (totalMatch) {
          this.navigationState.totalJobs = parseInt(totalMatch[1].replace(/,/g, ''));
        }
      }
      
      // Calculate total pages (LinkedIn shows ~25 jobs per page)
      this.navigationState.totalPages = Math.ceil(this.navigationState.totalJobs / 25);
      
      // Limit to reasonable number of pages
      this.navigationState.totalPages = Math.min(this.navigationState.totalPages, 40);
      
      console.log(`📊 Navigation state: ${this.navigationState.totalJobs} jobs, ${this.navigationState.totalPages} pages`);
      
    } catch (error) {
      console.error('Failed to update navigation state:', error);
      // Set defaults
      this.navigationState.totalPages = 10;
      this.navigationState.totalJobs = 250;
    }
  }

  // Navigate to next page
  async navigateToNextPage() {
    try {
      const nextButton = document.querySelector('button[aria-label="Next"]') ||
                        document.querySelector('.artdeco-pagination__button--next') ||
                        document.querySelector('button:contains("Next")');
      
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        await this.waitForSearchResults();
        this.navigationState.currentPage++;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to navigate to next page:', error);
      return false;
    }
  }

  // Setup page observer for dynamic content
  setupPageObserver() {
    if (typeof MutationObserver === 'undefined') return;
    
    this.pageObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check for new job cards
          const addedNodes = Array.from(mutation.addedNodes);
          const hasJobCards = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.classList?.contains('result-card') || 
             node.querySelector?.('.result-card'))
          );
          
          if (hasJobCards) {
            this.onNewJobCardsDetected();
          }
        }
      }
    });
    
    // Start observing
    if (document.body) {
      this.pageObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Setup job card observer
  setupJobCardObserver() {
    // Add compatibility scores to visible job cards
    this.addCompatibilityScoresToVisibleJobs();
    
    // Re-run when new content loads
    setInterval(() => {
      if (this.isJobSearchPage()) {
        this.addCompatibilityScoresToVisibleJobs();
      }
    }, 5000);
  }

  // Add compatibility scores to visible job cards
  async addCompatibilityScoresToVisibleJobs() {
    if (!this.isJobSearchPage()) return;
    
    const jobCards = document.querySelectorAll('.result-card, .job-result-card');
    
    for (const card of jobCards) {
      // Skip if already processed
      if (card.querySelector('.hireheat-compatibility-score')) {
        continue;
      }
      
      try {
        const job = await this.extractJobFromCard(card);
        if (job) {
          // Add loading indicator
          this.addLoadingIndicatorToCard(card);
          
          try {
            const compatibilityResult = await this.jobMatcher.scoreJobCompatibility(job);
            const score = compatibilityResult.overallScore || 0;
            
            // Remove loading indicator and add score
            this.removeLoadingIndicatorFromCard(card);
            this.addCompatibilityScoreToCard(card, score);
          } catch (scoreError) {
            console.warn('Compatibility scoring failed for job:', job.title, scoreError);
            // Remove loading indicator and show fallback
            this.removeLoadingIndicatorFromCard(card);
            this.addCompatibilityScoreToCard(card, 0, true); // Show as unavailable
          }
        }
      } catch (error) {
        console.warn('Failed to process job card:', error);
        this.removeLoadingIndicatorFromCard(card);
      }
    }
  }

  // Add loading indicator to job card
  addLoadingIndicatorToCard(card) {
    // Remove existing indicators first
    this.removeLoadingIndicatorFromCard(card);
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'hireheat-loading-indicator';
    loadingElement.innerHTML = `
      <div class="loading-badge">
        <span class="loading-spinner">⏳</span>
        <span class="loading-text">...</span>
      </div>
    `;
    
    // Position card relatively if needed
    if (getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }
    
    card.appendChild(loadingElement);
  }
  
  // Remove loading indicator from job card
  removeLoadingIndicatorFromCard(card) {
    const existingIndicator = card.querySelector('.hireheat-loading-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  // Add compatibility score to job card
  addCompatibilityScoreToCard(card, score, isError = false) {
    // Remove any existing score or loading indicator
    const existingScore = card.querySelector('.hireheat-compatibility-score');
    if (existingScore) {
      existingScore.remove();
    }
    this.removeLoadingIndicatorFromCard(card);
    
    const scoreElement = document.createElement('div');
    scoreElement.className = 'hireheat-compatibility-score';
    
    if (isError) {
      scoreElement.innerHTML = `
        <div class="score-badge error">
          <span class="score-icon">❌</span>
          <span class="score-value">N/A</span>
        </div>
      `;
    } else {
      scoreElement.innerHTML = `
        <div class="score-badge ${this.getScoreClass(score)}">
          <span class="score-icon">🔥</span>
          <span class="score-value">${score}%</span>
        </div>
      `;
    }
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .hireheat-compatibility-score {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
      }
      
      .score-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .score-badge.high {
        background: #4CAF50;
      }
      
      .score-badge.medium {
        background: #FF9800;
      }
      
      .score-badge.low {
        background: #f44336;
      }
      
      .score-badge.error {
        background: #9e9e9e;
      }
      
      .score-icon {
        font-size: 10px;
      }
      
      .hireheat-loading-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
      }
      
      .loading-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        background: #2196F3;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .loading-spinner {
        animation: spin 1s linear infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    
    if (!document.getElementById('hireheat-score-styles')) {
      style.id = 'hireheat-score-styles';
      document.head.appendChild(style);
    }
    
    // Position card relatively if needed
    if (getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }
    
    card.appendChild(scoreElement);
  }

  // Get score class for styling
  getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  // Handle new job cards detected
  onNewJobCardsDetected() {
    // Debounce to avoid excessive processing
    clearTimeout(this.newJobCardsTimeout);
    this.newJobCardsTimeout = setTimeout(() => {
      this.addCompatibilityScoresToVisibleJobs();
    }, 1000);
  }

  // Emit job discovered event
  emitJobDiscovered(job) {
    const event = new CustomEvent('hireHeatJobDiscovered', {
      detail: { job }
    });
    document.dispatchEvent(event);
  }

  // Utility functions
  async clearAndType(element, text) {
    element.focus();
    element.select();
    element.value = '';
    
    // Type character by character for more natural behavior
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.delay(50 + Math.random() * 50);
    }
    
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  async waitForSearchResults() {
    // Wait for search results to load
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      const resultsContainer = document.querySelector('.jobs-search__results-list') ||
                              document.querySelector('.jobs-search-results-list');
      
      if (resultsContainer && resultsContainer.children.length > 0) {
        await this.delay(1000); // Additional wait for content to stabilize
        return;
      }
      
      await this.delay(500);
      attempts++;
    }
    
    console.warn('Search results did not load within expected time');
  }

  parseRelativeDate(dateText) {
    const now = new Date();
    const lowerText = dateText.toLowerCase();
    
    if (lowerText.includes('hour')) {
      const hours = parseInt(lowerText.match(/\d+/)?.[0] || '1');
      return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    } else if (lowerText.includes('day')) {
      const days = parseInt(lowerText.match(/\d+/)?.[0] || '1');
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    } else if (lowerText.includes('week')) {
      const weeks = parseInt(lowerText.match(/\d+/)?.[0] || '1');
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (lowerText.includes('month')) {
      const months = parseInt(lowerText.match(/\d+/)?.[0] || '1');
      return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return now.toISOString();
  }

  getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Storage functions
  async loadSearchHistory() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_searchHistory']);
        if (result.hireHeat_searchHistory) {
          this.searchHistory = result.hireHeat_searchHistory;
        }
      } else {
        const stored = localStorage.getItem('hireHeat_searchHistory');
        if (stored) {
          this.searchHistory = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  async saveSearchHistory() {
    try {
      // Keep only last 50 searches
      const recentHistory = this.searchHistory.slice(-50);
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'hireHeat_searchHistory': recentHistory });
      } else {
        localStorage.setItem('hireHeat_searchHistory', JSON.stringify(recentHistory));
      }
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  async loadFilters() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_searchFilters']);
        if (result.hireHeat_searchFilters) {
          this.filters = { ...this.filters, ...result.hireHeat_searchFilters };
        }
      } else {
        const stored = localStorage.getItem('hireHeat_searchFilters');
        if (stored) {
          this.filters = { ...this.filters, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }

  async saveFilters() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'hireHeat_searchFilters': this.filters });
      } else {
        localStorage.setItem('hireHeat_searchFilters', JSON.stringify(this.filters));
      }
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }

  // Public API methods
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.saveFilters();
  }

  getFilters() {
    return { ...this.filters };
  }

  getSearchHistory() {
    return [...this.searchHistory];
  }

  getCurrentSearch() {
    return this.currentSearch;
  }

  getDiscoveredJobs() {
    return Array.from(this.discoveredJobs.values());
  }

  isSearchRunning() {
    return this.isRunning;
  }

  // Cleanup
  destroy() {
    this.stopSearch();
    
    if (this.pageObserver) {
      this.pageObserver.disconnect();
    }
    
    clearTimeout(this.newJobCardsTimeout);
    
    console.log('🔍 LinkedIn Automation destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkedInAutomation;
} else {
  window.LinkedInAutomation = LinkedInAutomation;
}

console.log('🔍 LinkedIn Automation loaded');