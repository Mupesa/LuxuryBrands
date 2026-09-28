# LuxuryBrands — Noir & Lumière Mauritius

An architectural, high-end luxury e-commerce experience tailored for the Mauritius market. Built with React 19, Vite, Tailwind CSS v4, Neon Serverless PostgreSQL, and Neon Object Storage.

---

## Features

- **Luxury Atelier Storefront**: Refined typography, architectural grid layouts, editorial product showcases, and responsive design.
- **Neon PostgreSQL Backend**: Direct serverless connection to PostgreSQL with stock tracking, product catalog, and order registry.
- **Mauritius Payment & Checkout**:
  - MCB Juice & Bank Transfer with 1-tap account copying.
  - Cash on Delivery with private courier dispatch.
  - Proof of Payment upload with automatic 90-day retention and purge protocol.
- **Post-Purchase Communication**:
  - Dual transactional email dispatch via Resend (instant admin alert + client MUR confirmation receipt).
  - Status update notification emails on fulfillment progress.
- **Client Liaison & Services**:
  - Interactive 5-step order fulfillment tracker (*Received → Allocation → Quality Inspection → Courier Dispatched → Hand-Delivered*).
  - Floating WhatsApp concierge with Mauritius atelier business hours (*Mon–Sat, 9:00–18:00 MUT*).
  - Comprehensive legal modals (Returns & Exchanges, Mauritius Data Protection Act 2017 Privacy Policy, Island Delivery Coverage, Terms of Sale).
- **Administrative Portal**:
  - Secure passcode-protected maison portal (`1002`).
  - Order management with fulfillment status switching.
  - 1-click CSV order export.
  - Printable courier packing slips with item checklists and client delivery instructions.
  - Inline catalog stock quantity editing and image management.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4
- **Database**: Neon Serverless PostgreSQL (`app` schema)
- **Object Storage**: Neon S3 Storage (`luxury-brands` bucket)
- **Email**: Resend Transactional Email API
- **Cron / Retention**: Daily cloud cron (02:00 UTC) purging expired payment proofs after 90 days

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Mupesa/LuxuryBrands.git
cd LuxuryBrands
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local` and provide your service credentials:
```bash
cp .env.example .env.local
```

### 4. Run the development server
```bash
npm run dev
```

Visit `http://localhost:8443` in your browser. Access the admin dashboard at `http://localhost:8443/#admin` (passcode: `1002`).

---

## Infrastructure & Tooling Protocol

See [`PROJECT_TOOLS.md`](./PROJECT_TOOLS.md) and [`AGENTS.md`](./AGENTS.md) for authorized database IDs, S3 bucket settings, and AI verification protocols.
