// HireHeat Job-Resume Compatibility Scoring Algorithm
// Intelligent job matching and ranking system using AI analysis

class JobMatcher {
  constructor(aiService, resumeManager) {
    this.aiService = aiService;
    this.resumeManager = resumeManager;
    this.scoringWeights = {
      skillsMatch: 0.35,
      experienceMatch: 0.25,
      responsibilityMatch: 0.20,
      educationMatch: 0.10,
      locationMatch: 0.05,
      salaryMatch: 0.05
    };
    this.cache = new Map();
    this.matchHistory = [];
  }

  // Main method to score job compatibility
  async scoreJobCompatibility(jobData, resumeId = null) {
    try {
      // Get resume data
      const resume = resumeId ? 
        await this.resumeManager.getResume(resumeId) : 
        await this.resumeManager.getActiveResume();
      
      if (!resume) {
        throw new Error('No resume found for compatibility scoring');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(jobData, resume.id);
      if (this.cache.has(cacheKey)) {
        console.log('📋 Using cached compatibility score');
        return this.cache.get(cacheKey);
      }

      // Analyze job posting with AI (with fallback)
      let jobAnalysis;
      try {
        jobAnalysis = await this.aiService.analyzeJob(jobData);
        if (!jobAnalysis) {
          console.warn('AI job analysis failed, using basic analysis');
          jobAnalysis = this.aiService.getBasicJobAnalysis(jobData);
        }
      } catch (error) {
        console.warn('AI job analysis error, using basic analysis:', error);
        jobAnalysis = this.aiService.getBasicJobAnalysis(jobData);
      }

      // Calculate compatibility using AI (with fallback)
      let aiCompatibility;
      try {
        aiCompatibility = await this.aiService.calculateCompatibility(jobAnalysis, resume.data);
        if (!aiCompatibility) {
          console.warn('AI compatibility calculation failed, using basic calculation');
          aiCompatibility = this.aiService.getBasicCompatibility(jobAnalysis, resume.data);
        }
      } catch (error) {
        console.warn('AI compatibility calculation error, using basic calculation:', error);
        aiCompatibility = this.aiService.getBasicCompatibility(jobAnalysis, resume.data);
      }

      // Enhance with local scoring algorithms
      const localScores = this.calculateLocalScores(jobAnalysis, resume.data, jobData);
      
      // Combine AI and local scores
      const finalScore = this.combineScores(aiCompatibility, localScores);
      
      // Add metadata
      const result = {
        ...finalScore,
        jobId: jobData.id || jobData.jobId,
        resumeId: resume.id,
        jobTitle: jobData.title,
        company: jobData.company,
        analyzedAt: new Date().toISOString(),
        jobAnalysis: jobAnalysis,
        localScores: localScores
      };

      // Cache result
      this.cache.set(cacheKey, result);
      
      // Add to match history
      this.addToMatchHistory(result);
      
      console.log(`✅ Job compatibility scored: ${result.overallScore}%`);
      return result;
    } catch (error) {
      console.error('❌ Job compatibility scoring failed:', error);
      return null;
    }
  }

  // Calculate local scores using rule-based algorithms
  calculateLocalScores(jobAnalysis, resumeData, jobData) {
    const scores = {
      skillsMatch: this.calculateSkillsMatch(jobAnalysis, resumeData),
      experienceMatch: this.calculateExperienceMatch(jobAnalysis, resumeData),
      responsibilityMatch: this.calculateResponsibilityMatch(jobAnalysis, resumeData),
      educationMatch: this.calculateEducationMatch(jobAnalysis, resumeData),
      locationMatch: this.calculateLocationMatch(jobData, resumeData),
      salaryMatch: this.calculateSalaryMatch(jobAnalysis, resumeData)
    };

    // Calculate weighted overall score
    scores.overallScore = Object.entries(this.scoringWeights)
      .reduce((total, [key, weight]) => total + (scores[key] * weight), 0);

    return scores;
  }

  // Calculate skills matching score
  calculateSkillsMatch(jobAnalysis, resumeData) {
    const requiredSkills = jobAnalysis.requiredSkills || [];
    const preferredSkills = jobAnalysis.preferredSkills || [];
    const candidateSkills = this.extractAllSkills(resumeData);

    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      return 50; // Neutral score if no skills specified
    }

    let score = 0;
    let totalWeight = 0;

    // Required skills (higher weight)
    requiredSkills.forEach(skill => {
      const match = this.findSkillMatch(skill, candidateSkills);
      score += match ? 100 : 0;
      totalWeight += 1;
    });

    // Preferred skills (lower weight)
    preferredSkills.forEach(skill => {
      const match = this.findSkillMatch(skill, candidateSkills);
      score += match ? 50 : 0;
      totalWeight += 0.5;
    });

    return totalWeight > 0 ? Math.min(100, score / totalWeight) : 0;
  }

