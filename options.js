document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  loadStats();
  
  // Add event listeners
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // Toggle switches
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    const settings = result.settings || {
      autoRefresh: true,
      refreshInterval: 30,
      showNotifications: true,
      trackingEnabled: true,
      dataRetentionDays: 30,
      coldThreshold: 5,
      hotThreshold: 15
    };
    
    // Set toggle states
    document.getElementById('trackingEnabled').classList.toggle('active', settings.trackingEnabled);
    document.getElementById('autoRefresh').classList.toggle('active', settings.autoRefresh);
    document.getElementById('showNotifications').classList.toggle('active', settings.showNotifications);
    
    // Set input values
    document.getElementById('refreshInterval').value = settings.refreshInterval;
    document.getElementById('dataRetentionDays').value = settings.dataRetentionDays;
    document.getElementById('coldThreshold').value = settings.coldThreshold;
    document.getElementById('hotThreshold').value = settings.hotThreshold;
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const settings = {
      trackingEnabled: document.getElementById('trackingEnabled').classList.contains('active'),
      autoRefresh: document.getElementById('autoRefresh').classList.contains('active'),
      showNotifications: document.getElementById('showNotifications').classList.contains('active'),
      refreshInterval: parseInt(document.getElementById('refreshInterval').value) * 1000, // Convert to ms
      dataRetentionDays: parseInt(document.getElementById('dataRetentionDays').value),
      coldThreshold: parseFloat(document.getElementById('coldThreshold').value),
      hotThreshold: parseFloat(document.getElementById('hotThreshold').value)
    };
    
    await chrome.storage.sync.set({ settings });
    
    // Show success message
    const status = document.getElementById('status');
    status.textContent = '✅ Settings saved successfully!';
    status.className = 'status success';
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error('Error saving settings:', error);
    
    const status = document.getElementById('status');
    status.textContent = '❌ Error saving settings. Please try again.';
    status.className = 'status error';
    status.style.display = 'block';
  }
}

async function loadStats() {
  try {
    const data = await chrome.storage.local.get();
    const jobs = Object.keys(data).filter(key => data[key].applies !== undefined);
    
    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, jobId) => sum + data[jobId].applies, 0);
    
    let totalApplyRate = 0;
    let coldJobs = 0;
    
    jobs.forEach(jobId => {
      const job = data[jobId];
      const applyRate = job.views > 0 ? (job.applies / job.views) * 100 : 0;
      totalApplyRate += applyRate;
      
      if (applyRate < 5) {
        coldJobs++;
      }
    });
    
    const avgCompetition = totalJobs > 0 ? (totalApplyRate / totalJobs) : 0;
    
    // Update stats display
    document.getElementById('totalJobs').textContent = totalJobs;
    document.getElementById('totalApplications').textContent = totalApplications.toLocaleString();
    document.getElementById('avgCompetition').textContent = avgCompetition.toFixed(1) + '%';
    document.getElementById('coldJobs').textContent = coldJobs;
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}