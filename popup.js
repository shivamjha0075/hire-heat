document.addEventListener('DOMContentLoaded', function() {
  checkExtensionStatus();
  initializeSupabase();
  initializeResumeManagement();
  
  const activateBtn = document.getElementById('activateBtn');
  if (activateBtn) {
    activateBtn.addEventListener('click', toggleExtension);
  }
});

// Global variables for Supabase integration
let supabaseResumeManager = null;
let currentUser = null;
let authStateListener = null;

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    // Check if Supabase classes are available
    if (typeof SupabaseResumeManager === 'undefined') {
      console.warn('⚠️ Supabase classes not loaded, falling back to local storage');
      return false;
    }

    // Initialize Supabase client from global config
    if (typeof initializeSupabaseClient === 'function') {
      initializeSupabaseClient();
    }
    
    // Set up authentication state listener
    if (typeof onAuthStateChange === 'function') {
      authStateListener = onAuthStateChange((event, session) => {
        handleAuthStateChange(event, session);
      });
    }
    
    // Check current user
    if (typeof getCurrentUser === 'function') {
      currentUser = await getCurrentUser();
      updateAuthUI();
    }
    
    // Try to initialize resume manager if user is authenticated
    if (currentUser) {
      try {
        supabaseResumeManager = new SupabaseResumeManager();
        await supabaseResumeManager.initialize(currentUser.id);
        console.log('✅ Supabase initialized successfully');
        return true;
      } catch (error) {
        console.log('ℹ️ Supabase resume manager initialization failed:', error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    return false;
  }
}

// Handle authentication state changes
async function handleAuthStateChange(event, session) {
  console.log('Auth state changed:', event, session);
  
  const statusDiv = document.getElementById('status');
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;

    // Ensure user exists in our public.users table (create if missing)
    if (typeof verifyUserInDatabase === 'function') {
      try {
        await verifyUserInDatabase(currentUser.id);
        if (statusDiv) {
          statusDiv.innerHTML = '<div class="success">✅ Signed in and verified in database</div>';
        }
      } catch (e) {
        console.error('Database verification failed:', e);
        if (statusDiv) {
          statusDiv.innerHTML = '<div class="error">⚠️ Signed in, but database verification failed. See console for details.</div>';
        }
      }
    }

    // Initialize resume manager for authenticated user
    try {
      supabaseResumeManager = new SupabaseResumeManager();
      await supabaseResumeManager.initialize(currentUser.id);
      console.log('✅ Resume manager initialized for authenticated user');
    } catch (error) {
      console.error('❌ Failed to initialize resume manager:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    supabaseResumeManager = null;
    if (statusDiv) {
      statusDiv.innerHTML = '';
    }
  }
  
  updateAuthUI();
  await loadResumeStatus(); // Refresh resume status
}

// Update authentication UI
function updateAuthUI() {
  const signedOutSection = document.getElementById('authSignedOut');
  const signedInSection = document.getElementById('authSignedIn');
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');
  
  if (currentUser) {
    // User is signed in
    signedOutSection.style.display = 'none';
    signedInSection.style.display = 'block';
    
    userNameEl.textContent = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User';
    userEmailEl.textContent = currentUser.email || '';
    userAvatarEl.src = currentUser.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzLjk5IDcuMDEgMTUuNzggNi4yMiAxOC4zOUM2LjA5IDE4Ljc5IDYuNDIgMTkuMTcgNi44NCAxOS4xN0gxNy4xNkMxNy41OCAxOS4xNyAxNy45MSAxOC43OSAxNy43OCAxOC4zOUMxNi45OSAxNS43OCAxNC42NyAxMy45OSAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo=';
  } else {
    // User is signed out
    signedOutSection.style.display = 'block';
    signedInSection.style.display = 'none';
  }
}

// Initialize Supabase if not already done
async function ensureSupabaseInitialized() {
  if (!supabaseResumeManager && currentUser) {
    try {
      supabaseResumeManager = new SupabaseResumeManager();
      await supabaseResumeManager.initialize(currentUser.id);
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }
  return !!supabaseResumeManager;
}

// Handle resume file upload
async function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const statusElement = document.getElementById('resumeStatus');
  
  try {
    // Check if user is authenticated
    if (!currentUser) {
      statusElement.innerHTML = '<p class="status-text">❌ Please sign in with Google to upload resumes.</p>';
      return;
    }
    
    // Show loading state
    statusElement.innerHTML = '<p class="status-text">📤 Uploading resume...</p>';
    
    // Ensure Supabase is initialized
    const supabaseReady = await ensureSupabaseInitialized();
    if (!supabaseReady) {
      console.log('ℹ️ Supabase not available, using local storage fallback');
    }
    
    // Read file content
    const fileContent = await readFileContent(file);
    
    // Parse resume data based on file type
    const resumeData = await parseResumeContent(fileContent, file.type, file.name);
    
    // Save resume using Supabase Resume Manager
    let savedResume;
    if (supabaseResumeManager) {
      savedResume = await supabaseResumeManager.createResume(
        'general', 
        resumeData, 
        file.name, 
        file.size, 
        file.type
      );
      
      // Set as active if it's the first resume
      const allResumes = await supabaseResumeManager.getAllResumes();
      if (allResumes.length === 1) {
        await supabaseResumeManager.setActiveResume(savedResume.id);
      }
    } else {
      // Fallback to local storage
      await saveResumeDataLocal(resumeData, file.name);
    }
    
    // Update UI
    statusElement.innerHTML = '<p class="status-text">✅ Resume uploaded successfully!</p>';
    
    // Refresh resume list
    setTimeout(() => {
      loadResumeStatus();
    }, 1000);
    
  } catch (error) {
    console.error('Resume upload failed:', error);
    statusElement.innerHTML = `<p class="status-text">❌ Upload failed: ${error.message}</p>`;
  }
  
  // Clear file input
  event.target.value = '';
}

// Read file content
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read as text for most formats
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For other formats, we'll need to handle them differently
      // For now, try reading as text
      reader.readAsText(file);
    }
  });
}

