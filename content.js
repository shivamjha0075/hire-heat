// HireHeat - AI-Powered Job Application Assistant
// Main content script that integrates all AI features

console.log('🔥 HireHeat AI Assistant v3.0 - Loading...');

// Import all modules (these will be loaded via manifest)
let hireHeatAI = null;
let resumeManager = null;
let jobMatcher = null;
let safetyManager = null;
let formFiller = null;
let coverLetterGenerator = null;
let enhancedUI = null;
let linkedinAutomation = null;
let privacyManager = null;

// Global state
let isInitialized = false;
let currentJobId = null;
let currentJobData = null;
let isProcessing = false;
let errorHandler = null;

// Global AI settings (renamed to avoid conflict with linkedin-tracker.js)
let aiSettings = {
  aiEnabled: true,
  autoFillEnabled: true,
  safetyMode: true,
  showCompatibilityScores: true,
  autoGenerateCoverLetters: false,
  dailyApplicationLimit: 10,
  requireManualReview: true
};

// Initialize the extension
async function initializeHireHeat() {
  if (isInitialized) return;
  
  try {
    console.log('🚀 Initializing HireHeat AI Assistant...');
    
    // Load settings
    await loadSettings();
    
    // Initialize error handler first
    if (typeof HireHeatErrorHandler !== 'undefined') {
      errorHandler = new HireHeatErrorHandler();
      await errorHandler.initialize();
      console.log('✅ Error handler initialized');
    }
    
    // Initialize privacy manager first
    if (typeof PrivacySecurityManager !== 'undefined') {
      privacyManager = new PrivacySecurityManager();
      await privacyManager.initialize();
      console.log('✅ Privacy manager initialized');
    }
    
    // Check for user consent
    const hasConsent = await privacyManager?.checkConsent('dataProcessing');
    if (!hasConsent) {
      console.log('⚠️ User consent required for AI features');
      await privacyManager?.requestConsent('dataProcessing', {
        title: 'HireHeat AI Features',
        description: 'Enable AI-powered job matching, form filling, and cover letter generation?',
        features: ['Job compatibility scoring', 'Smart form filling', 'AI cover letter generation']
      });
    }
    
    // Initialize AI service
    if (typeof HireHeatAI !== 'undefined') {
      hireHeatAI = new HireHeatAI();
      await hireHeatAI.initialize();
      console.log('✅ AI service initialized');
    }
    
    // Initialize resume manager
    if (typeof ResumeManager !== 'undefined') {
      resumeManager = new ResumeManager(privacyManager);
      await resumeManager.initialize();
      console.log('✅ Resume manager initialized');
    }
    
    // Initialize safety manager
    if (typeof SafetyManager !== 'undefined') {
      safetyManager = new SafetyManager();
      await safetyManager.initialize();
      console.log('✅ Safety manager initialized');
    }
    
    // Initialize job matcher
    if (typeof JobMatcher !== 'undefined' && hireHeatAI && resumeManager) {
      jobMatcher = new JobMatcher(hireHeatAI, resumeManager);
      console.log('✅ Job matcher initialized');
    }
    
    // Initialize form filler
    if (typeof SmartFormFiller !== 'undefined' && resumeManager && hireHeatAI && safetyManager) {
      formFiller = new SmartFormFiller(resumeManager, hireHeatAI, safetyManager);
      await formFiller.initialize();
      console.log('✅ Form filler initialized');
    }
    
    // Initialize cover letter generator
    if (typeof CoverLetterGenerator !== 'undefined' && hireHeatAI && resumeManager) {
      coverLetterGenerator = new CoverLetterGenerator(hireHeatAI, resumeManager);
      await coverLetterGenerator.initialize();
      console.log('✅ Cover letter generator initialized');
    }
    
    // Initialize LinkedIn automation
    if (typeof LinkedInAutomation !== 'undefined' && jobMatcher && safetyManager && privacyManager) {
      linkedinAutomation = new LinkedInAutomation(jobMatcher, safetyManager, privacyManager);
      await linkedinAutomation.initialize();
      console.log('✅ LinkedIn automation initialized');
    }
    
    // Initialize enhanced UI
    if (typeof EnhancedUI !== 'undefined') {
      enhancedUI = new EnhancedUI(
        resumeManager,
        jobMatcher,
        safetyManager,
        formFiller,
        coverLetterGenerator
      );
      await enhancedUI.initialize();
      console.log('✅ Enhanced UI initialized');
    }
    
    // Set up event listeners (but don't interfere with linkedin-tracker.js)
    setupEventListeners();
    
    // Don't start job monitoring here - let linkedin-tracker.js handle it
    // startJobMonitoring();
    
    isInitialized = true;
    console.log('🎉 HireHeat AI Assistant fully initialized!');
    
    // Don't show notification to avoid conflicts with linkedin-tracker.js
    // showNotification('HireHeat AI Assistant is ready!', 'success');
    
  } catch (error) {
    console.error('❌ Failed to initialize HireHeat:', error);
    showNotification('Failed to initialize HireHeat AI features', 'error');
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.sync.get(['hireHeatAISettings']);
      if (result.hireHeatAISettings) {
        aiSettings = { ...aiSettings, ...result.hireHeatAISettings };
      }
    } else {
      const stored = localStorage.getItem('hireHeatAISettings');
      if (stored) {
        aiSettings = { ...aiSettings, ...JSON.parse(stored) };
      }
    }
    console.log('⚙️ AI Settings loaded:', aiSettings);
  } catch (error) {
    console.error('Failed to load AI settings:', error);
  }
}

