// HireHeat Resume Management System
// Secure storage and management of resume data with multiple template support

class ResumeManager {
  constructor() {
    this.storageKey = 'hireHeat_resumes';
    this.activeResumeKey = 'hireHeat_activeResume';
    this.encryptionKey = null;
    this.templates = new Map();
    this.initializeTemplates();
  }

  // Initialize with encryption key for secure storage
  async initialize() {
    try {
      // Generate or retrieve encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();
      console.log('🔐 Resume manager initialized with encryption');
      return true;
    } catch (error) {
      console.error('❌ Resume manager initialization failed:', error);
      return false;
    }
  }

  // Get or create encryption key for secure storage
  async getOrCreateEncryptionKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hireHeat_encryptionKey'], (result) => {
        if (result.hireHeat_encryptionKey) {
          resolve(result.hireHeat_encryptionKey);
        } else {
          // Generate new encryption key
          const key = this.generateEncryptionKey();
          chrome.storage.local.set({ hireHeat_encryptionKey: key }, () => {
            resolve(key);
          });
        }
      });
    });
  }

  // Generate secure encryption key
  generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Initialize resume templates
  initializeTemplates() {
    // Software Engineer Template
    this.templates.set('software_engineer', {
      name: 'Software Engineer',
      fields: {
        personal: ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'],
        summary: ['professionalSummary'],
        technical: ['programmingLanguages', 'frameworks', 'databases', 'tools', 'cloudPlatforms'],
        experience: ['workExperience'],
        projects: ['technicalProjects'],
        education: ['degrees', 'certifications'],
        additional: ['achievements', 'publications', 'languages']
      },
      requiredFields: ['name', 'email', 'programmingLanguages', 'workExperience']
    });

    // Marketing Professional Template
    this.templates.set('marketing', {
      name: 'Marketing Professional',
      fields: {
        personal: ['name', 'email', 'phone', 'location', 'linkedin'],
        summary: ['professionalSummary'],
        skills: ['marketingSkills', 'analyticsTools', 'designTools', 'socialMediaPlatforms'],
        experience: ['workExperience'],
        campaigns: ['marketingCampaigns'],
        education: ['degrees', 'certifications'],
        additional: ['achievements', 'languages', 'awards']
      },
      requiredFields: ['name', 'email', 'marketingSkills', 'workExperience']
    });

    // General Professional Template
    this.templates.set('general', {
      name: 'General Professional',
      fields: {
        personal: ['name', 'email', 'phone', 'location', 'linkedin'],
        summary: ['professionalSummary'],
        skills: ['coreSkills', 'technicalSkills', 'softSkills'],
        experience: ['workExperience'],
        education: ['degrees', 'certifications'],
        additional: ['achievements', 'languages', 'volunteer', 'interests']
      },
      requiredFields: ['name', 'email', 'coreSkills', 'workExperience']
    });
  }

  // Create new resume
  async createResume(templateType, resumeData) {
    try {
      const template = this.templates.get(templateType);
      if (!template) {
        throw new Error(`Template '${templateType}' not found`);
      }

      // Validate required fields
      const missingFields = this.validateRequiredFields(resumeData, template);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const resume = {
        id: this.generateResumeId(),
        name: resumeData.name || 'Untitled Resume',
        template: templateType,
        data: this.sanitizeResumeData(resumeData),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };

      await this.saveResume(resume);
      console.log('✅ Resume created successfully:', resume.id);
      return resume;
    } catch (error) {
      console.error('❌ Resume creation failed:', error);
      throw error;
    }
  }

  // Update existing resume
  async updateResume(resumeId, updates) {
    try {
      const resume = await this.getResume(resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      const template = this.templates.get(resume.template);
      const updatedData = { ...resume.data, ...this.sanitizeResumeData(updates) };
      
      // Validate required fields
      const missingFields = this.validateRequiredFields(updatedData, template);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const updatedResume = {
        ...resume,
        data: updatedData,
        updatedAt: new Date().toISOString(),
        version: this.incrementVersion(resume.version)
      };

      await this.saveResume(updatedResume);
      console.log('✅ Resume updated successfully:', resumeId);
      return updatedResume;
    } catch (error) {
      console.error('❌ Resume update failed:', error);
      throw error;
    }
  }

  // Get resume by ID
  async getResume(resumeId) {
    try {
      const resumes = await this.getAllResumes();
      return resumes.find(resume => resume.id === resumeId) || null;
    } catch (error) {
      console.error('❌ Failed to get resume:', error);
      return null;
    }
  }

  // Get all resumes
  async getAllResumes() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        const encryptedData = result[this.storageKey] || [];
        try {
          const decryptedData = this.decryptData(encryptedData);
          resolve(JSON.parse(decryptedData) || []);
        } catch (error) {
          console.error('❌ Failed to decrypt resume data:', error);
          resolve([]);
        }
      });
    });
  }

  // Save resume to encrypted storage
  async saveResume(resume) {
    try {
      const resumes = await this.getAllResumes();
      const existingIndex = resumes.findIndex(r => r.id === resume.id);
      
      if (existingIndex >= 0) {
        resumes[existingIndex] = resume;
      } else {
        resumes.push(resume);
      }

      const encryptedData = this.encryptData(JSON.stringify(resumes));
      
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [this.storageKey]: encryptedData }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to save resume:', error);
      throw error;
    }
  }

  // Delete resume
  async deleteResume(resumeId) {
    try {
      const resumes = await this.getAllResumes();
      const filteredResumes = resumes.filter(resume => resume.id !== resumeId);
      
      const encryptedData = this.encryptData(JSON.stringify(filteredResumes));
      
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [this.storageKey]: encryptedData }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log('✅ Resume deleted successfully:', resumeId);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to delete resume:', error);
      throw error;
    }
  }

  // Set active resume
  async setActiveResume(resumeId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.activeResumeKey]: resumeId }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('✅ Active resume set:', resumeId);
          resolve();
        }
      });
    });
  }

  // Get active resume
  async getActiveResume() {
    return new Promise(async (resolve) => {
      chrome.storage.local.get([this.activeResumeKey], async (result) => {
        const activeResumeId = result[this.activeResumeKey];
        if (activeResumeId) {
          const resume = await this.getResume(activeResumeId);
          resolve(resume);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Validate required fields
  validateRequiredFields(data, template) {
    const missingFields = [];
    
    template.requiredFields.forEach(field => {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        missingFields.push(field);
      }
    });
    
    return missingFields;
  }

  // Sanitize resume data to prevent XSS and ensure data integrity
  sanitizeResumeData(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Basic HTML sanitization
        sanitized[key] = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? item.replace(/<[^>]*>/g, '').trim() : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeResumeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Generate unique resume ID
  generateResumeId() {
    return 'resume_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Increment version number
  incrementVersion(version) {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || 0) + 1;
    return `${parts[0]}.${minor}`;
  }

  // Simple encryption for local storage
  encryptData(data) {
    if (!this.encryptionKey) return data;
    
    // Simple XOR encryption (for demo purposes - use proper encryption in production)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = this.encryptionKey[i % this.encryptionKey.length];
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ keyChar.charCodeAt(0));
    }
    return btoa(encrypted);
  }

  // Simple decryption for local storage
  decryptData(encryptedData) {
    if (!this.encryptionKey || !encryptedData) return encryptedData;
    
    try {
      const encrypted = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = this.encryptionKey[i % this.encryptionKey.length];
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0));
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  // Export resume data (for backup/transfer)
  async exportResume(resumeId) {
    try {
      const resume = await this.getResume(resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }
      
      // Remove sensitive internal data
      const exportData = {
        name: resume.name,
        template: resume.template,
        data: resume.data,
        createdAt: resume.createdAt,
        version: resume.version
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Resume export failed:', error);
      throw error;
    }
  }

  // Import resume data
  async importResume(resumeJson) {
    try {
      const resumeData = JSON.parse(resumeJson);
      
      // Validate imported data
      if (!resumeData.template || !this.templates.has(resumeData.template)) {
        throw new Error('Invalid or unsupported resume template');
      }
      
      // Create new resume with imported data
      const newResume = await this.createResume(resumeData.template, resumeData.data);
      newResume.name = resumeData.name || 'Imported Resume';
      
      await this.saveResume(newResume);
      console.log('✅ Resume imported successfully:', newResume.id);
      return newResume;
    } catch (error) {
      console.error('❌ Resume import failed:', error);
      throw error;
    }
  }

  // Get available templates
  getTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      id: key,
      name: template.name,
      fields: template.fields,
      requiredFields: template.requiredFields
    }));
  }

  // Clear all resume data (for privacy/security)
  async clearAllData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey, this.activeResumeKey, 'hireHeat_encryptionKey'], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('🗑️ All resume data cleared');
          resolve();
        }
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResumeManager;
} else {
  window.ResumeManager = ResumeManager;
}

console.log('📄 Resume Manager loaded');