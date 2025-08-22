// HireHeat Smart Form Filler
// Detects and pre-fills LinkedIn application forms with resume data

class SmartFormFiller {
  constructor(resumeManager, aiService, safetyManager) {
    this.resumeManager = resumeManager;
    this.aiService = aiService;
    this.safetyManager = safetyManager;
    this.fieldMappings = new Map();
    this.customMappings = new Map();
    this.fillHistory = [];
    this.initialize();
  }

  // Initialize form filler with field mappings
  initialize() {
    this.setupFieldMappings();
    this.loadCustomMappings();
    console.log('📝 Smart Form Filler initialized');
  }

  // Setup default field mappings
  setupFieldMappings() {
    // Common LinkedIn form field patterns
    this.fieldMappings.set('firstName', {
      selectors: [
        'input[name*="firstName"]',
        'input[name*="first_name"]',
        'input[placeholder*="First name"]',
        'input[aria-label*="First name"]',
        '#firstName',
        '.first-name input'
      ],
      dataPath: 'personalInfo.firstName',
      validation: 'name'
    });

    this.fieldMappings.set('lastName', {
      selectors: [
        'input[name*="lastName"]',
        'input[name*="last_name"]',
        'input[placeholder*="Last name"]',
        'input[aria-label*="Last name"]',
        '#lastName',
        '.last-name input'
      ],
      dataPath: 'personalInfo.lastName',
      validation: 'name'
    });

    this.fieldMappings.set('email', {
      selectors: [
        'input[type="email"]',
        'input[name*="email"]',
        'input[placeholder*="email"]',
        'input[aria-label*="email"]',
        '#email'
      ],
      dataPath: 'personalInfo.email',
      validation: 'email'
    });

    this.fieldMappings.set('phone', {
      selectors: [
        'input[type="tel"]',
        'input[name*="phone"]',
        'input[name*="mobile"]',
        'input[placeholder*="phone"]',
        'input[aria-label*="phone"]',
        '#phone'
      ],
      dataPath: 'personalInfo.phone',
      validation: 'phone'
    });

    this.fieldMappings.set('location', {
      selectors: [
        'input[name*="location"]',
        'input[name*="city"]',
        'input[name*="address"]',
        'input[placeholder*="location"]',
        'input[aria-label*="location"]',
        '#location'
      ],
      dataPath: 'personalInfo.location',
      validation: 'location'
    });

    this.fieldMappings.set('linkedin', {
      selectors: [
        'input[name*="linkedin"]',
        'input[name*="profile"]',
        'input[placeholder*="LinkedIn"]',
        'input[aria-label*="LinkedIn"]'
      ],
      dataPath: 'personalInfo.linkedin',
      validation: 'url'
    });

    this.fieldMappings.set('website', {
      selectors: [
        'input[name*="website"]',
        'input[name*="portfolio"]',
        'input[placeholder*="website"]',
        'input[aria-label*="website"]'
      ],
      dataPath: 'personalInfo.website',
      validation: 'url'
    });

    this.fieldMappings.set('coverLetter', {
      selectors: [
        'textarea[name*="cover"]',
        'textarea[name*="letter"]',
        'textarea[placeholder*="cover letter"]',
        'textarea[aria-label*="cover letter"]',
        '.cover-letter textarea',
        '#coverLetter'
      ],
      dataPath: 'generated.coverLetter',
      validation: 'text',
      aiGenerated: true
    });

    this.fieldMappings.set('experience', {
      selectors: [
        'input[name*="experience"]',
        'select[name*="experience"]',
        'input[placeholder*="years of experience"]',
        'input[aria-label*="experience"]'
      ],
      dataPath: 'experience.totalYears',
      validation: 'number'
    });

    this.fieldMappings.set('salary', {
      selectors: [
        'input[name*="salary"]',
        'input[name*="compensation"]',
        'input[placeholder*="salary"]',
        'input[aria-label*="salary"]'
      ],
      dataPath: 'preferences.salaryExpectation',
      validation: 'currency'
    });

    this.fieldMappings.set('availability', {
      selectors: [
        'input[name*="availability"]',
        'input[name*="start"]',
        'input[placeholder*="available"]',
        'input[aria-label*="availability"]'
      ],
      dataPath: 'preferences.availability',
      validation: 'date'
    });
  }

