// HireHeat - Job Competition Tracker v2.0
console.log('🔥 HireHeat v2.0 - Advanced job competition tracking');

// Global settings
let settings = {
  trackingEnabled: true,
  autoRefresh: true,
  refreshInterval: 30000,
  showNotifications: true,
  coldThreshold: 5,
  hotThreshold: 15
};

// Load settings from storage
if (typeof chrome !== 'undefined' && chrome.runtime) {
  try {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Extension context invalidated, using default settings');
        return;
      }
      if (response) {
        settings = { ...settings, ...response };
        console.log('⚙️ Settings loaded:', settings);
      }
    });
  } catch (error) {
    console.log('Failed to load settings, using defaults:', error.message);
  }
} else {
  console.log('Chrome runtime not available, using default settings');
}

// Suppress the chrome-extension://invalid/ error spam
const originalConsoleError = console.error;
console.error = function (...args) {
  // Filter out the chrome-extension://invalid/ errors
  const message = args[0];
  if (typeof message === 'string' && message.includes('chrome-extension://invalid/')) {
    return; // Don't log these errors
  }
  originalConsoleError.apply(console, args);
};

// Also suppress network errors in the console
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  const message = args[0];
  if (typeof message === 'string' && message.includes('chrome-extension://invalid/')) {
    return; // Don't log these warnings
  }
  originalConsoleWarn.apply(console, args);
};

