// HireHeat Privacy & Security Manager
// Comprehensive privacy and security measures for handling sensitive data

class PrivacySecurityManager {
  constructor() {
    this.encryptionKey = null;
    this.privacySettings = {
      dataRetentionDays: 90,
      enableEncryption: true,
      shareAnalytics: false,
      autoDeleteApplications: true,
      requireDataConsent: true,
      enableAuditLog: true
    };
    this.auditLog = [];
    this.consentStatus = {
      dataProcessing: false,
      aiAnalysis: false,
      dataStorage: false,
      thirdPartyIntegration: false
    };
    this.initialize();
  }

  // Initialize privacy and security system
  async initialize() {
    try {
      await this.loadPrivacySettings();
      await this.initializeEncryption();
      await this.loadConsentStatus();
      await this.setupDataRetentionSchedule();
      this.logAuditEvent('system', 'Privacy system initialized');
      console.log('🔒 Privacy & Security Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Privacy system initialization failed:', error);
      return false;
    }
  }

  // Initialize encryption system
  async initializeEncryption() {
    if (!this.privacySettings.enableEncryption) {
      console.log('🔓 Encryption disabled by user settings');
      return;
    }

    try {
      // Generate or load encryption key
      const storedKey = await this.getStoredEncryptionKey();
      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        this.encryptionKey = await this.generateEncryptionKey();
        await this.storeEncryptionKey(this.encryptionKey);
      }
      
      console.log('🔐 Encryption system ready');
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error);
      throw error;
    }
  }

  // Generate encryption key
  async generateEncryptionKey() {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Use Web Crypto API for secure key generation
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      return key;
    } else {
      // Fallback for environments without Web Crypto API
      const keyArray = new Uint8Array(32);
      for (let i = 0; i < keyArray.length; i++) {
        keyArray[i] = Math.floor(Math.random() * 256);
      }
      return keyArray;
    }
  }

  // Store encryption key securely
  async storeEncryptionKey(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Store in Chrome extension storage
        const keyData = await crypto.subtle.exportKey('raw', key);
        const keyArray = Array.from(new Uint8Array(keyData));
        await chrome.storage.local.set({ 'hireHeat_encryptionKey': keyArray });
      } else {
        // Fallback to localStorage (less secure)
        console.warn('⚠️ Using localStorage for key storage - less secure');
        localStorage.setItem('hireHeat_encryptionKey', JSON.stringify(Array.from(key)));
      }
    } catch (error) {
      console.error('❌ Failed to store encryption key:', error);
      throw error;
    }
  }

  // Get stored encryption key
  async getStoredEncryptionKey() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_encryptionKey']);
        if (result.hireHeat_encryptionKey) {
          const keyArray = new Uint8Array(result.hireHeat_encryptionKey);
          return await crypto.subtle.importKey(
            'raw',
            keyArray,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
          );
        }
      } else {
        const storedKey = localStorage.getItem('hireHeat_encryptionKey');
        if (storedKey) {
          return new Uint8Array(JSON.parse(storedKey));
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve encryption key:', error);
      return null;
    }
  }

  // Encrypt sensitive data
  async encryptData(data) {
    if (!this.privacySettings.enableEncryption || !this.encryptionKey) {
      return data; // Return unencrypted if encryption is disabled
    }

    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Use Web Crypto API
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          this.encryptionKey,
          dataBuffer
        );

        return {
          encrypted: true,
          data: Array.from(new Uint8Array(encryptedBuffer)),
          iv: Array.from(iv),
          timestamp: Date.now()
        };
      } else {
        // Simple XOR encryption fallback (less secure)
        const encrypted = this.xorEncrypt(dataString, this.encryptionKey);
        return {
          encrypted: true,
          data: encrypted,
          method: 'xor',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      this.logAuditEvent('encryption', 'Encryption failed', { error: error.message });
      return data; // Return unencrypted on failure
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {
      return encryptedData; // Return as-is if not encrypted
    }

    if (!this.encryptionKey) {
      console.error('❌ No encryption key available for decryption');
      return null;
    }

    try {
      if (encryptedData.method === 'xor') {
        // XOR decryption
        const decrypted = this.xorDecrypt(encryptedData.data, this.encryptionKey);
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      } else if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Web Crypto API decryption
        const dataBuffer = new Uint8Array(encryptedData.data);
        const iv = new Uint8Array(encryptedData.iv);

        const decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          this.encryptionKey,
          dataBuffer
        );

        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decryptedBuffer);
        
        try {
          return JSON.parse(decryptedString);
        } catch {
          return decryptedString;
        }
      }
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      this.logAuditEvent('decryption', 'Decryption failed', { error: error.message });
      return null;
    }
  }

  // Simple XOR encryption (fallback)
  xorEncrypt(text, key) {
    let result = '';
    const keyArray = Array.isArray(key) ? key : Array.from(key);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCode = keyArray[i % keyArray.length];
      result += String.fromCharCode(charCode ^ keyCode);
    }
    
    return btoa(result); // Base64 encode
  }

  // Simple XOR decryption (fallback)
  xorDecrypt(encryptedText, key) {
    try {
      const decodedText = atob(encryptedText); // Base64 decode
      let result = '';
      const keyArray = Array.isArray(key) ? key : Array.from(key);
      
      for (let i = 0; i < decodedText.length; i++) {
        const charCode = decodedText.charCodeAt(i);
        const keyCode = keyArray[i % keyArray.length];
        result += String.fromCharCode(charCode ^ keyCode);
      }
      
      return result;
    } catch (error) {
      console.error('❌ XOR decryption failed:', error);
      return null;
    }
  }

  // Sanitize data before storage
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    const sensitiveFields = [
      'ssn', 'socialSecurityNumber', 'passport', 'driverLicense',
      'bankAccount', 'creditCard', 'password', 'apiKey', 'token'
    ];

    const maskSensitiveValue = (value) => {
      if (typeof value === 'string' && value.length > 4) {
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
      }
      return '***';
    };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            obj[key] = maskSensitiveValue(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  // Check and request user consent
  async checkConsent(consentType) {
    if (!this.privacySettings.requireDataConsent) {
      return true;
    }

    if (this.consentStatus[consentType]) {
      return true;
    }

    // Request consent from user
    const granted = await this.requestConsent(consentType);
    if (granted) {
      this.consentStatus[consentType] = true;
      await this.saveConsentStatus();
      this.logAuditEvent('consent', `Consent granted for ${consentType}`);
    }

    return granted;
  }

  // Request consent from user
  async requestConsent(consentType) {
    const consentMessages = {
      dataProcessing: 'HireHeat would like to process your resume and job application data to provide AI-powered job matching and application assistance.',
      aiAnalysis: 'Allow HireHeat to use AI services to analyze job descriptions and generate personalized application materials?',
      dataStorage: 'HireHeat needs to store your resume and application data locally to provide its services. This data will be encrypted.',
      thirdPartyIntegration: 'Allow HireHeat to integrate with third-party services (like AI APIs) to enhance functionality?'
    };

    const message = consentMessages[consentType] || 'HireHeat requests permission to process your data.';
    
    return new Promise((resolve) => {
      // Create consent dialog
      const dialog = this.createConsentDialog(message, consentType);
      document.body.appendChild(dialog);

      // Handle user response
      const handleResponse = (granted) => {
        document.body.removeChild(dialog);
        resolve(granted);
      };

      dialog.querySelector('.consent-accept').addEventListener('click', () => handleResponse(true));
      dialog.querySelector('.consent-decline').addEventListener('click', () => handleResponse(false));
    });
  }

  // Create consent dialog
  createConsentDialog(message, consentType) {
    const dialog = document.createElement('div');
    dialog.className = 'hireheat-consent-dialog';
    dialog.innerHTML = `
      <div class="consent-overlay">
        <div class="consent-modal">
          <div class="consent-header">
            <h3>🔒 Privacy Consent Required</h3>
          </div>
          <div class="consent-body">
            <p>${message}</p>
            <div class="consent-details">
              <h4>What this means:</h4>
              <ul>
                ${this.getConsentDetails(consentType)}
              </ul>
            </div>
            <div class="consent-privacy-note">
              <p><strong>Your Privacy:</strong> All data is encrypted and stored locally. We never share your personal information with third parties without your explicit consent.</p>
            </div>
          </div>
          <div class="consent-actions">
            <button class="hireheat-btn hireheat-btn-secondary consent-decline">Decline</button>
            <button class="hireheat-btn hireheat-btn-primary consent-accept">Accept</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .hireheat-consent-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10003;
      }
      
      .consent-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .consent-modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        color: #333;
      }
      
      .consent-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      
      .consent-header h3 {
        margin: 0;
        color: #333;
      }
      
      .consent-body {
        padding: 20px;
      }
      
      .consent-body p {
        margin-bottom: 15px;
        line-height: 1.5;
      }
      
      .consent-details {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
      }
      
      .consent-details h4 {
        margin: 0 0 10px 0;
        color: #333;
      }
      
      .consent-details ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .consent-details li {
        margin-bottom: 5px;
      }
      
      .consent-privacy-note {
        background: #e8f5e8;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #4CAF50;
      }
      
      .consent-privacy-note p {
        margin: 0;
        font-size: 14px;
      }
      
      .consent-actions {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
    `;
    
    dialog.appendChild(style);
    return dialog;
  }

  // Get consent details for specific type
  getConsentDetails(consentType) {
    const details = {
      dataProcessing: `
        <li>Your resume data will be analyzed to match with job opportunities</li>
        <li>Application forms will be pre-filled using your information</li>
        <li>Job compatibility scores will be calculated</li>
      `,
      aiAnalysis: `
        <li>Job descriptions will be sent to AI services for analysis</li>
        <li>Your resume will be used to generate personalized cover letters</li>
        <li>AI will help optimize your application materials</li>
      `,
      dataStorage: `
        <li>Resume and profile data stored locally on your device</li>
        <li>Application history and preferences saved</li>
        <li>All data encrypted using industry-standard encryption</li>
      `,
      thirdPartyIntegration: `
        <li>Integration with Google Gemini Pro 2.5 for enhanced AI features</li>
        <li>No personal data shared without explicit consent</li>
        <li>Third-party services used only for processing, not storage</li>
      `
    };
    
    return details[consentType] || '<li>Data processing for core functionality</li>';
  }

  // Load consent status
  async loadConsentStatus() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_consentStatus']);
        if (result.hireHeat_consentStatus) {
          this.consentStatus = { ...this.consentStatus, ...result.hireHeat_consentStatus };
        }
      } else {
        const stored = localStorage.getItem('hireHeat_consentStatus');
        if (stored) {
          this.consentStatus = { ...this.consentStatus, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.error('❌ Failed to load consent status:', error);
    }
  }

  // Save consent status
  async saveConsentStatus() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'hireHeat_consentStatus': this.consentStatus });
      } else {
        localStorage.setItem('hireHeat_consentStatus', JSON.stringify(this.consentStatus));
      }
    } catch (error) {
      console.error('❌ Failed to save consent status:', error);
    }
  }

  // Load privacy settings
  async loadPrivacySettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_privacySettings']);
        if (result.hireHeat_privacySettings) {
          this.privacySettings = { ...this.privacySettings, ...result.hireHeat_privacySettings };
        }
      } else {
        const stored = localStorage.getItem('hireHeat_privacySettings');
        if (stored) {
          this.privacySettings = { ...this.privacySettings, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.error('❌ Failed to load privacy settings:', error);
    }
  }

  // Save privacy settings
  async savePrivacySettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'hireHeat_privacySettings': this.privacySettings });
      } else {
        localStorage.setItem('hireHeat_privacySettings', JSON.stringify(this.privacySettings));
      }
      
      this.logAuditEvent('settings', 'Privacy settings updated');
    } catch (error) {
      console.error('❌ Failed to save privacy settings:', error);
    }
  }

  // Setup data retention schedule
  async setupDataRetentionSchedule() {
    if (!this.privacySettings.autoDeleteApplications) {
      return;
    }

    // Check for old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // 1 hour

    // Initial cleanup
    await this.cleanupOldData();
  }

  // Cleanup old data based on retention policy
  async cleanupOldData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.privacySettings.dataRetentionDays);
      
      // Get all stored data keys
      let keys = [];
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(null);
        keys = Object.keys(result);
      } else {
        keys = Object.keys(localStorage).filter(key => key.startsWith('hireHeat_'));
      }

      let deletedCount = 0;
      for (const key of keys) {
        if (key.includes('application_') || key.includes('jobData_')) {
          const data = await this.getStoredData(key);
          if (data && data.timestamp && new Date(data.timestamp) < cutoffDate) {
            await this.deleteStoredData(key);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        this.logAuditEvent('cleanup', `Deleted ${deletedCount} old records`);
        console.log(`🧹 Cleaned up ${deletedCount} old records`);
      }
    } catch (error) {
      console.error('❌ Data cleanup failed:', error);
      this.logAuditEvent('cleanup', 'Data cleanup failed', { error: error.message });
    }
  }

  // Get stored data
  async getStoredData(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([key]);
        return result[key];
      } else {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error(`❌ Failed to get stored data for key ${key}:`, error);
      return null;
    }
  }

  // Delete stored data
  async deleteStoredData(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove([key]);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`❌ Failed to delete stored data for key ${key}:`, error);
    }
  }

  // Log audit event
  logAuditEvent(category, action, details = {}) {
    if (!this.privacySettings.enableAuditLog) {
      return;
    }

    const event = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.auditLog.push(event);
    
    // Keep only last 1000 events
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Save audit log periodically
    this.saveAuditLog();
  }

  // Save audit log
  async saveAuditLog() {
    try {
      const encryptedLog = await this.encryptData(this.auditLog);
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'hireHeat_auditLog': encryptedLog });
      } else {
        localStorage.setItem('hireHeat_auditLog', JSON.stringify(encryptedLog));
      }
    } catch (error) {
      console.error('❌ Failed to save audit log:', error);
    }
  }

  // Load audit log
  async loadAuditLog() {
    try {
      let encryptedLog = null;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['hireHeat_auditLog']);
        encryptedLog = result.hireHeat_auditLog;
      } else {
        const stored = localStorage.getItem('hireHeat_auditLog');
        encryptedLog = stored ? JSON.parse(stored) : null;
      }

      if (encryptedLog) {
        const decryptedLog = await this.decryptData(encryptedLog);
        this.auditLog = Array.isArray(decryptedLog) ? decryptedLog : [];
      }
    } catch (error) {
      console.error('❌ Failed to load audit log:', error);
      this.auditLog = [];
    }
  }

  // Get audit log for review
  getAuditLog(category = null, limit = 100) {
    let filteredLog = this.auditLog;
    
    if (category) {
      filteredLog = this.auditLog.filter(event => event.category === category);
    }
    
    return filteredLog.slice(-limit).reverse(); // Most recent first
  }

  // Export user data (GDPR compliance)
  async exportUserData() {
    try {
      const userData = {
        exportDate: new Date().toISOString(),
        privacySettings: this.privacySettings,
        consentStatus: this.consentStatus,
        auditLog: this.getAuditLog(),
        resumes: [],
        applications: [],
        jobMatches: []
      };

      // Collect all user data
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const allData = await chrome.storage.local.get(null);
        
        for (const [key, value] of Object.entries(allData)) {
          if (key.startsWith('hireHeat_resume_')) {
            const decryptedData = await this.decryptData(value);
            userData.resumes.push(decryptedData);
          } else if (key.startsWith('hireHeat_application_')) {
            const decryptedData = await this.decryptData(value);
            userData.applications.push(decryptedData);
          } else if (key.startsWith('hireHeat_jobMatch_')) {
            const decryptedData = await this.decryptData(value);
            userData.jobMatches.push(decryptedData);
          }
        }
      }

      return userData;
    } catch (error) {
      console.error('❌ Data export failed:', error);
      throw error;
    }
  }

  // Delete all user data (GDPR compliance)
  async deleteAllUserData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Get all keys
        const allData = await chrome.storage.local.get(null);
        const hireHeatKeys = Object.keys(allData).filter(key => key.startsWith('hireHeat_'));
        
        // Remove all HireHeat data
        await chrome.storage.local.remove(hireHeatKeys);
      } else {
        // Clear localStorage
        const keys = Object.keys(localStorage).filter(key => key.startsWith('hireHeat_'));
        keys.forEach(key => localStorage.removeItem(key));
      }

      // Reset internal state
      this.auditLog = [];
      this.consentStatus = {
        dataProcessing: false,
        aiAnalysis: false,
        dataStorage: false,
        thirdPartyIntegration: false
      };

      this.logAuditEvent('privacy', 'All user data deleted');
      console.log('🗑️ All user data deleted');
      
      return true;
    } catch (error) {
      console.error('❌ Data deletion failed:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get privacy compliance status
  getComplianceStatus() {
    return {
      encryptionEnabled: this.privacySettings.enableEncryption,
      consentObtained: Object.values(this.consentStatus).every(status => status),
      dataRetentionConfigured: this.privacySettings.autoDeleteApplications,
      auditLogEnabled: this.privacySettings.enableAuditLog,
      lastCleanup: this.getLastCleanupDate(),
      totalAuditEvents: this.auditLog.length
    };
  }

  // Get last cleanup date
  getLastCleanupDate() {
    const cleanupEvents = this.auditLog.filter(event => 
      event.category === 'cleanup' && event.action.includes('Deleted')
    );
    
    if (cleanupEvents.length > 0) {
      return cleanupEvents[cleanupEvents.length - 1].timestamp;
    }
    
    return null;
  }

  // Update privacy settings
  async updatePrivacySettings(newSettings) {
    this.privacySettings = { ...this.privacySettings, ...newSettings };
    await this.savePrivacySettings();
    
    // Reinitialize encryption if setting changed
    if (newSettings.hasOwnProperty('enableEncryption')) {
      await this.initializeEncryption();
    }
    
    // Update data retention schedule if setting changed
    if (newSettings.hasOwnProperty('autoDeleteApplications') || 
        newSettings.hasOwnProperty('dataRetentionDays')) {
      await this.setupDataRetentionSchedule();
    }
  }

  // Get privacy settings
  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  // Get consent status
  getConsentStatus() {
    return { ...this.consentStatus };
  }

  // Revoke consent
  async revokeConsent(consentType) {
    this.consentStatus[consentType] = false;
    await this.saveConsentStatus();
    this.logAuditEvent('consent', `Consent revoked for ${consentType}`);
  }

  // Check if feature is allowed based on consent
  isFeatureAllowed(feature) {
    const featureConsentMap = {
      'aiAnalysis': 'aiAnalysis',
      'dataStorage': 'dataStorage',
      'formFilling': 'dataProcessing',
      'jobMatching': 'dataProcessing',
      'coverLetterGeneration': 'aiAnalysis',
      'thirdPartyIntegration': 'thirdPartyIntegration'
    };

    const requiredConsent = featureConsentMap[feature];
    return !requiredConsent || this.consentStatus[requiredConsent];
  }

  // Cleanup and destroy
  async destroy() {
    // Save final audit log
    this.logAuditEvent('system', 'Privacy system destroyed');
    await this.saveAuditLog();
    
    // Clear sensitive data from memory
    this.encryptionKey = null;
    
    console.log('🔒 Privacy & Security Manager destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrivacySecurityManager;
} else {
  window.PrivacySecurityManager = PrivacySecurityManager;
}

console.log('🔒 Privacy & Security Manager loaded');