# Hide UI Toggle

## Purpose

Provide a global toggle button that hides all interface modules, allowing users to focus on the background photo slideshow. A minimal "Show UI" control remains visible to restore the interface.

## Requirements

### Functional
- Persistent toggle button visible on the main interface
- Tapping toggle hides all modules except the background slideshow
- A small "Show UI" control remains visible when UI is hidden
- Tapping "Show UI" restores all modules
- State persists across page reloads (optional)
- Smooth transition when hiding/showing

### Non-Functional
- Toggle button: minimum 48x48px touch target
- Toggle button: positioned to not obscure key information
- Show UI control: small, unobtrusive, positioned in corner
- No layout glitches when toggling
- Fast transition (300ms or less)

## Technical Design

### Approach: CSS-Based Hiding

Use CSS classes to hide modules rather than MagicMirror's `hide()` method. This avoids:
- Animation stacking issues
- Module lifecycle complications
- State management complexity

```css
/* When UI is hidden, hide all module regions except fullscreen */
body.ui-hidden .region:not(.region.fullscreen_below):not(.region.fullscreen_above) {
    opacity: 0;
    pointer-events: none;
    transition: opacity 300ms ease-in-out;
}

/* Also hide module headers */
body.ui-hidden .module-header {
    opacity: 0;
}
```

### DOM Structure

```html
<!-- Toggle button (always visible when UI is shown) -->
<button class="touch-ui-toggle" aria-label="Hide interface">
    <span class="toggle-icon">👁</span>
</button>

<!-- Show UI button (only visible when UI is hidden) -->
<button class="touch-ui-show" aria-label="Show interface">
    <span class="show-icon">👁</span>
    <span class="show-text">Show UI</span>
</button>
```

### State Management

```javascript
// In MMM-TouchOverlay
this.uiState = {
    hidden: false
};

toggleUI() {
    this.uiState.hidden = !this.uiState.hidden;

    if (this.uiState.hidden) {
        this.hideUI();
    } else {
        this.showUI();
    }

    // Persist state (optional)
    if (this.config.persistUIState) {
        localStorage.setItem("mm-touch-ui-hidden", this.uiState.hidden);
    }

    // Notify other modules
    this.sendNotification("TOUCH_UI_HIDDEN", { hidden: this.uiState.hidden });
}

hideUI() {
    document.body.classList.add("ui-hidden");
    this.updateToggleVisibility();
}

showUI() {
    document.body.classList.remove("ui-hidden");
    this.updateToggleVisibility();
}

updateToggleVisibility() {
    const toggleBtn = document.querySelector(".touch-ui-toggle");
    const showBtn = document.querySelector(".touch-ui-show");

    if (this.uiState.hidden) {
        toggleBtn.style.display = "none";
        showBtn.style.display = "flex";
    } else {
        toggleBtn.style.display = "flex";
        showBtn.style.display = "none";
    }
}
```

### Initialization

```javascript
getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "touch-overlay-wrapper";

    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "touch-ui-toggle";
    toggleBtn.setAttribute("aria-label", "Hide interface");
    toggleBtn.innerHTML = `<span class="toggle-icon">👁</span>`;
    toggleBtn.addEventListener("click", () => this.toggleUI());

    // Create show button
    const showBtn = document.createElement("button");
    showBtn.className = "touch-ui-show";
    showBtn.setAttribute("aria-label", "Show interface");
    showBtn.innerHTML = `
        <span class="show-icon">👁</span>
        <span class="show-text">UI</span>
    `;
    showBtn.style.display = "none";
    showBtn.addEventListener("click", () => this.toggleUI());

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(showBtn);

    // Restore persisted state
    if (this.config.persistUIState) {
        const savedState = localStorage.getItem("mm-touch-ui-hidden");
        if (savedState === "true") {
            this.uiState.hidden = true;
            this.hideUI();
        }
    }

    return wrapper;
}
```

### CSS