// Get job ID from URL - Updated to handle multiple LinkedIn URL patterns
function getJobId() {
  const url = window.location.href;
  console.log('🔍 Checking URL for job ID:', url);
  
  // Pattern 1: currentJobId parameter
  let match = url.match(/currentJobId=(\d+)/);
  if (match) {
    console.log('✅ Found job ID via currentJobId:', match[1]);
    return match[1];
  }
  
  // Pattern 2: /jobs/view/[jobId]
  match = url.match(/\/jobs\/view\/(\d+)/);
  if (match) {
    console.log('✅ Found job ID via /jobs/view/:', match[1]);
    return match[1];
  }
  
  // Pattern 3: /jobs/collections/recommended/?currentJobId=
  match = url.match(/\/jobs\/collections\/.*currentJobId=(\d+)/);
  if (match) {
    console.log('✅ Found job ID via collections currentJobId:', match[1]);
    return match[1];
  }
  
  // Pattern 4: Hash-based routing #/jobs/view/[jobId]
  match = url.match(/#.*\/jobs\/view\/(\d+)/);
  if (match) {
    console.log('✅ Found job ID via hash routing:', match[1]);
    return match[1];
  }
  
  console.log('❌ No job ID found in URL');
  return null;
}

// Show loading state
function showLoadingState() {
  // Remove existing stats
  const existing = document.querySelector('#job-stats-display');
  if (existing) existing.remove();

  // Create loading element
  const loadingElement = document.createElement('div');
  loadingElement.id = 'job-stats-display';
  loadingElement.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #64748b, #475569);
      color: white;
      padding: 18px;
      border-radius: 12px;
      margin: 16px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.2);
      animation: pulse 2s infinite;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 16px;
        font-weight: 600;
      ">
        <div style="
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span>🔥 HireHeat analyzing competition...</span>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      </style>
    </div>
  `;

  // Find where to insert
  const targets = [
    '.jobs-unified-top-card__content',
    '.job-details-jobs-unified-top-card',
    '.jobs-details__main-content'
  ];

  for (const selector of targets) {
    const target = document.querySelector(selector);
    if (target) {
      target.insertBefore(loadingElement, target.firstChild);
      console.log('🔄 Loading state displayed');
      return;
    }
  }
}

// Display job statistics
function showJobStats(jobData) {
  // Remove existing stats (including loading state)
  const existing = document.querySelector('#job-stats-display');
  if (existing) existing.remove();

  // Create stats display
  const statsElement = document.createElement('div');
  statsElement.id = 'job-stats-display';
  // Calculate heat level based on apply rate and user settings
  const applyRate = jobData.views > 0 ? ((jobData.applies / jobData.views) * 100) : 0;
  let heatLevel, heatColor, heatEmoji, heatText;

  if (applyRate < settings.coldThreshold) {
    heatLevel = 'COLD';
    heatColor = 'linear-gradient(135deg, #4ade80, #22c55e)';
    heatEmoji = '❄️';
    heatText = 'Low Competition';
  } else if (applyRate < settings.hotThreshold) {
    heatLevel = 'WARM';
    heatColor = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
    heatEmoji = '🔥';
    heatText = 'Moderate Competition';
  } else {
    heatLevel = 'HOT';
    heatColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
    heatEmoji = '🌡️';
    heatText = 'High Competition';
  }

  statsElement.innerHTML = `
    <div style="
      background: ${heatColor};
      color: white;
      padding: 18px;
      border-radius: 12px;
      margin: 16px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
        ">
          <span style="font-size: 20px;">${heatEmoji}</span>
          <span>HireHeat</span>
        </div>
        <div style="
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${heatLevel} • ${heatText}
        </div>
      </div>
      
      <div style="display: flex; gap: 20px;">
        <div style="text-align: center; flex: 1;">
          <div style="
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 4px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          ">${jobData.applies}</div>
          <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Applications</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 4px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          ">${jobData.views || 0}</div>
          <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Views</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 4px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          ">${applyRate.toFixed(1)}%</div>
          <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Apply Rate</div>
        </div>
      </div>
    </div>
  `;

  // Find where to insert
  const targets = [
    '.jobs-unified-top-card__content',
    '.job-details-jobs-unified-top-card',
    '.jobs-details__main-content'
  ];

  for (const selector of targets) {
    const target = document.querySelector(selector);
    if (target) {
      target.insertBefore(statsElement, target.firstChild);
      console.log('✅ Stats displayed:', jobData.applies, 'applies,', jobData.views, 'views');
      return;
    }
  }
}

// Direct API call with proper headers
async function fetchJobData(jobId) {
  if (!jobId) return null;

  console.log('🔄 Attempting to fetch job data for:', jobId);

  // Try multiple API endpoints and approaches
  const endpoints = [
    // Modern LinkedIn API endpoint
    `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}?decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-65`,
    // Alternative endpoint
    `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}`,
    // Older endpoint format
    `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}?decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-23`
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const apiUrl = endpoints[i];
    console.log(`🔄 Trying endpoint ${i + 1}:`, apiUrl);

    try {
      // Get CSRF token from multiple sources
      let csrfToken = null;
      
      // Try to get from JSESSIONID cookie
      const jsessionMatch = document.cookie.match(/JSESSIONID="([^"]+)"/);
      if (jsessionMatch) {
        csrfToken = jsessionMatch[1];
      }
      
      // Try to get from csrf-token meta tag
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta && !csrfToken) {
        csrfToken = csrfMeta.getAttribute('content');
      }
      
      // Fallback token
      if (!csrfToken) {
        csrfToken = 'ajax:' + Math.random().toString(36).substring(2, 15);
      }
      
      console.log('🔑 Using CSRF token:', csrfToken.substring(0, 10) + '...');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/vnd.linkedin.normalized+json+2.1',
          'csrf-token': csrfToken,
          'x-restli-protocol-version': '2.0.0',
          'x-li-lang': 'en_US',
          'x-requested-with': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      console.log(`📡 Response status for endpoint ${i + 1}:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 API response received:', Object.keys(data));

        // Try different data structure patterns
        let jobData = null;
        
        // Pattern 1: data.data structure
        if (data && data.data && typeof data.data.applies === 'number') {
          jobData = {
            applies: data.data.applies,
            views: data.data.views || 0,
            title: data.data.title || 'LinkedIn Job',
            jobId: jobId,
            lastUpdated: Date.now(),
            url: window.location.href
          };
        }
        // Pattern 2: direct data structure
        else if (data && typeof data.applies === 'number') {
          jobData = {
            applies: data.applies,
            views: data.views || 0,
            title: data.title || 'LinkedIn Job',
            jobId: jobId,
            lastUpdated: Date.now(),
            url: window.location.href
          };
        }
        // Pattern 3: nested in elements
        else if (data && data.elements && data.elements[0]) {
          const element = data.elements[0];
          if (typeof element.applies === 'number') {
            jobData = {
              applies: element.applies,
              views: element.views || 0,
              title: element.title || 'LinkedIn Job',
              jobId: jobId,
              lastUpdated: Date.now(),
              url: window.location.href
            };
          }
        }

        if (jobData) {
          console.log('✅ Successfully extracted job data:', {
            applies: jobData.applies,
            views: jobData.views,
            title: jobData.title
          });

          showJobStats(jobData);
          storeJobData(jobData);
          return jobData;
        } else {
          console.log('⚠️ API response received but no job data found in expected format');
          console.log('Raw data structure:', data);
        }
      } else {
        console.log(`❌ API call failed for endpoint ${i + 1}:`, response.status, response.statusText);
      }
    } catch (error) {
      console.log(`❌ API call error for endpoint ${i + 1}:`, error.message);
    }
  }

  console.log('❌ All API endpoints failed');
  return null;
}

