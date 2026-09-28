---
name: marketing
description: Systematic marketing routine for Brubru and Massimino. Checks metrics, prepares LinkedIn posts, plans outreach actions, and logs everything. Run whenever you have 20-30 minutes for marketing.
argument-hint: "brubru, massimino, linkedin, metrics, outreach, catalan-announce, deep-dive-promo, or full (default)"
---

# Marketing Routine

**Run whenever Victor has time for marketing.** Aim for at least 3 times per week. Each run takes ~20-30 minutes.

**CRITICAL:** This skill prepares content and presents it for Victor's approval. NEVER post, send, or publish anything without explicit OK.

Parse optional argument:
- `full` (default): Run all steps for Brubru
- `brubru`: Same as full -- Brubru marketing only
- `massimino`: Massimino marketing (TODO: define when Massimino has its own marketing plan)
- `linkedin`: Skip to Step 2 (LinkedIn post)
- `metrics`: Only Step 1 (metrics check)
- `outreach`: Skip to Step 3 (outreach action)
- `catalan-announce`: Skip to Step 3c (Catalan translation promotion)
- `deep-dive-promo`: Skip to Step 3d (deep-dive promotion)

## Step 0: Read Context

**Brubru project path:** `/Users/victorsole/Documents/GitHub/brubru`

Read these files first:
- `<brubru>/docs/marketing/beresol-marketing-kit/brubru-context.md` -- Brubru marketing state summary
- OR the full files if needed:
  - `/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-brubru/memory/marketing_plan.md`
  - `/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-brubru/memory/email_campaigns.md`
  - `/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-brubru/memory/feedback_ugc_strategy.md`
  - `/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-brubru/memory/catalan_translation.md`
  - `/Users/victorsole/Documents/GitHub/brubru/docs/marketing/linkedin/content_strategy.md`

Also read the marketing state memory in this project:
- `/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-massimino/memory/marketing_state.md`

Determine where we are in the LinkedIn calendar based on the marketing state memory.

## Step 1: Metrics Check

Run this against Brubru's production database:

```bash
cd /Users/victorsole/Documents/GitHub/brubru/backend
python3.12 -c "
import sys; sys.path.insert(0, '.')
from core.database import SessionLocal
from models.user import User
from models.chat import Chat, Message
from models.pre_user_event import PreUserEvent
from datetime import datetime, timedelta, timezone
from sqlalchemy import func

db = SessionLocal()
now = datetime.now(timezone.utc)
week_ago = now - timedelta(days=7)

# Total registered users
total_users = db.query(User).count()

# New signups this week
new_week = db.query(User).filter(User.created_at >= week_ago).count()

# Active chatters this week (non-Victor)
active_week = db.query(func.count(func.distinct(Chat.user_id))).filter(
    Chat.updated_at >= week_ago
).scalar()

# Total chat messages this week
msgs_week = db.query(Message).filter(Message.created_at >= week_ago).count()

# Pre-user funnel (last 7 days)
page_loads = db.query(PreUserEvent).filter(PreUserEvent.event_type == 'page_load', PreUserEvent.created_at >= week_ago).count()
queries = db.query(PreUserEvent).filter(PreUserEvent.event_type.in_(['query_1', 'query_2', 'query_3']), PreUserEvent.created_at >= week_ago).count()
email_caps = db.query(PreUserEvent).filter(PreUserEvent.event_type == 'email_captured', PreUserEvent.created_at >= week_ago).count()
signups = db.query(PreUserEvent).filter(PreUserEvent.event_type == 'signed_up', PreUserEvent.created_at >= week_ago).count()
ctas = db.query(PreUserEvent).filter(PreUserEvent.event_type == 'cta_clicked', PreUserEvent.created_at >= week_ago).count()

# Recent email captures (potential leads)
recent_emails = db.query(PreUserEvent).filter(
    PreUserEvent.event_type == 'email_captured',
    PreUserEvent.created_at >= week_ago
).order_by(PreUserEvent.created_at.desc()).all()

db.close()

print('=== BRUBRU METRICS (Last 7 Days) ===')
print(f'  Registered users:  {total_users} (+ {new_week} this week)')
print(f'  Active chatters:   {active_week}')
print(f'  Chat messages:     {msgs_week}')
print()
print('=== PRE-USER FUNNEL (Last 7 Days) ===')
print(f'  Page loads:        {page_loads}')
print(f'  Queries tried:     {queries}')
print(f'  Emails captured:   {email_caps}')
print(f'  CTA clicked:       {ctas}')
print(f'  Signed up:         {signups}')

if recent_emails:
    print()
    print('=== NEW EMAIL CAPTURES ===')
    for e in recent_emails[:10]:
        email = (e.event_metadata or {}).get('email', '?')
        print(f'  {e.created_at.strftime(\"%d %b %H:%M\")} -- {email}')
"
```

