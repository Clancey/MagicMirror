# Touch Overlay Component

## Purpose

Provide a shared, reusable overlay/modal infrastructure that other touch features build upon. This is the foundation for all detail views.

## Requirements

### Functional
- Display a full-screen overlay with dark translucent backdrop
- Support different content types (news, weather, calendar, photo)
- Close on: tap outside content area, tap close button, or escape key
- Only one overlay open at a time
- Block background interactions while open

### Non-Functional
- Close button touch target: minimum 48x48px
- Backdrop opacity: rgba(0,0,0,0.8)
- Animation: fade in/out, 200ms duration
- Content area: centered, max 90% viewport width/height

## Technical Design

### Module Registration

```javascript
Module.register("MMM-TouchOverlay", {
    defaults: {
        animationSpeed: 200,
        backdropOpacity: 0.8,
        closeButtonSize: 48
    }
});
```

### DOM Structure

```html
<div class="touch-overlay" data-visible="false">
    <div class="touch-overlay-backdrop"></div>
    <div class="touch-overlay-content">
        <button class="touch-overlay-close" aria-label="Close">×</button>
        <div class="touch-overlay-body">
            <!-- Dynamic content injected here -->
        </div>
    </div>
</div>
```

### State Management

```javascript
// Internal state
this.overlayState = {
    isOpen: false,
    contentType: null,  // 'news' | 'weather' | 'calendar' | 'photo'
    data: null          // Content-specific data
};
```

### Public Methods

```javascript
// Open overlay with specific content type and data
openOverlay(contentType, data) {
    if (this.overlayState.isOpen) return;
    this.overlayState = { isOpen: true, contentType, data };
    this.renderContent();
    this.showOverlay();
}

// Close overlay
closeOverlay() {
    this.overlayState = { isOpen: false, contentType: null, data: null };
    this.hideOverlay();
    this.sendNotification("TOUCH_OVERLAY_CLOSE", {});
}
```

### Touch Handlers

Attach handlers after `MODULE_DOM_CREATED`:

```javascript
notificationReceived(notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
        this.attachTouchHandlers();
    }
}

attachTouchHandlers() {
    // Newsfeed module
    const newsfeed = document.querySelector(".newsfeed");
    if (newsfeed) {
        newsfeed.addEventListener("click", (e) => {
            this.handleNewsfeedTap(e);
        });
    }

    // Weather module
    const weather = document.querySelector(".weather");
    if (weather) {
        weather.addEventListener("click", (e) => {
            this.handleWeatherTap(e);
        });
    }

    // Calendar module
    const calendar = document.querySelector(".calendar");
    if (calendar) {
        calendar.addEventListener("click", (e) => {
            this.handleCalendarTap(e);
        });
    }
}
```

### CSS

```css
.touch-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    display: none;
    opacity: 0;
    transition: opacity 200ms ease-in-out;
}

.touch-overlay[data-visible="true"] {
    display: flex;
    justify-content: center;
    align-items: center;
}

.touch-overlay.visible {
    opacity: 1;
}

.touch-overlay-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
}

.touch-overlay-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    overflow: auto;
    z-index: 1;
}

.touch-overlay-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 48px;
    height: 48px;
    background: transparent;
    border: none;
    color: white;
    font-size: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.touch-overlay-close:focus {
    outline: 2px solid white;
    outline-offset: 2px;
}

.touch-overlay-body {
    padding: 24px;
    padding-top: 56px; /* Space for close button */
    color: white;
}
```

## Implementation Details

### Files to Create

| File | Description |
|------|-------------|
| `modules/MMM-TouchOverlay/MMM-TouchOverlay.js` | Main module logic (includes inline templates) |
| `modules/MMM-TouchOverlay/MMM-TouchOverlay.css` | Styles |

**Note**: The module uses inline JavaScript template literals for rendering instead of Nunjucks templates. This approach was chosen for simplicity and to avoid external template dependencies.

### Dependencies

None beyond MagicMirror core.

### Configuration

```javascript
{
    module: "MMM-TouchOverlay",
    position: "fullscreen_above",  // Requires this position
    config: {
        animationSpeed: 200,
        backdropOpacity: 0.8
    }
}
```

## Acceptance Criteria

1. [ ] Overlay renders as full-screen modal with dark backdrop
2. [ ] Close button is visible and has 48x48px touch target
3. [ ] Tapping backdrop closes overlay
4. [ ] Tapping close button closes overlay
5. [ ] Pressing Escape key closes overlay
6. [ ] Only one overlay can be open at a time
7. [ ] Opening overlay sends `TOUCH_OVERLAY_OPEN` notification
8. [ ] Closing overlay sends `TOUCH_OVERLAY_CLOSE` notification
9. [ ] Overlay fades in/out with 200ms animation

## Open Questions

1. Should the overlay support swipe-to-close?
2. Should there be a loading state while content renders?
