# Code Cleanup Audit Report

**Date:** 2025-12-18  
**Status:** 📋 Recommendations provided

---

## Executive Summary

This audit identifies code quality issues, unused dependencies, dead code, and refactoring opportunities in the LOKAL app.

---

## Code Quality Issues

### 1. Large Files (>500 lines)
**Priority:** HIGH

**Files:**
- `app/(tabs)/map.tsx` - **1651 lines** ⚠️
- `app/(places)/bathymetry.tsx` - 684 lines
- `app/(places)/add.tsx` - 441 lines

**Recommendation:**
- Extract components from large files
- Split into smaller, focused modules
- Target: <300 lines per file

**Action Plan:**
1. Extract FilterPanel from map.tsx
2. Extract PlaceBottomSheet from map.tsx
3. Extract WeatherWidgets from map.tsx
4. Split bathymetry.tsx into components

---

### 2. Unused Imports
**Priority:** LOW

**Status:** ✅ Mostly clean (TypeScript helps)

**Recommendation:**
- Run ESLint with `no-unused-vars`
- Remove unused imports
- Use IDE to auto-remove

**Command:**
```bash
npm run lint -- --fix
```

---

### 3. Console.log Statements
**Priority:** LOW  
**Status:** ✅ Already fixed (using logger)

**Current State:**
- Most console.log replaced with logger
- 1 remaining in `app/(tabs)/map.tsx`

**Action:**
- Replace remaining console.log with logger
- Add ESLint rule to prevent console.log

**Files:**
- `app/(tabs)/map.tsx` - Check for console.log

---

### 4. TODO/FIXME Comments
**Priority:** LOW

**Status:** ✅ Clean (no TODOs found in app code)

**Backend:**
- `backend/src/main.py` - Has TODO for CORS (already fixed)

**Action:**
- Remove resolved TODOs
- Create GitHub issues for remaining TODOs

---

## Dependency Audit

### 5. Unused Dependencies
**Priority:** MEDIUM

**Check:**
```bash
npm install -g depcheck
depcheck
```

**Potential Unused:**
- Review `package.json` dependencies
- Check if all icons are used
- Check if all utilities are used

**Recommendation:**
- Run depcheck
- Remove unused dependencies
- Document why each dependency is needed

---

### 6. Outdated Dependencies
**Priority:** LOW

**Check:**
```bash
npm outdated
```

**Recommendation:**
- Review outdated packages
- Update carefully (test after each update)
- Check for security vulnerabilities: `npm audit`

---

## Dead Code

### 7. Unused Components
**Priority:** LOW

**Potential Candidates:**
- Check if all components in `components/` are used
- Check if all utilities in `utils/` are used
- Check if all hooks in `hooks/` are used

**Recommendation:**
- Use IDE "Find Usages" feature
- Remove unused code
- Archive instead of delete (git history)

---

### 8. Unused Types
**Priority:** LOW

**Check:**
- Review `types/` directory
- Check if all types are used
- Remove unused type definitions

**Recommendation:**
- TypeScript will warn about unused types
- Remove unused types
- Keep shared types even if used once

---

## Code Organization

### 9. Inconsistent File Structure
**Priority:** LOW

**Current State:**
- Some screens in `app/(tabs)/`
- Some screens in `app/(places)/`
- Some screens in `app/(admin)/`

**Status:** ✅ Consistent (using Expo Router conventions)

**Recommendation:**
- Keep current structure (follows Expo Router)
- Document folder structure

---

### 10. Missing Documentation
**Priority:** LOW

**Current State:**
- Some functions lack JSDoc comments
- Some components lack prop documentation

**Recommendation:**
- Add JSDoc to public functions
- Document component props
- Use TypeScript for type documentation

**Example:**
```typescript
/**
 * Get places within radius of a location
 * @param center - Center coordinates
 * @param radiusKm - Radius in kilometers
 * @returns Array of places within radius
 */
export async function getPlacesNearby(
  center: Coordinates,
  radiusKm: number
): Promise<Place[]>
```

---

## Refactoring Opportunities

### 11. Extract Constants
**Priority:** LOW

**Current State:**
- Some magic numbers/strings in code
- Some repeated values

**Recommendation:**
- Extract to constants file
- Use enums for categories
- Centralize configuration

**Files to Create:**
- `constants/config.ts` - App configuration
- `constants/colors.ts` - Color constants (if not using theme)

---

### 12. Error Handling
**Priority:** MEDIUM

**Current State:**
- Some try/catch blocks
- Inconsistent error handling
- Some errors not logged

**Recommendation:**
- Standardize error handling
- Use error boundaries (React)
- Log all errors
- Show user-friendly error messages

**Files to Create:**
- `components/ErrorBoundary.tsx`
- `utils/errorHandler.ts`

---

### 13. Type Safety
**Priority:** LOW

**Current State:**
- ✅ Good TypeScript usage
- Some `any` types
- Some type assertions

**Recommendation:**
- Replace `any` with proper types
- Avoid type assertions where possible
- Use type guards

**Files to Review:**
- Search for `: any`
- Search for `as any`
- Replace with proper types

---

## Testing

### 14. Missing Tests
**Priority:** MEDIUM

**Current State:**
- No unit tests
- No integration tests
- No E2E tests

**Recommendation:**
- Add unit tests for utilities
- Add integration tests for services
- Add E2E tests for critical flows

**Files to Create:**
- `__tests__/utils/` - Utility tests
- `__tests__/services/` - Service tests
- `e2e/` - E2E tests

**Testing Framework:**
- Jest for unit tests
- React Native Testing Library for components
- Detox for E2E tests

---

## Linting & Formatting

### 15. ESLint Configuration
**Priority:** LOW

**Current State:**
- ✅ ESLint configured
- Using Expo preset

**Recommendation:**
- Add custom rules if needed
- Enforce consistent code style
- Use Prettier for formatting

**Files:**
- `.eslintrc.js` - Review rules
- `.prettierrc` - Add if not exists

---

### 16. Pre-commit Hooks
**Priority:** LOW

**Recommendation:**
- Add husky for git hooks
- Run lint on pre-commit
- Run typecheck on pre-commit

**Setup:**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

---

## Quick Wins

1. ⏭️ **Extract map.tsx components** - High impact, medium effort
2. ⏭️ **Run depcheck** - Low effort, medium impact
3. ⏭️ **Add error boundaries** - Medium effort, high impact
4. ⏭️ **Remove console.log** - Low effort, low impact
5. ⏭️ **Add JSDoc comments** - Low effort, low impact

---

## Metrics

### Code Statistics
- Total lines: ~4791 (app screens)
- Largest file: 1651 lines (map.tsx)
- Average file size: ~300 lines
- Files >500 lines: 3

### Target Metrics
- Max file size: 300 lines
- Files >500 lines: 0
- Test coverage: >80% (future)

---

## Action Plan

### Phase 1: Critical (This Sprint)
1. Extract map.tsx components
2. Add error boundaries
3. Run depcheck and cleanup

### Phase 2: Important (Next Sprint)
1. Add unit tests
2. Improve error handling
3. Add JSDoc comments

### Phase 3: Nice to Have
1. Add E2E tests
2. Refactor constants
3. Improve type safety

---

## Related Documents

- `docs/AUDIT_SECURITY.md` - Security issues
- `docs/AUDIT_UX_UI.md` - UX recommendations
- `docs/AUDIT_PERF.md` - Performance recommendations

---

**Status:** 📋 Recommendations provided. **ACTION REQUIRED:** Prioritize based on impact/effort.