// Parse resume content based on file type
async function parseResumeContent(content, fileType, fileName) {
  // Basic text parsing - extract key information
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  const resumeData = {
    name: extractName(lines) || 'Unknown',
    email: extractEmail(content) || '',
    phone: extractPhone(content) || '',
    location: extractLocation(lines) || '',
    linkedin: extractLinkedIn(content) || '',
    professionalSummary: extractSummary(lines) || '',
    workExperience: extractExperience(lines) || [],
    coreSkills: extractSkills(content) || [],
    education: extractEducation(lines) || [],
    fileName: fileName,
    uploadedAt: new Date().toISOString()
  };
  
  return resumeData;
}

// Extract name from resume
function extractName(lines) {
  // Look for name in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like headers or contact info
    if (line.includes('@') || line.includes('http') || line.includes('RESUME') || line.includes('CV')) {
      continue;
    }
    // Look for lines that could be names (2-4 words, proper case)
    if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) {
      return line;
    }
  }
  return null;
}

// Extract email
function extractEmail(content) {
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);  
  return emailMatch ? emailMatch[0] : null;
}

// Extract phone
function extractPhone(content) {
  const phoneMatch = content.match(/[\(]?[0-9]{3}[\)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}

// Extract location
function extractLocation(lines) {
  for (const line of lines) {
    if (line.match(/[A-Z][a-z]+,\s*[A-Z]{2}/) || line.match(/[A-Z][a-z]+,\s*[A-Z][a-z]+/)) {
      return line;
    }
  }
  return null;
}

// Extract LinkedIn
function extractLinkedIn(content) {
  const linkedinMatch = content.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
  return linkedinMatch ? `https://${linkedinMatch[0]}` : null;
}

// Extract professional summary
function extractSummary(lines) {
  const summaryKeywords = ['summary', 'profile', 'objective', 'about'];
  let summaryStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      summaryStart = i + 1;
      break;
    }
  }
  
  if (summaryStart > -1) {
    const summaryLines = [];
    for (let i = summaryStart; i < lines.length && i < summaryStart + 5; i++) {
      if (lines[i] && !lines[i].match(/^[A-Z\s]+$/)) {
        summaryLines.push(lines[i]);
      } else {
        break;
      }
    }
    return summaryLines.join(' ');
  }
  
  return null;
}

