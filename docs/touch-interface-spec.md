# Touch Interface Specification (MagicMirror)

## Goal
Convert the default MagicMirror interface into a touch-friendly experience. Tapping on modules reveals a full-screen or detail view, and a global control allows hiding all UI to focus on the background image slideshow.

## Scope
In scope:
- News ticker: tap to show full-screen article content.
- Weather: tap to show detailed forecast.
- Calendar: tap to show detailed agenda.
- MMM-ImmichTileSlideShow background: tap a photo to enlarge it.
- Global “hide UI” button to show only images.

Out of scope:
- Voice controls.
- Authentication flows for external services.
- Multi-user profiles.

## Assumptions
- A touch-capable display is connected.
- The default MagicMirror modules are used for news, weather, and calendar (or equivalents with similar DOM structure).
- MMM-ImmichTileSlideShow is configured as the background module.

## Personas
- Primary user: household member using the mirror as a glanceable dashboard.
- Secondary user: photographer or family member browsing background photos.

## Interaction Model
### Global
- All touch targets meet a minimum 48x48 px size.
- Primary action: single tap.
- Escape action: tap outside overlay or use a visible close control.
- Overlays are modal and block background interactions until closed.

### News Ticker (Default Module: MMM-NewsFeed)
- The news module already supports a popup article view; touch should trigger that same popup.
- Tap any ticker item to open the existing article popup.
- Full-screen view includes:
  - Headline
  - Source
  - Timestamp (if available)
  - Summary or first paragraph (if available)
  - “Open full article” link indicator (display-only unless external browser support is added later)
  - Close control
- Swipe left/right (optional enhancement): move between articles.

### Weather (Default Module: currentweather/weatherforecast)
- Tap the weather module to open a full-screen weather detail view.
- Full-screen view includes:
  - Current conditions
  - Hourly forecast (next 12 hours)
  - Daily forecast (next 7 days)
  - Feels-like, humidity, wind, precipitation chance
  - Close control

### Calendar (Default Module: calendar)
- Tap the calendar module to open a full-screen agenda view.
- Full-screen view includes:
  - Agenda list (next 7–14 days)
  - Event title, start time, end time, location
  - All-day event badge
  - Close control

### MMM-ImmichTileSlideShow Background
- Tap a photo to open an enlarged view.
- Enlarged view includes:
  - Photo scaled to fit screen
  - Optional metadata (date, album, or filename) if available
  - Close control
- Background slideshow pauses while a photo is enlarged and resumes on close.

### Global UI Hide Control
- A persistent button toggles “Images Only” mode.
- When enabled:
  - All interface modules are hidden.
  - Only the background slideshow and a small “Show UI” control remain.
- Tap “Show UI” to restore all modules.

## Visual/UX Requirements
- Overlays use a dark translucent backdrop (e.g., rgba(0,0,0,0.8)) to maintain readability.
- Text sizes increase by 10–20% in full-screen views.
- Close control is placed top-right and has a minimum 48x48 px touch area.
- No hover-only interactions.

## Accessibility
- High contrast text on overlays.
- Clear focus state (even if touch-first).
- Do not rely on color alone for UI state.

## Acceptance Criteria
### News
- Tapping a ticker item opens a full-screen view with headline and summary.
- User can close the full-screen view by tapping close or outside overlay.

### Weather
- Tapping weather opens a full-screen view with current, hourly, and daily info.
- User can close the view consistently.

### Calendar
- Tapping calendar opens a full-screen agenda list of upcoming events.
- User can close the view consistently.

### Background Photo
- Tapping a photo opens an enlarged view and pauses slideshow.
- Closing the view resumes slideshow.

### Hide UI
- “Images Only” mode hides all modules and leaves a minimal “Show UI” control.
- Toggling restores all modules without layout glitches.

## Technical Notes (Implementation Hints)
- Use MagicMirror module DOM hooks and a shared overlay component to standardize full-screen views.
- Add a simple event bus or use MM’s notifications to coordinate overlays and slideshow pause/resume.
- Consider using module-specific CSS classes to hide/show modules in “Images Only” mode.

## Open Questions
- Which news module is in use and what fields are available (headline/summary/source)?
- Which weather modules are installed and what data is available for hourly/daily forecasts?
- Should “Open full article” launch an external browser or remain informational only?
- Do you want swipe navigation between news items or photos?
