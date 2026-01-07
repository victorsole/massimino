# 🛡️ Massimino - 

**Massimino** is a professional-grade, anti-creep fitness platform built to protect personal trainers and athletes while enabling evidence-based, NASM-aligned programming. Our mission is to foster a respectful, secure, and effective training environment for all.

## 🎯 Mission

Massimino creates a zero-tolerance, anti-creep environment for fitness professionals and enthusiasts. We actively protect personal trainers and athletes from inappropriate interactions while keeping the community focused on health, fitness, and respectful engagement.

---

## ✨ Features

### 🔐 Core Platform
- **Certified Coach Profiles** — NASM/ACE/ACSM credential validation
- **Team-Based Management** — Coach-led athlete communities
- **NASM-Based Assessments** — Static/dynamic posture, cardio, and mobility testing
- **Professional Workout Programming** — OPT model-based, phase-driven templates
- **Progress Tracking** — Strength, endurance, mobility, and wellness analytics
- **Secure Messaging** — Real-time, moderated, professional communication
- **Payments** — Mollie integration for seamless coaching transactions

### 🏋️ Browse Programs
- **30+ Pre-Built Training Programs** — Celebrity, goal-based, lifestyle, sport-specific, and modality programs
- **Program Categories:**
  - **Celebrity Programs** — Arnold's Golden Six, CBUM Classic Physique, Ronnie Coleman, Colorado Experiment, IFBB Classic Physique
  - **Goal-Based** — NASM Fat Loss, Muscle Gain, Performance, Aesthetics Hunter
  - **Lifestyle** — Postpartum (Mum/Dad), Stress Management, Time-Constrained, Medical Conditions
  - **Training Modality** — HIIT, [Hyrox](https://hyrox.com/), Cardio, Flexibility, Balance, Plyometric
  - **Sport-Specific** — Castellers, Basketball, Football, Tennis conditioning
- **My Programs** — Track subscribed programs with progress indicators and next workout info
- **Exercise Media Integration** — Video and image demonstrations from exercise database

### ⚙️ Settings & Preferences
- **Profile Visibility** — Public/Private profile control
- **Discovery Settings** — Enable/disable profile discovery for new users
- **Mobile-Optimized UI** — Responsive settings page with improved mobile dropdown positioning

---

## 📝 Language Style Guide (UI Copy)

- Use “Athlete” in all user‑facing copy where traditional tools would say “Client”.
- Keep “CLIENT” for technical contexts only (e.g., role values, database fields, API params), and for code terms like `use client`, “Prisma client”, or “HTTP client”.
- When displaying a user’s role, map `CLIENT → Athlete`, `TRAINER → Trainer`, `ADMIN → Admin`.

### 🛡️ Safety Infrastructure
- **AI Content Moderation** — Real-time message scanning (OpenAI Moderation API)
- **Anti-Harassment Policies** — Zero-tolerance flagging & reporting system
- **Professional Boundary Monitoring** — Role-based chat filters
- **Emergency Protocols** — Crisis escalation and alerting system

### 🏢 Gym & Business Integration
- **Embeddable Widgets** — Easily plug into existing gym sites
- **API Access** — RESTful integration for fitness tools
- **White-Labeling** — Partner-branded platform deployments

---

## 🛠️ Tech Stack

| Layer            | Tech                      |
|------------------|----------------------------|
| Frontend         | Next.js 15 + TypeScript    |
| Styling          | Tailwind CSS               |
| Backend          | Node.js, REST API          |
| Database         | PostgreSQL + Prisma ORM    |
| Authentication   | Google Cloud Identity      |
| Payments         | Mollie API                 |
| Moderation       | OpenAI Moderation API      |
| Hosting          | IONOS Cloud                |
| Testing          | Jest + Playwright          |

---

## 📁 Project Structure
```
massimino/
├── prisma/                    # Database schema & seeds
├── src/
│   ├── app/                   # Auth, dashboard, and API routes
│   │   ├── api/               # REST API endpoints
│   │   │   └── workout/       # Workout & program APIs
│   │   ├── workout-log/       # Workout logging pages
│   │   └── settings/          # User settings page
│   ├── components/            # UI and form components
│   │   ├── programs/          # Program display components
│   │   ├── workout-log/       # Workout log UI (mobile-optimized)
│   │   └── ui/                # Shared UI components
│   ├── core/                  # Core business logic
│   │   └── database/          # Database queries and utilities
│   ├── templates/             # 30+ JSON program templates
│   │   ├── arnold_golden_six.json
│   │   ├── hiit_workout.json
│   │   ├── hyrox_training.json
│   │   └── ... (celebrity, goal, lifestyle, sport programs)
│   ├── types/                 # TypeScript interfaces
│   └── hooks/                 # Custom React hooks
├── tests/                     # Unit & e2e tests
├── public/
│   └── images/programs/       # Program hero images
├── docs/                      # API and deployment guides
├── .env.example               # Env variable template
├── tailwind.config.js         # Tailwind setup
├── next.config.js             # Next.js config
└── README.md
```

## Ownership
Massimino is a product of Beresol BV and developed by Victor Solé Ferioli.