// Save AI settings to storage
async function saveSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.sync.set({ hireHeatAISettings: aiSettings });
    } else {
      localStorage.setItem('hireHeatAISettings', JSON.stringify(aiSettings));
    }
  } catch (error) {
    console.error('Failed to save AI settings:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Don't listen for URL changes - let linkedin-tracker.js handle job tracking
  // let lastUrl = window.location.href;
  // const urlObserver = new MutationObserver(() => {
  //   if (window.location.href !== lastUrl) {
  //     lastUrl = window.location.href;
  //     handleUrlChange();
  //   }
  // });
  // 
  // urlObserver.observe(document.body, {
  //   childList: true,
  //   subtree: true
  // });
  
  // Listen for keyboard shortcuts (only for AI features)
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Listen for custom events (only for AI features)
  document.addEventListener('hireHeatJobDiscovered', handleJobDiscovered);
  document.addEventListener('hireHeatFormDetected', handleFormDetected);
  
  // Listen for messages from popup/background (mainly for AI config updates)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(handleMessage);
  }
}

// Handle URL changes
async function handleUrlChange() {
  const newJobId = extractJobId();
  
  if (newJobId && newJobId !== currentJobId) {
    currentJobId = newJobId;
    console.log('🔄 Job changed:', currentJobId);
    
    // Process new job
    await processCurrentJob();
  }
}

