# 🔥 HireHeat - Advanced Job Competition Tracker

A powerful Chrome browser extension that reveals the real competition heat for LinkedIn job postings with advanced analytics, trends tracking, and smart notifications.

## ✨ Key Features

### 🌡️ Smart Heat Detection
- **Customizable Thresholds**: Set your own cold/warm/hot competition levels
- **Real-time Analysis**: Instant competition assessment on any LinkedIn job posting
- **Visual Heat Indicators**: Color-coded badges with intuitive emojis (❄️ Cold, 🔥 Warm, 🌡️ Hot)

### 📊 Advanced Analytics
- **Competition Trends**: Track job market competition patterns over time
- **Data Export**: Export your job tracking data to CSV for analysis
- **Smart Filtering**: Filter jobs by competition level (Cold/Warm/Hot)
- **Statistical Insights**: Average competition rates, cold job discovery metrics

### 🎯 Opportunity Discovery
- **Cold Job Alerts**: Get notified about low-competition opportunities
- **Apply Rate Analysis**: See exact application-to-view ratios
- **Best Opportunities First**: Jobs sorted by competition level for optimal targeting

### 🔧 Customization & Control
- **Settings Dashboard**: Comprehensive settings panel for personalization
- **Auto-refresh Control**: Configurable data refresh intervals
- **Data Retention**: Customizable data storage duration
- **Notification Preferences**: Toggle alerts on/off

## 🚀 Installation

1. **Download**: Clone or download this repository to your computer
2. **Chrome Extensions**: Open Chrome and navigate to `chrome://extensions/`
3. **Developer Mode**: Enable "Developer mode" toggle in the top right corner
4. **Load Extension**: Click "Load unpacked" and select the extension folder
5. **Ready to Go**: The HireHeat icon will appear in your Chrome toolbar

## 🎮 Quick Start

1. **Visit LinkedIn**: Navigate to any LinkedIn job posting
2. **Automatic Analysis**: HireHeat instantly analyzes competition and displays heat level
3. **View Dashboard**: Click the extension icon to see your tracking history
4. **Explore Trends**: Use the trends page to analyze competition patterns
5. **Customize Settings**: Access settings to personalize your experience

## Usage

1. Navigate to any LinkedIn job posting
2. HireHeat automatically analyzes the competition and shows:
   - **❄️ COLD** (< 5% apply rate) - Low competition, great opportunity!
   - **🔥 WARM** (5-15% apply rate) - Moderate competition
   - **🌡️ HOT** (> 15% apply rate) - High competition, many applicants
3. View detailed stats: applications, views, and exact apply rate
4. Click the HireHeat icon to see your job tracking history
5. Use the dashboard to compare competition levels across different jobs

## How It Works

The extension uses:
- **API Interception**: Intercepts LinkedIn's internal API calls to capture real job data
- **Network Request Monitoring**: Monitors fetch() and XMLHttpRequest calls to LinkedIn's voyager API
- **Chrome Storage API**: Store job statistics locally
- **Real-time Data Display**: Shows live statistics directly on job postings

## Privacy

- All data is stored locally on your device
- No data is sent to external servers
- Only captures data that LinkedIn already loads for you
- Works entirely offline after installation
- Uses publicly available API data that LinkedIn shows in their interface

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Active tab access and local storage only
- **Host Permissions**: LinkedIn.com domains only
- **Storage**: Chrome's local storage API

## 📁 Project Structure

```
hireheat/
├── manifest.json          # Extension configuration
├── linkedin-tracker.js    # Main tracking logic for LinkedIn pages
├── background-simple.js   # Background service worker
├── popup.html/js          # Extension popup interface
├── options.html/js        # Settings page
├── trends.html/js         # Analytics and trends dashboard
├── icons/                # Extension icons
└── README.md             # Documentation
```

## 🆕 What's New in v2.0

- **📈 Trends Dashboard**: Comprehensive analytics with charts and insights
- **⚙️ Advanced Settings**: Customizable thresholds and preferences
- **🔔 Smart Notifications**: Get alerted about cold job opportunities
- **📊 Data Export**: Export tracking data to CSV format
- **🎯 Better Filtering**: Filter jobs by competition level
- **🔧 Background Processing**: Improved performance and reliability
- **📱 Enhanced UI**: Modern, responsive design with better UX

## Troubleshooting

If the extension isn't working:
1. Refresh the LinkedIn page after installing
2. Check that the extension is enabled in `chrome://extensions/`
3. Ensure you're on a LinkedIn job posting page (URL contains `/jobs/view/`)
4. Open browser console (F12) to check for any error messages

## Limitations

- Only works on LinkedIn job pages
- Requires manual apply button clicks to track
- Cannot track clicks from other users (privacy limitation)
- May need updates if LinkedIn changes their page structure