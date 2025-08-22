// HireHeat Supabase Resume Manager
// Database-backed resume management with Supabase integration

class SupabaseResumeManager {
  constructor() {
    this.supabase = null;
    this.userId = null;
    this.templates = new Map();
    this.initializeTemplates();
    this.schemaVariant = 'unknown';
  }

  // Initialize with Supabase connection
  async initialize(userId = null) {
    try {
      // Get Supabase client from global configuration
      if (typeof getSupabaseClient === 'function') {
        this.supabase = getSupabaseClient();
      } else if (typeof supabase !== 'undefined') {
        this.supabase = supabase;
      } else {
        throw new Error('Supabase client not available');
      }

      if (!this.supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      this.userId = userId || await this.generateUserId();
      
      // Detect current resumes schema (wide vs json) to avoid failed insert attempts
      await this.detectResumeSchema();
      
      console.log('📄 Supabase Resume Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Supabase Resume Manager initialization failed:', error);
      throw error;
    }
  }

  // Generate or retrieve user ID
  async generateUserId() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['hireheat_user_id'], (result) => {
          if (result.hireheat_user_id) {
            resolve(result.hireheat_user_id);
          } else {
            const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            chrome.storage.local.set({ hireheat_user_id: newUserId }, () => {
              resolve(newUserId);
            });
          }
        });
      } else {
        // Fallback for non-extension environments
        resolve('user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
      }
    });
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

  // Create new resume in database
  async createResume(templateType, resumeData, fileName = null, fileSize = null, fileType = null) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const template = this.templates.get(templateType) || this.templates.get('general');
      
      // Validate required fields (be lenient: only require name OR email)
      const hasName = !!resumeData.name;
      const hasEmail = !!resumeData.email;
      if (!hasName && !hasEmail) {
        throw new Error('Missing required fields: name or email');
      }

      // Sanitize resume data
      const sanitizedData = this.sanitizeResumeData(resumeData);

      // Build both payload variants
      const payloadJSON = {
        user_id: this.userId,
        name: sanitizedData.name || fileName || 'Untitled Resume',
        content: sanitizedData,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        is_active: false
      };

      const payloadWide = {
        user_id: this.userId,
        title: fileName || sanitizedData.name || 'Untitled Resume',
        full_name: sanitizedData.name || null,
        email: sanitizedData.email || null,
        phone: sanitizedData.phone || null,
        location: sanitizedData.location || null,
        linkedin_url: sanitizedData.linkedin || null,
        summary: sanitizedData.professionalSummary || null,
        experience: Array.isArray(sanitizedData.workExperience) ? sanitizedData.workExperience : [],
        skills: Array.isArray(sanitizedData.coreSkills) ? sanitizedData.coreSkills : [],
        education: Array.isArray(sanitizedData.education) ? sanitizedData.education : [],
        template_type: templateType || 'general',
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        is_active: false
      };

      const insertJSON = async () => this.supabase.from('resumes').insert(payloadJSON).select().single();
      const insertWide = async () => this.supabase.from('resumes').insert(payloadWide).select().single();

      let data, error;

      // Prefer the detected schema. Default to 'wide' to match the provided supabase-schema.sql
      const preferred = this.schemaVariant === 'json' ? 'json' : 'wide';

      if (preferred === 'json') {
        ({ data, error } = await insertJSON());
        if (error) {
          const fb = await insertWide();
          if (fb.error) throw fb.error;
          data = fb.data;
          this.schemaVariant = 'wide';
        }
      } else {
        ({ data, error } = await insertWide());
        if (error) {
          const fb = await insertJSON();
          if (fb.error) throw fb.error;
          data = fb.data;
          this.schemaVariant = 'json';
        }
      }

      const normalized = this._normalizeResumeRow(data);
      console.log('✅ Resume created in database:', normalized.id);
      return normalized;
    } catch (error) {
      console.error('❌ Resume creation failed:', error);
      throw error;
    }
  }

  // Update existing resume
  async updateResume(resumeId, updates) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      // Get existing resume
      const existingResume = await this.getResume(resumeId);
      if (!existingResume) {
        throw new Error('Resume not found');
      }

      const sanitizedUpdates = this.sanitizeResumeData(updates);

      let data, error;

      // Detect schema by available fields
      if (typeof existingResume.content !== 'undefined') {
        // JSON-content schema: merge into content
        const newContent = { ...(existingResume.content || existingResume.data || {}), ...sanitizedUpdates };
        ({ data, error } = await this.supabase
          .from('resumes')
          .update({ content: newContent, updated_at: new Date().toISOString() })
          .eq('id', resumeId)
          .eq('user_id', this.userId)
          .select()
          .single());
      } else {
        // Wide-column schema: map selective fields
        const mapped = {
          title: sanitizedUpdates.fileName || sanitizedUpdates.name || existingResume.title || existingResume.name,
          full_name: sanitizedUpdates.name ?? existingResume.full_name ?? existingResume.name ?? null,
          email: sanitizedUpdates.email ?? existingResume.email ?? null,
          phone: sanitizedUpdates.phone ?? existingResume.phone ?? null,
          location: sanitizedUpdates.location ?? existingResume.location ?? null,
          linkedin_url: sanitizedUpdates.linkedin ?? existingResume.linkedin_url ?? null,
          summary: sanitizedUpdates.professionalSummary ?? existingResume.summary ?? null,
          experience: Array.isArray(sanitizedUpdates.workExperience) ? sanitizedUpdates.workExperience : existingResume.experience ?? [],
          skills: Array.isArray(sanitizedUpdates.coreSkills) ? sanitizedUpdates.coreSkills : existingResume.skills ?? [],
          education: Array.isArray(sanitizedUpdates.education) ? sanitizedUpdates.education : existingResume.education ?? [],
          updated_at: new Date().toISOString()
        };
        ({ data, error } = await this.supabase
          .from('resumes')
          .update(mapped)
          .eq('id', resumeId)
          .eq('user_id', this.userId)
          .select()
          .single());
      }

      if (error) throw error;

      const normalized = this._normalizeResumeRow(data);
      console.log('✅ Resume updated:', resumeId);
      return normalized;
    } catch (error) {
      console.error('❌ Resume update failed:', error);
      throw error;
    }
  }

  // Get resume by ID
  async getResume(resumeId) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data, error } = await this.supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Resume not found
        }
        throw error;
      }

      return this._normalizeResumeRow(data);
    } catch (error) {
      console.error('❌ Failed to get resume:', error);
      throw error;
    }
  }

  // Get all resumes for user
  async getAllResumes() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data, error } = await this.supabase
        .from('resumes')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(row => this._normalizeResumeRow(row));
    } catch (error) {
      console.error('❌ Failed to get resumes:', error);
      throw error;
    }
  }

  // Set active resume
  async setActiveResume(resumeId) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      // First, deactivate all resumes
      await this.supabase
        .from('resumes')
        .update({ is_active: false })
        .eq('user_id', this.userId);

      // Then activate the selected resume
      const { data, error } = await this.supabase
        .from('resumes')
        .update({ is_active: true })
        .eq('id', resumeId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const normalized = this._normalizeResumeRow(data);
      console.log('✅ Active resume set:', resumeId);
      return normalized;
    } catch (error) {
      console.error('❌ Failed to set active resume:', error);
      throw error;
    }
  }

  // Get active resume
  async getActiveResume() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data, error } = await this.supabase
        .from('resumes')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // If no rows or multiple rows were returned previously, avoid throwing
        if (error.code === 'PGRST116' || error.status === 406) {
          return null; // No active resume or ambiguous; treat as none
        }
        throw error;
      }

      return data ? this._normalizeResumeRow(data) : null;
    } catch (error) {
      console.error('❌ Failed to get active resume:', error);
      throw error;
    }
  }

  // Helper: normalize resume row across schema variants
  _normalizeResumeRow(row) {
    if (!row) return row;
    const normalized = { ...row };
    // Ensure a stable name field is present for UI
    normalized.name = row.name || row.title || 'Untitled Resume';
    // Map template field if applicable
    if (!normalized.template && row.template_type) {
      normalized.template = row.template_type;
    }
    // Content vs data consistency
    if (!normalized.content && row.data) {
      normalized.content = row.data;
    }
    return normalized;
  }

  // Delete resume
  async deleteResume(resumeId) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { error } = await this.supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', this.userId);

      if (error) {
        throw error;
      }

      console.log('✅ Resume deleted:', resumeId);
      return true;
    } catch (error) {
      console.error('❌ Resume deletion failed:', error);
      throw error;
    }
  }

  // Save job application
  async saveJobApplication(resumeId, jobData, compatibilityScore = null) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data, error } = await this.supabase
        .from('job_applications')
        .insert({
          user_id: this.userId,
          resume_id: resumeId,
          job_id: jobData.id || jobData.jobId,
          job_title: jobData.title,
          company: jobData.company,
          job_url: jobData.url,
          compatibility_score: compatibilityScore,
          application_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Job application saved:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to save job application:', error);
      throw error;
    }
  }

  // Get job applications
  async getJobApplications(limit = 50) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data, error } = await this.supabase
        .from('job_applications')
        .select(`
          *,
          resumes(name, template)
        `)
        .eq('user_id', this.userId)
        .order('applied_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get job applications:', error);
      throw error;
    }
  }

  // Update job application status
  async updateJobApplicationStatus(applicationId, status, notes = null) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const updateData = {
        application_status: status
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'responded') {
        updateData.response_received_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', applicationId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Job application status updated:', applicationId);
      return data;
    } catch (error) {
      console.error('❌ Failed to update job application status:', error);
      throw error;
    }
  }

  // Validate required fields
  validateRequiredFields(data, template) {
    const missing = [];
    
    for (const field of template.requiredFields) {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        missing.push(field);
      }
    }
    
    return missing;
  }

  // Sanitize resume data
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

  // Get available templates
  getTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      id: key,
      name: template.name,
      fields: template.fields,
      requiredFields: template.requiredFields
    }));
  }

  // Get user statistics
  async getUserStats() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      const [resumesResult, applicationsResult] = await Promise.all([
        this.supabase
          .from('resumes')
          .select('id', { count: 'exact' })
          .eq('user_id', this.userId),
        this.supabase
          .from('job_applications')
          .select('application_status', { count: 'exact' })
          .eq('user_id', this.userId)
      ]);

      const stats = {
        totalResumes: resumesResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        applicationsByStatus: {}
      };

      // Get application status breakdown
      const statusResult = await this.supabase
        .from('job_applications')
        .select('application_status')
        .eq('user_id', this.userId);

      if (statusResult.data) {
        statusResult.data.forEach(app => {
          const status = app.application_status;
          stats.applicationsByStatus[status] = (stats.applicationsByStatus[status] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      throw error;
    }
  }

  // Try to detect which resumes schema is present on the server
  async detectResumeSchema() {
    try {
      if (!this.supabase) return 'unknown';
      const { data, error } = await this.supabase
        .from('resumes')
        .select('*')
        .eq('user_id', this.userId)
        .limit(1);

      if (error) {
        console.warn('ℹ️ Could not detect resumes schema:', error.message || error);
        this.schemaVariant = 'unknown';
        return this.schemaVariant;
      }

      if (Array.isArray(data) && data.length > 0) {
        const row = data[0];
        if (Object.prototype.hasOwnProperty.call(row, 'content')) {
          this.schemaVariant = 'json';
        } else if (
          Object.prototype.hasOwnProperty.call(row, 'title') ||
          Object.prototype.hasOwnProperty.call(row, 'full_name')
        ) {
          this.schemaVariant = 'wide';
        } else {
          this.schemaVariant = 'unknown';
        }
      } else {
        // No rows yet — default to the schema shipped in supabase-schema.sql
        this.schemaVariant = 'wide';
      }

      console.log('🧭 Resumes schema detected:', this.schemaVariant);
      return this.schemaVariant;
    } catch (e) {
      console.warn('ℹ️ Schema detection failed:', e.message || e);
      this.schemaVariant = 'unknown';
      return this.schemaVariant;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseResumeManager;
} else {
  window.SupabaseResumeManager = SupabaseResumeManager;
}

console.log('📊 Supabase Resume Manager loaded');