// Extract work experience
function extractExperience(lines) {
  const experience = [];
  const experienceKeywords = ['experience', 'employment', 'work history'];
  let experienceStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      experienceStart = i + 1;
      break;
    }
  }
  
  if (experienceStart > -1) {
    // Simple extraction - look for job titles and companies
    for (let i = experienceStart; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/\d{4}/) && (line.includes('-') || line.includes('to'))) {
        // This looks like a date range
        const prevLine = lines[i-1];
        if (prevLine) {
          experience.push({
            title: prevLine,
            duration: line,
            description: lines[i+1] || ''
          });
        }
      }
    }
  }
  
  return experience;
}

// Extract skills
function extractSkills(content) {
  const skillsKeywords = ['skills', 'technologies', 'technical skills', 'core competencies'];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (skillsKeywords.some(keyword => line.includes(keyword))) {
      // Look for skills in next few lines
      const skillsText = lines.slice(i+1, i+5).join(' ');
      const skills = skillsText.split(/[,;\n]/).map(s => s.trim()).filter(s => s && s.length > 1);
      return skills.slice(0, 20); // Limit to 20 skills
    }
  }
  
  return [];
}

// Extract education
function extractEducation(lines) {
  const education = [];
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      // Look for degree information in next few lines
      for (let j = i+1; j < Math.min(i+5, lines.length); j++) {
        const eduLine = lines[j];
        if (eduLine.match(/\d{4}/) || eduLine.toLowerCase().includes('degree')) {
          education.push({
            degree: eduLine,
            school: lines[j+1] || '',
            year: eduLine.match(/\d{4}/) ? eduLine.match(/\d{4}/)[0] : ''
          });
        }
      }
      break;
    }
  }
  
  return education;
}

// Fallback: Save resume data using local storage
async function saveResumeDataLocal(resumeData, fileName) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      reject(new Error('Chrome storage not available'));
      return;
    }
    
    // Send message to content script to handle resume saving
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'saveResume',
        resumeData: resumeData,
        fileName: fileName
      }, function(response) {
        if (chrome.runtime.lastError) {
          reject(new Error('Failed to communicate with content script'));
        } else if (response && response.success) {
          resolve(response.resumeId);
        } else {
          reject(new Error(response?.error || 'Failed to save resume'));
        }
      });
    });
  });
}

// Load resume status
async function loadResumeStatus() {
  const statusElement = document.getElementById('resumeStatus');
  
  try {
    // Check if user is authenticated
    if (!currentUser) {
      statusElement.innerHTML = '<p class="status-text">🔐 Please sign in with Google to manage resumes</p>';
      return;
    }
    
    // Try Supabase first
    if (supabaseResumeManager) {
      const resumes = await supabaseResumeManager.getAllResumes();
      const activeResume = await supabaseResumeManager.getActiveResume();
      
      if (resumes.length > 0) {
        const resumeList = resumes.map(resume => {
          const isActive = activeResume && activeResume.id === resume.id;
          return `
            <div class="resume-item">
              <span class="resume-name">${resume.name} ${isActive ? '(Active)' : ''}</span>
              <div class="resume-actions">
                ${!isActive ? `<button class="resume-action-btn set-active-btn" onclick="setActiveResume('${resume.id}')">Set Active</button>` : ''}
                <button class="resume-action-btn delete-btn" onclick="deleteResume('${resume.id}')">Delete</button>
              </div>
            </div>
          `;
        }).join('');
        
        statusElement.innerHTML = `
          <div class="resume-list">
            ${resumeList}
          </div>
        `;
      } else {
        statusElement.innerHTML = '<p class="status-text">No resume uploaded yet</p>';
      }
      return;
    }
    
    // Fallback to Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['hireHeat_resumes'], function(result) {
        if (result.hireHeat_resumes) {
          try {
            statusElement.innerHTML = '<p class="status-text">✅ Resumes available - Click "View Resumes" to manage</p>';
          } catch (error) {
            statusElement.innerHTML = '<p class="status-text">⚠️ Resume data found but encrypted</p>';
          }
        } else {
          statusElement.innerHTML = '<p class="status-text">No resume uploaded yet</p>';
        }
      });
    } else {
      statusElement.innerHTML = '<p class="status-text">Demo mode - Resume features not available</p>';
    }
    
  } catch (error) {
    console.error('Failed to load resume status:', error);
    statusElement.innerHTML = '<p class="status-text">❌ Failed to load resume status</p>';
  }
}

