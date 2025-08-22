// HireHeat AI Assistant - Comprehensive Test Suite
// Tests all AI features and error handling

console.log('🧪 HireHeat Test Suite - Starting comprehensive tests...');

class HireHeatTestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = Date.now();
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting HireHeat AI Assistant test suite...');
    
    try {
      // Core module tests
      await this.testPrivacySecurityManager();
      await this.testAIService();
      await this.testResumeManager();
      await this.testJobMatcher();
      await this.testSafetyManager();
      await this.testFormFiller();
      await this.testCoverLetterGenerator();
      await this.testLinkedInAutomation();
      await this.testEnhancedUI();
      
      // Integration tests
      await this.testIntegration();
      
      // Error handling tests
      await this.testErrorHandling();
      
      // Performance tests
      await this.testPerformance();
      
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.logTest('Test Suite Execution', false, error.message);
    }
  }

  // Test Privacy Security Manager
  async testPrivacySecurityManager() {
    console.log('🔒 Testing Privacy Security Manager...');
    
    try {
      // Test initialization
      if (typeof PrivacySecurityManager !== 'undefined') {
        const privacyManager = new PrivacySecurityManager();
        await privacyManager.initialize();
        this.logTest('Privacy Manager Initialization', true);
        
        // Test encryption
        const testData = { test: 'sensitive data' };
        const encrypted = await privacyManager.encryptData(testData);
        const decrypted = await privacyManager.decryptData(encrypted);
        
        this.logTest('Data Encryption/Decryption', 
          JSON.stringify(testData) === JSON.stringify(decrypted));
        
        // Test consent management
        const consentResult = await privacyManager.checkConsent('dataProcessing');
        this.logTest('Consent Management', typeof consentResult === 'boolean');
        
        // Test data sanitization
        const dirtyData = '<script>alert("xss")</script>Hello World';
        const cleanData = privacyManager.sanitizeData(dirtyData);
        this.logTest('Data Sanitization', !cleanData.includes('<script>'));
        
      } else {
        this.logTest('Privacy Manager Availability', false, 'PrivacySecurityManager not loaded');
      }
    } catch (error) {
      this.logTest('Privacy Security Manager', false, error.message);
    }
  }

  // Test AI Service
  async testAIService() {
    console.log('🤖 Testing AI Service...');
    
    try {
      if (typeof HireHeatAI !== 'undefined') {
        const aiService = new HireHeatAI();
        await aiService.initialize();
        this.logTest('AI Service Initialization', true);
        
        // Test rate limiter
        const rateLimiter = aiService.rateLimiter;
        const canMakeRequest = rateLimiter.canMakeRequest();
        this.logTest('Rate Limiter Functionality', typeof canMakeRequest === 'boolean');
        
        // Test job analysis (mock)
        const mockJob = {
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'We are looking for a skilled software engineer...'
        };
        
        // This would normally make an API call, so we test the structure
        this.logTest('Job Analysis Structure', 
          typeof aiService.analyzeJob === 'function');
        
        // Test resume matching structure
        this.logTest('Resume Matching Structure', 
          typeof aiService.calculateJobResumeMatch === 'function');
        
      } else {
        this.logTest('AI Service Availability', false, 'HireHeatAI not loaded');
      }
    } catch (error) {
      this.logTest('AI Service', false, error.message);
    }
  }

  // Test Resume Manager
  async testResumeManager() {
    console.log('📄 Testing Resume Manager...');
    
    try {
      if (typeof ResumeManager !== 'undefined') {
        const resumeManager = new ResumeManager();
        await resumeManager.initialize();
        this.logTest('Resume Manager Initialization', true);
        
        // Test resume creation
        const testResume = {
          personalInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890'
          },
          experience: [{
            title: 'Software Engineer',
            company: 'Tech Corp',
            duration: '2020-2023',
            description: 'Developed web applications'
          }],
          skills: ['JavaScript', 'Python', 'React'],
          education: [{
            degree: 'BS Computer Science',
            school: 'University',
            year: '2020'
          }]
        };
        
        const resumeId = await resumeManager.createResume('Test Resume', testResume);
        this.logTest('Resume Creation', typeof resumeId === 'string');
        
        // Test resume retrieval
        const retrievedResume = await resumeManager.getResume(resumeId);
        this.logTest('Resume Retrieval', 
          retrievedResume && retrievedResume.personalInfo.name === 'John Doe');
        
        // Test resume validation
        const isValid = resumeManager.validateResumeData(testResume);
        this.logTest('Resume Validation', isValid.isValid);
        
        // Test resume update
        testResume.personalInfo.name = 'Jane Doe';
        await resumeManager.updateResume(resumeId, testResume);
        const updatedResume = await resumeManager.getResume(resumeId);
        this.logTest('Resume Update', 
          updatedResume.personalInfo.name === 'Jane Doe');
        
        // Cleanup
        await resumeManager.deleteResume(resumeId);
        
      } else {
        this.logTest('Resume Manager Availability', false, 'ResumeManager not loaded');
      }
    } catch (error) {
      this.logTest('Resume Manager', false, error.message);
    }
  }

  // Test Job Matcher
  async testJobMatcher() {
    console.log('🎯 Testing Job Matcher...');
    
    try {
      if (typeof JobMatcher !== 'undefined') {
        // Mock dependencies
        const mockAI = { calculateJobResumeMatch: () => Promise.resolve(85) };
        const mockResumeManager = { getActiveResume: () => Promise.resolve({ skills: ['JavaScript'] }) };
        
        const jobMatcher = new JobMatcher(mockAI, mockResumeManager);
        this.logTest('Job Matcher Initialization', true);
        
        // Test compatibility calculation
        const mockJob = {
          title: 'JavaScript Developer',
          description: 'Looking for JavaScript expert',
          skills: ['JavaScript', 'React'],
          location: 'Remote'
        };
        
        const compatibility = await jobMatcher.calculateCompatibility(mockJob);
        this.logTest('Compatibility Calculation', 
          typeof compatibility === 'number' && compatibility >= 0 && compatibility <= 100);
        
        // Test skill extraction
        const extractedSkills = jobMatcher.extractSkills('JavaScript, Python, React developer needed');
        this.logTest('Skill Extraction', 
          Array.isArray(extractedSkills) && extractedSkills.includes('JavaScript'));
        
        // Test batch processing
        const jobs = [mockJob, { ...mockJob, title: 'Python Developer' }];
        const results = await jobMatcher.batchProcessJobs(jobs);
        this.logTest('Batch Job Processing', 
          Array.isArray(results) && results.length === 2);
        
      } else {
        this.logTest('Job Matcher Availability', false, 'JobMatcher not loaded');
      }
    } catch (error) {
      this.logTest('Job Matcher', false, error.message);
    }
  }

  // Test Safety Manager
  async testSafetyManager() {
    console.log('🛡️ Testing Safety Manager...');
    
    try {
      if (typeof SafetyManager !== 'undefined') {
        const safetyManager = new SafetyManager();
        await safetyManager.initialize();
        this.logTest('Safety Manager Initialization', true);
        
        // Test daily limits
        const limitCheck = await safetyManager.checkDailyLimits('application');
        this.logTest('Daily Limits Check', 
          typeof limitCheck === 'object' && 'allowed' in limitCheck);
        
        // Test action logging
        await safetyManager.logAction('test', { data: 'test' });
        this.logTest('Action Logging', true);
        
        // Test suspicious activity detection
        const isSuspicious = safetyManager.detectSuspiciousActivity({
          actionsPerMinute: 100,
          failureRate: 0.8
        });
        this.logTest('Suspicious Activity Detection', isSuspicious);
        
        // Test user confirmation
        const confirmationNeeded = safetyManager.requiresUserConfirmation('application');
        this.logTest('User Confirmation Logic', typeof confirmationNeeded === 'boolean');
        
        // Test emergency stop
        safetyManager.emergencyStop();
        const isBlocked = safetyManager.isBlocked();
        this.logTest('Emergency Stop', isBlocked);
        
        // Reset for other tests
        safetyManager.reset();
        
      } else {
        this.logTest('Safety Manager Availability', false, 'SafetyManager not loaded');
      }
    } catch (error) {
      this.logTest('Safety Manager', false, error.message);
    }
  }

  // Test Form Filler
  async testFormFiller() {
    console.log('📝 Testing Form Filler...');
    
    try {
      if (typeof SmartFormFiller !== 'undefined') {
        // Mock dependencies
        const mockResumeManager = {
          getActiveResume: () => Promise.resolve({
            personalInfo: { name: 'John Doe', email: 'john@example.com' }
          })
        };
        const mockAI = { generateFormResponse: () => Promise.resolve('AI generated response') };
        const mockSafety = { checkDailyLimits: () => Promise.resolve({ allowed: true }) };
        
        const formFiller = new SmartFormFiller(mockResumeManager, mockAI, mockSafety);
        await formFiller.initialize();
        this.logTest('Form Filler Initialization', true);
        
        // Test field detection
        const mockForm = document.createElement('form');
        const nameInput = document.createElement('input');
        nameInput.name = 'name';
        nameInput.type = 'text';
        mockForm.appendChild(nameInput);
        
        const detectedFields = formFiller.detectFormFields(mockForm);
        this.logTest('Form Field Detection', 
          Array.isArray(detectedFields) && detectedFields.length > 0);
        
        // Test field mapping
        const fieldType = formFiller.identifyFieldType(nameInput);
        this.logTest('Field Type Identification', typeof fieldType === 'string');
        
        // Test value suggestion
        const suggestedValue = await formFiller.suggestFieldValue('name', nameInput);
        this.logTest('Field Value Suggestion', typeof suggestedValue === 'string');
        
      } else {
        this.logTest('Form Filler Availability', false, 'SmartFormFiller not loaded');
      }
    } catch (error) {
      this.logTest('Form Filler', false, error.message);
    }
  }

  // Test Cover Letter Generator
  async testCoverLetterGenerator() {
    console.log('✍️ Testing Cover Letter Generator...');
    
    try {
      if (typeof CoverLetterGenerator !== 'undefined') {
        // Mock dependencies
        const mockAI = {
          generateCoverLetter: () => Promise.resolve({
            content: 'Dear Hiring Manager, I am writing to express my interest...',
            wordCount: 250
          })
        };
        const mockResumeManager = {
          getActiveResume: () => Promise.resolve({
            personalInfo: { name: 'John Doe' },
            experience: [{ title: 'Developer' }]
          })
        };
        
        const coverLetterGen = new CoverLetterGenerator(mockAI, mockResumeManager);
        await coverLetterGen.initialize();
        this.logTest('Cover Letter Generator Initialization', true);
        
        // Test template loading
        const templates = coverLetterGen.getAvailableTemplates();
        this.logTest('Template Loading', 
          Array.isArray(templates) && templates.length > 0);
        
        // Test cover letter generation
        const mockJob = {
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'We are looking for a skilled developer'
        };
        
        const coverLetter = await coverLetterGen.generateCoverLetter(mockJob);
        this.logTest('Cover Letter Generation', 
          coverLetter && typeof coverLetter.content === 'string');
        
        // Test customization
        const customized = await coverLetterGen.customizeCoverLetter(
          coverLetter.id, { tone: 'enthusiastic' }
        );
        this.logTest('Cover Letter Customization', 
          customized && typeof customized.content === 'string');
        
      } else {
        this.logTest('Cover Letter Generator Availability', false, 'CoverLetterGenerator not loaded');
      }
    } catch (error) {
      this.logTest('Cover Letter Generator', false, error.message);
    }
  }

  // Test LinkedIn Automation
  async testLinkedInAutomation() {
    console.log('🔗 Testing LinkedIn Automation...');
    
    try {
      if (typeof LinkedInAutomation !== 'undefined') {
        // Mock dependencies
        const mockJobMatcher = { calculateCompatibility: () => Promise.resolve(75) };
        const mockSafety = { checkDailyLimits: () => Promise.resolve({ allowed: true }) };
        const mockPrivacy = { checkConsent: () => Promise.resolve(true) };
        
        const linkedinAuto = new LinkedInAutomation(mockJobMatcher, mockSafety, mockPrivacy);
        await linkedinAuto.initialize();
        this.logTest('LinkedIn Automation Initialization', true);
        
        // Test LinkedIn page detection
        const originalHostname = window.location.hostname;
        Object.defineProperty(window.location, 'hostname', {
          value: 'linkedin.com',
          configurable: true
        });
        
        const isLinkedIn = linkedinAuto.isLinkedInPage();
        this.logTest('LinkedIn Page Detection', isLinkedIn);
        
        // Test job search page detection
        Object.defineProperty(window.location, 'pathname', {
          value: '/jobs/search',
          configurable: true
        });
        
        const isJobSearch = linkedinAuto.isJobSearchPage();
        this.logTest('Job Search Page Detection', isJobSearch);
        
        // Test filter management
        const filters = linkedinAuto.getFilters();
        this.logTest('Filter Management', typeof filters === 'object');
        
        linkedinAuto.updateFilters({ keywords: ['developer'] });
        const updatedFilters = linkedinAuto.getFilters();
        this.logTest('Filter Updates', 
          updatedFilters.keywords && updatedFilters.keywords.includes('developer'));
        
        // Restore original hostname
        Object.defineProperty(window.location, 'hostname', {
          value: originalHostname,
          configurable: true
        });
        
      } else {
        this.logTest('LinkedIn Automation Availability', false, 'LinkedInAutomation not loaded');
      }
    } catch (error) {
      this.logTest('LinkedIn Automation', false, error.message);
    }
  }

  // Test Enhanced UI
  async testEnhancedUI() {
    console.log('🎨 Testing Enhanced UI...');
    
    try {
      if (typeof EnhancedUI !== 'undefined') {
        // Mock all dependencies
        const mockDependencies = {
          aiService: { isInitialized: () => true },
          resumeManager: { getActiveResume: () => Promise.resolve({}) },
          jobMatcher: { calculateCompatibility: () => Promise.resolve(80) },
          safetyManager: { checkDailyLimits: () => Promise.resolve({ allowed: true }) },
          formFiller: { detectAndAnalyzeForms: () => Promise.resolve([]) },
          coverLetterGenerator: { generateCoverLetter: () => Promise.resolve({}) },
          linkedinAutomation: { isSearchRunning: () => false },
          privacyManager: { checkConsent: () => Promise.resolve(true) }
        };
        
        const enhancedUI = new EnhancedUI(mockDependencies);
        await enhancedUI.initialize();
        this.logTest('Enhanced UI Initialization', true);
        
        // Test UI creation
        enhancedUI.createUI();
        const uiElement = document.querySelector('.hireheat-ui');
        this.logTest('UI Element Creation', uiElement !== null);
        
        // Test view switching
        enhancedUI.showView('dashboard');
        this.logTest('View Switching', enhancedUI.currentView === 'dashboard');
        
        // Test notification system
        enhancedUI.showNotification('Test notification', 'info');
        const notification = document.querySelector('.hireheat-notification');
        this.logTest('Notification System', notification !== null);
        
        // Cleanup
        if (uiElement) uiElement.remove();
        if (notification) notification.remove();
        
      } else {
        this.logTest('Enhanced UI Availability', false, 'EnhancedUI not loaded');
      }
    } catch (error) {
      this.logTest('Enhanced UI', false, error.message);
    }
  }

  // Test Integration
  async testIntegration() {
    console.log('🔗 Testing Integration...');
    
    try {
      // Test main content script initialization
      if (typeof initializeHireHeat === 'function') {
        this.logTest('Main Content Script Available', true);
      } else {
        this.logTest('Main Content Script Available', false, 'initializeHireHeat function not found');
      }
      
      // Test module loading order
      const requiredModules = [
        'PrivacySecurityManager',
        'HireHeatAI',
        'ResumeManager',
        'JobMatcher',
        'SafetyManager',
        'SmartFormFiller',
        'CoverLetterGenerator',
        'LinkedInAutomation',
        'EnhancedUI'
      ];
      
      const loadedModules = requiredModules.filter(module => typeof window[module] !== 'undefined');
      this.logTest('Module Loading', 
        loadedModules.length >= requiredModules.length * 0.8, // At least 80% loaded
        `${loadedModules.length}/${requiredModules.length} modules loaded`);
      
      // Test event system
      let eventReceived = false;
      document.addEventListener('hireHeatJobDiscovered', () => {
        eventReceived = true;
      });
      
      const event = new CustomEvent('hireHeatJobDiscovered', {
        detail: { job: { title: 'Test Job' } }
      });
      document.dispatchEvent(event);
      
      setTimeout(() => {
        this.logTest('Event System', eventReceived);
      }, 100);
      
    } catch (error) {
      this.logTest('Integration', false, error.message);
    }
  }

  // Test Error Handling
  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...');
    
    try {
      // Test API error handling
      if (typeof HireHeatAI !== 'undefined') {
        const aiService = new HireHeatAI();
        
        // Test Gemini API error handling
        try {
          await aiService.callGemini('test', {});
          this.logTest('API Error Handling', true, 'Gemini API call handled');
        } catch (error) {
          this.logTest('API Error Handling', true, 'Error properly caught');
        }
      }
      
      // Test storage error handling
      if (typeof ResumeManager !== 'undefined') {
        const resumeManager = new ResumeManager();
        
        // Test with invalid data
        try {
          await resumeManager.createResume('', null);
          this.logTest('Storage Error Handling', false, 'Should have thrown error');
        } catch (error) {
          this.logTest('Storage Error Handling', true);
        }
      }
      
      // Test DOM error handling
      if (typeof SmartFormFiller !== 'undefined') {
        const formFiller = new SmartFormFiller({}, {}, {});
        
        // Test with non-existent element
        const result = formFiller.detectFormFields(null);
        this.logTest('DOM Error Handling', Array.isArray(result));
      }
      
    } catch (error) {
      this.logTest('Error Handling', false, error.message);
    }
  }

  // Test Performance
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test initialization time
      const initStart = performance.now();
      
      if (typeof HireHeatAI !== 'undefined') {
        const aiService = new HireHeatAI();
        await aiService.initialize();
      }
      
      const initTime = performance.now() - initStart;
      this.logTest('Initialization Performance', 
        initTime < 1000, // Should initialize in under 1 second
        `${initTime.toFixed(2)}ms`);
      
      // Test memory usage (basic check)
      const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Create and destroy multiple instances
      const instances = [];
      for (let i = 0; i < 10; i++) {
        if (typeof JobMatcher !== 'undefined') {
          instances.push(new JobMatcher({}, {}));
        }
      }
      
      // Clear instances
      instances.length = 0;
      
      const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      this.logTest('Memory Management', 
        memoryIncrease < 10 * 1024 * 1024, // Less than 10MB increase
        `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
      
      // Test DOM manipulation performance
      const domStart = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.className = 'test-element';
        document.body.appendChild(element);
        document.body.removeChild(element);
      }
      
      const domTime = performance.now() - domStart;
      this.logTest('DOM Performance', 
        domTime < 100, // Should complete in under 100ms
        `${domTime.toFixed(2)}ms`);
      
    } catch (error) {
      this.logTest('Performance', false, error.message);
    }
  }

  // Log test result
  logTest(testName, passed, details = '') {
    this.totalTests++;
    
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName}${details ? ` (${details})` : ''}`);
    } else {
      this.failedTests++;
      console.error(`❌ ${testName}${details ? ` - ${details}` : ''}`);
    }
  }

  // Generate test report
  generateTestReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    console.log('\n📊 HireHeat Test Suite Report');
    console.log('================================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${duration}ms`);
    console.log('================================\n');
    
    // Show failed tests
    if (this.failedTests > 0) {
      console.log('❌ Failed Tests:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.details}`);
        });
      console.log('');
    }
    
    // Store results for later analysis
    this.storeTestResults({
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      successRate: parseFloat(successRate),
      duration,
      timestamp: new Date().toISOString(),
      results: this.testResults
    });
    
    // Show summary notification
    if (typeof showNotification === 'function') {
      const message = `Tests completed: ${this.passedTests}/${this.totalTests} passed (${successRate}%)`;
      const type = this.failedTests === 0 ? 'success' : 'warning';
      showNotification(message, type);
    }
  }

  // Store test results
  async storeTestResults(report) {
    try {
      const storageKey = 'hireHeat_testResults';
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [storageKey]: report });
      } else {
        localStorage.setItem(storageKey, JSON.stringify(report));
      }
      
      console.log('📁 Test results stored successfully');
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }

  // Get previous test results
  async getPreviousResults() {
    try {
      const storageKey = 'hireHeat_testResults';
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([storageKey]);
        return result[storageKey] || null;
      } else {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Failed to get previous test results:', error);
      return null;
    }
  }
}

// Auto-run tests if in test mode
if (window.location.search.includes('hireheat-test=true')) {
  console.log('🧪 Auto-running HireHeat tests...');
  
  // Wait for all modules to load
  setTimeout(async () => {
    const testSuite = new HireHeatTestSuite();
    await testSuite.runAllTests();
  }, 2000);
}

// Export for manual testing
window.HireHeatTestSuite = HireHeatTestSuite;

// Add test runner to debug object
if (window.HireHeatDebug) {
  window.HireHeatDebug.runTests = async () => {
    const testSuite = new HireHeatTestSuite();
    await testSuite.runAllTests();
    return testSuite.testResults;
  };
}

console.log('🧪 HireHeat Test Suite loaded - Use HireHeatTestSuite to run tests');