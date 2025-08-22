// HireHeat Supabase Configuration

// Supabase configuration
const SUPABASE_CONFIG = {
    url: 'https://gapeoriqaaxxgdfocgxq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcGVvcmlxYWF4eGdkZm9jZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjA5NjMsImV4cCI6MjA3MTM5Njk2M30.8xEnG-79mnqaOb8pq6H01Jcvq1hZANhLF_V6H8w0nXo'
};

// Initialize Supabase client
let supabaseClient = null;

// Function to initialize Supabase client
function initializeSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase client initialized successfully');
        return supabaseClient;
    } else {
        console.error('Supabase createClient function not available');
        return null;
    }
}

// Function to get Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        return initializeSupabaseClient();
    }
    return supabaseClient;
}

// Authentication functions
async function signInWithGoogle() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not initialized');
    }
    
    // Check if running in extension context
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    
    if (!isExtension) {
        // For testing in browser, show informative message
        alert('Google OAuth requires the extension to be loaded in Chrome. Please:\n\n1. Go to chrome://extensions/\n2. Enable Developer mode\n3. Click "Load unpacked" and select this folder\n4. Try signing in from the extension popup');
        throw new Error('Google OAuth requires Chrome extension context');
    }
    
    try {
        // Use Chrome Identity API redirect URL for robust OAuth in extensions
        const redirectUri = chrome.identity.getRedirectURL('supabase-callback');
        console.log('Using redirect URI:', redirectUri);
        
        // Initiate OAuth with Supabase but skip automatic browser redirect
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUri,
                flowType: 'pkce',
                skipBrowserRedirect: true
            }
        });
        
        if (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
        
        if (!data?.url) {
            throw new Error('Failed to obtain OAuth URL from Supabase');
        }
        
        // Launch the OAuth flow in a controlled way so we can capture the final redirect with code/token
        const authUrl = data.url;
        console.log('Launching OAuth flow:', authUrl);
        
        let finalRedirect;
        try {
            finalRedirect = await new Promise((resolve, reject) => {
                try {
                    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectedTo) => {
                        if (chrome.runtime.lastError) {
                            return reject(new Error(chrome.runtime.lastError.message || 'OAuth flow failed'));
                        }
                        if (!redirectedTo) {
                            return reject(new Error('OAuth flow did not return a redirect URL'));
                        }
                        resolve(redirectedTo);
                    });
                } catch (e) {
                    reject(e);
                }
            });
        } catch (identityErr) {
            // Do NOT fall back to opening a tab; this breaks the Identity interception and shows a chromiumapp error page
            const helpful = 'Could not open the authorization page. Ensure the Redirect URL https://' + chrome.runtime.id + '.chromiumapp.org/supabase-callback is added in Supabase (Auth → URL Configuration and Providers → Google), and that the extension was reloaded.';
            console.error('launchWebAuthFlow failed:', identityErr);
            throw new Error(helpful);
        }
        
        // Avoid logging full redirect with tokens
        console.log('OAuth redirect captured by Identity API');
        
        // Try to extract authorization code (PKCE) first
        const urlObj = new URL(finalRedirect);
        const code = urlObj.searchParams.get('code');
        if (code) {
            // Exchange code for a session with Supabase
            const { data: sessionData, error: exchangeError } = await client.auth.exchangeCodeForSession({ code });
            if (exchangeError) {
                console.error('Code exchange failed:', exchangeError);
                throw exchangeError;
            }
            console.log('✅ Session established via code exchange');
            return { initiated: true };
        }
        
        // Fallback: some providers may return access_token in hash
        const hash = urlObj.hash || '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token) {
            const { data: setSessionData, error: setErr } = await client.auth.setSession({ access_token, refresh_token });
            if (setErr) {
                console.error('Setting session from token failed:', setErr);
                throw setErr;
            }
            console.log('✅ Session established from access token');
            return { initiated: true };
        }
        
        throw new Error('No authorization code or access token found in redirect URL');
        
    } catch (err) {
        console.error('Sign-in failed:', err);
        throw err;
    }
}

// Verify user exists in database and create if missing
async function verifyUserInDatabase(userId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not initialized');
    }
    
    try {
        // Check if user exists in public.users table
        const { data: existingUser, error: selectError } = await client
            .from('users')
            .select('id, email, full_name')
            .eq('id', userId)
            .single();
        
        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw selectError;
        }
        
        if (existingUser) {
            console.log('✅ User found in database:', existingUser.email);
            return existingUser;
        }
        
        // User doesn't exist, get current auth user and create manually
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError || !user) {
            throw new Error('Could not get current user data');
        }
        
        console.log('⚠️ User not found in database, creating manually...');
        const { data: newUser, error: insertError } = await client
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || null
            })
            .select()
            .single();
        
        if (insertError) {
            throw insertError;
        }
        
        console.log('✅ User created in database:', newUser.email);
        return newUser;
        
    } catch (error) {
        console.error('❌ Database verification error:', error);
        throw error;
    }
}

async function signOut() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not initialized');
    }
    
    const { error } = await client.auth.signOut();
    if (error) {
        throw error;
    }
}

