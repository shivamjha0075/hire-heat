// HireHeat Background Service Worker - Simplified Version
console.log('🔥 HireHeat background service worker started');

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 HireHeat extension event:', details.reason);
  
  if (details.reason === 'install') {
    console.log('🎉 HireHeat installed');
    // Set default settings
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 30000,
      showNotifications: true,
      trackingEnabled: true,
      dataRetentionDays: 30,
      coldThreshold: 5,
      hotThreshold: 15
    };
    
    chrome.storage.sync.set({ settings: defaultSettings })
      .then(() => console.log('✅ Default settings saved'))
      .catch(error => console.error('❌ Error setting default settings:', error));
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type);
  
  if (message.type === 'JOB_DATA_UPDATED') {
    console.log('📊 Job data updated:', message.data);
    updateBadge();
  }
  
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get('settings')
      .then(result => {
        const settings = result.settings || {
          autoRefresh: true,
          refreshInterval: 30000,
          showNotifications: true,
          trackingEnabled: true,
          dataRetentionDays: 30,
          coldThreshold: 5,
          hotThreshold: 15
        };
        sendResponse(settings);
      })
      .catch(error => {
        console.error('Error getting settings:', error);
        sendResponse({});
      });
    return true; // Keep message channel open
  }
});

// Simple badge update function
async function updateBadge() {
  try {
    const data = await chrome.storage.local.get();
    const jobCount = Object.keys(data).filter(key => 
      data[key] && data[key].applies !== undefined
    ).length;
    
    if (jobCount > 0) {
      chrome.action.setBadgeText({ text: jobCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

console.log('✅ Background script loaded successfully');