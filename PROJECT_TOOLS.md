# PROJECT TOOLS & INFRASTRUCTURE REGISTRY (Noir & Lumière Mauritius)

> **CRITICAL AI DIRECTIVE**:
> Any AI agent operating within this workspace **MUST** read and confirm against this file before executing any database, storage, email, or third-party service operations.
> If any target project ID, branch, bucket, or account differs from this manifest, the AI **MUST ABORT IMMEDIATELY** and ask the user for confirmation.

---

## 1. Primary Account & Organization

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Owner / Admin Email** | `anesumupesa@gmail.com` | Primary account for Neon, Resend, S3, and Cloudinary |
| **Neon Organization ID** | `org-misty-band-32565604` | Organization housing project instances |
| **Brand Identity** | Noir & Lumière Mauritius | High-end luxury fashion atelier storefront |
| **Deployment URL** | Local: `http://localhost:8443` / Preview: Vercel | Production storefront |

---

## 2. Neon PostgreSQL Database

### Authorized Database Specification
* **Project Name**: `Luxury Shop Mauritius`
* **Project ID**: `soft-butterfly-02907949`
* **Target Branch**: `production`
* **PostgreSQL Version**: `18`
* **Region**: `aws-us-east-2` (AWS US East - Ohio)
* **Pooled Hostname**: `ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech`
* **Unpooled Hostname**: `ep-morning-firefly-ay13w5o8.c-5.us-east-2.aws.neon.tech`
* **Database Name**: `neondb`
* **Role**: `neondb_owner`
* **Schema**: `app` (Tables: `app.products`, `app.orders`, `app.order_items`, `app.site_content`)

### ⚠️ Multi-Project Isolation Rule
* **AUTHORIZED TARGET**: `soft-butterfly-02907949` (`Luxury Shop Mauritius`)
* **PROHIBITED TARGET**: `rapid-hill-42448439` (`Zimthreads Collective`) or any other project ID.
* **MANDATORY CHECK**: Before executing any SQL query, migration, MCP call (`run_sql`, `describe_table_schema`, `prepare_database_migration`, etc.), verify that the active database connection or MCP `project_id` matches **`soft-butterfly-02907949`**. Do NOT touch other projects under this account.

---

## 3. Neon Object Storage (S3-Compatible)

* **Provider**: Neon S3 Storage
* **Bucket Name**: `luxury-brands`
* **Region**: `us-east-2`
* **S3 Endpoint**: `https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech`
* **Access Key ID**: Stored in `AWS_ACCESS_KEY_ID` (starts with `nak_live_...`)
* **Secret Access Key**: Stored in `AWS_SECRET_ACCESS_KEY` (starts with `nsk_live_...`)
* **Retention Policy**:
  - Customer Proof of Payment (POP) uploads are stored in folder: `proof-of-payment/`
  - Automated deletion scheduled after **90 days** in compliance with the Mauritius Data Protection Act 2017.
  - Purged via `/api/purge-expired-pop`.

---

## 4. Resend Transactional Email

* **Provider**: Resend (`resend` SDK)
* **Account Email**: `anesumupesa@gmail.com`
* **Admin Notification Destination**: `anesumupesa@gmail.com`
* **Sender Identity**: `Noir & Lumière <onboarding@resend.dev>` (or verified domain in production)
* **Environment Variable**: `RESEND_API_KEY` (stored in `.env.local` / Vercel secrets)
* **Email Workflows**:
  1. `sendOrderNotificationEmail`: Dual dispatch upon order completion:
     - Admin receipt + POP attachment/link.
     - Customer confirmation with MUR breakdown and bank details.
  2. `sendOrderStatusNotificationEmail`: Triggered upon fulfillment status updates by admin.

---

## 5. Cloudinary Media Asset Management

* **Provider**: Cloudinary
* **Intended Role**: Product image optimization, media delivery CDN, transformations, and responsive luxury asset serving.
* **Account Email**: `anesumupesa@gmail.com`
* **Environment Variables**:
  - `CLOUDINARY_CLOUD_NAME`: *(configured in `.env.local` when credentials provided)*
  - `CLOUDINARY_API_KEY`: *(configured in `.env.local` when credentials provided)*
  - `CLOUDINARY_API_SECRET`: *(configured in `.env.local` when credentials provided)*
  - `VITE_CLOUDINARY_CLOUD_NAME`: *(exposed to frontend client if needed)*
* **Asset Folder Structure**:
  - `noir-lumiere/products/` - High-resolution catalog editorial imagery
  - `noir-lumiere/banners/` - Hero video/editorial promotional banners
  - `noir-lumiere/lookbook/` - Atelier seasonal collections
* **AI Rule**: Whenever adding Cloudinary uploads or transformations, verify against the designated `CLOUDINARY_CLOUD_NAME` and never upload outside the `noir-lumiere/` folder namespace.

---

## 6. Vercel Hosting & Serverless Cron Architecture

* **Framework**: React 19 + Vite + Tailwind CSS v4
* **Serverless Functions**:
  - `api/upload.ts` (S3/storage upload)
  - `api/send-order-email.ts` (Resend dual order dispatch)
  - `api/send-status-email.ts` (Resend status updates)
  - `api/purge-expired-pop.ts` (90-day retention cleanup)
  - `api/track-order.ts` (Client order fulfillment lookup)
* **Scheduled Cron**:
  - Schedule: `0 2 * * *` (Daily at 02:00 UTC)
  - Target: `/api/purge-expired-pop`
  - Protection: `Authorization: Bearer $CRON_SECRET`

---

## 7. GitHub Repository & Version Control

* **Authorized Account Email**: `anesumupesa@gmail.com`
* **Account Scope**: Personal GitHub account dedicated strictly to this project.
* **⚠️ STRICT ISOLATION RULE**:
  - All commits, remotes, GitHub Actions, and repository pushes for this project **MUST STRICTLY** belong to the GitHub account associated with `anesumupesa@gmail.com`.
  - **STRICTLY PROHIBITED**: Never link, commit, or push this repository using any work, corporate, or secondary email address (such as `anesu@intern-mail.metabox.technology` or any other account).
* **Local Git Configuration Requirement**:
  Whenever Git is initialized or configured in this project directory, local git config **MUST** be explicitly set to:
  ```bash
  git config user.name "Anesu"
  git config user.email "anesumupesa@gmail.com"
  ```

---

## 8. AI Pre-Execution Verification Checklist

Before taking ANY action involving databases, storage, email, media, or version control:

```
[ ] 1. Identify Target Tool: Database, S3 Bucket, Email, Media, or GitHub.
[ ] 2. Check Project/Resource ID & Account:
       - If Neon Database -> Verify ID is soft-butterfly-02907949 (Luxury Shop Mauritius).
       - If S3 Storage -> Verify bucket is luxury-brands in us-east-2.
       - If Email -> Verify recipient is anesumupesa@gmail.com (admin) or verified customer.
       - If Cloudinary -> Verify namespace is noir-lumiere/.
       - If GitHub -> Verify account email is STRICTLY anesumupesa@gmail.com.
[ ] 3. Discrepancy Gate: If ANY parameter does not match, STOP and request explicit user confirmation.
```
