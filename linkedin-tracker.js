// HireHeat - Job Competition Tracker
console.log('� HirkeHeat - Tracking job competition heat');

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

// Get job ID from URL
function getJobId() {
  const match = window.location.href.match(/currentJobId=(\d+)/);
  return match ? match[1] : null;
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
  // Calculate heat level based on apply rate
  const applyRate = jobData.views > 0 ? ((jobData.applies / jobData.views) * 100) : 0;
  let heatLevel, heatColor, heatEmoji, heatText;

  if (applyRate < 5) {
    heatLevel = 'COLD';
    heatColor = 'linear-gradient(135deg, #4ade80, #22c55e)';
    heatEmoji = '❄️';
    heatText = 'Low Competition';
  } else if (applyRate < 15) {
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

  const apiUrl = `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}?decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-65&topN=1&topNRequestedFlavors=List(TOP_APPLICANT,IN_NETWORK,COMPANY_RECRUIT,SCHOOL_RECRUIT,HIDDEN_GEM,ACTIVELY_HIRING_COMPANY)`;

  console.log('🔄 Making direct API call for job:', jobId);

  try {
    // Get CSRF token from cookies
    const csrfToken = document.cookie.match(/JSESSIONID="([^"]+)"/)?.[1] || 'ajax:0500620337376533791';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/vnd.linkedin.normalized+json+2.1',
        'csrf-token': csrfToken,
        'x-restli-protocol-version': '2.0.0',
        'x-li-lang': 'en_US'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📊 Direct API success');

      if (data && data.data && typeof data.data.applies === 'number') {
        console.log('✅ Found job data:', {
          applies: data.data.applies,
          views: data.data.views,
          title: data.data.title
        });

        const jobData = {
          applies: data.data.applies,
          views: data.data.views || 0,
          title: data.data.title,
          jobId: jobId,
          lastUpdated: Date.now(),
          url: window.location.href
        };

        showJobStats(jobData);

        // Store for popup
        storeJobData(jobData);

        return data.data;
      }
    } else {
      console.log('❌ API call failed:', response.status);
    }
  } catch (error) {
    console.log('❌ API call error');
  }

  return null;
}

// Extract data from page scripts (more aggressive search)
function extractFromPageScripts() {
  console.log('🔍 Aggressive script search...');

  // Look in all script tags for job data
  const scripts = document.querySelectorAll('script');
  console.log(`Searching ${scripts.length} scripts...`);

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (script.textContent) {
      const text = script.textContent;

      // Look for various patterns that might contain job data
      const patterns = [
        /"applies":\s*(\d+)/g,
        /"numApplicants":\s*(\d+)/g,
        /"applicationCount":\s*(\d+)/g,
        /"views":\s*(\d+)/g,
        /"viewCount":\s*(\d+)/g
      ];

      let applies = null;
      let views = null;

      patterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          const value = parseInt(match[1]);
          if (pattern.source.includes('appli')) {
            applies = value;
          } else if (pattern.source.includes('view')) {
            views = value;
          }
        });
      });

      if (applies !== null) {
        console.log(`✅ Found applies in script ${i}:`, applies, 'views:', views);
        const jobData = {
          applies: applies,
          views: views || 0,
          jobId: getJobId(),
          title: 'Job from page script',
          lastUpdated: Date.now(),
          url: window.location.href
        };

        showJobStats(jobData);
        storeJobData(jobData);
        return true;
      }
    }
  }

  return false;
}

// Monitor job changes and fetch data
let currentJobId = getJobId();
let lastProcessedJob = null;

function processJobChange() {
  const jobId = getJobId();

  if (jobId && jobId !== lastProcessedJob) {
    console.log('🎯 Processing job:', jobId);
    lastProcessedJob = jobId;

    // Show loading state immediately
    showLoadingState();

    // Try multiple approaches with a slight delay for better UX
    setTimeout(async () => {
      // 1. Try direct API call
      const apiData = await fetchJobData(jobId);

      if (!apiData) {
        // 2. Try extracting from page scripts
        const scriptData = extractFromPageScripts();

        if (!scriptData) {
          console.log('❌ Could not get job data from any method');
          showErrorState();
        }
      }
    }, 800);
  }
}

// Check for job changes
setInterval(() => {
  const newJobId = getJobId();
  if (newJobId !== currentJobId) {
    console.log('Job changed:', currentJobId, '->', newJobId);
    currentJobId = newJobId;
    processJobChange();
  }
}, 1000);

// Process initial job
console.log('Initial job ID:', currentJobId);
if (currentJobId) {
  processJobChange();
}

// Show error state when data can't be loaded
function showErrorState() {
  // Remove existing stats
  const existing = document.querySelector('#job-stats-display');
  if (existing) existing.remove();

  // Create error element
  const errorElement = document.createElement('div');
  errorElement.id = 'job-stats-display';
  errorElement.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #6b7280, #4b5563);
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
        justify-content: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
      ">
        <span style="font-size: 20px;">⚠️</span>
        <span>HireHeat - Data temporarily unavailable</span>
      </div>
      <div style="
        text-align: center;
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.8;
      ">
        Try refreshing the page or switching to another job
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
      target.insertBefore(errorElement, target.firstChild);
      console.log('⚠️ Error state displayed');
      return;
    }
  }
}

// Store job data for popup
function storeJobData(jobData) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({
      [jobData.jobId]: jobData
    }, () => {
      console.log('📦 Job data stored for popup');
    });
  }
}

console.log('✅ Extension ready - will try direct API calls and script extraction');