// Extract data from page scripts and DOM elements (comprehensive search)
function extractFromPageScripts() {
  console.log('🔍 Comprehensive data extraction starting...');
  
  const jobId = getJobId();
  if (!jobId) {
    console.log('❌ No job ID available for extraction');
    return false;
  }

  // Method 1: Look for application count in DOM elements
  console.log('🔍 Method 1: Searching DOM elements...');
  const domResult = extractFromDOMElements();
  if (domResult) return domResult;

  // Method 2: Search through all script tags
  console.log('🔍 Method 2: Searching script tags...');
  const scripts = document.querySelectorAll('script');
  console.log(`Searching ${scripts.length} scripts...`);

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (script.textContent) {
      const text = script.textContent;

      // Enhanced patterns for job data
      const patterns = [
        // Application patterns
        /"applies":\s*(\d+)/gi,
        /"numApplicants":\s*(\d+)/gi,
        /"applicationCount":\s*(\d+)/gi,
        /"applicantCount":\s*(\d+)/gi,
        /"totalApplicants":\s*(\d+)/gi,
        /applicants?["']?:\s*(\d+)/gi,
        
        // View patterns
        /"views":\s*(\d+)/gi,
        /"viewCount":\s*(\d+)/gi,
        /"totalViews":\s*(\d+)/gi,
        /views?["']?:\s*(\d+)/gi,
        
        // LinkedIn specific patterns
        /numApplicants["']?:\s*["']?(\d+)/gi,
        /applicantCount["']?:\s*["']?(\d+)/gi
      ];

      let applies = null;
      let views = null;
      let title = null;

      // Extract job title
      const titlePatterns = [
        /"title":\s*"([^"]+)"/gi,
        /"jobTitle":\s*"([^"]+)"/gi,
        /"formattedTitle":\s*"([^"]+)"/gi
      ];
      
      titlePatterns.forEach(pattern => {
        const match = pattern.exec(text);
        if (match && !title) {
          title = match[1];
        }
      });

      // Extract numeric data
      patterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          const value = parseInt(match[1]);
          if (isNaN(value)) return;
          
          const patternStr = pattern.source.toLowerCase();
          if (patternStr.includes('appli') && applies === null) {
            applies = value;
            console.log(`📊 Found applies in script ${i}:`, value);
          } else if (patternStr.includes('view') && views === null) {
            views = value;
            console.log(`👁️ Found views in script ${i}:`, value);
          }
        });
      });

      if (applies !== null) {
        console.log(`✅ Successfully extracted from script ${i}:`, {
          applies,
          views: views || 0,
          title: title || 'LinkedIn Job'
        });
        
        const jobData = {
          applies: applies,
          views: views || 0,
          jobId: jobId,
          title: title || 'LinkedIn Job',
          lastUpdated: Date.now(),
          url: window.location.href
        };

        showJobStats(jobData);
        storeJobData(jobData);
        return true;
      }
    }
  }

  // Method 3: Try to extract from window objects
  console.log('🔍 Method 3: Searching window objects...');
  return extractFromWindowObjects();
}

