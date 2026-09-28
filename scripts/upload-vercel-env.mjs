import { execSync } from "child_process"
import crypto from "crypto"

const cronSecret = crypto.randomBytes(24).toString("hex")

const envVars = [
  {
    key: "DATABASE_URL",
    value:
      "postgresql://neondb_owner:npg_Z6FdwE2OjcUx@ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  },
  {
    key: "VITE_NEON_DATABASE_URL",
    value:
      "postgresql://neondb_owner:npg_Z6FdwE2OjcUx@ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  },
  {
    key: "DATABASE_URL_UNPOOLED",
    value:
      "postgresql://neondb_owner:npg_Z6FdwE2OjcUx@ep-morning-firefly-ay13w5o8.c-5.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  },
  {
    key: "NEON_BRANCH",
    value: "production",
  },
  {
    key: "AWS_ACCESS_KEY_ID",
    value: "nak_live_8263b95ad4154ca49c1870d68f30b93a",
  },
  {
    key: "AWS_SECRET_ACCESS_KEY",
    value:
      "nsk_live_0cba6b663be97996af6cc84b94c08ac5072047a800af6ccc65e151f5f94abd8e",
  },
  {
    key: "AWS_ENDPOINT_URL_S3",
    value:
      "https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech",
  },
  {
    key: "AWS_REGION",
    value: "us-east-2",
  },
  {
    key: "ADMIN_NOTIFICATION_EMAIL",
    value: "anesumupesa@gmail.com",
  },
  {
    key: "CRON_SECRET",
    value: cronSecret,
  },
]

for (const { key, value } of envVars) {
  console.log(`Setting Vercel env: ${key}...`)
  try {
    const output = execSync(
      `npx vercel env add ${key} production,preview,development --value "${value}" --force --yes`,
      { encoding: "utf-8" },
    )
    console.log(`  ✓ ${output.trim()}`)
  } catch (err) {
    console.error(`  ✕ Failed to set ${key}:`, err.message)
  }
}

console.log("All environment variables successfully added to Vercel!")
