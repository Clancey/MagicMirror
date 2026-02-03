# Calendar Detail View

## Purpose

Display a comprehensive agenda view when a user taps on the calendar module. Shows upcoming events for the next 7-14 days with full details including title, time, location, and all-day indicators.

## Requirements

### Functional
- Tap calendar module to open agenda detail view
- Display events grouped by date
- Show event title, start time, end time, location
- Indicate all-day events with badge
- Show event color coding if configured
- Display events for next 7-14 days (configurable)

### Non-Functional
- Clear date headers to separate days
- Readable time format (12h or 24h per user config)
- Vertical scrolling for long event lists
- Dimmed past events (events earlier today)

## Technical Design

### Data Source

The calendar module broadcasts events via notification:

```javascript
// From calendar.js:937
this.sendNotification("CALENDAR_EVENTS", eventList);
```

Event structure:
```javascript
{
    title: "Event Title",
    startDate: 1705312200000,    // Unix timestamp ms
    endDate: 1705315800000,      // Unix timestamp ms
    fullDayEvent: false,
    location: "123 Main St",
    geo: { lat: 0, lon: 0 },     // Optional
    color: "#ff0000",            // Optional
    calendarName: "Work",        // Optional
    symbol: ["fas fa-calendar"], // Icon classes
    today: true,                 // Convenience flags
    tomorrow: false,
    class: "PUBLIC"              // or "PRIVATE"
}
```

### State Management

```javascript
// In MMM-TouchOverlay
this.calendarData = {
    events: [],
    daysToShow: 14
};

notificationReceived(notification, payload, sender) {
    if (notification === "CALENDAR_EVENTS") {
        this.calendarData.events = payload;
    }
}
```

### Touch Handler

```javascript
handleCalendarTap(event) {
    if (this.calendarData.events.length === 0) {
        console.warn("No calendar events available");
        return;
    }
    this.openOverlay("calendar", this.calendarData);
}
```

### DOM Structure (rendered via inline templates)

The calendar detail view is rendered using inline JavaScript template literals in `renderCalendarDetail()`. The resulting DOM structure is:

```html
<div class="calendar-detail">
    <h1 class="calendar-title">Upcoming Events</h1>

    <!-- Empty state when no events -->
    <div class="calendar-empty">No upcoming events</div>

    <!-- Events grouped by date -->
    <section class="calendar-day">
        <h2 class="calendar-date-header today">
            Today
        </h2>

        <div class="calendar-events">
            <div class="calendar-event all-day"
                 style="border-left-color: #ff0000">

                <div class="event-time">
                    <span class="all-day-badge">All Day</span>
                </div>

                <div class="event-details">
                    <div class="event-title">Event Title</div>
                    <div class="event-location">
                        <span class="location-icon">📍</span>
                        123 Main St
                    </div>
                    <div class="event-calendar">Work</div>
                </div>
            </div>

            <div class="calendar-event past">
                <div class="event-time">
                    <span class="event-start">9:00 AM</span>
                    <span class="event-separator">-</span>
                    <span class="event-end">10:00 AM</span>
                </div>

                <div class="event-details">
                    <div class="event-title">Meeting</div>
                </div>
            </div>
        </div>
    </section>
</div>
```

**Note:** No external Nunjucks templates are used. All rendering is done via inline JavaScript template literals for simplicity and to avoid template engine dependencies.

### CSS