// Extract from DOM elements that might contain application counts
function extractFromDOMElements() {
  const selectors = [
    // Common selectors for application counts
    '[data-test-id*="applicant"]',
    '[class*="applicant"]',
    '[class*="application"]',
    '.jobs-unified-top-card__applicant-count',
    '.jobs-details-top-card__applicant-count',
    '.job-details-jobs-unified-top-card__primary-description-container',
    '[aria-label*="applicant"]',
    '[aria-label*="application"]',
    // Text-based searches
    '*'
  ];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || element.innerText || '';
        
        // Look for patterns like "X applicants", "X applications", etc.
        const matches = text.match(/(\d+)\s*(?:applicants?|applications?)/i);
        if (matches) {
          const applies = parseInt(matches[1]);
          console.log('✅ Found applicant count in DOM:', applies, 'from element:', element.tagName);
          
          const jobData = {
            applies: applies,
            views: 0,
            jobId: getJobId(),
            title: document.title || 'LinkedIn Job',
            lastUpdated: Date.now(),
            url: window.location.href
          };

          showJobStats(jobData);
          storeJobData(jobData);
          return true;
        }
      }
    } catch (e) {
      // Continue with next selector
    }
  }
  
  return false;
}

// Extract from window objects that LinkedIn might expose
function extractFromWindowObjects() {
  try {
    // Check if LinkedIn exposes any global data
    const windowKeys = Object.keys(window);
    const linkedinKeys = windowKeys.filter(key => 
      key.toLowerCase().includes('linkedin') || 
      key.toLowerCase().includes('voyager') ||
      key.toLowerCase().includes('job')
    );
    
    console.log('🔍 Found LinkedIn-related window objects:', linkedinKeys);
    
    // This is a basic implementation - LinkedIn's actual data structure may vary
    for (const key of linkedinKeys) {
      try {
        const obj = window[key];
        if (obj && typeof obj === 'object') {
          const jsonStr = JSON.stringify(obj);
          const appliesMatch = jsonStr.match(/"applies":(\d+)/i);
          if (appliesMatch) {
            const applies = parseInt(appliesMatch[1]);
            console.log('✅ Found applies in window object:', key, applies);
            
            const jobData = {
              applies: applies,
              views: 0,
              jobId: getJobId(),
              title: 'LinkedIn Job',
              lastUpdated: Date.now(),
              url: window.location.href
            };

            showJobStats(jobData);
            storeJobData(jobData);
            return true;
          }
        }
      } catch (e) {
        // Continue with next key
      }
    }
  } catch (e) {
    console.log('❌ Error searching window objects:', e.message);
  }
  
  return false;
}

// Check if we should run on this page
function isJobPage() {
  const url = window.location.href;
  return url.includes('/jobs/') || url.includes('currentJobId=') || url.includes('localhost');
}

// Monitor job changes and fetch data
let trackerCurrentJobId = null;
let lastProcessedJob = null;
let processingInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 3;
let isExtensionActive = true; // Default to active

// Only initialize job ID if we're on a job page
if (isJobPage()) {
  trackerCurrentJobId = getJobId();
}

// Extension state management
function getExtensionState() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        chrome.storage.local.get(['hireHeatActive'], (result) => {
          if (chrome.runtime.lastError) {
            console.log('Extension context error, defaulting to active state');
            isExtensionActive = true;
            resolve(true);
            return;
          }
          const isActive = result.hireHeatActive !== false; // Default to true if not set
          isExtensionActive = isActive;
          resolve(isActive);
        });
      } catch (error) {
        console.log('Failed to get extension state:', error.message);
        isExtensionActive = true;
        resolve(true);
      }
    } else {
      // Fallback if chrome.storage is not available
      isExtensionActive = true;
      resolve(true);
    }
  });
}

function setExtensionState(active) {
  isExtensionActive = active;
  chrome.storage.local.set({ hireHeatActive: active }, () => {
    logActivity(`🔄 Extension state changed to: ${active ? 'ACTIVE' : 'INACTIVE'}`, 'info');
  });
}

// Activity monitoring
let activityLog = [];
function logActivity(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, message, type };
  activityLog.push(logEntry);
  
  // Keep only last 50 entries
  if (activityLog.length > 50) {
    activityLog = activityLog.slice(-50);
  }
  
  console.log(`[${timestamp}] ${message}`);
}

