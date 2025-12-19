# Security Keys Rotation Guide

**Date:** 2025-01-XX  
**Priority:** HIGH  
**Status:** 📋 Action Required

---

## Executive Summary

If `.env` files or hardcoded credentials were committed to git, those keys must be considered **compromised** and should be rotated immediately.

**Important Note:** `EXPO_PUBLIC_*` environment variables are **not secret** in mobile builds (they are bundled into the app). However, they should still be rotated if exposed in git history to prevent abuse and maintain best practices.

---

## Services Using API Keys

### Frontend (EXPO_PUBLIC_*)

1. **Firebase:**
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

2. **OpenWeather API:**
   - `EXPO_PUBLIC_OPENWEATHER_KEY`

3. **OpenRouteService API:**
   - `EXPO_PUBLIC_OPENROUTESERVICE_KEY`

4. **Bathymetry Backend:**
   - `EXPO_PUBLIC_BATHYMETRY_API_URL` (URL, not a key, but important to manage)

### Backend

1. **Copernicus Marine Service:**
   - `COPERNICUSMARINE_SERVICE_USERNAME`
   - `COPERNICUSMARINE_SERVICE_PASSWORD`

---

## Rotation Steps

### 1. Firebase API Keys

**Note:** Firebase Web API keys are public by design (they're in client bundles). However, you should still:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to: Project Settings → General → Your apps
3. For each app:
   - The "Web API Key" is your `EXPO_PUBLIC_FIREBASE_API_KEY`
   - Regenerate if the option is available, or create a new web app
4. Update `.env` files with new values
5. Rebuild and redeploy the app

**For Service Accounts (if used by Cloud Functions or backend):**
- Go to: Project Settings → Service accounts
- Generate a new private key
- Update backend/Cloud Functions configuration

### 2. OpenWeather API Key

1. Log in to [OpenWeatherMap](https://openweathermap.org/api)
2. Go to: API keys tab
3. Generate a new key
4. Update `.env` file:
   ```env
   EXPO_PUBLIC_OPENWEATHER_KEY=your_new_key
   ```
5. Rebuild the app

### 3. OpenRouteService API Key

1. Log in to [OpenRouteService](https://openrouteservice.org/)
2. Go to: API Keys section
3. Generate a new key
4. Update `.env` file:
   ```env
   EXPO_PUBLIC_OPENROUTESERVICE_KEY=your_new_key
   ```
5. Rebuild the app

### 4. Copernicus Marine Service Credentials

1. Log in to [Copernicus Marine Service](https://marine.copernicus.eu/)
2. Navigate to: My Account → API credentials
3. Generate new username/password
4. Update `backend/.env`:
   ```env
   COPERNICUSMARINE_SERVICE_USERNAME=your_new_username
   COPERNICUSMARINE_SERVICE_PASSWORD=your_new_password
   ```
5. Restart the backend service

---

## Important Notes

### EXPO_PUBLIC_* Variables Are Not Secret

**Critical Understanding:**
- `EXPO_PUBLIC_*` variables are **bundled into the mobile app**
- Anyone can extract them from the app binary
- They are **not secret** by design

**Best Practices:**
1. **Use rate limiting** on API provider side
2. **Use provider restrictions** (IP whitelist, referrer restrictions for web)
3. **Prefer backend proxy** for sensitive API calls (don't expose keys in client)
4. **Monitor usage** for abuse

### Backend Credentials

- Backend credentials (`COPERNICUSMARINE_*`) are **truly secret**
- Never commit them to git
- Rotate immediately if exposed

---

## Git History Cleanup

If keys were committed, clean git history:

```bash
# Option 1: Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path .env --invert-paths
git filter-repo --path backend/.env --invert-paths

# Option 2: Using BFG Repo-Cleaner
# Download: https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files .env
bfg --delete-files backend/.env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# After cleanup, force push (WARNING: rewrites history)
git push origin --force --all
```

**⚠️ WARNING:** Force pushing rewrites git history. Coordinate with team before doing this.

---

## Verification

After rotation:

1. **Test all features** that use the rotated keys
2. **Check API usage** in provider dashboards for unexpected activity
3. **Monitor logs** for authentication errors
4. **Verify** `.env` files are in `.gitignore` and not tracked

---

## Related Documents

- `docs/SECURITY_HOTFIX.md` - Previous security fixes
- `.env.example` - Environment variable template
- `backend/.env.example` - Backend environment variable template

---

**Status:** ✅ Guide created. **ACTION REQUIRED:** User to manually rotate keys if exposed.