```css
/* Hide UI Toggle Button */
.touch-ui-toggle {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    transition: background 200ms ease;
}

.touch-ui-toggle:hover,
.touch-ui-toggle:focus {
    background: rgba(0, 0, 0, 0.7);
    outline: none;
}

.touch-ui-toggle:focus {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

/* Show UI Button (when hidden) */
.touch-ui-show {
    position: fixed;
    bottom: 24px;
    right: 24px;
    height: 36px;
    padding: 0 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    cursor: pointer;
    display: none;
    align-items: center;
    gap: 8px;
    z-index: 9998;
    transition: all 200ms ease;
}

.touch-ui-show:hover,
.touch-ui-show:focus {
    background: rgba(0, 0, 0, 0.5);
    color: rgba(255, 255, 255, 0.8);
}

.show-icon {
    font-size: 14px;
}

.show-text {
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* UI Hidden State */
body.ui-hidden .region:not(.region.fullscreen_below):not(.region.fullscreen_above) {
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 300ms ease-in-out;
}

body.ui-hidden .module .module-header {
    opacity: 0 !important;
}

/* Ensure toggle wrapper stays visible */
body.ui-hidden .touch-overlay-wrapper {
    opacity: 1 !important;
    pointer-events: auto !important;
}

/* Ensure overlay stays interactive when UI hidden */
body.ui-hidden .touch-overlay {
    opacity: 1 !important;
    pointer-events: auto !important;
}
```

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `MMM-TouchOverlay.js` | Add toggle logic, state management, DOM creation |
| `MMM-TouchOverlay.css` | Add toggle button styles, hidden state styles |

### Configuration Options

```javascript
{
    module: "MMM-TouchOverlay",
    config: {
        hideUIToggle: {
            enabled: true,                    // Show the toggle button
            position: "bottom-right",         // Button position
            persistState: false,              // Remember state across reloads
            autoHideDelay: 0                  // Auto-hide UI after X seconds (0 = disabled)
        }
    }
}
```

### Position Options

```javascript
const positions = {
    "top-left": { top: "24px", left: "24px" },
    "top-right": { top: "24px", right: "24px" },
    "bottom-left": { bottom: "24px", left: "24px" },
    "bottom-right": { bottom: "24px", right: "24px" }
};

applyPosition(button, position) {
    const pos = positions[position] || positions["bottom-right"];
    Object.assign(button.style, pos);
}
```

### Auto-Hide Feature (Optional)

```javascript
// Optional: automatically hide UI after period of inactivity
setupAutoHide() {
    if (!this.config.hideUIToggle?.autoHideDelay) return;

    let timeout;

    const resetTimer = () => {
        clearTimeout(timeout);
        if (!this.uiState.hidden) {
            timeout = setTimeout(() => {
                this.hideUI();
            }, this.config.hideUIToggle.autoHideDelay * 1000);
        }
    };

    // Reset timer on any interaction
    document.addEventListener("touchstart", resetTimer);
    document.addEventListener("mousemove", resetTimer);

    resetTimer();
}
```

## Acceptance Criteria

1. [ ] Toggle button is visible on the main interface
2. [ ] Toggle button has 48x48px minimum touch target
3. [ ] Tapping toggle button hides all UI modules
4. [ ] Background slideshow remains visible when UI is hidden
5. [ ] "Show UI" button appears when UI is hidden
6. [ ] "Show UI" button is small and unobtrusive
7. [ ] Tapping "Show UI" restores all modules
8. [ ] UI transitions smoothly (no jumps or glitches)
9. [ ] Transition completes in 300ms or less
10. [ ] `TOUCH_UI_HIDDEN` notification is sent on toggle
11. [ ] Toggle button does not cover important module content
12. [ ] Focus states are visible for keyboard accessibility

## Open Questions

1. Should the toggle button itself be hideable via config?
2. Should there be a keyboard shortcut (e.g., Escape) to toggle UI?
3. Should the auto-hide timer reset when the slideshow changes photos?
4. Should specific modules be excludable from hiding?