function processJobChange() {
  // Check if extension is active before processing
  if (!isExtensionActive) {
    logActivity('🔇 Extension is inactive, skipping job processing', 'info');
    return;
  }
  
  const jobId = getJobId();

  if (!jobId) {
    logActivity('❌ No job ID found in current URL', 'error');
    return;
  }

  if (jobId === lastProcessedJob && !processingInProgress) {
    logActivity(`⏭️ Job ${jobId} already processed, skipping`, 'info');
    return;
  }

  if (processingInProgress) {
    logActivity('⏳ Processing already in progress, waiting...', 'warning');
    return;
  }

  logActivity(`🎯 Starting to process job: ${jobId}`, 'info');
  lastProcessedJob = jobId;
  processingInProgress = true;
  retryCount = 0;

  // Show loading state immediately
  showLoadingState();

  // Try multiple approaches with a slight delay for better UX
  setTimeout(async () => {
    await attemptDataExtraction(jobId);
  }, 800);
}

async function attemptDataExtraction(jobId) {
  logActivity(`🔄 Attempt ${retryCount + 1}/${MAX_RETRIES} for job ${jobId}`, 'info');
  
  try {
    // 1. Try direct API call
    logActivity('📡 Trying API extraction...', 'info');
    const apiData = await fetchJobData(jobId);

    if (apiData) {
      logActivity('✅ API extraction successful', 'success');
      processingInProgress = false;
      return;
    }

    // 2. Try extracting from page scripts and DOM
    logActivity('🔍 Trying script/DOM extraction...', 'info');
    const scriptData = extractFromPageScripts();

    if (scriptData) {
      logActivity('✅ Script/DOM extraction successful', 'success');
      processingInProgress = false;
      return;
    }

    // 3. If all methods failed, retry or show error
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      logActivity(`⏳ Retrying in 2 seconds... (${retryCount}/${MAX_RETRIES})`, 'warning');
      setTimeout(() => attemptDataExtraction(jobId), 2000);
    } else {
      logActivity('❌ All extraction methods failed after maximum retries', 'error');
      showErrorState();
      processingInProgress = false;
    }
  } catch (error) {
    logActivity(`❌ Error during extraction: ${error.message}`, 'error');
    processingInProgress = false;
    showErrorState();
  }
}

// Enhanced job change detection
let urlCheckInterval;
let domObserver;

function startMonitoring() {
  logActivity('🚀 Starting HireHeat monitoring system', 'info');
  
  // Initialize current job ID to prevent initial false positives
  trackerCurrentJobId = getJobId();
  
  // Method 1: URL polling (more frequent for SPA)
  urlCheckInterval = setInterval(() => {
    const newJobId = getJobId();
    if (newJobId && newJobId !== trackerCurrentJobId) {
      logActivity(`🔄 Job change detected: ${trackerCurrentJobId} -> ${newJobId}`, 'info');
      trackerCurrentJobId = newJobId;
      processJobChange();
    }
  }, 1000); // Reduced frequency to 1 second to prevent spam
  
  // Method 1.5: Listen for navigation events (LinkedIn SPA)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      const newJobId = getJobId();
      if (newJobId && newJobId !== trackerCurrentJobId) {
        logActivity(`🔄 Navigation detected new job: ${newJobId}`, 'info');
        trackerCurrentJobId = newJobId;
        processJobChange();
      }
    }, 500);
  });
  
  // Override pushState and replaceState to catch programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      const newJobId = getJobId();
      if (newJobId && newJobId !== trackerCurrentJobId) {
        logActivity(`🔄 PushState detected new job: ${newJobId}`, 'info');
        trackerCurrentJobId = newJobId;
        processJobChange();
      }
    }, 500);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      const newJobId = getJobId();
      if (newJobId && newJobId !== trackerCurrentJobId) {
        logActivity(`🔄 ReplaceState detected new job: ${newJobId}`, 'info');
        trackerCurrentJobId = newJobId;
        processJobChange();
      }
    }, 500);
  };
  
  // Method 2: DOM observation for better responsiveness
  if (typeof MutationObserver !== 'undefined') {
    domObserver = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes might indicate a job page change
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              if (element.classList && (
                element.classList.contains('jobs-details') ||
                element.classList.contains('jobs-unified-top-card') ||
                element.querySelector && element.querySelector('[data-job-id]')
              )) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldCheck) {
        const newJobId = getJobId();
        if (newJobId && newJobId !== trackerCurrentJobId) {
          logActivity(`🔄 DOM change detected new job: ${newJobId}`, 'info');
          trackerCurrentJobId = newJobId;
          processJobChange();
        }
      }
    });
    
    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    logActivity('👁️ DOM observer started', 'info');
  }
}

