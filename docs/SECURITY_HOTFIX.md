# Security Hotfix - Secrets & CORS Hardening

**Date:** 2025-12-18  
**Priority:** CRITICAL  
**Status:** ✅ Completed

---

## Executive Summary

This hotfix addresses critical security vulnerabilities:
1. **Secrets leakage risk**: Hardcoded Firebase config and potential .env files in git
2. **CORS misconfiguration**: Backend allowing all origins (`allow_origins=["*"]`)
3. **Missing environment variable templates**: No .env.example files

---

## Changes Made

### 1. Environment Variable Migration

#### Frontend (`services/firebase.ts`)
- ✅ Migrated Firebase config to environment variables
- ✅ Maintained backward compatibility with fallback values (for existing deployments)
- ✅ Added `EXPO_PUBLIC_*` prefix for Expo environment variables

**Action Required:**
- Create `.env` file from `.env.example`
- Set `EXPO_PUBLIC_FIREBASE_*` variables
- **ROTATE Firebase API keys** if they were exposed in git history

#### Backend (`backend/src/main.py`)
- ✅ Implemented environment-based CORS allowlist
- ✅ Removed wildcard (`allow_origins=["*"]`)
- ✅ Development defaults: localhost + Expo dev URLs
- ✅ Production: Requires explicit `CORS_ALLOWED_ORIGINS` env var

**Action Required:**
- Set `ENVIRONMENT=production` in production
- Set `CORS_ALLOWED_ORIGINS` with comma-separated allowed origins

### 2. .gitignore Hardening

**Added:**
```
.env
.env.local
.env.*.local
*.env
backend/.env
backend/.env.local
backend/.env.*.local
secrets/
credentials/
*.pem
*.key
*.crt
*.p12
*.keystore
```

### 3. Environment Template Files

**Created:**
- `.env.example` (frontend)
- `backend/.env.example` (backend)

---

## Critical Actions Required

### ⚠️ IMMEDIATE: Rotate Exposed Credentials

If `.env` files or Firebase config were committed to git:

1. **Firebase API Keys:**
   - Go to Firebase Console → Project Settings → General
   - Regenerate API keys
   - Update `.env` files with new keys

2. **Backend Credentials:**
   - Rotate Copernicus Marine credentials (if exposed)
   - Rotate any other API keys found in git history

### 🔧 Git History Cleanup (Optional but Recommended)

If secrets were committed, clean git history:

```bash
# Option 1: Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path backend/.env --invert-paths
git filter-repo --path .env --invert-paths

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

## Environment Setup

### Frontend Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in Firebase config (from Firebase Console):
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... etc
   ```

3. Add API keys:
   ```env
   EXPO_PUBLIC_OPENWEATHER_KEY=your_openweather_key
   EXPO_PUBLIC_OPENROUTESERVICE_KEY=your_ors_key
   ```

### Backend Setup

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Set environment:
   ```env
   ENVIRONMENT=development  # or "production"
   ```

3. Set CORS origins (production):
   ```env
   CORS_ALLOWED_ORIGINS=https://your-app-domain.com,https://api.your-app-domain.com
   ```

4. Add dataset paths and credentials:
   ```env
   GEBCO_COG_PATH=/absolute/path/to/gebco.tif
   EMODNET_COG_PATH=/absolute/path/to/emodnet.tif
   COPERNICUSMARINE_SERVICE_USERNAME=your_username
   COPERNICUSMARINE_SERVICE_PASSWORD=your_password
   ```

---

## Testing

### Frontend
```bash
# Verify env vars are loaded
npm start
# Check console for Firebase initialization (should not show hardcoded values)
```

### Backend
```bash
# Development (should allow localhost)
ENVIRONMENT=development uvicorn src.main:app --reload

# Production (should reject if CORS_ALLOWED_ORIGINS not set)
ENVIRONMENT=production CORS_ALLOWED_ORIGINS=https://example.com uvicorn src.main:app
```

### CORS Test
```bash
# Should work (development)
curl -H "Origin: http://localhost:8081" http://localhost:8000/v1/depth?lat=40.5&lon=28.5

# Should fail (production without proper origin)
ENVIRONMENT=production CORS_ALLOWED_ORIGINS=https://example.com uvicorn src.main:app
curl -H "Origin: http://evil.com" http://localhost:8000/v1/depth?lat=40.5&lon=28.5
```

---

## Security Best Practices Going Forward

1. **Never commit .env files** - Already in .gitignore
2. **Use environment variables** - All secrets should be in env
3. **Rotate credentials regularly** - Especially if exposed
4. **Use different configs per environment** - dev/staging/prod
5. **Review git history** - Before sharing repo publicly
6. **Use secret management** - For production (AWS Secrets Manager, etc.)

---

## Files Changed

- ✅ `services/firebase.ts` - Migrated to env vars
- ✅ `backend/src/main.py` - CORS hardening
- ✅ `.gitignore` - Added env/secrets patterns
- ✅ `.env.example` - Created template
- ✅ `backend/.env.example` - Created template
- ✅ `docs/SECURITY_HOTFIX.md` - This document

---

## Rollback Plan

If issues occur:

1. **Frontend:** Revert `services/firebase.ts` to hardcoded config (temporary)
2. **Backend:** Set `CORS_ALLOWED_ORIGINS=*` in env (temporary, not recommended)

---

## Related Issues

- Firebase config was hardcoded (security risk)
- Backend CORS allowed all origins (security risk)
- No .env.example templates (developer experience)

---

## Next Steps

1. ✅ Complete this hotfix
2. ⏭️ Implement Firestore security rules (see `docs/FIRESTORE_RULES.md`)
3. ⏭️ Add rate limiting to backend
4. ⏭️ Set up secret management for production

---

**Status:** ✅ Hotfix complete. **ACTION REQUIRED:** Rotate exposed credentials.

