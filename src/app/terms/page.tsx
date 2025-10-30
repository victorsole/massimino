// src/app/terms/page.tsx

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = {
  title: 'Terms of Service • Massimino',
  description: 'Read the terms that govern your use of Massimino.',
}

const TERMS_MD = `# MASSIMINO TERMS OF SERVICE

**Effective Date:** Wednesday 18 September 2025  
**Last Updated:** Thursday 30 October 2025

## 1. ACCEPTANCE OF TERMS

Welcome to Massimino ("we," "us," "our," "Platform"), the fitness-first community platform. By accessing or using Massimino, you ("User," "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use our Platform.

**Scope:**
These Terms of Service apply to the website, apps, APIs, and services that link to this policy, including Massichat (AI assistant).

## 2. PLATFORM PURPOSE AND CORE PRINCIPLES

### 2.1 Fitness First Mission
Massimino exists exclusively for fitness-related sharing, learning, coaching, and professional networking. Our Platform is designed to connect fitness professionals with enthusiasts in a respectful, safety-focused environment.

### 2.2 Zero-Tolerance Anti-Harassment Policy
Massimino maintains a strict zero-tolerance policy against:
- Harassment, inappropriate advances, or unwanted personal attention
- Objectification or sexualization of users
- Content that shifts focus from fitness to personal appearance in inappropriate ways
- Any behavior that makes the Platform unsafe or uncomfortable for fitness professionals and enthusiasts

## 3. USER ACCOUNTS AND ELIGIBILITY

### 3.1 Account Creation
- Users must be at least 18 years old to create an account
- You must provide accurate, complete information during registration
- You are responsible for maintaining the confidentiality of your account credentials
- You may not create multiple accounts or impersonate others

### 3.2 Account Types
**Fitness Professional Accounts:** For certified trainers, nutritionists, coaches, and other fitness professionals
**Enthusiast Accounts:** For gym-goers, fitness enthusiasts, and those seeking fitness guidance
**Business Accounts:** For gyms, supplement companies, and fitness-related businesses

### 3.3 Professional Verification
Fitness professionals must provide valid certification or credentials for verification before accessing professional features.

## 4. COMMUNITY GUIDELINES AND ACCEPTABLE USE

### 4.1 Permitted Activities
- Sharing fitness knowledge, techniques, and educational content
- Professional coaching and athlete communication
- Respectful networking within the fitness community
- Promoting legitimate fitness services, products, or events
- Constructive feedback on form, technique, and performance

### 4.2 Prohibited Content and Behavior
Users may NOT:
- Post, share, or send content of a sexual, suggestive, or inappropriate nature
- Make comments about users' bodies or appearance that are not directly related to fitness technique or performance
- Engage in harassment, stalking, or unwanted personal contact
- Share content promoting unsafe fitness practices, eating disorders, or illegal substances
- Use the Platform for dating, romantic pursuits, or personal relationships unrelated to fitness
- Send unsolicited personal messages or contact information
- Impersonate fitness professionals or misrepresent qualifications
- Spam, promote unrelated businesses, or engage in fraudulent activities
- Share personal information of other users without consent

### 4.3 AI-Powered Content Moderation
- All content is subject to automated review by our behavioral AI systems
- Messages flagged as potentially inappropriate will trigger "Respect Reminders"
- Users will have the opportunity to edit flagged content before posting
- Repeated violations will result in escalating enforcement actions

## 5. ENFORCEMENT AND CONSEQUENCES

### 5.1 Tiered Enforcement System
**First Violation:** Warning notification and education about community guidelines
**Second Violation:** Content removal, temporary restrictions (24 hours)
**Third Violation:** Account suspension and review
**Severe Violations:** Immediate permanent ban for harassment, threats, or illegal content

### 5.2 Appeals Process
Users may appeal enforcement actions by contacting our moderation team within 30 days of the action.

## 6. PRIVACY AND DATA PROTECTION

### 6.1 Privacy Settings
- Users control their profile visibility and message preferences
- Fitness professionals can restrict communications to athletes only
- Private communities and content sharing is protected by robust privacy controls

### 6.2 Safety Monitoring
To maintain platform safety, we monitor interactions using AI and human moderation. This monitoring is solely for safety and guideline enforcement purposes.

## 7. INTELLECTUAL PROPERTY

### 7.1 User Content
- Users retain ownership of their original content
- By posting content, users grant Massimino a license to use, display, and distribute content on the Platform
- Users represent that they have the right to share all posted content

### 7.2 Platform Content
Massimino's technology, features, and proprietary content are protected by intellectual property laws.

## 8. PREMIUM SERVICES AND PAYMENTS

### 8.1 Subscription Services
- Some features require paid subscriptions
- All payments are processed securely through third-party providers
- Subscription terms and cancellation policies are clearly disclosed at purchase

### 8.2 Trainer Services
- Fitness professionals may offer paid services through the Platform
- Massimino facilitates but does not guarantee these transactions
- Service agreements are between users and professionals

## 9. PLATFORM AVAILABILITY AND MODIFICATIONS

### 9.1 Service Availability
- We strive for 99.9% uptime but cannot guarantee uninterrupted service
- We may perform maintenance or updates that temporarily affect availability

### 9.2 Terms Modifications
We may update these Terms with 30 days' notice. Continued use constitutes acceptance of updated Terms.

## 10. LIMITATION OF LIABILITY

### 10.1 Platform Liability
- Massimino provides the Platform "as is" without warranties
- We are not liable for user interactions, content, or third-party services
- Our liability is limited to the maximum extent permitted by law

### 10.2 User Responsibility
Users are responsible for their interactions, content, and use of fitness advice or services obtained through the Platform.

## 11. TERMINATION

### 11.1 User Termination
Users may delete their accounts at any time through account settings.

### 11.2 Platform Termination
We may suspend or terminate accounts for violations of these Terms, illegal activity, or at our discretion with appropriate notice.

## 12. DISPUTE RESOLUTION

### 12.1 Informal Resolution
Users agree to first attempt to resolve disputes directly with Massimino through our support team.

### 12.2 Binding Arbitration
Disputes that cannot be resolved informally will be subject to binding arbitration under the rules of [Arbitration Organization].

### 12.3 Class Action Waiver
Users waive the right to participate in class action lawsuits against Massimino.

## 13. GENERAL PROVISIONS

### 13.1 Governing Law
These Terms are governed by the laws of [Jurisdiction] without regard to conflict of law principles.

### 13.2 Severability
If any provision of these Terms is found unenforceable, the remaining provisions will remain in full effect.

### 13.3 Entire Agreement
These Terms, along with our Privacy Policy, constitute the entire agreement between users and Massimino.

## 14. CONTACT INFORMATION

For questions about these Terms:
- Email: helloberesol@gmail.com
- Address: Zonnewende 181, 7325 EP, Apeldoorn, Nederland
- Phone: +32493365423

## 15. ACKNOWLEDGMENT

By using Massimino, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our commitment to maintaining a safe, respectful fitness community.

---

**"Train Hard. Stay Safe." - Massimino**` as const

