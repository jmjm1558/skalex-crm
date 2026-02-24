# AGENTS.md

## Purpose
This repository is a monorepo for a WhatsApp Web CRM system. All agent changes must prioritize user safety and operational control.

## Mandatory Rules
1. **No auto-send or auto-dispatch actions**
   - Never implement automatic message sending to WhatsApp contacts.
   - Any send action must be explicitly initiated by a human user.

2. **Human-in-the-loop at all critical steps**
   - Any irreversible or high-impact action (send, bulk update, delete, export) must require explicit human confirmation.
   - Default behavior should be preview-first, then confirm.

3. **Minimal permissions principle**
   - Request and use only the minimal browser extension permissions needed.
   - Keep backend/API/database credentials scoped and least-privileged.
   - Avoid broad host permissions unless strictly required.

## Engineering Constraints
- Favor strict TypeScript and clear typing.
- Keep dependencies minimal and justified.
- Include linting/formatting scripts for all packages.
- Document setup and run commands for Windows PowerShell.
