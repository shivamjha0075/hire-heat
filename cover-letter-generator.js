// HireHeat AI-Powered Cover Letter Generator
// Generates personalized cover letters based on job descriptions and resume data

class CoverLetterGenerator {
  constructor(aiService, resumeManager) {
    this.aiService = aiService;
    this.resumeManager = resumeManager;
    this.templates = new Map();
    this.generatedLetters = new Map();
    this.customPrompts = new Map();
    this.initialize();
  }

  // Initialize cover letter generator
  async initialize() {
    try {
      await this.loadTemplates();
      await this.loadCustomPrompts();
      console.log('📄 Cover Letter Generator initialized');
      return true;
    } catch (error) {
      console.error('❌ Cover Letter Generator initialization failed:', error);
      return false;
    }
  }

  // Load cover letter templates
  async loadTemplates() {
    // Default templates for different job types and industries
    this.templates.set('professional', {
      name: 'Professional',
      description: 'Standard professional cover letter template',
      structure: {
        opening: 'formal_greeting',
        introduction: 'position_interest',
        body: ['experience_highlight', 'skills_match', 'company_research'],
        closing: 'call_to_action',
        signature: 'professional_closing'
      },
      tone: 'professional',
      length: 'medium'
    });

    this.templates.set('creative', {
      name: 'Creative',
      description: 'Creative and engaging cover letter template',
      structure: {
        opening: 'engaging_hook',
        introduction: 'story_based',
        body: ['creative_experience', 'portfolio_highlight', 'passion_statement'],
        closing: 'enthusiastic_close',
        signature: 'creative_closing'
      },
      tone: 'creative',
      length: 'medium'
    });

    this.templates.set('technical', {
      name: 'Technical',
      description: 'Technical role focused cover letter template',
      structure: {
        opening: 'direct_approach',
        introduction: 'technical_background',
        body: ['technical_skills', 'project_examples', 'problem_solving'],
        closing: 'technical_interest',
        signature: 'professional_closing'
      },
      tone: 'technical',
      length: 'detailed'
    });

    this.templates.set('executive', {
      name: 'Executive',
      description: 'Executive and leadership position template',
      structure: {
        opening: 'executive_greeting',
        introduction: 'leadership_vision',
        body: ['strategic_experience', 'achievements', 'industry_impact'],
        closing: 'strategic_alignment',
        signature: 'executive_closing'
      },
      tone: 'executive',
      length: 'comprehensive'
    });

    this.templates.set('entry_level', {
      name: 'Entry Level',
      description: 'Template for new graduates and entry-level positions',
      structure: {
        opening: 'enthusiastic_greeting',
        introduction: 'education_focus',
        body: ['academic_achievements', 'relevant_projects', 'learning_eagerness'],
        closing: 'growth_mindset',
        signature: 'professional_closing'
      },
      tone: 'enthusiastic',
      length: 'concise'
    });

    console.log(`📄 Loaded ${this.templates.size} cover letter templates`);
  }

