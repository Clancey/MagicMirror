# Touch Interface Overview

## Purpose

Convert the default MagicMirror interface into a touch-friendly experience. Users can tap modules to see detailed views and toggle UI visibility to focus on the background slideshow.

## Goals

1. **Touch-first interaction**: All interactions work via single tap on touch screens
2. **Detail views**: Tap news, weather, or calendar to see full-screen detailed information
3. **Photo browsing**: Tap background photos to enlarge them
4. **Focus mode**: Hide all UI to enjoy the photo slideshow

## Architecture

### New Module: MMM-TouchOverlay

A single new module that provides:
- Shared overlay/modal infrastructure
- Touch event handlers attached to existing modules
- Global UI hide toggle
- Coordination via MagicMirror notifications

```
┌─────────────────────────────────────────────────────┐
│                   MagicMirror                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  newsfeed   │  │   weather   │  │  calendar   │  │
│  │   module    │  │   module    │  │   module    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          │                          │
│                          ▼                          │
│              ┌───────────────────────┐              │
│              │    MMM-TouchOverlay   │              │
│              │  - overlay container  │              │
│              │  - touch handlers     │              │
│              │  - UI hide toggle     │              │
│              └───────────────────────┘              │
│                          │                          │
│                          ▼                          │
│              ┌───────────────────────┐              │
│              │ MMM-ImmichTileSlide   │              │
│              │      Show             │              │
│              └───────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### Notification Protocol

| Notification | Sender | Payload | Description |
|--------------|--------|---------|-------------|
| `TOUCH_OVERLAY_OPEN` | MMM-TouchOverlay | `{type, data}` | Request to open overlay |
| `TOUCH_OVERLAY_CLOSE` | MMM-TouchOverlay | `{}` | Overlay closed |
| `TOUCH_UI_HIDDEN` | MMM-TouchOverlay | `{hidden: bool}` | UI visibility changed |
| `SLIDESHOW_PAUSE` | MMM-TouchOverlay | `{}` | Request slideshow pause |
| `SLIDESHOW_RESUME` | MMM-TouchOverlay | `{}` | Request slideshow resume |

### Data Sources

The overlay module reads data from existing module broadcasts:

- **News**: Listens for `NEWS_FEED` notification from newsfeed module (see `newsfeed.js:321`)
- **Weather**: Listens for `WEATHER_UPDATED` notification from weather module (see `weather.js:189`)
- **Calendar**: Listens for `CALENDAR_EVENTS` notification from calendar module (see `calendar.js:937`)

## Technical Constraints

1. **No module modifications**: Avoid changing default MagicMirror modules
2. **Single module**: All touch functionality in one module for simplicity
3. **CSS-based hiding**: Use CSS classes for UI hide, not module hide/show (avoid animation jank)
4. **Touch target size**: Minimum 48x48px for all interactive elements
5. **Accessibility**: High contrast, clear focus states, no color-only indicators

## File Structure

```
modules/
└── MMM-TouchOverlay/
    ├── MMM-TouchOverlay.js      # Main module
    ├── MMM-TouchOverlay.css     # Styles
    └── templates/
        ├── overlay.njk          # Base overlay template
        ├── news-detail.njk      # News detail view
        ├── weather-detail.njk   # Weather detail view
        ├── calendar-detail.njk  # Calendar detail view
        └── photo-viewer.njk     # Photo enlargement view
```

## Implementation Order

1. **touch-overlay.md** - Base overlay infrastructure (blocks other work)
2. **hide-ui-toggle.md** - Simplest feature, validates CSS approach
3. **news-detail-view.md** - Uses existing popup pattern
4. **calendar-detail-view.md** - Straightforward data display
5. **weather-detail-view.md** - Most complex data aggregation
6. **photo-viewer.md** - Requires slideshow integration

## Out of Scope

- Voice controls
- Authentication flows
- Multi-user profiles
- Swipe gestures (optional future enhancement)
- External browser launch

## Open Questions

1. **MMM-ImmichTileSlideShow API**: What notifications does it support for pause/resume?
2. **Weather data availability**: Does the weather module broadcast hourly data?
3. **Touch event conflicts**: Will existing modules intercept touch events?
