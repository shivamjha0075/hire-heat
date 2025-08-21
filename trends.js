document.addEventListener('DOMContentLoaded', function() {
  loadTrends();
});

async function loadTrends() {
  try {
    const data = await chrome.storage.local.get();
    const jobs = Object.keys(data).filter(key => data[key].applies !== undefined);
    
    if (jobs.length === 0) {
      document.getElementById('jobTrendsList').innerHTML = 
        '<div style="padding: 20px; text-align: center; color: #6b7280;">No job data available yet. Start tracking jobs on LinkedIn!</div>';
      return;
    }
    
    // Calculate current stats
    const totalJobs = jobs.length;
    let coldJobs = 0;
    let warmJobs = 0;
    let hotJobs = 0;
    let totalApplyRate = 0;
    
    const jobsWithRates = jobs.map(jobId => {
      const job = data[jobId];
      const applyRate = job.views > 0 ? (job.applies / job.views) * 100 : 0;
      totalApplyRate += applyRate;
      
      if (applyRate < 5) coldJobs++;
      else if (applyRate < 15) warmJobs++;
      else hotJobs++;
      
      return { ...job, jobId, applyRate };
    });
    
    const avgCompetition = totalApplyRate / totalJobs;
    
    // Update trend cards
    document.getElementById('totalJobs').textContent = totalJobs;
    document.getElementById('avgCompetition').textContent = avgCompetition.toFixed(1) + '%';
    document.getElementById('coldJobs').textContent = coldJobs;
    document.getElementById('hotJobs').textContent = hotJobs;
    
    // Draw competition chart
    drawCompetitionChart(coldJobs, warmJobs, hotJobs);
    
    // Display job trends list
    displayJobTrends(jobsWithRates);
    
  } catch (error) {
    console.error('Error loading trends:', error);
  }
}

function drawCompetitionChart(cold, warm, hot) {
  const canvas = document.getElementById('competitionChart');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const total = cold + warm + hot;
  if (total === 0) return;
  
  // Chart dimensions
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  // Colors
  const colors = ['#22c55e', '#f59e0b', '#ef4444'];
  const labels = ['Cold', 'Warm', 'Hot'];
  const values = [cold, warm, hot];
  
  // Draw pie chart
  let currentAngle = -Math.PI / 2; // Start from top
  
  values.forEach((value, index) => {
    if (value === 0) return;
    
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${labels[index]}\n${value}`, labelX, labelY);
    
    currentAngle += sliceAngle;
  });
  
  // Draw legend
  const legendY = canvas.height - 30;
  let legendX = 20;
  
  values.forEach((value, index) => {
    if (value === 0) return;
    
    // Color box
    ctx.fillStyle = colors[index];
    ctx.fillRect(legendX, legendY, 12, 12);
    
    // Label
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${labels[index]}: ${value} (${((value/total)*100).toFixed(1)}%)`, legendX + 16, legendY + 6);
    
    legendX += 120;
  });
}

function displayJobTrends(jobs) {
  const container = document.getElementById('jobTrendsList');
  container.innerHTML = '';
  
  // Sort by most recent
  jobs.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  
  jobs.slice(0, 10).forEach(job => { // Show only recent 10
    const item = document.createElement('div');
    item.className = 'job-trend-item';
    
    const lastUpdated = job.lastUpdated ? 
      new Date(job.lastUpdated).toLocaleDateString() : 'Unknown';
    
    let heatClass, heatLabel;
    if (job.applyRate < 5) {
      heatClass = 'heat-cold';
      heatLabel = 'Cold';
    } else if (job.applyRate < 15) {
      heatClass = 'heat-warm';
      heatLabel = 'Warm';
    } else {
      heatClass = 'heat-hot';
      heatLabel = 'Hot';
    }
    
    item.innerHTML = `
      <div class="job-info">
        <div class="job-title">${job.title || 'Unknown Job'}</div>
        <div class="job-stats">
          ${job.applies.toLocaleString()} applies • 
          ${job.views.toLocaleString()} views • 
          Updated ${lastUpdated}
        </div>
      </div>
      <div class="trend-indicator">
        <div class="heat-badge ${heatClass}">${heatLabel}</div>
        <span style="font-weight: 600;">${job.applyRate.toFixed(1)}%</span>
      </div>
    `;
    
    // Make clickable if URL exists
    if (job.url) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        chrome.tabs.create({ url: job.url });
      });
    }
    
    container.appendChild(item);
  });
}