// Toggle resume view
function toggleResumeView() {
  // For now, just show a message about opening options page
  alert('Resume management will open in the options page. This feature is coming soon!');
  
  // In the future, this could open the options page:
  // chrome.runtime.openOptionsPage();
}

// Set active resume
async function setActiveResume(resumeId) {
  try {
    if (supabaseResumeManager) {
      await supabaseResumeManager.setActiveResume(resumeId);
      loadResumeStatus(); // Refresh the display
    }
  } catch (error) {
    console.error('Failed to set active resume:', error);
    alert('Failed to set active resume: ' + error.message);
  }
}

// Delete resume
async function deleteResume(resumeId) {
  if (confirm('Are you sure you want to delete this resume?')) {
    try {
      if (supabaseResumeManager) {
        await supabaseResumeManager.deleteResume(resumeId);
        loadResumeStatus(); // Refresh the display
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
      alert('Failed to delete resume: ' + error.message);
    }
  }
}

// Make functions globally available
window.setActiveResume = setActiveResume;
window.deleteResume = deleteResume;

// Initialize resume management functionality
function initializeResumeManagement() {
  const uploadBtn = document.getElementById('uploadResumeBtn');
  const viewBtn = document.getElementById('viewResumesBtn');
  const fileInput = document.getElementById('resumeFileInput');
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', handleResumeUpload);
  }
  
  if (viewBtn) {
    viewBtn.addEventListener('click', toggleResumeView);
  }
  
  // Add Google sign-in/sign-out event listeners
  if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
      const statusDiv = document.getElementById('status');
      
      try {
        // Clear previous status
        if (statusDiv) {
          statusDiv.innerHTML = '';
        }
        
        // Show loading state
        signInBtn.disabled = true;
        signInBtn.textContent = '🔄 Signing in...';
        
        // Debug: Check if we're in extension context
        const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
        console.log('Extension context:', isExtension);
        
        // Debug: Check if Supabase is available
        console.log('Supabase available:', typeof window.supabase !== 'undefined');
        console.log('signInWithGoogle function available:', typeof signInWithGoogle === 'function');
        
        if (!isExtension) {
          throw new Error('This feature requires the extension to be loaded in Chrome. Please go to chrome://extensions/, enable Developer mode, and load this extension.');
        }
        
        if (typeof signInWithGoogle === 'function') {
          // Show intermediate status
          if (statusDiv) {
            statusDiv.innerHTML = '<div class="info">🔄 Opening Google sign-in...</div>';
          }
          
          // Start OAuth but do not block the UI waiting for completion
          signInWithGoogle()
            .then(() => {
              if (statusDiv) {
                statusDiv.innerHTML = '<div class="info">✅ OAuth started. Complete sign-in in the opened window/tab. This popup will update automatically after sign-in.</div>';
              }
            })
            .catch((error) => {
              console.error('❌ Sign-in start failed:', error);
              let message = error?.message || 'Failed to start Google sign-in.';
              // Handle common Chrome Identity error more gracefully
              if (/authorization page could not be loaded/i.test(message)) {
                message = 'Could not open the authorization page. Please ensure the redirect URL https://<your-extension-id>.chromiumapp.org/supabase-callback is added to Supabase Authentication → URL Configuration → Redirect URLs.';
              }
              if (statusDiv) {
                statusDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
              }
            })
            .finally(() => {
              // Reset button state after launching flow
              signInBtn.disabled = false;
              signInBtn.textContent = '🔑 Sign in with Google';
            });
          
          return; // We handled UI updates in the promise chain
        } else {
          throw new Error('Google sign-in function not available. Please check if Supabase is properly loaded.');
        }
      } catch (error) {
        console.error('❌ Sign-in failed:', error);
        
        // Show detailed error message with troubleshooting
        let errorMessage = error.message;
        let troubleshooting = '';
        
        if (error.message.includes('database setup failed')) {
          troubleshooting = '<br><br>🔧 <strong>Troubleshooting:</strong><br>1. Run the supabase-schema.sql file in your Supabase SQL Editor<br>2. Check that Google OAuth is configured in Supabase Authentication<br>3. Use the verify-database-setup.html tool to diagnose issues';
        } else if (error.message.includes('timeout')) {
          troubleshooting = '<br><br>🔧 <strong>Try:</strong><br>1. Check your internet connection<br>2. Verify Google OAuth configuration<br>3. Try signing in again';
        }
        
        if (statusDiv) {
          statusDiv.innerHTML = `<div class="error">❌ ${errorMessage}${troubleshooting}</div>`;
        }
      } finally {
        // If we returned early above, button state is handled there; this is a safety reset
        signInBtn.disabled = false;
        signInBtn.textContent = '🔑 Sign in with Google';
      }
    });
  }
  
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        if (typeof signOut === 'function') {
          await signOut();
        } else {
          console.warn('Sign-out not available');
        }
      } catch (error) {
        console.error('Sign-out failed:', error);
      }
    });
  }
  
  // Load existing resumes
  loadResumeStatus();
}

