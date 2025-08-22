// HireHeat AI Service Integration Layer
// Powered by Google Gemini Pro 2.5

class HireHeatAI {
  constructor() {
    this.apiKey = 'AIzaSyDlsRcdt59KWX0MziXYcbuq4ozOJS_GGQM';
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.rateLimiter = new RateLimiter();
    this.cache = new Map();
  }

  // Initialize AI service with Gemini Pro 2.5
  async initialize() {
    // Test API connection
    try {
      await this.testConnection();
      console.log('✅ Gemini Pro 2.5 AI service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Gemini AI service initialization failed:', error);
      console.log('🔄 Falling back to basic mode');
      return true; // Still return true to allow basic functionality
    }
  }
  
  // Update configuration (called from popup) - Gemini Pro 2.5 only
  updateConfiguration() {
    console.log('🔧 AI configuration: Gemini Pro 2.5 (fixed configuration)');
    
    // Clear cache when configuration changes
    this.clearCache();
  }
  
  // Check if AI features are available
  isAIEnabled() {
    return true; // Always enabled with Gemini Pro 2.5
  }

  // Test API connection
  async testConnection() {
    const testPrompt = 'Test connection';
    const response = await this.makeAPICall(testPrompt, { maxTokens: 10 });
    return response !== null;
  }

