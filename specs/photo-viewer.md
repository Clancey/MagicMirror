# Photo Viewer

## Purpose

Enlarge background photos from the MMM-ImmichTileSlideShow module when tapped. Provides a full-screen view of the photo with optional metadata, pausing the slideshow while viewing.

## Requirements

### Functional
- Tap a background photo to enlarge it
- Display photo scaled to fit screen while maintaining aspect ratio
- Show optional metadata: date, album name, filename
- Pause slideshow while photo is enlarged
- Resume slideshow when photo viewer is closed
- Support navigation to next/previous photo (optional enhancement)

### Non-Functional
- Photo loads immediately (no spinner for cached images)
- Smooth transition when opening/closing
- Metadata displayed unobtrusively over image
- Works with any photo aspect ratio

## Technical Design

### Integration with MMM-ImmichTileSlideShow

The photo viewer needs to integrate with the slideshow module. This requires understanding its notification protocol and DOM structure.

**Expected slideshow notifications:**
```javascript
// Request to pause slideshow
this.sendNotification("SLIDESHOW_PAUSE", {});

// Request to resume slideshow
this.sendNotification("SLIDESHOW_RESUME", {});

// Or alternatively, the slideshow may listen for:
this.sendNotification("REMOTE_ACTION", { action: "PAUSE" });
this.sendNotification("REMOTE_ACTION", { action: "PLAY" });
```

**Note:** The exact notification names depend on MMM-ImmichTileSlideShow's implementation. This spec assumes standard patterns - actual implementation may require adjustment.

### DOM Detection

```javascript
// Find slideshow background images
const backgroundImages = document.querySelectorAll(
    ".MMM-ImmichTileSlideShow img, " +
    "[class*='slideshow'] img, " +
    ".background img"
);
```

### State Management

```javascript
// In MMM-TouchOverlay
this.photoData = {
    currentImage: null,     // URL of current image
    metadata: null,         // { date, album, filename }
    slideshowPaused: false
};
```

### Touch Handler

```javascript
attachPhotoHandlers() {
    // Listen for clicks on slideshow images
    document.addEventListener("click", (e) => {
        const img = e.target.closest(
            ".MMM-ImmichTileSlideShow img, " +
            "[class*='slideshow'] img"
        );

        if (img && !this.overlayState.isOpen) {
            this.handlePhotoTap(img);
        }
    });
}

handlePhotoTap(imgElement) {
    const imageUrl = imgElement.src || imgElement.dataset.src;
    const metadata = this.extractPhotoMetadata(imgElement);

    // Pause slideshow
    this.pauseSlideshow();

    // Open viewer
    this.photoData = {
        currentImage: imageUrl,
        metadata,
        slideshowPaused: true
    };

    this.openOverlay("photo", this.photoData);
}

extractPhotoMetadata(imgElement) {
    // Try to extract metadata from data attributes or parent elements
    const container = imgElement.closest("[data-photo-info]");

    return {
        date: imgElement.dataset.date || container?.dataset.date || null,
        album: imgElement.dataset.album || container?.dataset.album || null,
        filename: imgElement.alt || imgElement.dataset.filename || null
    };
}
```

### Slideshow Control

```javascript
pauseSlideshow() {
    if (this.photoData.slideshowPaused) return;

    this.sendNotification("SLIDESHOW_PAUSE", {});
    // Also try alternative notification patterns
    this.sendNotification("REMOTE_ACTION", { action: "PAUSE" });

    this.photoData.slideshowPaused = true;
}

resumeSlideshow() {
    if (!this.photoData.slideshowPaused) return;

    this.sendNotification("SLIDESHOW_RESUME", {});
    this.sendNotification("REMOTE_ACTION", { action: "PLAY" });

    this.photoData.slideshowPaused = false;
}

// Override closeOverlay to resume slideshow
closeOverlay() {
    if (this.overlayState.contentType === "photo") {
        this.resumeSlideshow();
    }
    // ... rest of close logic
}
```

### Template: photo-viewer.njk

```html
<div class="photo-viewer">
    <img
        class="photo-viewer-image"
        src="{{ imageUrl }}"
        alt="{{ metadata.filename | default('Photo') }}"
    />

    {% if metadata.date or metadata.album or metadata.filename %}
    <div class="photo-metadata">
        {% if metadata.date %}
        <span class="photo-date">{{ metadata.date }}</span>
        {% endif %}
        {% if metadata.album %}
        <span class="photo-album">{{ metadata.album }}</span>
        {% endif %}
        {% if metadata.filename %}
        <span class="photo-filename">{{ metadata.filename }}</span>
        {% endif %}
    </div>
    {% endif %}
</div>
```

### CSS

```css
.photo-viewer {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.photo-viewer-image {
    max-width: 95vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.photo-metadata {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
}

.photo-date::before {
    content: "📅 ";
}

.photo-album::before {
    content: "📁 ";
}

.photo-filename {
    color: rgba(255, 255, 255, 0.6);
}

/* Fullscreen-specific overlay adjustments */
.touch-overlay[data-content="photo"] .touch-overlay-content {
    background: transparent;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
}

.touch-overlay[data-content="photo"] .touch-overlay-close {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
}
```

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `MMM-TouchOverlay.js` | Add photo handlers, slideshow control, render method (inline templates) |
| `MMM-TouchOverlay.css` | Add photo viewer styles |

**Note**: Uses inline JavaScript template literals in `renderPhotoViewer()` instead of Nunjucks templates.

### Configuration Options

```javascript
{
    module: "MMM-TouchOverlay",
    config: {
        // Photo viewer specific options
        photoViewer: {
            showMetadata: true,           // Show date/album/filename
            slideshowPauseEnabled: true,  // Attempt to pause slideshow
            customPauseNotification: null // Override pause notification name
        }
    }
}
```

### Render Method

```javascript
renderPhotoViewer() {
    return {
        imageUrl: this.photoData.currentImage,
        metadata: this.config.photoViewer?.showMetadata !== false
            ? this.photoData.metadata
            : null
    };
}
```

### Image Loading Optimization

```javascript
// Preload image before showing overlay for smoother experience
preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async handlePhotoTap(imgElement) {
    const imageUrl = imgElement.src;

    // Image is likely already cached since it's visible
    // But ensure it's loaded before showing overlay
    try {
        await this.preloadImage(imageUrl);
    } catch (e) {
        console.warn("Failed to preload image", e);
    }

    // ... rest of handler
}
```

## Acceptance Criteria

1. [ ] Tapping a slideshow photo opens the photo viewer
2. [ ] Photo is displayed full-screen while maintaining aspect ratio
3. [ ] Photo is centered in the viewport
4. [ ] Slideshow pauses when photo viewer opens
5. [ ] Slideshow resumes when photo viewer closes
6. [ ] Close button is visible over the photo
7. [ ] Tapping backdrop closes the viewer
8. [ ] Metadata (date) is displayed when available
9. [ ] Metadata (album) is displayed when available
10. [ ] Metadata bar is unobtrusive and doesn't cover photo center
11. [ ] Works with photos of various aspect ratios

## Open Questions

1. What notifications does MMM-ImmichTileSlideShow actually support?
2. How is photo metadata exposed (data attributes, separate notification)?
3. Should we support zooming/panning for large photos?
4. Should there be a "download" or "share" option?
5. Should navigation buttons cycle through recent slideshow images?

## Dependencies on External Module

This feature requires understanding of MMM-ImmichTileSlideShow:
- DOM structure for image elements
- Notification protocol for pause/resume
- Metadata availability and format

**Action required:** Review MMM-ImmichTileSlideShow source code to confirm integration approach before implementing.