function checkExtensionStatus() {
  // Check if running in Chrome extension environment
  if (typeof chrome === 'undefined' || !chrome.storage) {
    // Running in browser preview - show demo status
    const statusText = document.getElementById('statusText');
    const activateBtn = document.getElementById('activateBtn');
    if (statusText) statusText.textContent = 'HireHeat AI - Powered by Gemini Pro 2.5';
    if (activateBtn) activateBtn.textContent = 'Demo Mode';
    return;
  }
  
  // First check the extension's active state
  chrome.storage.local.get(['hireHeatActive'], function(result) {
    const isActive = result.hireHeatActive !== false; // Default to true if not set
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const statusText = document.getElementById('statusText');
      const activateBtn = document.getElementById('activateBtn');
      
      if (currentTab.url.includes('linkedin.com')) {
        if (isActive) {
          statusText.textContent = 'HireHeat is active on LinkedIn';
          activateBtn.textContent = 'Deactivate HireHeat';
          activateBtn.className = 'deactivate-btn';
        } else {
          statusText.textContent = 'HireHeat is inactive - click to activate';
          activateBtn.textContent = 'Activate HireHeat';
          activateBtn.className = 'activate-btn';
        }
        activateBtn.disabled = false;
      } else {
        statusText.textContent = 'Navigate to LinkedIn to use HireHeat';
        activateBtn.textContent = 'Go to LinkedIn';
        activateBtn.className = 'navigate-btn';
        activateBtn.disabled = false;
      }
    });
  });
}

// AI Configuration - Gemini Pro 2.5 (No configuration needed)
// AI is now always enabled with built-in Gemini Pro 2.5

// AI Configuration functions removed - Gemini Pro 2.5 is always active

function toggleExtension() {
  // Check if running in Chrome extension environment
  if (typeof chrome === 'undefined' || !chrome.storage) {
    alert('This is a demo preview. Install the extension to use HireHeat on LinkedIn.');
    return;
  }
  
  chrome.storage.local.get(['hireHeatActive'], function(result) {
    const isCurrentlyActive = result.hireHeatActive !== false;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const statusText = document.getElementById('statusText');
      const activateBtn = document.getElementById('activateBtn');
      
      if (currentTab.url.includes('linkedin.com')) {
        if (isCurrentlyActive) {
          // Deactivate
          chrome.storage.local.set({hireHeatActive: false}, function() {
            chrome.tabs.sendMessage(currentTab.id, {type: 'DEACTIVATE_HIREHEAT'});
            statusText.textContent = 'HireHeat deactivated';
            activateBtn.textContent = 'Activate HireHeat';
            activateBtn.className = 'activate-btn';
          });
        } else {
          // Activate
          chrome.storage.local.set({hireHeatActive: true}, function() {
            chrome.tabs.sendMessage(currentTab.id, {type: 'ACTIVATE_HIREHEAT'}, function(response) {
              if (chrome.runtime.lastError) {
                statusText.textContent = 'Please reload the LinkedIn page';
                activateBtn.textContent = 'Reload Required';
              } else {
                statusText.textContent = 'HireHeat activated!';
                activateBtn.textContent = 'Deactivate HireHeat';
                activateBtn.className = 'deactivate-btn';
              }
            });
          });
        }
      } else {
        // Navigate to LinkedIn
        chrome.tabs.update(currentTab.id, {url: 'https://www.linkedin.com/jobs/'});
      }
    });
  });
}