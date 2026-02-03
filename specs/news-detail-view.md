# News Detail View

## Purpose

Display full article details when a user taps on the news ticker. Provides headline, source, timestamp, and summary in a readable full-screen format.

## Requirements

### Functional
- Tap any visible news item to open detail view
- Display: headline, source name, publication timestamp, summary/description
- Show "Open full article" link indicator (informational only)
- Navigate between articles within the overlay (optional enhancement)
- Close returns to normal news ticker view

### Non-Functional
- Text size 20% larger than normal module display
- Headline: bold, larger font
- Source and timestamp: muted color
- Summary: normal weight, comfortable line height (1.5)

## Technical Design

### Data Source

The newsfeed module broadcasts article data via notification:

```javascript
// From newsfeed.js:321
this.sendNotification("NEWS_FEED", { items: this.newsItems });
```

Each news item contains:
```javascript
{
    title: "Article headline",
    description: "Article summary or first paragraph",
    url: "https://example.com/article",
    pubdate: "2024-01-15T10:30:00Z",
    sourceTitle: "News Source Name",
    hash: "unique-hash"
}
```

### State Management

```javascript
// In MMM-TouchOverlay
this.newsData = {
    items: [],           // All available articles
    currentIndex: 0      // Currently displayed article index
};

// Listen for news updates
notificationReceived(notification, payload, sender) {
    if (notification === "NEWS_FEED") {
        this.newsData.items = payload.items;
    }
}
```

### Touch Handler

```javascript
handleNewsfeedTap(event) {
    // Find which article was tapped
    const articleElement = event.target.closest(".newsfeed-item");
    if (!articleElement) {
        // Tap on module container, show first/current article
        this.openOverlay("news", { index: 0 });
        return;
    }

    // Find index of tapped article
    const allItems = document.querySelectorAll(".newsfeed-item");
    const index = Array.from(allItems).indexOf(articleElement);

    this.newsData.currentIndex = index >= 0 ? index : 0;
    this.openOverlay("news", { index: this.newsData.currentIndex });
}
```

### DOM Structure (rendered via inline templates)

The news detail view is rendered using inline JavaScript template literals in `renderNewsDetail()`. The resulting DOM structure is:

```html
<div class="news-detail">
    <div class="news-detail-header">
        <span class="news-source">Source Name</span>
        <span class="news-date">2 hours ago</span>
    </div>

    <h1 class="news-headline">Article Headline</h1>

    <div class="news-summary">
        Article summary text...
    </div>

    <div class="news-link-indicator">
        <span class="news-link-icon">🔗</span>
        <span class="news-link-text">https://example.com/article...</span>
    </div>

    <div class="news-navigation">
        <button class="news-nav-btn news-prev" aria-label="Previous article">‹</button>
        <span class="news-position">1 / 10</span>
        <button class="news-nav-btn news-next" aria-label="Next article">›</button>
    </div>
</div>
```

**Note:** No external Nunjucks templates are used. All rendering is done via inline JavaScript template literals for simplicity and to avoid template engine dependencies.

### CSS

```css
.news-detail {
    max-width: 800px;
    padding: 24px;
}

.news-detail-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
}

.news-headline {
    font-size: 28px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: 24px;
}

.news-summary {
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 24px;
}

.news-link-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin-bottom: 24px;
}

.news-navigation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.news-nav-btn {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
}

.news-nav-btn:focus {
    outline: 2px solid white;
    outline-offset: 2px;
}

.news-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.news-position {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
}
```

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `MMM-TouchOverlay.js` | Add news data listener, handler, render method (inline templates) |
| `MMM-TouchOverlay.css` | Add news detail styles |

**Note**: Uses inline JavaScript template literals in `renderNewsDetail()` instead of Nunjucks templates.

### Navigation Logic

```javascript
navigateNews(direction) {
    const newIndex = this.newsData.currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.newsData.items.length) {
        this.newsData.currentIndex = newIndex;
        this.renderContent();
    }
}
```

### Render Method

```javascript
renderNewsDetail() {
    const item = this.newsData.items[this.newsData.currentIndex];
    if (!item) return;

    return {
        headline: item.title,
        source: item.sourceTitle,
        publishDate: moment(item.pubdate).fromNow(),
        summary: item.description,
        url: item.url,
        currentIndex: this.newsData.currentIndex,
        totalItems: this.newsData.items.length
    };
}
```

## Acceptance Criteria

1. [ ] Tapping news ticker opens news detail overlay
2. [ ] Detail view shows headline in large bold text
3. [ ] Detail view shows source name
4. [ ] Detail view shows relative timestamp (e.g., "2 hours ago")
5. [ ] Detail view shows article summary if available
6. [ ] Detail view shows URL indicator (not clickable)
7. [ ] Previous/Next buttons navigate between articles
8. [ ] Navigation buttons are disabled at list boundaries
9. [ ] Position indicator shows "X / Y" article count
10. [ ] Closing overlay returns to normal ticker view

## Open Questions

1. Should swipe gestures navigate between articles?
2. Should the overlay auto-advance to match ticker rotation?
3. What happens if the news data updates while overlay is open?