async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) {
        return null;
    }
    
    const { data: { user } } = await client.auth.getUser();
    return user;
}

function onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) {
        return null;
    }
    
    return client.auth.onAuthStateChange(callback);
}

// Export configuration and functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        initializeSupabaseClient,
        getSupabaseClient,
        signInWithGoogle,
        signOut,
        getCurrentUser,
        onAuthStateChange,
        verifyUserInDatabase
    };
}
// Database connection and management for resume storage

class SupabaseConfig {
  constructor() {
    // Supabase configuration - these should be set via environment or secure storage
    this.supabaseUrl = null;
    this.supabaseKey = null;
    this.supabase = null;
    this.isInitialized = false;
  }

  // Initialize Supabase connection
  async initialize(url, key) {
    try {
      if (!url || !key) {
        throw new Error('Supabase URL and API key are required');
      }

      this.supabaseUrl = url;
      this.supabaseKey = key;

      // Import Supabase client (assuming it's loaded via CDN or bundled)
      if (typeof createClient !== 'undefined') {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      } else {
        throw new Error('Supabase client not available. Please include the Supabase JavaScript library.');
      }

      // Test connection
      await this.testConnection();
      this.isInitialized = true;
      console.log('✅ Supabase initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      throw error;
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('resumes')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      console.log('🔗 Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  // Get Supabase client instance
  getClient() {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Supabase not initialized. Call initialize() first.');
    }
    return this.supabase;
  }

  // Check if initialized
  isReady() {
    return this.isInitialized && this.supabase !== null;
  }

  async initializeFromStorage() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome storage not available in this environment');
      }

      const { supabase_url, supabase_key } = await new Promise((resolve) => {
        chrome.storage.local.get(['supabase_url', 'supabase_key'], resolve);
      });

      if (!supabase_url || !supabase_key) {
        throw new Error('Supabase credentials not found in storage');
      }

      return this.initialize(supabase_url, supabase_key);
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
      throw error;
    }
  }

  async saveCredentials(url, key) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome storage not available');
      }

      await new Promise((resolve) => {
        chrome.storage.local.set({ supabase_url: url, supabase_key: key }, resolve);
      });

      console.log('✅ Supabase credentials saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save credentials:', error);
      throw error;
    }
  }

  async clearCredentials() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome storage not available');
      }

      await new Promise((resolve) => {
        chrome.storage.local.remove(['supabase_url', 'supabase_key'], resolve);
      });

      console.log('🧹 Supabase credentials cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear credentials:', error);
      throw error;
    }
  }
}

class DatabaseSchema {
  static getResumeSchema() {
    return {
      title: 'Resume',
      description: 'Schema for resume entries',
      type: 'object',
      properties: {
        id: { type: 'string' },
        user_id: { type: 'string' },
        name: { type: 'string' },
        content: { type: 'object' },
        is_active: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      },
      required: ['user_id', 'name']
    };
  }

  static getJobApplicationSchema() {
    return {
      title: 'Job Application',
      description: 'Schema for job applications',
      type: 'object',
      properties: {
        id: { type: 'string' },
        user_id: { type: 'string' },
        job_title: { type: 'string' },
        company: { type: 'string' },
        status: { type: 'string' },
        notes: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      },
      required: ['user_id', 'job_title', 'company']
    };
  }

  static getCreateTablesSQL() {
    return `
      -- Create users table
      create table if not exists public.users (
        id uuid primary key references auth.users(id) on delete cascade,
        email text unique not null,
        full_name text,
        avatar_url text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );

      -- Create resumes table
      create table if not exists public.resumes (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references public.users(id) on delete cascade,
        name text not null,
        content jsonb not null,
        is_active boolean default false,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );

      -- Create job applications table
      create table if not exists public.job_applications (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references public.users(id) on delete cascade,
        job_title text not null,
        company text not null,
        status text default 'applied',
        notes text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );

      -- Indexes
      create index if not exists idx_resumes_user_id on public.resumes(user_id);
      create index if not exists idx_job_applications_user_id on public.job_applications(user_id);

      -- Enable Row Level Security
      alter table public.users enable row level security;
      alter table public.resumes enable row level security;
      alter table public.job_applications enable row level security;

      -- RLS Policies
      create policy if not exists "Users can view and update their own profile"
        on public.users for all
        using (auth.uid() = id);

      create policy if not exists "Users can manage their own resumes"
        on public.resumes for all
        using (auth.uid() = user_id);

      create policy if not exists "Users can manage their own job applications"
        on public.job_applications for all
        using (auth.uid() = user_id);

      -- Create trigger function to handle new Auth users
      create or replace function public.handle_new_user()
      returns trigger as $$
      begin
        insert into public.users (id, email, full_name, avatar_url)
        values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
        return new;
      end;
      $$ language plpgsql security definer;

      -- Create trigger for user signup
      drop trigger if exists on_auth_user_created on auth.users;
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function public.handle_new_user();
    `;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseConfig, DatabaseSchema };
} else {
  window.SupabaseConfig = SupabaseConfig;
  window.DatabaseSchema = DatabaseSchema;
}

console.log('🗄️ Supabase Config loaded');