  // Detect and analyze form fields on current page
  async detectFormFields() {
    try {
      const detectedFields = [];
      const allInputs = document.querySelectorAll('input, textarea, select');
      
      for (const input of allInputs) {
        const fieldInfo = this.analyzeField(input);
        if (fieldInfo) {
          detectedFields.push(fieldInfo);
        }
      }

      console.log(`🔍 Detected ${detectedFields.length} form fields`);
      return detectedFields;
    } catch (error) {
      console.error('❌ Field detection failed:', error);
      return [];
    }
  }

  // Analyze individual form field
  analyzeField(element) {
    try {
      const fieldInfo = {
        element: element,
        type: element.type || element.tagName.toLowerCase(),
        name: element.name || '',
        id: element.id || '',
        placeholder: element.placeholder || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        className: element.className || '',
        required: element.required,
        value: element.value || '',
        detectedType: null,
        confidence: 0
      };

      // Skip hidden or disabled fields
      if (element.type === 'hidden' || element.disabled || element.style.display === 'none') {
        return null;
      }

      // Detect field type using mappings
      for (const [fieldType, mapping] of this.fieldMappings) {
        for (const selector of mapping.selectors) {
          if (element.matches(selector)) {
            fieldInfo.detectedType = fieldType;
            fieldInfo.confidence = 0.9;
            fieldInfo.mapping = mapping;
            break;
          }
        }
        if (fieldInfo.detectedType) break;
      }

      // Use AI for uncertain fields
      if (!fieldInfo.detectedType || fieldInfo.confidence < 0.7) {
        const aiDetection = this.detectFieldTypeWithAI(fieldInfo);
        if (aiDetection.confidence > fieldInfo.confidence) {
          fieldInfo.detectedType = aiDetection.type;
          fieldInfo.confidence = aiDetection.confidence;
        }
      }

      return fieldInfo.detectedType ? fieldInfo : null;
    } catch (error) {
      console.error('Field analysis failed:', error);
      return null;
    }
  }

  // Use AI to detect field type for uncertain cases
  detectFieldTypeWithAI(fieldInfo) {
    const context = {
      name: fieldInfo.name,
      placeholder: fieldInfo.placeholder,
      ariaLabel: fieldInfo.ariaLabel,
      type: fieldInfo.type,
      className: fieldInfo.className
    };

    // Simple heuristic-based detection (can be enhanced with actual AI)
    const text = (context.name + ' ' + context.placeholder + ' ' + context.ariaLabel).toLowerCase();
    
    if (text.includes('first') && text.includes('name')) {
      return { type: 'firstName', confidence: 0.8 };
    }
    if (text.includes('last') && text.includes('name')) {
      return { type: 'lastName', confidence: 0.8 };
    }
    if (text.includes('email')) {
      return { type: 'email', confidence: 0.8 };
    }
    if (text.includes('phone') || text.includes('mobile')) {
      return { type: 'phone', confidence: 0.8 };
    }
    if (text.includes('location') || text.includes('city') || text.includes('address')) {
      return { type: 'location', confidence: 0.8 };
    }
    if (text.includes('cover') && text.includes('letter')) {
      return { type: 'coverLetter', confidence: 0.8 };
    }
    if (text.includes('experience') && text.includes('year')) {
      return { type: 'experience', confidence: 0.7 };
    }
    if (text.includes('salary') || text.includes('compensation')) {
      return { type: 'salary', confidence: 0.7 };
    }

    return { type: null, confidence: 0 };
  }

