# The Cherny Paradigm: Claude Code Workflow Principles

*Extracted from Boris Cherny's workflow (Creator & Head of Claude Code at Anthropic)*

---

## Core Mindset Shift

Stop thinking of AI as an assistant. Start treating it as a **workforce**. You are a **fleet commander**, not a typist. The workflow resembles real-time strategy (like Starcraft) more than traditional linear coding.

---

## 1. Parallel Execution

Run multiple Claude instances simultaneously:

- Use 5 Claudes in parallel in your terminal
- Number your tabs 1-5 for easy tracking
- Use system notifications (e.g., iTerm2) to know when a Claude needs input
- Run 5-10 additional Claudes on claude.ai in browser for supplementary tasks
- Use the `teleport` command to hand off sessions between web and local machine

**Why it works:** While one agent runs tests, another refactors, and a third drafts documentation. You orchestrate rather than execute.

---

## 2. Model Selection: Choose Depth Over Speed

Use **Opus 4.5 with thinking** for everything.

**Rationale:** Even though it's bigger and slower than Sonnet:
- Requires less steering/correction
- Better at tool use
- The "compute tax" upfront eliminates the "correction tax" later
- Net result: faster overall despite slower token generation

**Key insight:** The bottleneck isn't AI generation speed—it's human time spent correcting AI mistakes.

---

## 3. The CLAUDE.md File: Institutional Memory

Maintain a single `CLAUDE.md` file in your git repository.

**Protocol:**
- Anytime Claude does something incorrectly, add it to CLAUDE.md
- Claude reads this file and learns not to repeat mistakes
- Every mistake becomes a rule
- The longer you work together, the smarter the agent becomes

**Effect:** Your codebase becomes a self-correcting organism.

---

## 4. Slash Commands: Automate the Bureaucracy

Create custom slash commands checked into your repository.

**Example:** `/commit-push-pr`
- Handles git commands automatically
- Writes commit messages
- Opens pull requests
- Invoked dozens of times daily

**Principle:** Any repetitive task sequence should become a single keystroke.

---

## 5. Subagents: Specialized Personas

Deploy specialized AI personas for specific development phases:

| Subagent | Purpose |
|----------|---------|
| `code-simplifier` | Clean up architecture after main work is done |
| `verify-app` | Run end-to-end tests before shipping |

**Concept:** Different phases of development benefit from different AI configurations/prompts.

---

## 6. Verification Loops: The Quality Multiplier

Give Claude ways to verify its own work:

- Browser automation (Chrome extension)
- Running bash commands
- Executing test suites
- UI testing with iteration

**Process:**
1. Claude writes code
2. Claude opens a browser and tests the UI
3. Claude iterates until the code works and UX feels good

**Impact:** Improves final result quality by **2-3x**.

**Critical principle:** The AI doesn't just write code—it proves the code works.

---

## Summary: The Cherny Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    HUMAN (Fleet Commander)              │
│         Orchestrates, reviews, makes decisions          │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Claude 1 │   │Claude 2 │   │Claude N │  (Parallel Execution)
   │Feature A│   │Refactor │   │  Docs   │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              ┌───────────────┐
              │  CLAUDE.md    │  (Institutional Memory)
              │  + Subagents  │
              │  + Slash Cmds │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │ Verification  │  (Self-Testing Loop)
              │    Loop       │
              └───────────────┘
```

---

## Key Takeaways for Your CLAUDE.md

1. **Document every correction** — mistakes become permanent rules
2. **Create slash commands** — for your most repeated workflows
3. **Trust the slower, smarter model** — fewer corrections = faster overall
4. **Always verify** — give Claude tools to prove its own work
5. **Think parallel** — you're commanding a fleet, not typing code
