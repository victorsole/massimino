# CLAUDE.md - Massimino Project Guidelines

## Project Overview

Massimino is a fitness application built with Next.js that includes workout logging, training programs, nutrition coaching, and exercise databases.

---

## Workflow Principles (The Cherny Paradigm)

*Based on Boris Cherny's Claude Code workflow*

### Core Philosophy

Treat AI as a **workforce**, not an assistant. You are a **fleet commander** orchestrating multiple parallel operations.

### Key Principles

1. **Parallel Execution** - Run multiple Claude instances for different tasks simultaneously
2. **Model Selection** - Use Opus 4.5 with thinking for everything; slower but requires less correction
3. **Institutional Memory** - Every mistake becomes a rule in this file
4. **Slash Commands** - Automate repetitive workflows
5. **Verification Loops** - Claude proves its own work through testing

---

## Project-Specific Rules

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns in `src/components/`
- Use Tailwind CSS for styling
- Prefer server components where possible (Next.js App Router)

### Database

- Supabase is the primary database
- Exercise data is in JSON files under `public/databases/`
- User data, workout logs, and programs are in Supabase

### Known Issues to Avoid

1. **Navigation Bug**: "Back to Programs" sometimes returns to "Today" tab instead of "Programs" tab
2. **Exercise Media**: Several programs lack exercise media/demonstrations
3. **Missing Exercises**: Some programs reference exercises not in the database

### API Endpoints

- All API routes are in `src/app/api/`
- Authentication via Supabase Auth
- Exercise data served from local JSON and Supabase

### Testing

- Run `npm run build` to check for TypeScript errors
- Test mobile view for all UI changes
- Verify exercise media loads correctly

---

## Corrections Log

*Document every correction here so it doesn't happen again*

<!-- Add corrections in this format:
### YYYY-MM-DD: Brief Description
- What went wrong
- What the correct approach is
-->

---

## Slash Commands

<!-- Add custom slash commands here -->

- `/commit-push-pr` - Commits, pushes, and creates PR in one command

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
├─────────────────────────────────────────────────────────────┤
│  /app                                                        │
│  ├── /api          - API routes (Supabase, external APIs)   │
│  ├── /workout-log  - Workout logging features               │
│  ├── /profile      - User profile management                │
│  └── /massiminos   - Core app features                      │
├─────────────────────────────────────────────────────────────┤
│  /components       - Reusable React components              │
│  /lib              - Utilities, Supabase client, helpers    │
│  /public/databases - Exercise JSON databases (NASM, etc.)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

Before shipping any change:

- [ ] TypeScript builds without errors (`npm run build`)
- [ ] UI works on mobile viewport
- [ ] No console errors in browser
- [ ] Navigation flows work correctly
- [ ] Database operations handle errors gracefully
