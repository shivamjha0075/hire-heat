document.addEventListener('DOMContentLoaded', function() {
  checkExtensionStatus();
  
  const activateBtn = document.getElementById('activateBtn');
  if (activateBtn) {
    activateBtn.addEventListener('click', toggleExtension);
  }
});

function checkExtensionStatus() {
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

function toggleExtension() {
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