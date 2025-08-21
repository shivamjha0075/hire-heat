document.addEventListener('DOMContentLoaded', function() {
  loadStats();
  
  document.getElementById('clearData').addEventListener('click', clearAllData);
});

function loadStats() {
  chrome.storage.local.get(null, function(data) {
    const jobs = Object.keys(data).filter(key => data[key].applies !== undefined);
    const totalJobs = jobs.length;
    const totalApplies = jobs.reduce((sum, jobId) => sum + data[jobId].applies, 0);
    
    document.getElementById('totalJobs').textContent = totalJobs;
    document.getElementById('totalClicks').textContent = totalApplies;
    
    displayJobList(data, jobs);
  });
}

function displayJobList(data, jobs) {
  const jobList = document.getElementById('jobList');
  jobList.innerHTML = '';
  
  if (jobs.length === 0) {
    jobList.innerHTML = '<div class="job-item">No jobs tracked yet. Visit LinkedIn job postings to start seeing application data!</div>';
    return;
  }
  
  // Sort jobs by apply count (descending)
  jobs.sort((a, b) => data[b].applies - data[a].applies);
  
  jobs.forEach(jobId => {
    const job = data[jobId];
    const jobItem = document.createElement('div');
    jobItem.className = 'job-item';
    
    const lastUpdated = job.lastUpdated ? new Date(job.lastUpdated).toLocaleDateString() : 'Unknown';
    const applyRate = job.views > 0 ? ((job.applies / job.views) * 100) : 0;
    
    // Determine heat level
    let heatEmoji, heatText, heatColor;
    if (applyRate < 5) {
      heatEmoji = '❄️';
      heatText = 'COLD';
      heatColor = '#22c55e';
    } else if (applyRate < 15) {
      heatEmoji = '🔥';
      heatText = 'WARM';
      heatColor = '#f59e0b';
    } else {
      heatEmoji = '🌡️';
      heatText = 'HOT';
      heatColor = '#ef4444';
    }
    
    jobItem.innerHTML = `
      <div class="job-title">${job.title || 'Unknown Job'}</div>
      <div class="job-stats">
        <span>${job.applies} applies</span> • 
        <span>${job.views} views</span> • 
        <span style="color: ${heatColor}; font-weight: 600;">
          ${heatEmoji} ${heatText} (${applyRate.toFixed(1)}%)
        </span>
      </div>
      <div class="job-date">Updated: ${lastUpdated}</div>
    `;
    
    jobList.appendChild(jobItem);
  });
}

function clearAllData() {
  if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
    chrome.storage.local.clear(function() {
      loadStats();
    });
  }
}