// Initialize extension with proper timing and retry mechanism
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

async function initializeExtension() {
  // Check if we should run on this page first
  if (!isJobPage()) {
    logActivity('❌ Not on a job page, skipping initialization', 'info');
    return;
  }
  
  // Check extension state
  const isActive = await getExtensionState();
  if (!isActive) {
    logActivity('🔇 Extension is inactive, skipping initialization', 'info');
    return;
  }
  
  initializationAttempts++;
  logActivity(`🔥 HireHeat extension initialized (attempt ${initializationAttempts})`, 'info');
  
  trackerCurrentJobId = getJobId();
  logActivity(`Initial job ID: ${trackerCurrentJobId || 'none'}`, 'info');
  
  // Check if we're actually on LinkedIn or localhost (for testing)
  if (!window.location.href.includes('linkedin.com') && !window.location.href.includes('localhost')) {
    logActivity('❌ Not on LinkedIn or localhost, skipping initialization', 'warn');
    return;
  }
  
  if (trackerCurrentJobId) {
    // Wait a bit for page to fully load before processing
    setTimeout(() => {
      processJobChange();
    }, 2000);
  } else if (initializationAttempts < MAX_INIT_ATTEMPTS) {
    // Retry initialization if no job ID found and we haven't exceeded max attempts
    logActivity(`🔄 No job ID found, retrying initialization in 3 seconds...`, 'info');
    setTimeout(initializeExtension, 3000);
    return;
  }
  
  // Start monitoring
  startMonitoring();
  
  // Set up periodic health check
  setInterval(async () => {
    // Check if extension is active
    const isActive = await getExtensionState();
    if (!isActive) {
      return; // Skip health check if extension is inactive
    }
    
    if (isJobPage() && !trackerCurrentJobId) {
      const newJobId = getJobId();
      if (newJobId) {
        logActivity(`🔄 Health check found job ID: ${newJobId}`, 'info');
        trackerCurrentJobId = newJobId;
        processJobChange();
      }
    }
  }, 10000); // Check every 10 seconds
}

// Multiple initialization strategies
function startInitialization() {
  // Strategy 1: Immediate if page is ready
  if (document.readyState === 'complete') {
    setTimeout(initializeExtension, 500);
  }
  // Strategy 2: Wait for DOMContentLoaded
  else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeExtension, 1000);
    });
  }
  // Strategy 3: Wait for load event
  else {
    setTimeout(initializeExtension, 1500);
  }
  
  // Strategy 4: Fallback initialization after delay
  setTimeout(() => {
    if (initializationAttempts === 0) {
      logActivity('🔄 Fallback initialization triggered', 'info');
      initializeExtension();
    }
  }, 5000);
}

startInitialization();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (urlCheckInterval) clearInterval(urlCheckInterval);
  if (domObserver) domObserver.disconnect();
  logActivity('🛑 HireHeat monitoring stopped', 'info');
});

// Expose activity log for debugging
window.HireHeatDebug = {
  getActivityLog: () => activityLog,
  getCurrentJobId: () => trackerCurrentJobId,
  forceProcess: () => processJobChange(),
  clearLog: () => { activityLog = []; }
};

