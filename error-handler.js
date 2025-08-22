// HireHeat AI Assistant - Comprehensive Error Handler
// Provides centralized error management and recovery for all modules

class HireHeatErrorHandler {
  constructor() {
    this.errorLog = [];
    this.errorCounts = new Map();
    this.maxLogSize = 1000;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.errorCallbacks = new Map();
    this.isInitialized = false;
    
    // Error categories
    this.errorCategories = {
      API: 'api',
      STORAGE: 'storage',
      DOM: 'dom',
      NETWORK: 'network',
      VALIDATION: 'validation',
      PERMISSION: 'permission',
      RATE_LIMIT: 'rate_limit',
      UNKNOWN: 'unknown'
    };
    
    // Recovery strategies
    this.recoveryStrategies = new Map();
    this.setupRecoveryStrategies();
  }

  // Initialize error handler
  async initialize() {
    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Load previous error data
      await this.loadErrorData();
      
      // Set up periodic cleanup
      this.setupPeriodicCleanup();
      
      this.isInitialized = true;
      console.log('✅ HireHeat Error Handler initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Error Handler:', error);
      throw error;
    }
  }

  // Set up global error handlers
  setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        category: this.errorCategories.UNKNOWN,
        context: 'global_error'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        error: event.reason,
        message: event.reason?.message || 'Unhandled promise rejection',
        category: this.errorCategories.UNKNOWN,
        context: 'unhandled_promise'
      });
    });

    // Handle Chrome extension errors
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'error') {
          this.handleError({
            error: message.error,
            message: message.message,
            category: message.category || this.errorCategories.UNKNOWN,
            context: 'chrome_runtime'
          });
        }
      });
    }
  }

  // Set up recovery strategies
  setupRecoveryStrategies() {
    // API error recovery
    this.recoveryStrategies.set(this.errorCategories.API, {
      canRecover: (error) => {
        return error.status === 429 || error.status >= 500 || error.code === 'NETWORK_ERROR';
      },
      recover: async (error, context) => {
        if (error.status === 429) {
          // Rate limit - wait and retry
          const waitTime = this.getRetryDelay(context.retryCount);
          await this.delay(waitTime);
          return { canRetry: true, delay: waitTime };
        }
        
        if (error.status >= 500) {
          // Server error - exponential backoff
          const waitTime = this.getRetryDelay(context.retryCount) * 2;
          await this.delay(waitTime);
          return { canRetry: true, delay: waitTime };
        }
        
        return { canRetry: false };
      }
    });

    // Storage error recovery
    this.recoveryStrategies.set(this.errorCategories.STORAGE, {
      canRecover: (error) => {
        return error.name === 'QuotaExceededError' || error.message.includes('storage');
      },
      recover: async (error, context) => {
        if (error.name === 'QuotaExceededError') {
          // Clear old data and retry
          await this.clearOldStorageData();
          return { canRetry: true, message: 'Cleared old data to free storage space' };
        }
        return { canRetry: false };
      }
    });

    // DOM error recovery
    this.recoveryStrategies.set(this.errorCategories.DOM, {
      canRecover: (error) => {
        return error.message.includes('not found') || error.message.includes('null');
      },
      recover: async (error, context) => {
        // Wait for DOM to be ready
        await this.waitForDOM();
        return { canRetry: true, message: 'Waited for DOM to be ready' };
      }
    });

    // Network error recovery
    this.recoveryStrategies.set(this.errorCategories.NETWORK, {
      canRecover: (error) => {
        return error.code === 'NETWORK_ERROR' || error.message.includes('fetch');
      },
      recover: async (error, context) => {
        // Wait and retry with exponential backoff
        const waitTime = this.getRetryDelay(context.retryCount);
        await this.delay(waitTime);
        return { canRetry: true, delay: waitTime };
      }
    });
  }

  // Main error handling method
  async handleError(errorInfo) {
    try {
      // Normalize error info
      const normalizedError = this.normalizeError(errorInfo);
      
      // Log the error
      this.logError(normalizedError);
      
      // Update error counts
      this.updateErrorCounts(normalizedError);
      
      // Attempt recovery if possible
      const recoveryResult = await this.attemptRecovery(normalizedError);
      
      // Notify error callbacks
      this.notifyErrorCallbacks(normalizedError, recoveryResult);
      
      // Show user notification if needed
      this.showUserNotification(normalizedError, recoveryResult);
      
      return {
        handled: true,
        recovered: recoveryResult?.recovered || false,
        canRetry: recoveryResult?.canRetry || false,
        errorId: normalizedError.id
      };
      
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      return { handled: false, error: handlingError };
    }
  }

  // Normalize error information
  normalizeError(errorInfo) {
    const timestamp = new Date().toISOString();
    const id = this.generateErrorId();
    
    return {
      id,
      timestamp,
      message: errorInfo.message || errorInfo.error?.message || 'Unknown error',
      stack: errorInfo.error?.stack || new Error().stack,
      category: errorInfo.category || this.categorizeError(errorInfo),
      context: errorInfo.context || 'unknown',
      filename: errorInfo.filename || '',
      lineno: errorInfo.lineno || 0,
      colno: errorInfo.colno || 0,
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: this.determineSeverity(errorInfo),
      metadata: errorInfo.metadata || {}
    };
  }

  // Categorize error based on content
  categorizeError(errorInfo) {
    const message = (errorInfo.message || errorInfo.error?.message || '').toLowerCase();
    const stack = (errorInfo.error?.stack || '').toLowerCase();
    
    if (message.includes('api') || message.includes('fetch') || message.includes('network')) {
      return this.errorCategories.API;
    }
    
    if (message.includes('storage') || message.includes('quota')) {
      return this.errorCategories.STORAGE;
    }
    
    if (message.includes('element') || message.includes('dom') || message.includes('null')) {
      return this.errorCategories.DOM;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return this.errorCategories.PERMISSION;
    }
    
    if (message.includes('rate') || message.includes('limit') || message.includes('429')) {
      return this.errorCategories.RATE_LIMIT;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return this.errorCategories.VALIDATION;
    }
    
    return this.errorCategories.UNKNOWN;
  }

  // Determine error severity
  determineSeverity(errorInfo) {
    const message = (errorInfo.message || errorInfo.error?.message || '').toLowerCase();
    
    // Critical errors that break core functionality
    if (message.includes('initialization') || message.includes('critical') || 
        message.includes('security') || message.includes('permission denied')) {
      return 'critical';
    }
    
    // High severity errors that impact user experience
    if (message.includes('api') || message.includes('storage') || 
        message.includes('network') || message.includes('timeout')) {
      return 'high';
    }
    
    // Medium severity errors that cause minor issues
    if (message.includes('validation') || message.includes('format') || 
        message.includes('parsing')) {
      return 'medium';
    }
    
    // Low severity errors that don't impact functionality
    return 'low';
  }

  // Log error to internal log
  logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Console logging based on severity
    const logMethod = this.getLogMethod(errorInfo.severity);
    logMethod(`[HireHeat Error] ${errorInfo.category.toUpperCase()}: ${errorInfo.message}`, {
      id: errorInfo.id,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp
    });
  }

  // Get appropriate console log method
  getLogMethod(severity) {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      default:
        return console.log;
    }
  }

  // Update error counts for analytics
  updateErrorCounts(errorInfo) {
    const key = `${errorInfo.category}:${errorInfo.context}`;
    const current = this.errorCounts.get(key) || { count: 0, lastSeen: null };
    
    this.errorCounts.set(key, {
      count: current.count + 1,
      lastSeen: errorInfo.timestamp,
      category: errorInfo.category,
      context: errorInfo.context
    });
  }

  // Attempt error recovery
  async attemptRecovery(errorInfo) {
    const strategy = this.recoveryStrategies.get(errorInfo.category);
    
    if (!strategy || !strategy.canRecover(errorInfo)) {
      return { recovered: false, canRetry: false };
    }
    
    const retryKey = `${errorInfo.category}:${errorInfo.context}`;
    const retryCount = this.retryAttempts.get(retryKey) || 0;
    
    if (retryCount >= this.maxRetries) {
      return { recovered: false, canRetry: false, reason: 'Max retries exceeded' };
    }
    
    try {
      const recoveryResult = await strategy.recover(errorInfo, { retryCount });
      
      if (recoveryResult.canRetry) {
        this.retryAttempts.set(retryKey, retryCount + 1);
      }
      
      return {
        recovered: true,
        canRetry: recoveryResult.canRetry,
        message: recoveryResult.message,
        delay: recoveryResult.delay
      };
      
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return { recovered: false, canRetry: false, error: recoveryError };
    }
  }

  // Notify registered error callbacks
  notifyErrorCallbacks(errorInfo, recoveryResult) {
    const callbacks = this.errorCallbacks.get(errorInfo.category) || [];
    
    callbacks.forEach(callback => {
      try {
        callback(errorInfo, recoveryResult);
      } catch (callbackError) {
        console.error('Error callback failed:', callbackError);
      }
    });
  }

  // Show user notification for significant errors
  showUserNotification(errorInfo, recoveryResult) {
    // Only show notifications for high/critical errors or when recovery fails
    if (errorInfo.severity === 'low' || 
        (recoveryResult?.recovered && recoveryResult?.canRetry)) {
      return;
    }
    
    const message = this.getUserFriendlyMessage(errorInfo, recoveryResult);
    
    // Try to show notification through UI if available
    if (typeof showNotification === 'function') {
      const type = errorInfo.severity === 'critical' ? 'error' : 'warning';
      showNotification(message, type);
    } else {
      // Fallback to console
      console.warn('User Notification:', message);
    }
  }

  // Generate user-friendly error messages
  getUserFriendlyMessage(errorInfo, recoveryResult) {
    if (recoveryResult?.recovered) {
      return `Issue resolved: ${this.getCategoryDisplayName(errorInfo.category)} problem was automatically fixed.`;
    }
    
    switch (errorInfo.category) {
      case this.errorCategories.API:
        return 'AI service temporarily unavailable. Please try again in a moment.';
      case this.errorCategories.STORAGE:
        return 'Storage space issue detected. Some old data may have been cleared.';
      case this.errorCategories.NETWORK:
        return 'Network connection issue. Please check your internet connection.';
      case this.errorCategories.PERMISSION:
        return 'Permission required. Please check extension permissions in Chrome settings.';
      case this.errorCategories.RATE_LIMIT:
        return 'Rate limit reached. Please wait a moment before trying again.';
      default:
        return 'An unexpected issue occurred. The extension will continue to work normally.';
    }
  }

  // Get display name for error category
  getCategoryDisplayName(category) {
    const names = {
      [this.errorCategories.API]: 'AI Service',
      [this.errorCategories.STORAGE]: 'Data Storage',
      [this.errorCategories.DOM]: 'Page Content',
      [this.errorCategories.NETWORK]: 'Network',
      [this.errorCategories.VALIDATION]: 'Data Validation',
      [this.errorCategories.PERMISSION]: 'Permissions',
      [this.errorCategories.RATE_LIMIT]: 'Rate Limiting',
      [this.errorCategories.UNKNOWN]: 'System'
    };
    
    return names[category] || 'System';
  }

  // Register error callback
  registerErrorCallback(category, callback) {
    if (!this.errorCallbacks.has(category)) {
      this.errorCallbacks.set(category, []);
    }
    
    this.errorCallbacks.get(category).push(callback);
  }

  // Unregister error callback
  unregisterErrorCallback(category, callback) {
    const callbacks = this.errorCallbacks.get(category);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Utility methods
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRetryDelay(retryCount) {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForDOM() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      }
    });
  }

  async clearOldStorageData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Clear old error logs
        const result = await chrome.storage.local.get(['hireHeat_errorLog']);
        if (result.hireHeat_errorLog) {
          const recentErrors = result.hireHeat_errorLog.slice(0, 100);
          await chrome.storage.local.set({ hireHeat_errorLog: recentErrors });
        }
      }
    } catch (error) {
      console.error('Failed to clear old storage data:', error);
    }
  }

  // Load previous error data
  async loadErrorData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_errorLog', 'hireHeat_errorCounts']);
        
        if (result.hireHeat_errorLog) {
          this.errorLog = result.hireHeat_errorLog.slice(0, this.maxLogSize);
        }
        
        if (result.hireHeat_errorCounts) {
          this.errorCounts = new Map(Object.entries(result.hireHeat_errorCounts));
        }
      }
    } catch (error) {
      console.error('Failed to load error data:', error);
    }
  }

  // Save error data
  async saveErrorData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          hireHeat_errorLog: this.errorLog.slice(0, 500), // Save only recent errors
          hireHeat_errorCounts: Object.fromEntries(this.errorCounts)
        });
      }
    } catch (error) {
      console.error('Failed to save error data:', error);
    }
  }

  // Set up periodic cleanup
  setupPeriodicCleanup() {
    // Clean up old retry attempts every 5 minutes
    setInterval(() => {
      this.retryAttempts.clear();
    }, 5 * 60 * 1000);
    
    // Save error data every 10 minutes
    setInterval(() => {
      this.saveErrorData();
    }, 10 * 60 * 1000);
  }

  // Get error statistics
  getErrorStatistics() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: this.errorLog.slice(0, 10),
      topErrorContexts: []
    };
    
    // Count by category
    this.errorLog.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });
    
    // Top error contexts
    const contextCounts = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([key, data]) => ({ context: key, count: data.count, lastSeen: data.lastSeen }));
    
    stats.topErrorContexts = contextCounts;
    
    return stats;
  }

  // Clear all error data
  clearErrorData() {
    this.errorLog = [];
    this.errorCounts.clear();
    this.retryAttempts.clear();
    
    // Clear stored data
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['hireHeat_errorLog', 'hireHeat_errorCounts']);
    }
  }

  // Create error wrapper for functions
  wrapFunction(fn, context, category = this.errorCategories.UNKNOWN) {
    return async (...args) => {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        await this.handleError({
          error,
          message: error.message,
          category,
          context,
          metadata: { args: args.length }
        });
        throw error;
      }
    };
  }

  // Create error wrapper for promises
  wrapPromise(promise, context, category = this.errorCategories.UNKNOWN) {
    return promise.catch(async (error) => {
      await this.handleError({
        error,
        message: error.message,
        category,
        context
      });
      throw error;
    });
  }
}

// Global error handler instance
window.HireHeatErrorHandler = HireHeatErrorHandler;

// Auto-initialize if not in test mode
if (!window.location.search.includes('hireheat-test=true')) {
  window.hireHeatErrorHandler = new HireHeatErrorHandler();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.hireHeatErrorHandler.initialize();
    });
  } else {
    window.hireHeatErrorHandler.initialize();
  }
}

console.log('🛡️ HireHeat Error Handler loaded');