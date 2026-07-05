# Working agreement

- Read SPEC.md before any task. It is the source of truth.
- Work autonomously: do NOT stop to ask questions or confirm scope.
  If something is ambiguous, make the most reasonable decision
  consistent with SPEC.md, write it down in DECISIONS.md, and continue.
- Complete the requested phase fully: all files, all loading/error/empty
  states. Then run `npm run build` and fix all errors before finishing.
- Never leave TODO stubs for things the current phase requires.
- Commit with git after each logical step (short, clear messages).
- Do not push to remote, do not deploy, do not touch .env values —
  the user does these manually.
- When done: summarize what was built and list all assumptions
  from DECISIONS.md.
- Do not ask "should I continue?" — continue until the phase is done.