// Show error state when data can't be loaded
function showErrorState() {
  // Remove existing stats
  const existing = document.querySelector('#job-stats-display');
  if (existing) existing.remove();

  // Create error element with enhanced debugging
  const errorElement = document.createElement('div');
  errorElement.id = 'job-stats-display';
  errorElement.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      padding: 18px;
      border-radius: 12px;
      margin: 16px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
      ">
        <span style="font-size: 20px;">⚠️</span>
        <span>🔥 HireHeat - Data Unavailable</span>
      </div>
      
      <div style="
        font-size: 14px;
        line-height: 1.4;
        opacity: 0.9;
        margin-bottom: 16px;
      ">
        Unable to fetch job competition data. This might be due to:
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>LinkedIn's updated security measures</li>
          <li>Changes to their API structure</li>
          <li>Network connectivity issues</li>
          <li>Job page not fully loaded</li>
        </ul>
      </div>
      
      <div style="
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      ">
        <button id="retry-fetch" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        ">🔄 Retry</button>
        
        <button id="debug-info" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        ">🐛 Debug Info</button>
        
        <button id="force-extract" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        ">🔍 Force Extract</button>
      </div>
      
      <div id="debug-output" style="
        display: none;
        background: rgba(0, 0, 0, 0.3);
        padding: 12px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 11px;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
      "></div>
    </div>
  `;

  // Find where to insert
  const targets = [
    '.jobs-unified-top-card__content',
    '.job-details-jobs-unified-top-card',
    '.jobs-details__main-content'
  ];

  for (const selector of targets) {
    const target = document.querySelector(selector);
    if (target) {
      target.insertBefore(errorElement, target.firstChild);
      console.log('⚠️ Error state displayed');
      
      // Add event listeners for buttons
      setupErrorStateButtons();
      return;
    }
  }
}

// Setup button functionality for error state
function setupErrorStateButtons() {
  const retryBtn = document.getElementById('retry-fetch');
  const debugBtn = document.getElementById('debug-info');
  const forceBtn = document.getElementById('force-extract');
  
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      console.log('🔄 Manual retry triggered');
      processJobChange();
    });
  }
  
  if (debugBtn) {
    debugBtn.addEventListener('click', () => {
      const debugOutput = document.getElementById('debug-output');
      if (debugOutput) {
        if (debugOutput.style.display === 'none') {
          debugOutput.style.display = 'block';
          debugOutput.textContent = generateDebugInfo();
          debugBtn.textContent = '🐛 Hide Debug';
        } else {
          debugOutput.style.display = 'none';
          debugBtn.textContent = '🐛 Debug Info';
        }
      }
    });
  }
  
  if (forceBtn) {
    forceBtn.addEventListener('click', () => {
      console.log('🔍 Force extraction triggered');
      forceDataExtraction();
    });
  }
}

// Generate comprehensive debug information
function generateDebugInfo() {
  const jobId = getJobId();
  const url = window.location.href;
  const userAgent = navigator.userAgent;
  const cookies = document.cookie;
  
  let debugInfo = `🔥 HireHeat Debug Information\n`;
  debugInfo += `=================================\n\n`;
  debugInfo += `URL: ${url}\n`;
  debugInfo += `Job ID: ${jobId || 'NOT FOUND'}\n`;
  debugInfo += `User Agent: ${userAgent}\n`;
  debugInfo += `Has Cookies: ${cookies ? 'Yes' : 'No'}\n`;
  debugInfo += `CSRF Token Available: ${document.cookie.includes('JSESSIONID') ? 'Yes' : 'No'}\n\n`;
  
  // Check for common LinkedIn elements
  const commonSelectors = [
    '.jobs-details-top-card__content',
    '.jobs-unified-top-card__content',
    '.job-details-jobs-unified-top-card__container',
    '[data-test-id*="applicant"]',
    '[class*="applicant"]'
  ];
  
  debugInfo += `DOM Elements Check:\n`;
  commonSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    debugInfo += `${selector}: ${elements.length} found\n`;
  });
  
  debugInfo += `\nScript Tags: ${document.querySelectorAll('script').length}\n`;
  debugInfo += `Extension Loaded: ${typeof chrome !== 'undefined' ? 'Yes' : 'No'}\n`;
  debugInfo += `Storage Available: ${typeof chrome !== 'undefined' && chrome.storage ? 'Yes' : 'No'}\n`;
  
  return debugInfo;
}

// Force data extraction using all available methods
function forceDataExtraction() {
  console.log('🔍 Force extraction starting...');
  
  // Try a more aggressive DOM search
  const allElements = document.querySelectorAll('*');
  console.log(`Searching ${allElements.length} DOM elements...`);
  
  for (const element of allElements) {
    const text = element.textContent || element.innerText || '';
    
    // Look for any number followed by "applicant" or "application"
    const matches = text.match(/(\d+)\s*(?:applicants?|applications?|people\s+applied)/i);
    if (matches && matches[1]) {
      const applies = parseInt(matches[1]);
      if (applies > 0 && applies < 100000) { // Reasonable range
        console.log('✅ Force extraction found:', applies, 'from text:', text.substring(0, 100));
        
        const jobData = {
          applies: applies,
          views: 0,
          jobId: getJobId() || 'unknown',
          title: document.title || 'LinkedIn Job',
          lastUpdated: Date.now(),
          url: window.location.href,
          extractionMethod: 'force'
        };

        showJobStats(jobData);
        storeJobData(jobData);
        return;
      }
    }
  }
  
  console.log('❌ Force extraction failed - no data found');
  alert('Force extraction completed but no job data was found. The page might not contain application counts or they may be loaded dynamically.');
}

// Listen for messages from popup or background
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.type === 'GET_JOB_DATA') {
        const jobId = getJobId();
        if (jobId) {
          chrome.storage.local.get([jobId], (result) => {
            if (chrome.runtime.lastError) {
              console.log('Storage error:', chrome.runtime.lastError.message);
              sendResponse(null);
              return;
            }
            sendResponse(result[jobId] || null);
          });
        } else {
          sendResponse(null);
        }
        return true; // Keep message channel open for async response
  } else if (message.type === 'ACTIVATE_HIREHEAT') {
    logActivity('🔥 HireHeat activated via popup', 'info');
    setExtensionState(true);
    
    // Force process current job if on a job page
    const jobId = getJobId();
    if (jobId) {
      logActivity(`🎯 Processing job ${jobId} after activation`, 'info');
      processJobChange();
      sendResponse({ success: true, message: 'HireHeat activated and processing job' });
    } else {
      logActivity('ℹ️ HireHeat activated but not on a job page', 'info');
      sendResponse({ success: true, message: 'HireHeat activated - navigate to a job posting to see data' });
    }
    return true;
  } else if (message.type === 'DEACTIVATE_HIREHEAT') {
    logActivity('🔇 HireHeat deactivated via popup', 'info');
    setExtensionState(false);
    
    // Remove any existing HireHeat displays
    const existing = document.querySelector('#job-stats-display');
    if (existing) {
      existing.remove();
      logActivity('🧹 Removed HireHeat display from page', 'info');
    }
    
    sendResponse({ success: true, message: 'HireHeat deactivated' });
    return true;
  }
    } catch (error) {
      console.log('Message handler error:', error.message);
      sendResponse({ success: false, error: error.message });
    }
  });
} else {
  console.log('Chrome runtime not available for message handling');
}

// Store job data for popup and notify background
function storeJobData(jobData) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({
      [jobData.jobId]: jobData
    }, () => {
      console.log('📦 Job data stored for popup');
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'JOB_DATA_UPDATED',
        data: jobData
      });
      
      // Show notification for cold jobs if enabled
      if (settings.showNotifications && jobData.views > 0) {
        const applyRate = (jobData.applies / jobData.views) * 100;
        if (applyRate < settings.coldThreshold) {
          showColdJobNotification(jobData, applyRate);
        }
      }
    });
  }
}

// Show notification for cold jobs
function showColdJobNotification(jobData, applyRate) {
  // Create a subtle in-page notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 18px;">❄️</span>
      <strong>Cold Job Alert!</strong>
    </div>
    <div style="font-size: 12px; opacity: 0.9;">
      Only ${applyRate.toFixed(1)}% apply rate - Great opportunity!
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  console.log('🎯 Cold job notification shown');
}

console.log('✅ Extension ready - will try direct API calls and script extraction');