Present results as a dashboard. Flag notable changes week over week.

## Step 2: LinkedIn Post

### 2a: Determine today's post

LinkedIn content calendar (72 posts, 6 languages):

| Phase | Language | File | Original Dates |
|-------|----------|------|----------------|
| 1 | English | `linkedin_posts_launch_en.md` | 6 Feb -- 4 Mar |
| 2 | French | `linkedin_posts_launch_fr.md` | 6 Mar -- 1 Apr |
| 3 | Spanish | `linkedin_posts_launch_es.md` | 3 Apr -- 29 Apr |
| 4 | Italian | `linkedin_posts_launch_it.md` | 1 May -- 27 May |
| 5 | Dutch | `linkedin_posts_launch_nl.md` | 29 May -- 24 Jun |
| 6 | Catalan | `linkedin_posts_launch_ca.md` | 26 Jun -- 22 Jul |

Files are at: `/Users/victorsole/Documents/GitHub/brubru/docs/marketing/linkedin/`

Check `marketing_state.md` memory for last published post. Present the NEXT post in sequence, ready to copy-paste.

### 2b: Adapt if needed

- Post 1 in any non-English phase needs the time-adapted opening (see content_strategy.md)
- Update any outdated feature claims

### 2c: Present to Victor

Show the full post text. Also show:
- Image brief from `post_images.md`
- Best posting time: 08:00-09:00 CET
- Reminder: respond to comments within 2 hours

## Step 3: Outreach Action

Pick ONE action from this priority list (top to bottom, skip if done recently):

### 3a: Follow up on email captures

If Step 1 found new email captures, draft a personal welcome email from Victor.

### 3b: Spanish/Catalan market outreach

Check email schedule memory for remaining organisations. Prepare next batch (max 5).

### 3c: Catalan translation announcement

Check Catalan translation memory for un-announced translations. For major regulations (GDPR, AI Act, Chips Act), draft a LinkedIn post in Catalan:
- Tag Plataforma per la Llengua (23K followers)
- Tag Omnium Cultural (190K followers)
- Tag BSC/AINA
- Hashtags: #LlenguaCatalana #UE #LegislacioEuropea

### 3d: Deep-dive promotion

Check `/Users/victorsole/Documents/GitHub/brubru/frontend/public/` for recent deep-dive HTML pages. Draft a LinkedIn post in the current phase's language.

### 3e: LinkedIn engagement

Suggest 3 searches for Victor to find and comment on relevant EU policy posts. 2-3 thoughtful comments per session drives profile visits.

## Step 4: Log and Plan

### 4a: Update marketing state

Update the marketing state memory in this project:
`/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-massimino/memory/marketing_state.md`

Also update the Brubru marketing plan memory:
`/Users/victorsole/.claude/projects/-Users-victorsole-Documents-GitHub-brubru/memory/marketing_plan.md`

Append to the session log:
```
### [DATE]
- Metrics: [key numbers]
- LinkedIn: [posted/skipped] Post N (Phase X, [language])
- Outreach: [what was done]
- Next: [what to do next session]
```

### 4b: Present summary

```
MARKETING SESSION: DD Month 2026

  Metrics:    X users, Y active this week, Z new captures
  LinkedIn:   [Posted/Ready] Post N ([language]) -- [topic]
  Outreach:   [Action taken]
  Next time:  [Suggested action for next session]

  Time spent: ~NN minutes
```

## Content Pillars (Reference)

1. **"I asked Brubru..."** -- Showcase a real chatbot answer (screenshot + explanation)
2. **Catalan translations** -- Each major regulation = standalone announcement
3. **Deep-dive analysis** -- Article-by-article legislative analysis as thought leadership
4. **Daily brief highlights** -- Turn a good brief into a LinkedIn post
5. **Behind the scenes** -- "Training an EU policy AI" founder story
6. **Feature updates** -- "Brubru now covers [domain]"

## Important Notes

- Use `python3.12` (not `python3`) for all Python commands
- LinkedIn: 08:00-09:00 CET for peak Brussels engagement
- NEVER post on Victor's behalf -- present text, he copy-pastes
- Catalan translation announcements = highest organic reach opportunity
- Every action must trace back to WAPU (Weekly Active Paid Users)
- Quality over quantity: one good post > three mediocre ones
- Founder surname: Sole (with accent: use `Sol&eacute;` in HTML)
- Brubru supports 6 languages: EN, FR, NL, ES, CA, IT (never claim 23)
- No emojis anywhere