```css
.calendar-detail {
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
}

.calendar-title {
    font-size: 24px;
    font-weight: 300;
    margin-bottom: 24px;
    text-align: center;
}

.calendar-empty {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    padding: 48px 0;
}

/* Date Headers */
.calendar-day {
    margin-bottom: 24px;
}

.calendar-date-header {
    font-size: 14px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 12px;
}

.calendar-date-header.today {
    color: #4a9eff;
}

.calendar-date-header.tomorrow {
    color: #7eb8ff;
}

/* Events */
.calendar-events {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.calendar-event {
    display: flex;
    gap: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 4px solid rgba(255, 255, 255, 0.3);
}

.calendar-event.past {
    opacity: 0.5;
}

.calendar-event.all-day {
    background: rgba(255, 255, 255, 0.08);
}

/* Time Column */
.event-time {
    min-width: 80px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.event-separator {
    color: rgba(255, 255, 255, 0.4);
}

.all-day-badge {
    background: rgba(255, 255, 255, 0.15);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
}

/* Details Column */
.event-details {
    flex: 1;
}

.event-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
}

.event-location {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    gap: 4px;
}

.location-icon {
    font-size: 12px;
}

.event-calendar {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 4px;
}
```

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `MMM-TouchOverlay.js` | Add calendar data listener, handler, render method (inline templates) |
| `MMM-TouchOverlay.css` | Add calendar detail styles |

**Note**: Uses inline JavaScript template literals in `renderCalendarDetail()` instead of Nunjucks templates.

### Event Grouping Logic

```javascript
groupEventsByDate(events, daysToShow) {
    const now = moment();
    const endDate = moment().add(daysToShow, "days").endOf("day");

    // Filter and sort events
    const filteredEvents = events
        .filter(e => moment(e.endDate).isAfter(now) && moment(e.startDate).isBefore(endDate))
        .sort((a, b) => a.startDate - b.startDate);

    // Group by date
    const groups = {};
    filteredEvents.forEach(event => {
        const dateKey = moment(event.startDate).format("YYYY-MM-DD");
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(event);
    });

    // Convert to array with labels
    return Object.keys(groups).sort().map(dateKey => {
        const date = moment(dateKey);
        const isToday = date.isSame(now, "day");
        const isTomorrow = date.isSame(moment().add(1, "day"), "day");

        let dateLabel;
        let headerClass = "";

        if (isToday) {
            dateLabel = "Today";
            headerClass = "today";
        } else if (isTomorrow) {
            dateLabel = "Tomorrow";
            headerClass = "tomorrow";
        } else if (date.isSame(now, "week")) {
            dateLabel = date.format("dddd");
        } else {
            dateLabel = date.format("dddd, MMMM D");
        }

        return {
            dateKey,
            dateLabel,
            headerClass,
            events: groups[dateKey].map(e => this.formatEvent(e))
        };
    });
}
```

### Event Formatting

```javascript
formatEvent(event) {
    const now = moment();
    const start = moment(event.startDate);
    const end = moment(event.endDate);

    return {
        title: event.title,
        startTime: event.fullDayEvent ? null : start.format(config.timeFormat === 24 ? "HH:mm" : "h:mm a"),
        endTime: event.fullDayEvent ? null : end.format(config.timeFormat === 24 ? "HH:mm" : "h:mm a"),
        fullDayEvent: event.fullDayEvent,
        location: event.location,
        color: event.color,
        calendarName: event.calendarName,
        isPast: end.isBefore(now)
    };
}
```

### Render Method

```javascript
renderCalendarDetail() {
    const eventsByDate = this.groupEventsByDate(
        this.calendarData.events,
        this.calendarData.daysToShow
    );

    return {
        eventsByDate
    };
}
```

## Acceptance Criteria

1. [ ] Tapping calendar module opens calendar detail overlay
2. [ ] Events are grouped by date with clear headers
3. [ ] Today's header is highlighted
4. [ ] Tomorrow's header is highlighted differently
5. [ ] Event titles are displayed prominently
6. [ ] Start and end times are shown for timed events
7. [ ] All-day events show "All Day" badge instead of times
8. [ ] Event location is shown when available
9. [ ] Calendar name/source is shown when available
10. [ ] Event color coding is preserved from calendar config
11. [ ] Past events (earlier today) are visually dimmed
12. [ ] Long event lists are scrollable
13. [ ] Empty state shows "No upcoming events"

## Open Questions

1. Should tapping an event show more details or do anything?
2. Should we show recurring event indicators?
3. Should multi-day events span multiple date groups or show once?
4. How to handle events with no title?