  // Load custom prompts from storage
  async loadCustomPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['hireHeat_customPrompts'], (result) => {
        if (result.hireHeat_customPrompts) {
          const prompts = result.hireHeat_customPrompts;
          for (const [key, value] of Object.entries(prompts)) {
            this.customPrompts.set(key, value);
          }
        }
        resolve();
      });
    });
  }

  // Generate cover letter for specific job
  async generateCoverLetter(jobData, options = {}) {
    try {
      // Get active resume
      const resume = await this.resumeManager.getActiveResume();
      if (!resume) {
        throw new Error('No active resume found');
      }

      // Determine best template
      const template = this.selectBestTemplate(jobData, resume, options.templateType);
      
      // Generate cover letter content
      const coverLetter = await this.generateContent(jobData, resume, template, options);
      
      // Cache the generated letter
      const letterId = this.generateLetterId(jobData);
      this.generatedLetters.set(letterId, {
        ...coverLetter,
        jobData: jobData,
        resume: resume,
        template: template,
        generatedAt: new Date().toISOString()
      });

      console.log(`📄 Cover letter generated for ${jobData.company} - ${jobData.title}`);
      return {
        success: true,
        letterId: letterId,
        ...coverLetter
      };
    } catch (error) {
      console.error('❌ Cover letter generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Select best template based on job and resume
  selectBestTemplate(jobData, resume, preferredType = null) {
    if (preferredType && this.templates.has(preferredType)) {
      return this.templates.get(preferredType);
    }

    const jobTitle = (jobData.title || '').toLowerCase();
    const jobDescription = (jobData.description || '').toLowerCase();
    const industry = (jobData.industry || '').toLowerCase();
    const experienceLevel = this.calculateExperienceLevel(resume);

    // Rule-based template selection
    if (experienceLevel === 'entry') {
      return this.templates.get('entry_level');
    }

    if (jobTitle.includes('ceo') || jobTitle.includes('cto') || jobTitle.includes('director') || 
        jobTitle.includes('vp') || jobTitle.includes('head of')) {
      return this.templates.get('executive');
    }

    if (jobTitle.includes('engineer') || jobTitle.includes('developer') || 
        jobTitle.includes('architect') || jobDescription.includes('technical')) {
      return this.templates.get('technical');
    }

    if (industry.includes('creative') || industry.includes('design') || 
        industry.includes('marketing') || jobTitle.includes('creative')) {
      return this.templates.get('creative');
    }

    // Default to professional template
    return this.templates.get('professional');
  }

  // Calculate experience level from resume
  calculateExperienceLevel(resume) {
    const totalYears = resume.experience?.totalYears || 0;
    const workExperience = resume.experience?.work || [];
    
    if (totalYears <= 2 || workExperience.length <= 1) {
      return 'entry';
    } else if (totalYears <= 5) {
      return 'mid';
    } else if (totalYears <= 10) {
      return 'senior';
    } else {
      return 'executive';
    }
  }

  // Generate cover letter content using AI
  async generateContent(jobData, resume, template, options = {}) {
    try {
      // Prepare context for AI generation
      const context = this.prepareGenerationContext(jobData, resume, template, options);
      
      // Generate using AI service
      const aiResponse = await this.aiService.generateCoverLetter(context);
      
      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI generation failed');
      }

      // Post-process the generated content
      const processedContent = this.postProcessContent(aiResponse.content, context);
      
      return {
        content: processedContent.fullText,
        sections: processedContent.sections,
        wordCount: processedContent.wordCount,
        template: template.name,
        tone: template.tone,
        customizations: context.customizations,
        metadata: {
          generatedAt: new Date().toISOString(),
          jobId: jobData.id || jobData.jobId,
          resumeId: resume.id,
          templateUsed: template.name
        }
      };
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }

  // Prepare context for AI generation
  prepareGenerationContext(jobData, resume, template, options) {
    const context = {
      // Job information
      job: {
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        requirements: jobData.requirements || [],
        location: jobData.location,
        industry: jobData.industry,
        salary: jobData.salary
      },
      
      // Resume information
      candidate: {
        name: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
        email: resume.personalInfo.email,
        phone: resume.personalInfo.phone,
        location: resume.personalInfo.location,
        summary: resume.summary,
        experience: resume.experience,
        skills: resume.skills,
        education: resume.education,
        achievements: resume.achievements || []
      },
      
      // Template and style preferences
      template: template,
      tone: options.tone || template.tone,
      length: options.length || template.length,
      
      // Customizations
      customizations: {
        emphasizeSkills: options.emphasizeSkills || [],
        mentionProjects: options.mentionProjects || [],
        companyResearch: options.companyResearch || '',
        personalTouch: options.personalTouch || '',
        callToAction: options.callToAction || 'standard'
      },
      
      // Generation parameters
      parameters: {
        maxWords: this.getMaxWords(template.length),
        includeMetrics: options.includeMetrics !== false,
        includePersonality: options.includePersonality !== false,
        formalityLevel: options.formalityLevel || 'professional'
      }
    };

    return context;
  }

  // Get maximum words based on length preference
  getMaxWords(lengthType) {
    const wordLimits = {
      'concise': 200,
      'medium': 300,
      'detailed': 400,
      'comprehensive': 500
    };
    return wordLimits[lengthType] || 300;
  }

  // Post-process generated content
  postProcessContent(content, context) {
    try {
      // Split content into sections
      const sections = this.extractSections(content);
      
      // Clean and format text
      const cleanedContent = this.cleanContent(content);
      
      // Count words
      const wordCount = this.countWords(cleanedContent);
      
      // Apply final formatting
      const formattedContent = this.applyFormatting(cleanedContent, context);
      
      return {
        fullText: formattedContent,
        sections: sections,
        wordCount: wordCount
      };
    } catch (error) {
      console.error('Post-processing failed:', error);
      return {
        fullText: content,
        sections: { full: content },
        wordCount: this.countWords(content)
      };
    }
  }

  // Extract sections from content
  extractSections(content) {
    const sections = {};
    
    // Try to identify common sections
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentSection = 'opening';
    let sectionContent = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect section breaks
      if (this.isSectionBreak(trimmedLine)) {
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n');
          sectionContent = [];
        }
        currentSection = this.identifySection(trimmedLine);
      } else {
        sectionContent.push(line);
      }
    }
    
    // Add final section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n');
    }
    
    return sections;
  }

  // Check if line is a section break
  isSectionBreak(line) {
    const sectionIndicators = [
      'dear', 'sincerely', 'best regards', 'yours truly',
      'paragraph', 'section', 'introduction', 'conclusion'
    ];
    
    return sectionIndicators.some(indicator => 
      line.toLowerCase().includes(indicator)
    );
  }

  // Identify section type
  identifySection(line) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('dear')) return 'greeting';
    if (lowerLine.includes('sincerely') || lowerLine.includes('regards')) return 'closing';
    if (lowerLine.includes('introduction')) return 'introduction';
    if (lowerLine.includes('conclusion')) return 'conclusion';
    
    return 'body';
  }

  // Clean content
  cleanContent(content) {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
      .trim();
  }

  // Count words in text
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Apply final formatting
  applyFormatting(content, context) {
    let formatted = content;
    
    // Ensure proper greeting
    if (!formatted.startsWith('Dear')) {
      const hiringManager = context.job.hiringManager || 'Hiring Manager';
      formatted = `Dear ${hiringManager},\n\n${formatted}`;
    }
    
    // Ensure proper closing
    if (!formatted.includes('Sincerely') && !formatted.includes('Best regards')) {
      formatted += `\n\nSincerely,\n${context.candidate.name}`;
    }
    
    return formatted;
  }

  // Customize existing cover letter
  async customizeCoverLetter(letterId, customizations) {
    try {
      const existingLetter = this.generatedLetters.get(letterId);
      if (!existingLetter) {
        throw new Error('Cover letter not found');
      }

      // Apply customizations
      const customizedContent = await this.applyCustomizations(
        existingLetter.content,
        customizations,
        existingLetter
      );

      // Update cached letter
      const updatedLetter = {
        ...existingLetter,
        content: customizedContent.content,
        customizations: { ...existingLetter.customizations, ...customizations },
        lastModified: new Date().toISOString()
      };
      
      this.generatedLetters.set(letterId, updatedLetter);
      
      return {
        success: true,
        content: customizedContent.content,
        changes: customizedContent.changes
      };
    } catch (error) {
      console.error('Customization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Apply customizations to content
  async applyCustomizations(content, customizations, letterData) {
    let modifiedContent = content;
    const changes = [];
    
    // Apply tone adjustments
    if (customizations.tone && customizations.tone !== letterData.template.tone) {
      const toneAdjusted = await this.adjustTone(modifiedContent, customizations.tone);
      if (toneAdjusted.success) {
        modifiedContent = toneAdjusted.content;
        changes.push(`Tone adjusted to ${customizations.tone}`);
      }
    }
    
    // Apply length adjustments
    if (customizations.length && customizations.length !== letterData.template.length) {
      const lengthAdjusted = await this.adjustLength(modifiedContent, customizations.length);
      if (lengthAdjusted.success) {
        modifiedContent = lengthAdjusted.content;
        changes.push(`Length adjusted to ${customizations.length}`);
      }
    }
    
    // Add specific skills emphasis
    if (customizations.emphasizeSkills && customizations.emphasizeSkills.length > 0) {
      modifiedContent = this.emphasizeSkills(modifiedContent, customizations.emphasizeSkills);
      changes.push(`Emphasized skills: ${customizations.emphasizeSkills.join(', ')}`);
    }
    
    // Add company research
    if (customizations.companyResearch) {
      modifiedContent = this.addCompanyResearch(modifiedContent, customizations.companyResearch);
      changes.push('Added company research');
    }
    
    // Add personal touch
    if (customizations.personalTouch) {
      modifiedContent = this.addPersonalTouch(modifiedContent, customizations.personalTouch);
      changes.push('Added personal touch');
    }
    
    return {
      content: modifiedContent,
      changes: changes
    };
  }

  // Adjust tone of content
  async adjustTone(content, newTone) {
    try {
      const prompt = `Please adjust the tone of this cover letter to be more ${newTone}:\n\n${content}`;
      const response = await this.aiService.makeAPICall(prompt, { maxTokens: 500 });
      
      return {
        success: true,
        content: response.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Adjust length of content
  async adjustLength(content, newLength) {
    try {
      const lengthInstructions = {
        'concise': 'make it more concise and under 200 words',
        'medium': 'adjust to medium length around 300 words',
        'detailed': 'expand with more details around 400 words',
        'comprehensive': 'make it comprehensive around 500 words'
      };
      
      const instruction = lengthInstructions[newLength] || 'adjust the length appropriately';
      const prompt = `Please ${instruction} for this cover letter:\n\n${content}`;
      
      const response = await this.aiService.makeAPICall(prompt, { maxTokens: 600 });
      
      return {
        success: true,
        content: response.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Emphasize specific skills in content
  emphasizeSkills(content, skills) {
    let modified = content;
    
    // Find a good place to insert skill emphasis
    const skillsText = `My expertise in ${skills.join(', ')} makes me particularly well-suited for this role.`;
    
    // Try to insert after first paragraph
    const paragraphs = modified.split('\n\n');
    if (paragraphs.length > 1) {
      paragraphs.splice(2, 0, skillsText);
      modified = paragraphs.join('\n\n');
    } else {
      modified += `\n\n${skillsText}`;
    }
    
    return modified;
  }

  // Add company research to content
  addCompanyResearch(content, research) {
    const researchText = `I'm particularly drawn to ${research}`;
    
    // Insert research in the middle of the letter
    const paragraphs = content.split('\n\n');
    const insertIndex = Math.floor(paragraphs.length / 2);
    paragraphs.splice(insertIndex, 0, researchText);
    
    return paragraphs.join('\n\n');
  }

  // Add personal touch to content
  addPersonalTouch(content, personalTouch) {
    // Add personal touch near the end
    const paragraphs = content.split('\n\n');
    const insertIndex = paragraphs.length - 1;
    paragraphs.splice(insertIndex, 0, personalTouch);
    
    return paragraphs.join('\n\n');
  }

  // Get generated cover letter
  getCoverLetter(letterId) {
    return this.generatedLetters.get(letterId) || null;
  }

  // List all generated cover letters
  listCoverLetters() {
    return Array.from(this.generatedLetters.entries()).map(([id, letter]) => ({
      id: id,
      jobTitle: letter.jobData.title,
      company: letter.jobData.company,
      template: letter.template.name,
      generatedAt: letter.generatedAt,
      wordCount: letter.wordCount
    }));
  }

  // Export cover letter to different formats
  exportCoverLetter(letterId, format = 'text') {
    const letter = this.generatedLetters.get(letterId);
    if (!letter) {
      return { success: false, error: 'Cover letter not found' };
    }

    try {
      switch (format.toLowerCase()) {
        case 'text':
          return {
            success: true,
            content: letter.content,
            filename: `cover_letter_${letter.jobData.company}_${Date.now()}.txt`
          };
          
        case 'html':
          const htmlContent = this.convertToHTML(letter.content);
          return {
            success: true,
            content: htmlContent,
            filename: `cover_letter_${letter.jobData.company}_${Date.now()}.html`
          };
          
        case 'json':
          return {
            success: true,
            content: JSON.stringify(letter, null, 2),
            filename: `cover_letter_${letter.jobData.company}_${Date.now()}.json`
          };
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Convert text to HTML format
  convertToHTML(content) {
    const htmlContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
      
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cover Letter</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <p>${htmlContent}</p>
      </body>
      </html>
    `;
  }

  // Generate unique letter ID
  generateLetterId(jobData) {
    const company = (jobData.company || 'unknown').replace(/\s+/g, '_').toLowerCase();
    const timestamp = Date.now();
    return `letter_${company}_${timestamp}`;
  }

  // Add custom template
  addCustomTemplate(name, template) {
    this.templates.set(name, {
      ...template,
      name: name,
      custom: true
    });
    console.log(`📄 Custom template added: ${name}`);
  }

  // Remove custom template
  removeCustomTemplate(name) {
    if (this.templates.get(name)?.custom) {
      this.templates.delete(name);
      console.log(`🗑️ Custom template removed: ${name}`);
      return true;
    }
    return false;
  }

  // Get available templates
  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      key: key,
      name: template.name,
      description: template.description,
      tone: template.tone,
      length: template.length,
      custom: template.custom || false
    }));
  }

  // Get generation statistics
  getStats() {
    const letters = Array.from(this.generatedLetters.values());
    const today = new Date().toDateString();
    
    return {
      totalGenerated: letters.length,
      todayGenerated: letters.filter(letter => 
        new Date(letter.generatedAt).toDateString() === today
      ).length,
      averageWordCount: letters.length > 0 ? 
        Math.round(letters.reduce((sum, letter) => sum + letter.wordCount, 0) / letters.length) : 0,
      templatesUsed: this.getTemplateUsageStats(letters),
      customTemplates: Array.from(this.templates.values()).filter(t => t.custom).length
    };
  }

  // Get template usage statistics
  getTemplateUsageStats(letters) {
    const usage = {};
    letters.forEach(letter => {
      const template = letter.template.name;
      usage[template] = (usage[template] || 0) + 1;
    });
    return usage;
  }

  // Clear all generated letters
  clearAllLetters() {
    this.generatedLetters.clear();
    console.log('🗑️ All generated cover letters cleared');
  }

  // Save custom prompts
  async saveCustomPrompts() {
    const promptsObj = Object.fromEntries(this.customPrompts);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'hireHeat_customPrompts': promptsObj }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoverLetterGenerator;
} else {
  window.CoverLetterGenerator = CoverLetterGenerator;
}

console.log('📄 Cover Letter Generator loaded');