  // Calculate experience level matching
  calculateExperienceMatch(jobAnalysis, resumeData) {
    const jobExperienceLevel = jobAnalysis.experienceLevel;
    const candidateExperience = this.calculateTotalExperience(resumeData);

    const experienceLevels = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 15 },
      'lead': { min: 8, max: 20 },
      'executive': { min: 10, max: 30 }
    };

    const jobLevel = experienceLevels[jobExperienceLevel] || experienceLevels['mid'];
    
    if (candidateExperience >= jobLevel.min && candidateExperience <= jobLevel.max) {
      return 100;
    } else if (candidateExperience < jobLevel.min) {
      // Under-qualified
      const gap = jobLevel.min - candidateExperience;
      return Math.max(0, 100 - (gap * 20));
    } else {
      // Over-qualified
      const excess = candidateExperience - jobLevel.max;
      return Math.max(60, 100 - (excess * 5));
    }
  }

  // Calculate responsibility matching
  calculateResponsibilityMatch(jobAnalysis, resumeData) {
    const jobResponsibilities = jobAnalysis.keyResponsibilities || [];
    const candidateExperience = resumeData.workExperience || [];
    
    if (jobResponsibilities.length === 0) return 50;

    let matchCount = 0;
    
    jobResponsibilities.forEach(responsibility => {
      const hasMatch = candidateExperience.some(exp => 
        this.textSimilarity(responsibility.toLowerCase(), 
                           (exp.responsibilities || []).join(' ').toLowerCase()) > 0.3
      );
      if (hasMatch) matchCount++;
    });

    return (matchCount / jobResponsibilities.length) * 100;
  }

  // Calculate education matching
  calculateEducationMatch(jobAnalysis, resumeData) {
    const candidateEducation = resumeData.education || resumeData.degrees || [];
    
    if (candidateEducation.length === 0) return 30; // Some penalty for no education data
    
    // Basic education scoring - can be enhanced based on job requirements
    const hasRelevantDegree = candidateEducation.some(edu => 
      edu.degree && (edu.degree.includes('Bachelor') || edu.degree.includes('Master') || edu.degree.includes('PhD'))
    );
    
    return hasRelevantDegree ? 80 : 60;
  }

  // Calculate location matching
  calculateLocationMatch(jobData, resumeData) {
    const jobLocation = jobData.location || '';
    const candidateLocation = resumeData.location || '';
    
    if (!jobLocation || !candidateLocation) return 50;
    
    // Check for remote work
    if (jobLocation.toLowerCase().includes('remote') || 
        candidateLocation.toLowerCase().includes('remote')) {
      return 100;
    }
    
    // Simple location matching - can be enhanced with geolocation
    const similarity = this.textSimilarity(jobLocation.toLowerCase(), candidateLocation.toLowerCase());
    return similarity * 100;
  }

  // Calculate salary matching
  calculateSalaryMatch(jobAnalysis, resumeData) {
    const jobSalary = jobAnalysis.salaryRange;
    const candidateExpectation = resumeData.salaryExpectation;
    
    if (!jobSalary || !candidateExpectation) return 50;
    
    // Simple salary range matching - can be enhanced
    return 75; // Placeholder implementation
  }

  // Combine AI and local scores
  combineScores(aiCompatibility, localScores) {
    // Weight AI scores higher as they're more sophisticated
    const aiWeight = 0.7;
    const localWeight = 0.3;
    
    return {
      overallScore: Math.round(
        (aiCompatibility.overallScore * aiWeight) + 
        (localScores.overallScore * localWeight)
      ),
      skillsMatch: Math.round(
        (aiCompatibility.skillsMatch * aiWeight) + 
        (localScores.skillsMatch * localWeight)
      ),
      experienceMatch: Math.round(
        (aiCompatibility.experienceMatch * aiWeight) + 
        (localScores.experienceMatch * localWeight)
      ),
      responsibilityMatch: Math.round(
        (aiCompatibility.responsibilityMatch * aiWeight) + 
        (localScores.responsibilityMatch * localWeight)
      ),
      recommendationLevel: aiCompatibility.recommendationLevel,
      missingSkills: aiCompatibility.missingSkills || [],
      strengthAreas: aiCompatibility.strengthAreas || [],
      applicationStrategy: aiCompatibility.applicationStrategy || 'Apply with confidence'
    };
  }

  // Batch score multiple jobs
  async scoreMultipleJobs(jobsData, resumeId = null) {
    const results = [];
    
    for (const jobData of jobsData) {
      try {
        const score = await this.scoreJobCompatibility(jobData, resumeId);
        if (score) {
          results.push(score);
        }
        
        // Add delay to respect rate limits
        await this.delay(500);
      } catch (error) {
        console.error(`Failed to score job ${jobData.id}:`, error);
      }
    }
    
    // Sort by overall score (highest first)
    return results.sort((a, b) => b.overallScore - a.overallScore);
  }

  // Get top job matches
  async getTopMatches(jobsData, limit = 10, resumeId = null) {
    const scoredJobs = await this.scoreMultipleJobs(jobsData, resumeId);
    return scoredJobs.slice(0, limit);
  }

  // Get jobs by recommendation level
  async getJobsByRecommendation(jobsData, level = 'high', resumeId = null) {
    const scoredJobs = await this.scoreMultipleJobs(jobsData, resumeId);
    return scoredJobs.filter(job => job.recommendationLevel === level);
  }

  // Helper methods
  extractAllSkills(resumeData) {
    const skills = [];
    
    // Technical skills
    if (resumeData.programmingLanguages) skills.push(...resumeData.programmingLanguages);
    if (resumeData.frameworks) skills.push(...resumeData.frameworks);
    if (resumeData.tools) skills.push(...resumeData.tools);
    if (resumeData.databases) skills.push(...resumeData.databases);
    
    // General skills
    if (resumeData.coreSkills) skills.push(...resumeData.coreSkills);
    if (resumeData.technicalSkills) skills.push(...resumeData.technicalSkills);
    if (resumeData.marketingSkills) skills.push(...resumeData.marketingSkills);
    
    return skills.map(skill => skill.toLowerCase());
  }

  findSkillMatch(jobSkill, candidateSkills) {
    const jobSkillLower = jobSkill.toLowerCase();
    
    return candidateSkills.some(candidateSkill => {
      // Exact match
      if (candidateSkill === jobSkillLower) return true;
      
      // Partial match
      if (candidateSkill.includes(jobSkillLower) || jobSkillLower.includes(candidateSkill)) {
        return true;
      }
      
      // Similarity match
      return this.textSimilarity(jobSkillLower, candidateSkill) > 0.8;
    });
  }

  calculateTotalExperience(resumeData) {
    const workExperience = resumeData.workExperience || [];
    
    return workExperience.reduce((total, exp) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
        return total + Math.max(0, years);
      }
      return total + (exp.duration || 0);
    }, 0);
  }

  textSimilarity(str1, str2) {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  generateCacheKey(jobData, resumeId) {
    const jobKey = jobData.id || jobData.title + jobData.company;
    return `${jobKey}_${resumeId}`;
  }

  addToMatchHistory(result) {
    this.matchHistory.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 matches
    if (this.matchHistory.length > 100) {
      this.matchHistory = this.matchHistory.slice(-100);
    }
  }

  getMatchHistory(limit = 20) {
    return this.matchHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Job matcher cache cleared');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get matching statistics
  getMatchingStats() {
    if (this.matchHistory.length === 0) {
      return {
        totalMatches: 0,
        averageScore: 0,
        highMatches: 0,
        mediumMatches: 0,
        lowMatches: 0
      };
    }

    const scores = this.matchHistory.map(match => match.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      totalMatches: this.matchHistory.length,
      averageScore: Math.round(averageScore),
      highMatches: this.matchHistory.filter(m => m.overallScore >= 80).length,
      mediumMatches: this.matchHistory.filter(m => m.overallScore >= 60 && m.overallScore < 80).length,
      lowMatches: this.matchHistory.filter(m => m.overallScore < 60).length,
      topCompanies: this.getTopCompanies(),
      commonMissingSkills: this.getCommonMissingSkills()
    };
  }

  getTopCompanies() {
    const companyCounts = {};
    this.matchHistory.forEach(match => {
      const company = match.company;
      if (company) {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });
    
    return Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));
  }

  getCommonMissingSkills() {
    const skillCounts = {};
    this.matchHistory.forEach(match => {
      (match.missingSkills || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    
    return Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }

  // Alias for getMatchingStats to maintain compatibility with EnhancedUI
  getStats() {
    return this.getMatchingStats();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JobMatcher;
} else {
  window.JobMatcher = JobMatcher;
}

console.log('🎯 Job Matcher loaded');