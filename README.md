# 🔥 HireHeat - Job Competition Tracker

A Chrome browser extension that reveals the real competition heat for LinkedIn job postings by showing actual application counts, view counts, and apply rates.

## Features

- **🌡️ Heat Level Detection**: Automatically categorizes jobs as COLD, WARM, or HOT based on competition
- **📊 Real LinkedIn Data**: Uses LinkedIn's internal API to get actual application counts and view statistics  
- **🎯 Smart Visual Indicators**: Color-coded heat levels with emojis (❄️ Cold, 🔥 Warm, 🌡️ Hot)
- **📈 Competition Analysis**: Shows apply rates to help you identify low-competition opportunities
- **💾 Job History**: Track and compare competition levels across multiple job postings
- **🚀 Instant Insights**: See competition heat the moment you view any LinkedIn job posting

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your Chrome toolbar

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

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main tracking logic injected into LinkedIn pages
- `popup.html/js` - Extension popup interface
- `styles.css` - Styling for click counter badges
- `README.md` - This documentation

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