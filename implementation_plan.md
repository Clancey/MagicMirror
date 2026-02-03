# Implementation Plan

## Status Legend
- `[ ]` - Incomplete (not started or needs rework)
- `[?]` - Waiting to be verified (work done, needs verification by different agent)
- `[x]` - Complete (verified by a second agent)

---

## Verified Complete
- [x] Project initialized

## Waiting Verification
(Tasks here have been implemented but need another agent to verify)

### Module Setup (Foundation - Blocks All Other Work)
- [x] Create modules/MMM-TouchOverlay directory structure
- [x] Create MMM-TouchOverlay.js with module registration and defaults
- [x] Create MMM-TouchOverlay.css base file
- [x] Create module structure (templates directory later removed - using inline rendering)

### Touch Overlay Component (Core Infrastructure)
- [x] Implement overlay DOM structure (backdrop, content area, close button)
- [x] Implement openOverlay(contentType, data) method
- [x] Implement closeOverlay() method with notification
- [x] Implement backdrop click-to-close handler
- [x] Implement close button click handler
- [x] Implement Escape key to close overlay
- [x] Add 200ms fade animation for overlay open/close
- [x] Ensure only one overlay can be open at a time
- [x] Send TOUCH_OVERLAY_OPEN notification on open
- [x] Send TOUCH_OVERLAY_CLOSE notification on close
- [x] Attach touch handlers after MODULE_DOM_CREATED

## High Priority
- [x] Fix MMM-TouchOverlay calendar daysToShow initialization (use config after start)
- [?] Respect 12h/24h time format setting in calendar detail rendering
- [?] Fix news detail tap handling to open the tapped article (not always index 0)
- [?] Ensure weather detail view respects unit preferences and matches module icon style

## Medium Priority
- [ ] Show precipitation/UV values when available even if zero
- [ ] Add automated tests for MMM-TouchOverlay core flows (overlay open/close, notifications, hide UI toggle, news navigation, calendar grouping, weather rendering, photo viewer pause/resume/swipe)
- [ ] Reconcile spec template requirement with inline rendering (update specs or add templates)

### Hide UI Toggle
- [x] Create toggle button DOM (48x48px touch target)
- [x] Create "Show UI" button DOM for hidden state
- [x] Implement toggleUI() method
- [x] Implement hideUI() with CSS class body.ui-hidden
- [x] Implement showUI() to restore modules
- [x] Add CSS for hiding regions (opacity 0, pointer-events none)
- [x] Add 300ms transition for hide/show
- [x] Position toggle button (configurable: bottom-right default)
- [x] Send TOUCH_UI_HIDDEN notification on toggle
 - [x] Optional: persist state to localStorage

### News Detail View
- [x] Listen for NEWS_FEED notification and store items
- [x] Implement handleNewsfeedTap() touch handler
- [x] Create templates/news-detail.njk template
- [x] Implement renderNewsDetail() method
- [x] Display headline in large bold text
- [x] Display source name and relative timestamp
- [x] Display summary/description if available
- [x] Display URL indicator (non-clickable)
- [x] Add prev/next navigation buttons (48x48px)
- [x] Implement navigateNews(direction) method
- [x] Show position indicator (X / Y)
- [x] Disable nav buttons at list boundaries
- [x] Add news detail CSS styles

### Calendar Detail View
- [x] Listen for CALENDAR_EVENTS notification and store events
- [x] Implement handleCalendarTap() touch handler
- [x] Create templates/calendar-detail.njk template
- [x] Implement groupEventsByDate() method
- [x] Implement formatEvent() method
- [x] Implement renderCalendarDetail() method
- [x] Display events grouped by date with headers
- [x] Highlight "Today" and "Tomorrow" headers
- [x] Display event title, start/end times
- [x] Display "All Day" badge for full-day events
- [x] Display location when available
- [x] Display calendar name when available
- [x] Show event color coding (border-left)
- [x] Dim past events (earlier today)
- [x] Add vertical scrolling for long lists
- [x] Show "No upcoming events" empty state
- [x] Add calendar detail CSS styles