// Extract job ID from current URL
function extractJobId() {
  const url = window.location.href;
  
  // LinkedIn job patterns
  const patterns = [
    /currentJobId=(\d+)/,
    /\/jobs\/view\/(\d+)/,
    /\/jobs\/collections\/.*currentJobId=(\d+)/,
    /#.*\/jobs\/view\/(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Process current job
async function processCurrentJob() {
  if (isProcessing || !currentJobId) return;
  
  try {
    isProcessing = true;
    console.log('🔍 Processing job:', currentJobId);
    
    // Extract job data from page
    const jobData = await extractJobData();
    
    if (jobData) {
      currentJobData = jobData;
      
      // Calculate compatibility score if job matcher is available
      if (jobMatcher && aiSettings.showCompatibilityScores) {
        const compatibilityScore = await jobMatcher.calculateCompatibility(jobData);
        jobData.compatibilityScore = compatibilityScore;
        
        // Show compatibility score in UI
        displayCompatibilityScore(compatibilityScore);
      }
      
      // Update enhanced UI
      if (enhancedUI) {
        enhancedUI.updateCurrentJob(jobData);
      }
      
      // Check for application forms
      if (formFiller && aiSettings.autoFillEnabled) {
        setTimeout(() => {
          formFiller.detectAndAnalyzeForms();
        }, 2000);
      }
      
      console.log('✅ Job processed successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to process job:', error);
  } finally {
    isProcessing = false;
  }
}

// Extract job data from current page
async function extractJobData() {
  try {
    const jobData = {
      id: currentJobId,
      url: window.location.href,
      extractedAt: new Date().toISOString()
    };
    
    // Extract title
    const titleElement = document.querySelector('h1.job-title, h1[data-test="job-title"], .job-details-jobs-unified-top-card__job-title h1');
    if (titleElement) {
      jobData.title = titleElement.textContent.trim();
    }
    
    // Extract company
    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name, .job-company-name');
    if (companyElement) {
      jobData.company = companyElement.textContent.trim();
    }
    
    // Extract location
    const locationElement = document.querySelector('.job-details-jobs-unified-top-card__bullet, .job-location');
    if (locationElement) {
      jobData.location = locationElement.textContent.trim();
    }
    
    // Extract description
    const descriptionElement = document.querySelector('.job-details-jobs-unified-top-card__job-description, .job-description, #job-details');
    if (descriptionElement) {
      jobData.description = descriptionElement.textContent.trim();
    }
    
    // Extract job details
    const detailsElements = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight span, .job-criteria__text');
    const details = {};
    detailsElements.forEach(element => {
      const text = element.textContent.trim();
      if (text.includes('Employment type')) {
        details.employmentType = element.nextElementSibling?.textContent.trim();
      } else if (text.includes('Job function')) {
        details.jobFunction = element.nextElementSibling?.textContent.trim();
      } else if (text.includes('Industries')) {
        details.industries = element.nextElementSibling?.textContent.trim();
      }
    });
    jobData.details = details;
    
    // Extract skills if available
    const skillsElements = document.querySelectorAll('.job-details-how-you-match__skills-item-subtitle, .skill-match-item');
    if (skillsElements.length > 0) {
      jobData.skills = Array.from(skillsElements).map(el => el.textContent.trim());
    }
    
    return jobData;
    
  } catch (error) {
    console.error('Failed to extract job data:', error);
    return null;
  }
}

// Display compatibility score
function displayCompatibilityScore(score) {
  // Remove existing score display
  const existing = document.querySelector('#hireheat-compatibility-display');
  if (existing) existing.remove();
  
  // Create score display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'hireheat-compatibility-display';
  scoreDisplay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${getScoreColor(score)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideIn 0.3s ease-out;
    ">
      <span style="font-size: 16px;">🔥</span>
      <span>Match: ${score}%</span>
    </div>
  `;
  
  // Add animation styles
  if (!document.getElementById('hireheat-animations')) {
    const style = document.createElement('style');
    style.id = 'hireheat-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(scoreDisplay);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (scoreDisplay.parentNode) {
      scoreDisplay.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => scoreDisplay.remove(), 300);
    }
  }, 5000);
}

// Get color based on compatibility score
function getScoreColor(score) {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FF9800';
  return '#f44336';
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Ctrl/Cmd + Shift + H: Toggle HireHeat UI
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
    event.preventDefault();
    if (enhancedUI) {
      enhancedUI.toggle();
    }
  }
  
  // Ctrl/Cmd + Shift + F: Auto-fill form
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
    event.preventDefault();
    if (formFiller && settings.autoFillEnabled) {
      formFiller.fillCurrentForm();
    }
  }
  
  // Ctrl/Cmd + Shift + C: Generate cover letter
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
    event.preventDefault();
    if (coverLetterGenerator && currentJobData) {
      generateCoverLetter();
    }
  }
}

// Handle job discovered event
function handleJobDiscovered(event) {
  const { job } = event.detail;
  console.log('📋 Job discovered:', job.title, 'at', job.company);
  
  // Update UI with new job
  if (enhancedUI) {
    enhancedUI.addDiscoveredJob(job);
  }
}

// Handle form detected event
function handleFormDetected(event) {
  const { forms } = event.detail;
  console.log('📝 Forms detected:', forms.length);
  
  if (settings.autoFillEnabled && safetyManager) {
    // Check if auto-fill is safe
    safetyManager.checkDailyLimits('autoFill').then(result => {
      if (result.allowed) {
        // Show auto-fill suggestion
        showAutoFillSuggestion(forms);
      }
    });
  }
}

// Handle messages from popup/background
function handleMessage(message, sender, sendResponse) {
  console.log('📨 Message received:', message);
  
  // Handle both 'type' and 'action' for backward compatibility
  const messageType = message.type || message.action;
  
  switch (messageType) {
    case 'ACTIVATE_HIREHEAT':
      if (!isInitialized) {
        initializeHireHeat().then(() => {
          sendResponse({success: true, message: 'HireHeat activated'});
        }).catch(error => {
          console.error('❌ Failed to activate HireHeat:', error);
          sendResponse({success: false, error: error.message});
        });
        return true; // Keep message channel open for async response
      } else {
        sendResponse({success: true, message: 'HireHeat already active'});
      }
      break;
      
    case 'DEACTIVATE_HIREHEAT':
      // Deactivate features but keep basic tracking
      settings.aiEnabled = false;
      settings.autoFillEnabled = false;
      settings.autoGenerateCoverLetters = false;
      saveSettings();
      showNotification('HireHeat AI features deactivated', 'info');
      sendResponse({success: true, message: 'HireHeat deactivated'});
      break;
      
    case 'AI_CONFIG_UPDATED':
      // Handle AI configuration updates from popup
      if (hireHeatAI && typeof hireHeatAI.updateConfiguration === 'function') {
        hireHeatAI.updateConfiguration(message.apiKey, message.model);
      }
      sendResponse({success: true, message: 'AI configuration updated'});
      break;
      
    case 'GET_CURRENT_JOB':
    case 'GET_JOB_DATA':
      sendResponse({ 
        success: true,
        job: currentJobData,
        data: {
          jobId: currentJobId,
          jobData: currentJobData,
          isProcessing: isProcessing
        }
      });
      break;
      
    case 'FILL_FORM':
      if (formFiller) {
        formFiller.fillCurrentForm().then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open
      }
      break;
      
    case 'GENERATE_COVER_LETTER':
      if (coverLetterGenerator && currentJobData) {
        generateCoverLetter().then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
      } else {
        sendResponse({ success: false, error: 'No job data available' });
      }
      break;
      
    case 'START_JOB_SEARCH':
      if (linkedinAutomation) {
        linkedinAutomation.startAutomatedSearch(message.params).then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
      }
      break;
      
    case 'UPDATE_SETTINGS':
      settings = { ...settings, ...message.settings };
      saveSettings();
      sendResponse({ success: true });
      break;
      
    case 'SAVE_RESUME':
    case 'saveResume':
      if (resumeManager) {
        const resumeData = message.resumeData;
        const fileName = message.fileName || 'resume';
        
        resumeManager.createResume(resumeData, fileName).then(result => {
          sendResponse({ success: true, resumeId: result.id || result });
        }).catch(error => {
          console.error('Failed to save resume:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open
      } else {
        sendResponse({ success: false, error: 'Resume manager not initialized' });
      }
      break;
      
    case 'GET_RESUME_STATUS':
    case 'getResumeStatus':
      if (resumeManager) {
        resumeManager.getAllResumes().then(resumes => {
          const hasResumes = resumes && resumes.length > 0;
          const activeResume = resumes.find(r => r.isActive);
          sendResponse({ 
            success: true, 
            hasResumes,
            resumeCount: resumes.length,
            activeResume: activeResume ? activeResume.name : null
          });
        }).catch(error => {
          console.error('Failed to get resume status:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open
      } else {
        sendResponse({ success: false, error: 'Resume manager not initialized' });
      }
      break;
      
    case 'TOGGLE_EXTENSION':
      // Handle extension toggle from popup
      if (isInitialized) {
        aiSettings.aiEnabled = !aiSettings.aiEnabled;
        saveSettings();
        sendResponse({ 
          success: true, 
          isActive: aiSettings.aiEnabled,
          message: aiSettings.aiEnabled ? 'HireHeat activated' : 'HireHeat deactivated'
        });
      } else {
        initializeHireHeat().then(() => {
          aiSettings.aiEnabled = true;
          saveSettings();
          sendResponse({ success: true, isActive: true, message: 'HireHeat activated' });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
      }
      break;
      
    default:
      console.log('🤷 Unknown message type:', messageType);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

// Generate cover letter for current job
async function generateCoverLetter() {
  if (!coverLetterGenerator || !currentJobData) {
    throw new Error('Cover letter generator not available or no job data');
  }
  
  try {
    const coverLetter = await coverLetterGenerator.generateCoverLetter(
      currentJobData,
      { template: 'professional', tone: 'enthusiastic' }
    );
    
    // Show cover letter in modal
    showCoverLetterModal(coverLetter);
    
    return coverLetter;
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    throw error;
  }
}

// Show cover letter modal
function showCoverLetterModal(coverLetter) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
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
    ">
      <div style="
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        ">
          <h3 style="margin: 0; color: #333;">Generated Cover Letter</h3>
          <button onclick="this.closest('div').parentNode.parentNode.remove()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>
        <div style="
          white-space: pre-wrap;
          line-height: 1.6;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">${coverLetter.content}</div>
        <div style="
          margin-top: 16px;
          display: flex;
          gap: 12px;
        ">
          <button onclick="navigator.clipboard.writeText('${coverLetter.content.replace(/'/g, "\\'")}')"; style="
            background: #0066cc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
          ">Copy to Clipboard</button>
          <button onclick="this.closest('div').parentNode.parentNode.remove()" style="
            background: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Show auto-fill suggestion
function showAutoFillSuggestion(forms) {
  const suggestion = document.createElement('div');
  suggestion.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0066cc;
      color: white;
      padding: 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
    ">
      <div style="margin-bottom: 12px;">
        <strong>🤖 Auto-fill available</strong>
      </div>
      <div style="margin-bottom: 12px; font-size: 14px;">
        Found ${forms.length} form(s) that can be auto-filled with your resume data.
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.postMessage({type: 'HIREHEAT_FILL_FORMS'}, '*'); this.closest('div').parentNode.remove();" style="
          background: white;
          color: #0066cc;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Fill Forms</button>
        <button onclick="this.closest('div').parentNode.remove()" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Dismiss</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(suggestion);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (suggestion.parentNode) {
      suggestion.remove();
    }
  }, 10000);
}

// Start job monitoring
function startJobMonitoring() {
  // Initial check
  handleUrlChange();
  
  // Set up periodic checks
  setInterval(() => {
    if (!isProcessing) {
      const jobId = extractJobId();
      if (jobId && jobId !== currentJobId) {
        handleUrlChange();
      }
    }
  }, 2000);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#FF9800',
    info: '#2196F3'
  };
  
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10002;
      animation: slideDown 0.3s ease-out;
    ">${message}</div>
  `;
  
  // Add animation
  if (!document.getElementById('hireheat-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'hireheat-notification-styles';
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// Listen for messages from auto-fill suggestion
window.addEventListener('message', (event) => {
  if (event.data.type === 'HIREHEAT_FILL_FORMS' && formFiller) {
    formFiller.fillCurrentForm();
  }
});

// AI configuration is now fixed to Gemini Pro 2.5 - no updates needed

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHireHeat);
} else {
  initializeHireHeat();
}

// Also initialize after a short delay to ensure all scripts are loaded
setTimeout(initializeHireHeat, 1000);

console.log('🔥 HireHeat AI Assistant content script loaded');