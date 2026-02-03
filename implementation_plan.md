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
- [?] Create modules/MMM-TouchOverlay directory structure
- [?] Create MMM-TouchOverlay.js with module registration and defaults
- [?] Create MMM-TouchOverlay.css base file
- [?] Create templates directory and overlay.njk base template

### Touch Overlay Component (Core Infrastructure)
- [?] Implement overlay DOM structure (backdrop, content area, close button)
- [?] Implement openOverlay(contentType, data) method
- [?] Implement closeOverlay() method with notification
- [?] Implement backdrop click-to-close handler
- [?] Implement close button click handler
- [?] Implement Escape key to close overlay
- [?] Add 200ms fade animation for overlay open/close
- [?] Ensure only one overlay can be open at a time
- [?] Send TOUCH_OVERLAY_OPEN notification on open
- [?] Send TOUCH_OVERLAY_CLOSE notification on close
- [?] Attach touch handlers after MODULE_DOM_CREATED

## High Priority

## Medium Priority

### Hide UI Toggle
- [ ] Create toggle button DOM (48x48px touch target)
- [ ] Create "Show UI" button DOM for hidden state
- [ ] Implement toggleUI() method
- [ ] Implement hideUI() with CSS class body.ui-hidden
- [ ] Implement showUI() to restore modules
- [ ] Add CSS for hiding regions (opacity 0, pointer-events none)
- [ ] Add 300ms transition for hide/show
- [ ] Position toggle button (configurable: bottom-right default)
- [ ] Send TOUCH_UI_HIDDEN notification on toggle
- [ ] Optional: persist state to localStorage

### News Detail View
- [ ] Listen for NEWS_FEED notification and store items
- [ ] Implement handleNewsfeedTap() touch handler
- [ ] Create templates/news-detail.njk template
- [ ] Implement renderNewsDetail() method
- [ ] Display headline in large bold text
- [ ] Display source name and relative timestamp
- [ ] Display summary/description if available
- [ ] Display URL indicator (non-clickable)
- [ ] Add prev/next navigation buttons (48x48px)
- [ ] Implement navigateNews(direction) method
- [ ] Show position indicator (X / Y)
- [ ] Disable nav buttons at list boundaries
- [ ] Add news detail CSS styles

### Calendar Detail View
- [ ] Listen for CALENDAR_EVENTS notification and store events
- [ ] Implement handleCalendarTap() touch handler
- [ ] Create templates/calendar-detail.njk template
- [ ] Implement groupEventsByDate() method
- [ ] Implement formatEvent() method
- [ ] Implement renderCalendarDetail() method
- [ ] Display events grouped by date with headers
- [ ] Highlight "Today" and "Tomorrow" headers
- [ ] Display event title, start/end times
- [ ] Display "All Day" badge for full-day events
- [ ] Display location when available
- [ ] Display calendar name when available
- [ ] Show event color coding (border-left)
- [ ] Dim past events (earlier today)
- [ ] Add vertical scrolling for long lists
- [ ] Show "No upcoming events" empty state
- [ ] Add calendar detail CSS styles

### Weather Detail View
- [ ] Listen for WEATHER_UPDATED notification and store data
- [ ] Implement handleWeatherTap() touch handler
- [ ] Create templates/weather-detail.njk template
- [ ] Implement renderWeatherDetail() method
- [ ] Implement getWeatherIcon() mapping method
- [ ] Implement formatTemp() for unit conversion
- [ ] Implement formatWind() for unit conversion
- [ ] Display current temperature prominently
- [ ] Display feels-like temperature
- [ ] Display humidity percentage
- [ ] Display wind speed with appropriate units
- [ ] Display weather icon for current conditions
- [ ] Display hourly forecast (next 12 hours)
- [ ] Add horizontal scroll for hourly forecast
- [ ] Display daily forecast (7 days) with high/low
- [ ] Display precipitation probability when available
- [ ] Display UV index when available
- [ ] Add weather detail CSS styles

### Photo Viewer
- [ ] Investigate MMM-ImmichTileSlideShow DOM structure
- [ ] Investigate MMM-ImmichTileSlideShow notification protocol
- [ ] Implement attachPhotoHandlers() for slideshow images
- [ ] Implement handlePhotoTap() touch handler
- [ ] Implement extractPhotoMetadata() method
- [ ] Create templates/photo-viewer.njk template
- [ ] Implement renderPhotoViewer() method
- [ ] Display photo scaled to fit (object-fit: contain)
- [ ] Display metadata (date, album, filename) when available
- [ ] Implement pauseSlideshow() notification
- [ ] Implement resumeSlideshow() notification
- [ ] Resume slideshow on closeOverlay when viewing photo
- [ ] Add photo viewer CSS styles
- [ ] Optional: preloadImage() for smoother experience

## Low Priority

### Configuration & Polish
- [ ] Add configuration options for animationSpeed, backdropOpacity
- [ ] Add configuration for hideUIToggle position
- [ ] Add configuration for photoViewer.showMetadata
- [ ] Add configuration for calendar daysToShow
- [ ] Document module configuration in README
- [ ] Test on touch-capable display

### Accessibility
- [ ] Ensure all interactive elements have aria-labels
- [ ] Ensure close button has visible focus state
- [ ] Verify high contrast text on overlays
- [ ] Verify no color-only indicators
- [ ] Test keyboard navigation (Tab, Escape)

### Optional Enhancements
- [ ] Swipe navigation for news articles
- [ ] Swipe navigation for photos
- [ ] Auto-hide UI after inactivity
- [ ] Loading state for weather data

## Bugs/Issues
- None

## Notes
- Implementation order: overlay infrastructure → hide UI toggle → news → calendar → weather → photo
- CSS-based hiding preferred over MagicMirror hide() method to avoid animation issues
- Touch targets must be minimum 48x48px per spec
- MMM-ImmichTileSlideShow integration requires investigation of its actual API
