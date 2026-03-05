# Claude Code Prompt: Set Up BCC Email Campaign System

Copy this entire prompt into Claude Code in any project to replicate the email sending infrastructure.

---

## Prompt

Set up a complete email campaign system with the following components. Use Python 3.11+ with no third-party email dependencies (only `smtplib`, `imaplib`, and standard library). The system uses Gmail SMTP via Google Workspace with App Passwords.

### 1. Email Service (`services/email_service.py`)

Create a singleton email service class with these specs:

```python
class EmailService:
    """Core email sender using Gmail SMTP (TLS on port 587)."""
```

**Configuration** (read from environment variables):
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = sender email address (e.g. `hello@example.com`)
- `SMTP_PASSWORD` = Google Workspace App Password (16-char, format: `xxxx xxxx xxxx xxxx`)
- `SMTP_FROM_NAME` = display name for the From header

**Required methods:**
- `is_configured` (property) - returns `True` if `SMTP_USER` and `SMTP_PASSWORD` are set
- `_from_address()` - returns `"Display Name <email>"` formatted sender
- `send(to, subject, html_body, text_body=None)` - send a single email, returns `bool`
- `send_bulk(recipients, subject, html_body)` - send same email to list individually, returns `{"sent": int, "failed": int}`

**SMTP connection pattern** (per send):
```python
with smtplib.SMTP(host, port, timeout=30) as server:
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(user, password)
    server.sendmail(from_addr, to_addr, msg.as_string())
```

**Message format:** `MIMEMultipart("alternative")` with both `text/plain` and `text/html` parts, UTF-8 encoded.

**Dry-run mode:** When SMTP credentials are not configured, log `[EMAIL][DRY-RUN] To: {email} | Subject: {subject}` instead of sending. This makes local development safe.

**Singleton pattern:**
```python
_email_service = None

def get_email_service():
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
```

### 2. BCC Campaign Sender (`scripts/send_campaign.py`)

Create a `send_bcc_campaign()` function that sends bulk emails via BCC batches:

```python
def send_bcc_campaign(recipients, subject, html_body, dry_run=True):
    """Send email to all recipients via BCC using Gmail SMTP.

    - Batches of 90 recipients per SMTP connection (Gmail limit is 100, we use 90 for safety)
    - Sender address goes in To:, recipients go in BCC
    - Each batch opens a fresh SMTP connection
    - Returns {"sent": int, "failed": int}
    """
```

**Key implementation details:**
- Batch size: 90 (Gmail allows 100 per message, 90 is safe margin)
- Gmail daily sending limit: ~2,000 recipients for Google Workspace (500 for free Gmail)
- The sender's own address is included in `To:` header and in the recipient list
- Each batch creates a new `MIMEMultipart("alternative")` message
- Log each batch: `[SEND] Batch {n}/{total} ({count} recipients)`
- On success: `[OK] Batch {n} sent`
- On failure: `[ERROR] Batch {n} failed: {error}`
- Final summary: `[DONE] Campaign: {sent} sent, {failed} failed`

**BCC pattern:**
```python
msg = MIMEMultipart("alternative")
msg["From"] = from_address
msg["To"] = sender_email  # sender receives a copy
msg["Subject"] = subject
# Do NOT set msg["Bcc"] header - just include recipients in sendmail()

all_recipients = [sender_email] + batch
server.sendmail(sender_email, all_recipients, msg.as_string())
```

### 3. HTML Email Template Builder

Create a reusable template builder function:

```python
def build_email(subject, subtitle, greeting, intro, section_heading, features, cta_text, cta_url, free_notice, unsubscribe):
    """Build a responsive HTML email from components. Returns {"subject": str, "html_body": str}."""
```

