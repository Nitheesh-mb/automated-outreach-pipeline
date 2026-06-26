# Cold Outreach Automation Pipeline

A modular Node.js command-line application that automates the process of finding lookalike companies, identifying key decision-makers, resolving contact information, and sending personalized transactional outreach.

This project was built as a take-home assessment for the Web Development Intern role at Vocallabs/Subspace.

## 🛠️ Tech Stack & Dependencies

- **Node.js** (v16+)
- **ES Modules** (`"type": "module"`)
- **Axios** (for API communication)
- **Dotenv** (for secure credentials management)
- **Chalk** (for clear, colorized terminal outputs)

---

## 📋 The 4-Stage Pipeline

A user inputs a single **seed company domain** (e.g., `stripe.com`), and the pipeline executes four distinct stages without any manual copy-paste:

1. **Stage 1 (Ocean.io)**: Given the seed domain, it calls Ocean.io's lookalike search to find similar company profiles (filtered by size, region, and industry).
2. **Stage 2 (Prospeo)**: For each lookalike company found, it queries Prospeo to identify C-level, VP, or Director level contacts, along with their LinkedIn profiles.
3. **Stage 3 (Email Resolver)**:
ℹ️ *Note: Per instructor guidelines, Eazyreach is skipped in this stage. The pipeline leverages Prospeo's contact enrichment engine as a robust fallback to find and verify professional work emails.*
4. **Stage 4 (Brevo / Transactional Email)**: Before sending, the application displays a **Safety Checkpoint** detailing all emails to be sent. Upon user confirmation, it personalizes a HTML email template and fires outreach messages via Brevo (formerly Sendinblue).

---

## 📂 Project Structure

```
SubSpace/
├── package.json          # Node project config and script dependencies
├── .env                  # Environment file (API keys - local only)
├── .env.example          # Template showing required environment variables
├── .gitignore            # Ignores .env and generated folders from git
├── README.md             # Project documentation (this file)
│
├── src/
│   ├── index.js          # Core orchestrator and safety checkpoint logic
│   ├── config.js         # Loads and validates environment variables
│   │
│   ├── stages/
│   │   ├── stage1-ocean.js     # Stage 1: Ocean.io lookalike search
│   │   ├── stage2-prospeo.js    # Stage 2: Prospeo decision-maker search
│   │   ├── stage3-eazyreach.js   # Stage 3: Resolves emails (Prospeo fallback)
│   │   └── stage4-brevo.js       # Stage 4: Brevo outreach email sender
│   │
│   ├── utils/
│   │   ├── logger.js       # Custom terminal logging utilities using Chalk
│   │   └── rateLimiter.js  # Automatic API rate limit retry with backoff
│   │
│   └── templates/
│       └── outreach.js     # Modular HTML email templates
│
└── output/               # Auto-generated JSON reports from each run
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example` as a starting point) and add your API keys:
```env
# API Keys
OCEAN_API_KEY=your_ocean_api_token
PROSPEO_API_KEY=your_prospeo_api_key
BREVO_API_KEY=your_brevo_api_key

# Sender Email Details (must be verified in your Brevo account)
SENDER_EMAIL=hello@yourdomain.me
SENDER_NAME=Your Name
```

### 3. Run the Program
Run the program by supplying a target company domain:
```bash
npm start stripe.com
```

---

## 💡 Key Implementations

- **Resilient Fallbacks**: If API keys are missing, invalid, or credits are exhausted, the stages automatically switch to generating mock data to ensure the pipeline executes end-to-end for demonstration purposes.
- **Rate Limit Handling**: Incorporates exponential backoff delays when HTTP `429 Too Many Requests` codes are encountered, respecting API limits.
- **Safety Gate**: Pauses before Stage 4, listing all recipients, and requiring the user to explicitly type `yes` before transmitting emails.
- **Tracking**: Every pipeline run generates a detailed timestamped JSON report inside the `/output` folder, outlining lookalike companies, contacts, emails, and message IDs.git init