  // Fill form with resume data
  async fillForm(jobData = null, options = {}) {
    try {
      // Check safety permissions
      const safetyCheck = await this.safetyManager.canPerformAction('fillForm', jobData);
      if (!safetyCheck.allowed) {
        console.warn('🚫 Form filling blocked:', safetyCheck.reason);
        return { success: false, reason: safetyCheck.reason };
      }

      // Get active resume
      const resume = await this.resumeManager.getActiveResume();
      if (!resume) {
        return { success: false, reason: 'No active resume found' };
      }

      // Detect form fields
      const fields = await this.detectFormFields();
      if (fields.length === 0) {
        return { success: false, reason: 'No fillable fields detected' };
      }

      const fillResults = [];
      let filledCount = 0;

      // Fill each detected field
      for (const field of fields) {
        try {
          const fillResult = await this.fillField(field, resume, jobData, options);
          fillResults.push(fillResult);
          
          if (fillResult.success) {
            filledCount++;
          }

          // Add delay between fills for safety
          if (options.addDelay !== false) {
            await this.delay(500 + Math.random() * 1000);
          }
        } catch (error) {
          console.error(`Failed to fill field ${field.detectedType}:`, error);
          fillResults.push({
            field: field.detectedType,
            success: false,
            error: error.message
          });
        }
      }

      // Log the action
      await this.safetyManager.logAction('fillForm', jobData, 'success', {
        fieldsDetected: fields.length,
        fieldsFilled: filledCount,
        fillResults: fillResults
      });

      console.log(`✅ Form filling completed: ${filledCount}/${fields.length} fields filled`);
      
      return {
        success: true,
        fieldsDetected: fields.length,
        fieldsFilled: filledCount,
        results: fillResults
      };
    } catch (error) {
      console.error('❌ Form filling failed:', error);
      await this.safetyManager.logAction('fillForm', jobData, 'failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Fill individual field
  async fillField(fieldInfo, resume, jobData, options) {
    try {
      const { element, detectedType, mapping } = fieldInfo;
      
      // Get value for this field
      let value = await this.getFieldValue(detectedType, resume, jobData, options);
      
      if (value === null || value === undefined) {
        return {
          field: detectedType,
          success: false,
          reason: 'No value available'
        };
      }

      // Validate value
      if (mapping && mapping.validation) {
        const validationResult = this.validateValue(value, mapping.validation);
        if (!validationResult.valid) {
          return {
            field: detectedType,
            success: false,
            reason: `Validation failed: ${validationResult.reason}`
          };
        }
        value = validationResult.value; // Use cleaned value
      }

      // Fill the field
      const fillSuccess = await this.setFieldValue(element, value, options);
      
      return {
        field: detectedType,
        success: fillSuccess,
        value: value,
        element: element.tagName + (element.name ? `[name="${element.name}"]` : '')
      };
    } catch (error) {
      return {
        field: fieldInfo.detectedType,
        success: false,
        error: error.message
      };
    }
  }

  // Get value for specific field type
  async getFieldValue(fieldType, resume, jobData, options) {
    try {
      const mapping = this.fieldMappings.get(fieldType);
      if (!mapping) return null;

      // Check for custom mapping first
      if (this.customMappings.has(fieldType)) {
        const customValue = this.customMappings.get(fieldType);
        if (typeof customValue === 'function') {
          return await customValue(resume, jobData);
        }
        return customValue;
      }

      // Handle AI-generated content
      if (mapping.aiGenerated && fieldType === 'coverLetter') {
        if (jobData && this.aiService) {
          const coverLetter = await this.aiService.generateCoverLetter(resume, jobData);
          return coverLetter.content;
        }
        return resume.templates?.coverLetter || '';
      }

      // Get value from resume using data path
      return this.getNestedValue(resume, mapping.dataPath);
    } catch (error) {
      console.error(`Failed to get value for ${fieldType}:`, error);
      return null;
    }
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Validate field value
  validateValue(value, validationType) {
    try {
      switch (validationType) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return { valid: false, reason: 'Invalid email format' };
          }
          break;

        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
          const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            return { valid: false, reason: 'Invalid phone format' };
          }
          value = cleanPhone;
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            if (!value.startsWith('http')) {
              value = 'https://' + value;
            }
            try {
              new URL(value);
            } catch {
              return { valid: false, reason: 'Invalid URL format' };
            }
          }
          break;

        case 'name':
          if (value.length < 1 || value.length > 50) {
            return { valid: false, reason: 'Name length invalid' };
          }
          value = value.trim();
          break;

        case 'number':
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) {
            return { valid: false, reason: 'Invalid number' };
          }
          value = num.toString();
          break;

        case 'currency':
          const currencyRegex = /^\$?[\d,]+(\.\d{2})?$/;
          if (!currencyRegex.test(value.toString())) {
            return { valid: false, reason: 'Invalid currency format' };
          }
          break;

        case 'date':
          if (value && !Date.parse(value)) {
            return { valid: false, reason: 'Invalid date format' };
          }
          break;
      }

      return { valid: true, value: value };
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error.message };
    }
  }

  // Set value in form field
  async setFieldValue(element, value, options = {}) {
    try {
      // Focus the element first
      element.focus();
      
      // Clear existing value
      if (element.value) {
        element.select();
        document.execCommand('delete');
      }

      // Set the value based on element type
      if (element.tagName.toLowerCase() === 'select') {
        // Handle select elements
        const option = Array.from(element.options).find(opt => 
          opt.value === value || opt.text.toLowerCase().includes(value.toLowerCase())
        );
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      } else {
        // Handle input and textarea elements
        if (options.simulateTyping) {
          // Simulate human typing
          await this.simulateTyping(element, value);
        } else {
          // Direct value assignment
          element.value = value;
        }

        // Trigger events to ensure form validation
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        
        return true;
      }
    } catch (error) {
      console.error('Failed to set field value:', error);
      return false;
    }
  }

  // Simulate human typing
  async simulateTyping(element, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      element.value += char;
      
      // Dispatch input event for each character
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Random delay between keystrokes
      await this.delay(50 + Math.random() * 100);
    }
  }

  // Add custom field mapping
  addCustomMapping(fieldType, valueOrFunction) {
    this.customMappings.set(fieldType, valueOrFunction);
    console.log(`📝 Custom mapping added for ${fieldType}`);
  }

  // Remove custom field mapping
  removeCustomMapping(fieldType) {
    this.customMappings.delete(fieldType);
    console.log(`🗑️ Custom mapping removed for ${fieldType}`);
  }

  // Load custom mappings from storage
  async loadCustomMappings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hireHeat_customMappings'], (result) => {
        if (result.hireHeat_customMappings) {
          const mappings = result.hireHeat_customMappings;
          for (const [key, value] of Object.entries(mappings)) {
            this.customMappings.set(key, value);
          }
        }
        resolve();
      });
    });
  }

  // Save custom mappings to storage
  async saveCustomMappings() {
    const mappingsObj = Object.fromEntries(this.customMappings);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'hireHeat_customMappings': mappingsObj }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Preview form filling (without actually filling)
  async previewFormFill(jobData = null) {
    try {
      const resume = await this.resumeManager.getActiveResume();
      if (!resume) {
        return { success: false, reason: 'No active resume found' };
      }

      const fields = await this.detectFormFields();
      const preview = [];

      for (const field of fields) {
        const value = await this.getFieldValue(field.detectedType, resume, jobData);
        preview.push({
          fieldType: field.detectedType,
          element: field.element.tagName + (field.element.name ? `[name="${field.element.name}"]` : ''),
          currentValue: field.element.value,
          proposedValue: value,
          confidence: field.confidence
        });
      }

      return {
        success: true,
        preview: preview,
        totalFields: fields.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get form filling statistics
  getStats() {
    const recentFills = this.fillHistory.filter(fill => 
      Date.now() - new Date(fill.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalFills: this.fillHistory.length,
      todayFills: recentFills.length,
      successRate: this.calculateSuccessRate(this.fillHistory),
      averageFieldsPerForm: this.calculateAverageFields(this.fillHistory),
      customMappings: this.customMappings.size
    };
  }

  // Calculate success rate
  calculateSuccessRate(history) {
    if (history.length === 0) return 0;
    const successful = history.filter(fill => fill.success).length;
    return Math.round((successful / history.length) * 100);
  }

  // Calculate average fields per form
  calculateAverageFields(history) {
    if (history.length === 0) return 0;
    const totalFields = history.reduce((sum, fill) => sum + (fill.fieldsFilled || 0), 0);
    return Math.round(totalFields / history.length);
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear all form filler data
  async clearAllData() {
    this.fillHistory = [];
    this.customMappings.clear();
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(['hireHeat_customMappings'], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('🗑️ Form filler data cleared');
          resolve();
        }
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartFormFiller;
} else {
  window.SmartFormFiller = SmartFormFiller;
}

console.log('📝 Smart Form Filler loaded');