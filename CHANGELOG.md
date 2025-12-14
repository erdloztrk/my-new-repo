# Stability & Cleanup

- Added lint/typecheck/doctor scripts and documented cache clean steps.
- Removed react-native-firebase packages in favor of Firebase Web SDK.
- Hardened bathymetry/weather services and removed debug ingest logging.
- Fixed infinite loop in map region updates (useEffect dependency issue).
- Fixed duplicate score fetches in DepthWidget (added fetch key tracking).
- Fixed wind speed unit labels (km/s → km/h) across weather components.
- Fixed TypeScript errors (PhosphorIcon, ReviewCard, ForecastWidget, firebase auth).
- Implemented map follow-me toggle with pan/zoom detection.
- Normalized theme strategy (useTheme hook consistently used).

# Depth Widget & Map Improvements

- Removed depth contour lines (isohips) feature.
- Fixed depth widget to only show for water areas (depth < 0), not land.
- Added pin marker when tapping on water areas.
- Redesigned depth widget as compact table format showing all data at once.
- Table shows: Species, Depth, Score, Zone for all fish types.

