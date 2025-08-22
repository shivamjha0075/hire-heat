# Google OAuth Setup Guide for HireHeat Extension

## Issue: Google Sign-in Button Not Working

The Google sign-in button is not opening the OAuth popup because Google OAuth is not properly configured in Supabase.

## Required Setup Steps

### 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/gapeoriqaaxxgdfocgxq
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to configure
4. Enable Google OAuth by toggling it ON
5. You'll need to provide:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Web application** as application type
6. Add these **Authorized redirect URIs**:
   ```
   https://gapeoriqaaxxgdfocgxq.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

### 3. Configure Supabase with Google Credentials

1. Back in Supabase Dashboard → Authentication → Providers → Google
2. Paste the **Client ID** and **Client Secret**
3. Save the configuration

### 4. Test the Extension

1. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the HireHeat folder
2. Click the extension icon and try signing in

## Current Extension Configuration

✅ **Manifest permissions**: `identity` permission is present
✅ **Host permissions**: Google accounts and Supabase domains allowed
✅ **Supabase client**: Properly configured with your project URL
✅ **OAuth redirect**: Set to extension popup URL

## Troubleshooting

If sign-in still doesn't work after setup:

1. Check browser console for errors
2. Verify Google OAuth is enabled in Supabase
3. Ensure redirect URI matches exactly
4. Try refreshing the extension

## Expected Behavior After Setup

- Click "Sign in with Google" → Google OAuth popup opens
- User authorizes → Popup closes
- User is signed in → Extension shows user info
- User data appears in Supabase Authentication dashboard