### Weather Detail View
- [x] Listen for WEATHER_UPDATED notification and store data
- [x] Implement handleWeatherTap() touch handler
- [x] Create templates/weather-detail.njk template
- [x] Implement renderWeatherDetail() method
- [x] Implement getWeatherIcon() mapping method
- [x] Implement formatTemp() for unit conversion
- [x] Implement formatWind() for unit conversion
- [x] Display current temperature prominently
- [x] Display feels-like temperature
- [x] Display humidity percentage
- [x] Display wind speed with appropriate units
- [x] Display weather icon for current conditions
- [x] Display hourly forecast (next 12 hours)
- [x] Add horizontal scroll for hourly forecast
- [x] Display daily forecast (7 days) with high/low
- [x] Display precipitation probability when available
- [x] Display UV index when available
- [x] Add weather detail CSS styles

### Photo Viewer
 - [x] Investigate MMM-ImmichTileSlideShow DOM structure (generic selectors implemented)
 - [x] Investigate MMM-ImmichTileSlideShow notification protocol (generic notifications sent)
 - [x] Implement attachPhotoHandlers() for slideshow images
 - [x] Implement handlePhotoTap() touch handler
 - [x] Implement extractPhotoMetadata() method
  - [x] Create templates/photo-viewer.njk template (inline rendering)
 - [x] Implement renderPhotoViewer() method
 - [x] Display photo scaled to fit (object-fit: contain)
 - [x] Display metadata (date, album, filename) when available
 - [x] Implement pauseSlideshow() notification
 - [x] Implement resumeSlideshow() notification
 - [x] Resume slideshow on closeOverlay when viewing photo
 - [x] Add photo viewer CSS styles
 - [x] Optional: preloadImage() for smoother experience

## Low Priority

### Code Quality
- [x] Decided to keep inline template literals (simpler, working well, no Nunjucks dependency needed)
- [x] Remove unused .njk template files and templates directory (removed: overlay.njk, news-detail.njk, calendar-detail.njk, weather-detail.njk, photo-viewer.njk)

### Configuration & Polish
- [x] Add configuration options for animationSpeed, backdropOpacity
- [x] Add configuration for hideUIToggle position
  - [x] Add configuration for photoViewer.showMetadata
- [x] Add configuration for calendar daysToShow
- [x] Document module configuration in README
- [x] Add MMM-TouchOverlay module to config/config.js with default configuration
- [B] Test on touch-capable display (blocked: no touch hardware available in this environment)

### Accessibility
- [x] Ensure all interactive elements have aria-labels
- [x] Ensure close button has visible focus state
- [x] Verify high contrast text on overlays
- [x] Verify no color-only indicators
- [x] Test keyboard navigation (Tab, Escape)

### Optional Enhancements
- [x] Swipe navigation for news articles
- [x] Swipe navigation for photos
- [x] Auto-hide UI after inactivity
- [x] Loading state for weather data

## Bugs/Issues
(none)

## Code Quality Follow-ups
- [ ] Address FIXME in js/main.js:476 (config passing in tests)
- [ ] Address FIXME in js/app.js:34 (Hotfix PR)
- [ ] Address FIXME in js/check_config.js:24 (refactor into core)
- [ ] Address FIXME in modules/default/calendar/calendarfetcherutils.js:131 (facebook birthday fix)
- [ ] Address TODO in modules/default/weather/providers/openweathermap.js:430 (hide doesn't exist)
- [ ] Address TODO in modules/default/weather/providers/weatherflow.js:105 (precipitation unit conversion)

## Notes
- Implementation order: overlay infrastructure → hide UI toggle → news → calendar → weather → photo
- CSS-based hiding preferred over MagicMirror hide() method to avoid animation issues
- Touch targets must be minimum 48x48px per spec
- MMM-ImmichTileSlideShow integration requires investigation of its actual API
