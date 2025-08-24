# 🛡️ Massimino - 

**Massimino** is a professional-grade, anti-creep fitness platform built to protect personal trainers and clients while enabling evidence-based, NASM-aligned programming. Our mission is to foster a respectful, secure, and effective training environment for all.

## 🎯 Mission

Massimino creates a zero-tolerance, anti-creep environment for fitness professionals and enthusiasts. We actively protect personal trainers and clients from inappropriate interactions while keeping the community focused on health, fitness, and respectful engagement.

---

## ✨ Features

### 🔐 Core Platform
- **Certified Coach Profiles** — NASM/ACE/ACSM credential validation
- **Team-Based Management** — Coach-led client communities
- **NASM-Based Assessments** — Static/dynamic posture, cardio, and mobility testing
- **Professional Workout Programming** — OPT model-based, phase-driven templates
- **Progress Tracking** — Strength, endurance, mobility, and wellness analytics
- **Secure Messaging** — Real-time, moderated, professional communication
- **Payments** — Mollie integration for seamless coaching transactions

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
massimino/

├── prisma/
│   ├── schema.prisma              # Core schema with safety-focused models
│   ├── seeds/
│   │   ├── users.ts              # Seed data for different user types
│   │   └── moderation-rules.ts   # Seed moderation rules & thresholds
│   └── migrations/               # Database version control
│
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── api/
│   │   │   ├── auth/             # OAuth endpoints
│   │   │   ├── moderation/       # Content moderation endpoints
│   │   │   ├── users/            # User management
│   │   │   └── reports/          # Safety reporting system
│   │   ├── auth/                 # Auth pages (login, callback)
│   │   ├── dashboard/            # User dashboards by role
│   │   ├── safety/               # Safety center & reports
│   │   └── globals.css           # Tailwind imports
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   ├── auth/                 # Auth-related components
│   │   ├── safety/               # Safety & moderation components
│   │   │   ├── ModerationAlert.tsx
│   │   │   ├── ReportButton.tsx
│   │   │   └── SafetyBadge.tsx
│   │   ├── forms/                # Form components with built-in moderation
│   │   └── layout/               # Layout components
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts         # Auth configuration
│   │   │   ├── providers.ts      # OAuth providers setup
│   │   │   └── session.ts        # Session management
│   │   ├── moderation/
│   │   │   ├── openai.ts         # OpenAI integration
│   │   │   ├── rules.ts          # Custom moderation rules
│   │   │   ├── middleware.ts     # Content filtering middleware
│   │   │   ├── logger.ts         # Moderation action logging
│   │   │   └── enforcement.ts    # Tiered enforcement system
│   │   ├── safety/
│   │   │   ├── reporting.ts      # User reporting system
│   │   │   ├── reputation.ts     # User reputation scoring
│   │   │   └── privacy.ts        # Privacy controls
│   │   ├── database/
│   │   │   ├── client.ts         # Prisma client setup
│   │   │   └── queries.ts        # Common DB queries
│   │   ├── utils/
│   │   │   ├── validation.ts     # Input validation schemas
│   │   │   └── constants.ts      # App constants & configs
│   │   └── email/                # Email notifications (future)
│   │
│   ├── types/
│   │   ├── auth.ts               # Authentication types
│   │   ├── moderation.ts         # Moderation & safety types
│   │   ├── user.ts               # User & role types
│   │   ├── database.ts           # Database model types
│   │   └── api.ts                # API response types
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useModeration.ts      # Content moderation hook
│   │   ├── useSafety.ts          # Safety features hook
│   │   └── useRole.ts            # Role-based permissions hook
│   │
│   └── middleware.ts             # Next.js middleware for route protection
│
├── tests/
│   ├── __mocks__/                # Test mocks
│   ├── unit/
│   │   ├── moderation/           # Moderation system tests
│   │   ├── auth/                 # Authentication tests
│   │   └── safety/               # Safety feature tests
│   ├── integration/              # API integration tests
│   ├── e2e/                      # End-to-end tests
│   └── utils/                    # Test utilities
│
├── public/
│   ├── icons/                    # App icons & favicons
│   ├── images/
│   │   ├── safety/               # Safety-related imagery
│   │   └── branding/             # Brand assets
│   └── manifest.json             # PWA manifest
│
├── docs/
│   ├── API.md                    # API documentation
│   ├── SAFETY.md                 # Safety policies & enforcement
│   ├── MODERATION.md             # Moderation system guide
│   ├── DEPLOYMENT.md             # Deployment instructions
│   └── CONTRIBUTING.md           # Development guidelines
│
├── config/
│   ├── moderation-rules.json     # Configurable moderation rules
│   ├── safety-thresholds.json    # Safety enforcement thresholds
│   └── user-roles.json          # Role definitions & permissions
│
├── .env.example                  # Environment variables template
├── .env.local                    # Local development env
├── tailwind.config.js            # Tailwind configuration
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint rules
├── prettier.config.js            # Code formatting
└── README.md                     # Project documentation

## Ownership
Massimino is a product of Beresol BV and developed by Victor Solé Ferioli.