function renderSimpleMarkdown(md: string) {
  const lines = md.split(/\r?\n/)
  const elements: JSX.Element[] = []
  let listBuffer: string[] = []
  let skippedTopH1 = false

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-1">
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  function formatInline(text: string) {
    let s = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1<\/a>')
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>')
    s = s.replace(/__(.+?)__/g, '<strong>$1<\/strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1<\/em>')
    s = s.replace(/_(.+?)_/g, '<em>$1<\/em>')
    return s
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    if (/^#\s+/.test(line)) {
      if (!skippedTopH1) {
        skippedTopH1 = true
        continue
      }
      flushList()
      const content = line.replace(/^#\s+/, '')
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold mt-6">
          {content}
        </h2>
      )
      continue
    }

    if (/^##\s+/.test(line)) {
      flushList()
      const content = line.replace(/^##\s+/, '')
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold mt-6">
          {content}
        </h2>
      )
      continue
    }

    if (/^###\s+/.test(line)) {
      flushList()
      const content = line.replace(/^###\s+/, '')
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-semibold mt-4">
          {content}
        </h3>
      )
      continue
    }

    if (/^-\s+/.test(line)) {
      listBuffer.push(line.replace(/^-\s+/, ''))
      continue
    }

    flushList()
    elements.push(
      <p key={`p-${elements.length}`} className="leading-7" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
    )
  }

  flushList()
  return elements
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>
            The rules and conditions for using Massimino
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-800">
          <div className="text-sm text-gray-600">
            Related: <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </div>
          <div className="text-[15px] space-y-3">
            {renderSimpleMarkdown(TERMS_MD)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
