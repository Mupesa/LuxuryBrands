import fs from "fs"
import path from "path"
import { neon } from "@neondatabase/serverless"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Load .env.local
const envPath = path.resolve(".env.local")
const env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let val = match[2] || ""
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      env[match[1]] = val
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL
const S3_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3 || env.AWS_ENDPOINT_URL_S3
const S3_REGION = process.env.AWS_REGION || env.AWS_REGION || "us-east-2"
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY
const BUCKET_NAME = "luxury-brands"

async function purgeExpiredProofOfPayments() {
  console.log("=======================================================")
  console.log(" Noir & Lumière — 90-Day POP Retention Purge Service")
  console.log(" Time:", new Date().toISOString())
  console.log("=======================================================")

  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL not found in environment or .env.local")
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)
  const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })

  // Find orders older than 90 days with an active proof of payment
  console.log("Searching for proof-of-payment receipts older than 90 days...")
  const expiredOrders = await sql`
    SELECT id, order_ref, customer_name, proof_of_payment_path, created_at
    FROM app.orders
    WHERE proof_of_payment_path IS NOT NULL
      AND proof_deleted_at IS NULL
      AND created_at < NOW() - INTERVAL '90 days'
    ORDER BY created_at ASC
  `

  console.log(`Found ${expiredOrders.length} expired proof-of-payment records to purge.`)

  if (expiredOrders.length === 0) {
    console.log("No expired receipts found. Retention policy is up-to-date.")
    return
  }

  let deletedCount = 0
  for (const order of expiredOrders) {
    const key = order.proof_of_payment_path
    console.log(`Processing Order ${order.order_ref} (Created: ${order.created_at}). Key: ${key}`)

    try {
      // 1. Delete from S3 storage
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      )
      console.log(`  -> Deleted from storage: ${key}`)

      // 2. Mark as purged in database
      await sql`
        UPDATE app.orders
        SET proof_deleted_at = NOW(),
            proof_of_payment_url = NULL,
            updated_at = NOW()
        WHERE id = ${order.id}
      `
      console.log(`  -> Database updated: proof_deleted_at set to NOW()`)
      deletedCount++
    } catch (err) {
      console.error(`  -> Failed to delete key ${key}:`, err.message)
    }
  }

  console.log("-------------------------------------------------------")
  console.log(`Successfully purged ${deletedCount}/${expiredOrders.length} expired receipts.`)
  console.log("=======================================================")
}

purgeExpiredProofOfPayments().catch((err) => {
  console.error("Purge process encountered fatal error:", err)
  process.exit(1)
})
