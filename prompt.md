# Ralph Loop Prompt - MagicMirror Touch Interface

## Task Status Legend

- `[ ]` - Incomplete (not started or needs rework)
- `[?]` - Waiting to be verified (work done, needs verification)
- `[x]` - Complete (verified by a second agent)

## Context Loading

1. Read `agents.md` for project context and build commands
2. Read `specs/*` for touch interface requirements
3. Read `implementation_plan.md` for current progress

## Task Execution - VERIFICATION FIRST

### If you see a `[?]` task (Waiting Verification)

#### Priority: Verify these FIRST before starting new work

- Review the implementation code
- Check it compiles/loads without errors
- Test in browser if possible (check DOM structure, CSS)
- Verify it meets spec requirements
- If **VERIFIED**: Mark as `[x]` and commit
- If **INCOMPLETE**: Mark as `[ ]` with note explaining what's missing

### If no `[?]` tasks exist:

- Choose an incomplete `[ ]` task
- Implement ONE thing completely
- Test your changes work
- Mark as `[?]` (NOT `[x]`) - another agent must verify
- Commit your work

## Git Commits - MANDATORY

After EVERY successful change:

```bash
git add -A && git commit -m 'Description of change'
```

**DO NOT skip commits. Commit after each task.**

## Error Handling

- File not found → use `list_directory` or `glob` to locate
- Command fails → try different approach
- Stuck 3 times → mark task as BLOCKED, move to next task

## Rules

- Search codebase before implementing new code
- Read existing files before editing them
- One task per iteration
- No placeholder code or TODO comments
- **NEVER mark your own work `[x]`** - only mark as `[?]`
- **Only mark `[x]` when verifying another agent's `[?]` work**

## MagicMirror Specifics

- Modules live in `modules/` directory
- Custom CSS goes in `css/custom.css`
- Use MM notification system for inter-module communication
- Touch targets must be minimum 48x48px
- Test overlay behavior and close controls

---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED: <number>
FILES_MODIFIED: <number>
TESTS_PASSED: true | false
EXIT_SIGNAL: true | false
NEXT_STEP: <brief description>
---END_STATUS---

EXIT_SIGNAL = true ONLY when:

- All tasks in implementation_plan.md are `[x]`
- All modules load without errors
- Touch interactions work per spec
- Specifications fully implemented
