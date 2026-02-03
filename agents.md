# AGENTS.md - AI Agent Operating Manual

## Core Principle

**One task at a time.** Pick ONE incomplete task from `IMPLEMENTATION_PLAN.md`, complete it, verify it works, then move on.

- **ALL tasks must be completed** - not just high priority ones
- **Verification workflow** - mark work `[?]` after completion, next iteration verifies before marking `[x]`
- **Commit often** - after every successful change
- **Never skip tasks** - if blocked, document why and attempt unblocking first

## Build Commands

```bash
# Install dependencies
npm install

# Start MagicMirror (development)
npm start

# Start MagicMirror (server only, for headless testing)
npm run server

# Check for syntax errors in JS files
npm run lint
```

## Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "module name"

# Validate config
npm run config:check
```

## Project Structure

```
MagicMirror/
├── config/config.js          # Main configuration
├── css/main.css              # Global styles
├── modules/                  # All modules live here
│   ├── default/              # Built-in modules
│   └── MMM-*/                # Third-party modules
├── js/                       # Core MagicMirror JS
└── vendor/                   # Third-party libraries
```

## Error Handling

### Build Errors
1. Read error message carefully
2. Check for missing dependencies (`npm install`)
3. Validate config syntax (`npm run config:check`)
4. If stuck 3 times, mark task as `[B]` blocked with reason and move on

### Test Failures
- Fix failing tests before proceeding to next task
- Do not mark task complete if tests fail

### File Not Found
- Use `glob` or `list_directory` to locate files
- Check both `modules/default/` and `modules/` for module code

## Task Selection Workflow

```
1. Read IMPLEMENTATION_PLAN.md
2. Find first `[?]` task → verify it works → mark `[x]` if good
3. Find first incomplete `[ ]` task
4. Check for blocking dependencies → complete blockers first
5. Execute selected task
6. Test the change works
7. Mark task `[?]` (pending verification)
8. Commit changes
9. Loop until ALL tasks are `[x]` complete
```

## Project-Specific Rules

### MagicMirror Module Development
- **Do not modify core files** in `js/` unless absolutely necessary
- **Create new modules** in `modules/` directory for new functionality
- **Use MM notification system** for inter-module communication
- **CSS changes** go in module-specific CSS or `css/custom.css`

### Touch Interface Rules
- All touch targets must be **minimum 48x48 px**
- Use **single tap** as primary action (no hover states)
- Overlays must have **visible close control** (top-right)
- Use **dark translucent backdrop** (`rgba(0,0,0,0.8)`) for overlays

### Configuration
- Never commit `config/config.js` with sensitive data
- Use `config/config.js.sample` for examples

### Module Communication
```javascript
// Send notification to other modules
this.sendNotification("NOTIFICATION_NAME", payload);

// Receive notifications
notificationReceived: function(notification, payload, sender) {
  if (notification === "NOTIFICATION_NAME") {
    // Handle it
  }
}
```

## Commit Message Format

```
feat(module): short description

- Detail of change 1
- Detail of change 2
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`

## Verification Checklist

Before marking any task `[?]`:
- [ ] Code runs without errors
- [ ] Touch interactions work (if applicable)
- [ ] Overlay opens and closes properly (if applicable)
- [ ] No console errors in browser
- [ ] Existing functionality not broken
