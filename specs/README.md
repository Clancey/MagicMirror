# Specifications

This directory contains the source of truth for what needs to be built. Each spec file describes a feature or component in enough detail that an agent can implement it.

## Spec Structure

Each spec should follow this structure:

```markdown
# Feature Name

## Purpose
Brief description of what this feature does and why it exists.

## Requirements
- Functional requirements (what it must do)
- Non-functional requirements (performance, accessibility, etc.)

## Technical Design
- Architecture decisions
- Integration points with existing code
- Data flow

## Implementation Details
- Key files to create/modify
- Dependencies
- Configuration options

## Acceptance Criteria
Testable conditions that must be true when the feature is complete.

## Open Questions
Any unresolved decisions or clarifications needed.
```

## Writing Good Specs

1. **Be specific**: Avoid vague language. "The button should be large enough" is bad. "The button must be at least 48x48 pixels" is good.

2. **Reference existing code**: Point to specific files, functions, or patterns in the codebase. Example: "Use the notification pattern from `modules/default/newsfeed/newsfeed.js:368`"

3. **Define boundaries**: Clearly state what is in scope and out of scope.

4. **Include acceptance criteria**: Every spec needs testable criteria so we know when it's done.

5. **Keep it concise**: Specs should fit in context. If it's too long, break it into smaller specs.

## MagicMirror-Specific Patterns

When writing specs for this project, reference these patterns:

### Module Communication
- Use `sendNotification(notification, payload)` for inter-module messaging
- Use `notificationReceived(notification, payload, sender)` to handle messages
- Standard notifications: `MODULE_DOM_CREATED`, `CALENDAR_EVENTS`, etc.

### DOM Updates
- Override `getDom()` or use `getTemplate()` with Nunjucks templates
- Call `updateDom(speed)` to trigger re-render

### Show/Hide Modules
- `this.hide(speed, callback, options)` with lock strings for coordination
- `this.show(speed, callback, options)` to restore visibility
- `suspend()` and `resume()` lifecycle hooks

### CSS Classes
- Use `.region` classes for positioning
- Standard classes: `.dimmed`, `.bright`, `.small`, `.normal`, `.xsmall`

## File Index

| Spec | Description | Status |
|------|-------------|--------|
| [overview.md](./overview.md) | Project goals and architecture | Draft |
| [touch-overlay.md](./touch-overlay.md) | Shared overlay component | Draft |
| [news-detail-view.md](./news-detail-view.md) | News article full-screen view | Draft |
| [weather-detail-view.md](./weather-detail-view.md) | Weather detail view | Draft |
| [calendar-detail-view.md](./calendar-detail-view.md) | Calendar agenda view | Draft |
| [photo-viewer.md](./photo-viewer.md) | Photo enlargement view | Draft |
| [hide-ui-toggle.md](./hide-ui-toggle.md) | Global UI hide toggle | Draft |