**HTML email requirements:**
- Table-based layout (600px max width) for email client compatibility
- Inline CSS only (no `<style>` blocks - many email clients strip them)
- Gradient header with logo image and subtitle
- Body with greeting, intro paragraph, feature bullet list, CTA button
- Footer with company info
- Feature bullets use coloured circle markers (&#9679;) cycling through brand colours
- CTA button: centred, rounded corners, solid background colour, white text, no underline
- Mobile-friendly: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Background: light grey (`#f8fafc`), card: white with subtle box-shadow

**Example feature list format:**
```python
features = [
    ("blue", "<strong>Feature title</strong> &mdash; feature description with details"),
    ("green", "<strong>Another feature</strong> &mdash; more details here"),
]
```

### 4. Bounce Cleaner (`scripts/clean_bounced_emails.py`)

Create a script that connects to Gmail IMAP, finds delivery failure messages, extracts bounced addresses, and removes them from CSV files:

**IMAP connection:**
```python
conn = imaplib.IMAP4_SSL("imap.gmail.com", 993)
conn.login(smtp_user, smtp_password)  # Same credentials as SMTP
```

**Bounce detection - search queries:**
```python
search_queries = [
    '(FROM "mailer-daemon" SINCE {date})',
    '(FROM "postmaster" SINCE {date})',
    '(FROM "mail-noreply@google.com" SINCE {date})',
    '(SUBJECT "Delivery Status Notification" SINCE {date})',
    '(SUBJECT "Undeliverable" SINCE {date})',
    '(SUBJECT "delivery failure" SINCE {date})',
    '(SUBJECT "Mail delivery failed" SINCE {date})',
    '(SUBJECT "Message not delivered" SINCE {date})',
    '(SUBJECT "Address not found" SINCE {date})',
]
```

**Email extraction from bounce body:**
- Parse each bounce message (handle multipart: `text/plain`, `text/html`, `message/delivery-status`)
- Use regex to find bounced email addresses in the body
- Skip the sender's own address
- Return `set[str]` of bounced addresses

**CSV cleanup:**
- Read each CSV with `csv.DictReader`
- Filter out rows where `email` column matches a bounced address
- Rewrite the CSV with remaining rows
- Log: `{filename}: {before} -> {after} (removed {count})`

**CLI interface:**
```bash
# Preview bounced emails (no changes)
python scripts/clean_bounced_emails.py --days 7

# Actually remove from CSVs
python scripts/clean_bounced_emails.py --days 7 --apply
```

### 5. Environment Setup

Create a `.env.example` file:

```env
# Email (Gmail SMTP via Google Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Your Company Name
```

**Google Workspace App Password setup:**
1. Go to myaccount.google.com
2. Security > 2-Step Verification (must be enabled)
3. App passwords > Select app: "Mail" > Select device: "Other"
4. Copy the 16-character password into `SMTP_PASSWORD`

**Important constraints:**
- Gmail Workspace daily limit: ~2,000 recipients/day
- Free Gmail daily limit: ~500 recipients/day
- Max recipients per message: 100 (we use 90 for safety)
- If you hit the daily limit, you get error: `550 5.4.5 Daily user sending limit exceeded`
- The limit resets approximately 24 hours after hitting it

### 6. Data Directory Structure

```
data/emails/
  contacts.csv          # Main contact list (full_name, email, institution, department)
  bounced_log.csv       # Optional: log of bounced addresses with dates
```

CSV format:
```csv
full_name,email,institution,department
John Smith,john@example.com,Example Corp,Engineering
```

### 7. Usage Pattern

```python
import csv

# 1. Load contacts
contacts = []
with open("data/emails/contacts.csv", "r") as f:
    contacts = [row["email"] for row in csv.DictReader(f) if row.get("email")]

# 2. Build tailored email
email = build_email(
    subject="Your Product - Tailored subject line",
    subtitle="AI-powered tools for your industry",
    greeting="Dear Colleague,",
    intro="Your compelling intro paragraph here...",
    section_heading="How we can help:",
    features=[
        ("blue", "<strong>Feature 1</strong> &mdash; description"),
        ("green", "<strong>Feature 2</strong> &mdash; description"),
        ("purple", "<strong>Feature 3</strong> &mdash; description"),
        ("gold", "<strong>Feature 4</strong> &mdash; description"),
    ],
    cta_text="Try it free",
    cta_url="https://your-product.com",
    free_notice="Free to use. No credit card required.",
    unsubscribe="Reply to unsubscribe.",
)

# 3. Send campaign
result = send_bcc_campaign(
    recipients=contacts,
    subject=email["subject"],
    html_body=email["html_body"],
    dry_run=False,
)
print(f"Sent: {result['sent']}, Failed: {result['failed']}")

# 4. Clean bounces (run next day)
# python scripts/clean_bounced_emails.py --days 2 --apply
```

### File Naming

All files use `snake_case`. No emojis in code. Use text prefixes for logging: `[OK]`, `[ERROR]`, `[WARN]`, `[INFO]`, `[SEND]`, `[DRY-RUN]`, `[DONE]`.
