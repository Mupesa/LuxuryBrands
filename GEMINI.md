# Antigravity & AI Project Instructions

See [`AGENTS.md`](file:///c:/Dev/Active%20Projects/lux%202/AGENTS.md) and [`PROJECT_TOOLS.md`](file:///c:/Dev/Active%20Projects/lux%202/PROJECT_TOOLS.md) for full project rules and tool registry.

## Mandatory Tool & Infrastructure Verification Protocol

Before executing ANY operation involving databases, storage, email, or third-party services, all AI agents **MUST** confirm the target against [`PROJECT_TOOLS.md`](file:///c:/Dev/Active%20Projects/lux%202/PROJECT_TOOLS.md).

- **Neon Database**:
  - **Authorized Project ID**: `soft-butterfly-02907949` (`Luxury Shop Mauritius`)
  - **Authorized Branch**: `production`
  - **Account Owner**: `anesumupesa@gmail.com`
  - **Host**: `ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech`
  - ⚠️ **PROHIBITED**: Never target `rapid-hill-42448439` (`Zimthreads Collective`) or any other project.
- **Neon S3 Storage**:
  - **Bucket Name**: `luxury-brands`
  - **Region**: `us-east-2`
  - **Retention Policy**: 90-day retention for Proof of Payment uploads.
- **Resend Email**:
  - **Admin Recipient**: `anesumupesa@gmail.com`
  - **Sender**: `Noir & Lumière <onboarding@resend.dev>`
- **Cloudinary**:
  - **Target Namespace**: `noir-lumiere/`
  - Confirm credentials and cloud name in [`PROJECT_TOOLS.md`](file:///c:/Dev/Active%20Projects/lux%202/PROJECT_TOOLS.md) before implementing media uploads.
- **GitHub & Version Control**:
  - **Authorized Account Email**: `anesumupesa@gmail.com`
  - ⚠️ **STRICTLY PROHIBITED**: Never link, commit, configure, or push to any GitHub account other than `anesumupesa@gmail.com` (strictly forbid `anesu@intern-mail.metabox.technology` or any corporate/secondary accounts).

**Enforcement Gate**: If ANY parameter or project ID does not match, the AI **MUST ABORT IMMEDIATELY** and request user confirmation.
