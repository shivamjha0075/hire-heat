// HireHeat Safety Manager
// Implements safety features, application limits, and user confirmation workflows

class SafetyManager {
  constructor() {
    this.storageKey = 'hireHeat_safetyData';
    this.settingsKey = 'hireHeat_safetySettings';
    this.applicationLog = [];
    this.dailyLimits = {
      applications: 10,
      searches: 50,
      profileViews: 20
    };
    this.safetySettings = {
      requireManualReview: true,
      enableApplicationLimits: true,
      enableConfirmationDialogs: true,
      pauseBetweenActions: 5000, // 5 seconds
      maxRetries: 3,
      enableSafeMode: true
    };
    this.blockedCompanies = new Set();
    this.blockedKeywords = new Set();
    this.initialize();
  }

  // Initialize safety manager
  async initialize() {
    try {
      await this.loadSettings();
      await this.loadApplicationLog();
      this.setupDailyReset();
      console.log('🛡️ Safety Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Safety Manager initialization failed:', error);
      return false;
    }
  }

  // Load safety settings from storage
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.settingsKey], (result) => {
        if (result[this.settingsKey]) {
          this.safetySettings = { ...this.safetySettings, ...result[this.settingsKey] };
        }
        resolve();
      });
    });
  }

  // Save safety settings to storage
  async saveSettings() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.settingsKey]: this.safetySettings }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Load application log from storage
  async loadApplicationLog() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (result[this.storageKey]) {
          this.applicationLog = result[this.storageKey];
        }
        resolve();
      });
    });
  }

  // Save application log to storage
  async saveApplicationLog() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: this.applicationLog }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Check if action is allowed based on safety rules
  async canPerformAction(actionType, jobData = null) {
    try {
      // Check if safe mode is enabled
      if (this.safetySettings.enableSafeMode) {
        const safetyCheck = await this.performSafetyCheck(actionType, jobData);
        if (!safetyCheck.allowed) {
          return safetyCheck;
        }
      }

      // Check daily limits
      if (this.safetySettings.enableApplicationLimits) {
        const limitCheck = this.checkDailyLimits(actionType);
        if (!limitCheck.allowed) {
          return limitCheck;
        }
      }

      // Check blocked companies/keywords
      if (jobData) {
        const blockCheck = this.checkBlockedContent(jobData);
        if (!blockCheck.allowed) {
          return blockCheck;
        }
      }

      return {
        allowed: true,
        reason: 'Action approved',
        requiresConfirmation: this.safetySettings.enableConfirmationDialogs
      };
    } catch (error) {
      console.error('Safety check failed:', error);
      return {
        allowed: false,
        reason: 'Safety check failed',
        error: error.message
      };
    }
  }

  // Perform comprehensive safety check
  async performSafetyCheck(actionType, jobData) {
    const checks = [];

    // Rate limiting check
    const recentActions = this.getRecentActions(actionType, 60000); // Last minute
    if (recentActions.length >= 5) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Please wait before performing more actions.',
        waitTime: 60000
      };
    }

    // Suspicious activity detection
    if (this.detectSuspiciousActivity()) {
      return {
        allowed: false,
        reason: 'Suspicious activity detected. Manual review required.',
        requiresManualReview: true
      };
    }

    // Job quality check
    if (jobData && actionType === 'apply') {
      const qualityCheck = this.checkJobQuality(jobData);
      if (!qualityCheck.passed) {
        return {
          allowed: false,
          reason: `Job quality check failed: ${qualityCheck.reason}`,
          requiresManualReview: true
        };
      }
    }

    return { allowed: true, reason: 'Safety checks passed' };
  }

  // Check daily limits
  checkDailyLimits(actionType) {
    const today = new Date().toDateString();
    const todayActions = this.applicationLog.filter(log => 
      new Date(log.timestamp).toDateString() === today && log.action === actionType
    );

    const limit = this.dailyLimits[actionType] || 10;
    
    if (todayActions.length >= limit) {
      return {
        allowed: false,
        reason: `Daily limit reached for ${actionType} (${limit}). Try again tomorrow.`,
        currentCount: todayActions.length,
        limit: limit
      };
    }

    return {
      allowed: true,
      currentCount: todayActions.length,
      limit: limit,
      remaining: limit - todayActions.length
    };
  }

  // Check for blocked companies or keywords
  checkBlockedContent(jobData) {
    const company = (jobData.company || '').toLowerCase();
    const title = (jobData.title || '').toLowerCase();
    const description = (jobData.description || '').toLowerCase();

    // Check blocked companies
    for (const blockedCompany of this.blockedCompanies) {
      if (company.includes(blockedCompany.toLowerCase())) {
        return {
          allowed: false,
          reason: `Company "${jobData.company}" is in your blocked list`,
          blockedItem: blockedCompany
        };
      }
    }

    // Check blocked keywords
    for (const keyword of this.blockedKeywords) {
      if (title.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase())) {
        return {
          allowed: false,
          reason: `Job contains blocked keyword: "${keyword}"`,
          blockedItem: keyword
        };
      }
    }

    return { allowed: true };
  }

  // Detect suspicious activity patterns
  detectSuspiciousActivity() {
    const recentActions = this.getRecentActions(null, 300000); // Last 5 minutes
    
    // Too many actions in short time
    if (recentActions.length > 20) {
      return true;
    }

    // Rapid-fire applications
    const applications = recentActions.filter(action => action.action === 'apply');
    if (applications.length > 5) {
      return true;
    }

    // Check for failed actions pattern
    const failedActions = recentActions.filter(action => action.status === 'failed');
    if (failedActions.length > 10) {
      return true;
    }

    return false;
  }

  // Check job quality to avoid spam/scam jobs
  checkJobQuality(jobData) {
    const title = (jobData.title || '').toLowerCase();
    const description = (jobData.description || '').toLowerCase();
    const company = (jobData.company || '').toLowerCase();

    // Red flags in job titles
    const suspiciousTitles = [
      'make money fast', 'work from home easy', 'no experience needed',
      'earn $', 'guaranteed income', 'pyramid', 'mlm'
    ];

    for (const flag of suspiciousTitles) {
      if (title.includes(flag) || description.includes(flag)) {
        return {
          passed: false,
          reason: `Suspicious content detected: "${flag}"`
        };
      }
    }

    // Check for minimum job description length
    if (description.length < 100) {
      return {
        passed: false,
        reason: 'Job description too short (possible spam)'
      };
    }

    // Check for missing company information
    if (!company || company.length < 2) {
      return {
        passed: false,
        reason: 'Missing or invalid company information'
      };
    }

    return { passed: true };
  }

  // Get recent actions within time window
  getRecentActions(actionType = null, timeWindow = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeWindow;
    return this.applicationLog.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      const isRecent = logTime > cutoff;
      const matchesType = !actionType || log.action === actionType;
      return isRecent && matchesType;
    });
  }

  // Log an action
  async logAction(actionType, jobData, status = 'success', metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      action: actionType,
      timestamp: new Date().toISOString(),
      status: status,
      jobId: jobData?.id || jobData?.jobId,
      jobTitle: jobData?.title,
      company: jobData?.company,
      metadata: metadata
    };

    this.applicationLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.applicationLog.length > 1000) {
      this.applicationLog = this.applicationLog.slice(-1000);
    }

    await this.saveApplicationLog();
    console.log(`📝 Action logged: ${actionType} - ${status}`);
    return logEntry;
  }

  // Request user confirmation for action
  async requestUserConfirmation(actionType, jobData, compatibilityScore = null) {
    return new Promise((resolve) => {
      const message = this.generateConfirmationMessage(actionType, jobData, compatibilityScore);
      
      // Create confirmation dialog
      const confirmed = confirm(message);
      resolve({
        confirmed: confirmed,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Generate confirmation message
  generateConfirmationMessage(actionType, jobData, compatibilityScore) {
    let message = `Confirm ${actionType}:\n\n`;
    message += `Job: ${jobData.title}\n`;
    message += `Company: ${jobData.company}\n`;
    
    if (compatibilityScore) {
      message += `Compatibility Score: ${compatibilityScore.overallScore}%\n`;
      message += `Recommendation: ${compatibilityScore.recommendationLevel}\n`;
    }
    
    message += `\nDo you want to proceed?`;
    return message;
  }

  // Manual review workflow
  async requestManualReview(actionType, jobData, reason) {
    const reviewData = {
      id: this.generateLogId(),
      actionType: actionType,
      jobData: jobData,
      reason: reason,
      timestamp: new Date().toISOString(),
      status: 'pending_review'
    };

    // Store for manual review
    await this.storePendingReview(reviewData);
    
    // Notify user
    this.showManualReviewNotification(reviewData);
    
    return reviewData;
  }

  // Store pending review
  async storePendingReview(reviewData) {
    const pendingReviews = await this.getPendingReviews();
    pendingReviews.push(reviewData);
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'hireHeat_pendingReviews': pendingReviews }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Get pending reviews
  async getPendingReviews() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hireHeat_pendingReviews'], (result) => {
        resolve(result.hireHeat_pendingReviews || []);
      });
    });
  }

  // Show manual review notification
  showManualReviewNotification(reviewData) {
    console.log('🔍 Manual review required:', reviewData.reason);
    
    // Create notification (if permissions allow)
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'HireHeat - Manual Review Required',
        message: `Action blocked: ${reviewData.reason}`
      });
    }
  }

  // Emergency stop - halt all automated actions
  emergencyStop() {
    this.safetySettings.enableSafeMode = true;
    this.safetySettings.requireManualReview = true;
    this.saveSettings();
    
    console.log('🚨 Emergency stop activated - all automation halted');
    
    // Notify all content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'EMERGENCY_STOP',
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  // Add company to block list
  addBlockedCompany(company) {
    this.blockedCompanies.add(company.toLowerCase());
    this.saveBlockedContent();
    console.log(`🚫 Company blocked: ${company}`);
  }

  // Add keyword to block list
  addBlockedKeyword(keyword) {
    this.blockedKeywords.add(keyword.toLowerCase());
    this.saveBlockedContent();
    console.log(`🚫 Keyword blocked: ${keyword}`);
  }

  // Save blocked content
  async saveBlockedContent() {
    const data = {
      companies: Array.from(this.blockedCompanies),
      keywords: Array.from(this.blockedKeywords)
    };
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'hireHeat_blockedContent': data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Load blocked content
  async loadBlockedContent() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hireHeat_blockedContent'], (result) => {
        if (result.hireHeat_blockedContent) {
          const data = result.hireHeat_blockedContent;
          this.blockedCompanies = new Set(data.companies || []);
          this.blockedKeywords = new Set(data.keywords || []);
        }
        resolve();
      });
    });
  }

  // Setup daily reset for limits
  setupDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyCounters();
      // Set up recurring daily reset
      setInterval(() => this.resetDailyCounters(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  // Reset daily counters
  resetDailyCounters() {
    console.log('🔄 Daily safety counters reset');
    // Counters are calculated dynamically from logs, so no action needed
  }

  // Get safety statistics
  getSafetyStats() {
    const today = new Date().toDateString();
    const todayLogs = this.applicationLog.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    const stats = {
      todayActions: todayLogs.length,
      todayApplications: todayLogs.filter(log => log.action === 'apply').length,
      todaySearches: todayLogs.filter(log => log.action === 'search').length,
      successRate: this.calculateSuccessRate(todayLogs),
      blockedActions: todayLogs.filter(log => log.status === 'blocked').length,
      limits: {
        applications: this.checkDailyLimits('applications'),
        searches: this.checkDailyLimits('searches'),
        profileViews: this.checkDailyLimits('profileViews')
      },
      safetySettings: { ...this.safetySettings }
    };

    return stats;
  }

  // Calculate success rate
  calculateSuccessRate(logs) {
    if (logs.length === 0) return 0;
    const successful = logs.filter(log => log.status === 'success').length;
    return Math.round((successful / logs.length) * 100);
  }

  // Generate unique log ID
  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Update safety settings
  async updateSettings(newSettings) {
    this.safetySettings = { ...this.safetySettings, ...newSettings };
    await this.saveSettings();
    console.log('⚙️ Safety settings updated');
  }

  // Clear all safety data
  async clearAllData() {
    this.applicationLog = [];
    this.blockedCompanies.clear();
    this.blockedKeywords.clear();
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([
        this.storageKey,
        this.settingsKey,
        'hireHeat_blockedContent',
        'hireHeat_pendingReviews'
      ], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('🗑️ All safety data cleared');
          resolve();
        }
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafetyManager;
} else {
  window.SafetyManager = SafetyManager;
}

console.log('🛡️ Safety Manager loaded');