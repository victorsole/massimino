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
├── prisma/ # Database schema & seeds
├── src/
│ ├── app/ # Auth, dashboard, and API routes
│ ├── components/ # UI and form components
│ ├── lib/ # Core logic (auth, moderation, payments, etc.)
│ ├── types/ # TypeScript interfaces
│ └── hooks/ # Custom React hooks
├── tests/ # Unit & e2e tests
├── public/ # Static assets and icons
├── docs/ # API and deployment guides
├── .env.example # Env variable template
├── tailwind.config.js # Tailwind setup
├── next.config.js # Next.js config
└── README.md

## Ownership
Massimino is a product of Beresol BV and developed by Victor Solé Ferioli.