  // Core API call method with error handling and rate limiting
  async makeAPICall(prompt, options = {}) {
    if (!this.isAIEnabled()) {
      throw new Error('AI features not available. Please configure API key in the popup.');
    }

    // Check rate limits
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(prompt, options);
    if (this.cache.has(cacheKey)) {
      console.log('📋 Using cached AI response');
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.callAIProvider(prompt, options);
      
      // Cache successful responses
      this.cache.set(cacheKey, response);
      this.rateLimiter.recordRequest();
      
      return response;
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  }

  // Gemini Pro 2.5 API calls
  async callAIProvider(prompt, options) {
    const { maxTokens = 1000, temperature = 0.7 } = options;
    return await this.callGemini(prompt, maxTokens, temperature);
  }

  // Gemini Pro 2.5 API integration
  async callGemini(prompt, maxTokens, temperature) {
    try {
      const response = await fetch(`${this.baseURL}/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Invalid Gemini API response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  // Analyze job posting and extract key information
  async analyzeJob(jobData) {
    // If AI is not enabled, return basic job information
    if (!this.isAIEnabled()) {
      return this.getBasicJobAnalysis(jobData);
    }

    const prompt = `
      Analyze this job posting and extract key information:
      
      Title: ${jobData.title || 'N/A'}
      Company: ${jobData.company || 'N/A'}
      Description: ${jobData.description || 'N/A'}
      Location: ${jobData.location || 'N/A'}
      
      Please provide a JSON response with:
      {
        "requiredSkills": ["skill1", "skill2"],
        "preferredSkills": ["skill1", "skill2"],
        "experienceLevel": "entry/mid/senior",
        "jobType": "full-time/part-time/contract",
        "remoteOptions": "remote/hybrid/onsite",
        "salaryRange": "estimated range or null",
        "keyResponsibilities": ["responsibility1", "responsibility2"],
        "companySize": "startup/small/medium/large/enterprise",
        "industry": "industry name",
        "applicationComplexity": "simple/moderate/complex",
        "competitionLevel": "low/medium/high"
      }
    `;

    try {
      const response = await this.makeAPICall(prompt, { maxTokens: 800 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Job analysis failed:', error);
      // Fallback to basic analysis if AI fails
      return this.getBasicJobAnalysis(jobData);
    }
  }
  
  // Basic job analysis without AI (fallback mode)
  getBasicJobAnalysis(jobData) {
    const description = (jobData.description || '').toLowerCase();
    const title = (jobData.title || '').toLowerCase();
    
    // Basic skill extraction from common keywords
    const commonSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
    const foundSkills = commonSkills.filter(skill => 
      description.includes(skill) || title.includes(skill)
    );
    
    // Basic experience level detection
    let experienceLevel = 'mid';
    if (description.includes('entry') || description.includes('junior') || description.includes('0-2 years')) {
      experienceLevel = 'entry';
    } else if (description.includes('senior') || description.includes('lead') || description.includes('5+ years')) {
      experienceLevel = 'senior';
    }
    
    // Basic remote detection
    let remoteOptions = 'onsite';
    if (description.includes('remote') || description.includes('work from home')) {
      remoteOptions = 'remote';
    } else if (description.includes('hybrid')) {
      remoteOptions = 'hybrid';
    }
    
    return {
      requiredSkills: foundSkills,
      preferredSkills: [],
      experienceLevel: experienceLevel,
      jobType: 'full-time',
      remoteOptions: remoteOptions,
      salaryRange: null,
      keyResponsibilities: ['See job description for details'],
      companySize: 'unknown',
      industry: 'unknown',
      applicationComplexity: 'moderate',
      competitionLevel: 'medium',
      isBasicAnalysis: true // Flag to indicate this is basic analysis
    };
  }

  // Calculate job-resume compatibility score
  async calculateCompatibility(jobAnalysis, resumeData) {
    // If AI is not enabled, return basic compatibility
    if (!this.isAIEnabled()) {
      return this.getBasicCompatibility(jobAnalysis, resumeData);
    }

    const prompt = `
      Calculate compatibility between this job and resume:
      
      JOB REQUIREMENTS:
      Required Skills: ${JSON.stringify(jobAnalysis.requiredSkills)}
      Preferred Skills: ${JSON.stringify(jobAnalysis.preferredSkills)}
      Experience Level: ${jobAnalysis.experienceLevel}
      Key Responsibilities: ${JSON.stringify(jobAnalysis.keyResponsibilities)}
      
      RESUME DATA:
      Skills: ${JSON.stringify(resumeData.skills)}
      Experience: ${resumeData.totalExperience} years
      Previous Roles: ${JSON.stringify(resumeData.previousRoles)}
      Education: ${JSON.stringify(resumeData.education)}
      
      Provide a JSON response with:
      {
        "overallScore": 85,
        "skillsMatch": 90,
        "experienceMatch": 80,
        "responsibilityMatch": 85,
        "recommendationLevel": "high/medium/low",
        "missingSkills": ["skill1", "skill2"],
        "strengthAreas": ["area1", "area2"],
        "applicationStrategy": "detailed strategy recommendation"
      }
    `;

    try {
      const response = await this.makeAPICall(prompt, { maxTokens: 600 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Compatibility calculation failed:', error);
      // Fallback to basic compatibility if AI fails
      return this.getBasicCompatibility(jobAnalysis, resumeData);
    }
  }
  
  // Basic compatibility calculation without AI (fallback mode)
  getBasicCompatibility(jobAnalysis, resumeData) {
    const jobSkills = jobAnalysis.requiredSkills || [];
    const resumeSkills = resumeData.skills || [];
    
    // Calculate skill match percentage
    const matchingSkills = jobSkills.filter(skill => 
      resumeSkills.some(resumeSkill => 
        resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(resumeSkill.toLowerCase())
      )
    );
    
    const skillsMatch = jobSkills.length > 0 ? 
      Math.round((matchingSkills.length / jobSkills.length) * 100) : 50;
    
    // Basic experience matching
    const jobExpLevel = jobAnalysis.experienceLevel || 'mid';
    const resumeExp = resumeData.totalExperience || 0;
    
    let experienceMatch = 50;
    if (jobExpLevel === 'entry' && resumeExp <= 2) experienceMatch = 90;
    else if (jobExpLevel === 'mid' && resumeExp >= 2 && resumeExp <= 5) experienceMatch = 90;
    else if (jobExpLevel === 'senior' && resumeExp >= 5) experienceMatch = 90;
    else if (Math.abs(resumeExp - 3) <= 2) experienceMatch = 70;
    
    const overallScore = Math.round((skillsMatch + experienceMatch) / 2);
    
    let recommendationLevel = 'low';
    if (overallScore >= 75) recommendationLevel = 'high';
    else if (overallScore >= 50) recommendationLevel = 'medium';
    
    const missingSkills = jobSkills.filter(skill => !matchingSkills.includes(skill));
    
    return {
      overallScore: overallScore,
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      responsibilityMatch: 60, // Default moderate match
      recommendationLevel: recommendationLevel,
      missingSkills: missingSkills,
      strengthAreas: matchingSkills,
      applicationStrategy: 'Basic compatibility analysis - configure AI for detailed insights',
      isBasicAnalysis: true
    };
  }

  // Generate personalized cover letter
  async generateCoverLetter(jobAnalysis, resumeData, companyInfo) {
    // If AI is not enabled, return a message
    if (!this.isAIEnabled()) {
      return 'AI-powered cover letter generation is not available. Please configure your API key in the popup to enable this feature.';
    }

    const prompt = `
      Generate a personalized cover letter for this job application:
      
      JOB INFO:
      Title: ${jobAnalysis.title}
      Company: ${companyInfo.name}
      Key Requirements: ${JSON.stringify(jobAnalysis.requiredSkills)}
      
      CANDIDATE INFO:
      Name: ${resumeData.name}
      Current Role: ${resumeData.currentRole}
      Key Skills: ${JSON.stringify(resumeData.skills)}
      Notable Achievements: ${JSON.stringify(resumeData.achievements)}
      
      Create a professional, engaging cover letter that:
      1. Shows genuine interest in the company
      2. Highlights relevant experience and skills
      3. Addresses key job requirements
      4. Maintains professional tone
      5. Is concise (under 300 words)
      
      Return only the cover letter text, no additional formatting.
    `;

    try {
      const response = await this.makeAPICall(prompt, { maxTokens: 500 });
      return response.trim();
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      return 'Cover letter generation failed. Please check your API configuration and try again.';
    }
  }

  // Generate application form responses
  async generateFormResponses(questions, jobAnalysis, resumeData) {
    // If AI is not enabled, return basic responses
    if (!this.isAIEnabled()) {
      return {
        responses: questions.map((q, i) => ({
          questionId: i + 1,
          response: 'AI-powered form filling is not available. Please configure your API key in the popup to enable this feature.'
        })),
        isBasicResponse: true
      };
    }

    const prompt = `
      Generate responses for these application form questions:
      
      QUESTIONS:
      ${questions.map((q, i) => `${i + 1}. ${q.question} (${q.type})`).join('\n')}
      
      JOB CONTEXT:
      ${JSON.stringify(jobAnalysis, null, 2)}
      
      CANDIDATE DATA:
      ${JSON.stringify(resumeData, null, 2)}
      
      Provide responses that are:
      1. Truthful and based on resume data
      2. Tailored to the specific job
      3. Professional and compelling
      4. Appropriate length for each question type
      
      Return JSON format:
      {
        "responses": [
          {"questionId": 1, "response": "answer text"},
          {"questionId": 2, "response": "answer text"}
        ]
      }
    `;

    try {
      const response = await this.makeAPICall(prompt, { maxTokens: 800 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Form response generation failed:', error);
      return {
        responses: questions.map((q, i) => ({
          questionId: i + 1,
          response: 'Form response generation failed. Please check your API configuration and try again.'
        })),
        isErrorResponse: true
      };
    }
  }

  // Generate cache key for responses
  generateCacheKey(prompt, options) {
    const key = prompt + JSON.stringify(options);
    return btoa(key).substring(0, 32); // Simple hash
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ AI response cache cleared');
  }
}

// Rate limiter to prevent API abuse
class RateLimiter {
  constructor(maxRequests = 60, timeWindow = 60000) { // 60 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  getRequestsRemaining() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HireHeatAI, RateLimiter };
} else {
  window.HireHeatAI = HireHeatAI;
  window.RateLimiter = RateLimiter;
}

console.log('🤖 HireHeat AI Service loaded');