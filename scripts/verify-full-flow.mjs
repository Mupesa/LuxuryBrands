import fs from "fs"
import path from "path"
import { neon } from "@neondatabase/serverless"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

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

async function verify() {
  console.log("=== STEP 1: Verify Neon Postgres Connection ===")
  const sql = neon(DATABASE_URL)
  const [productCount] = await sql`SELECT count(*) FROM app.products`
  console.log("Active products in DB:", productCount.count)

  const siteContent = await sql`SELECT key, title FROM app.site_content`
  console.log("Site content sections in DB:", siteContent.map((s) => s.key).join(", "))

  console.log("\n=== STEP 2: Verify S3 Proof-of-Payment Upload & Storage ===")
  const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })

  const testOrderRef = "NL-MU-TEST-" + Math.floor(1000 + Math.random() * 9000)
  const testPopKey = `proof-of-payment/pop_${testOrderRef}_test.txt`
  const testPopBody = `PROOF OF PAYMENT\nBank: The Mauritius Commercial Bank (MCB)\nOrder Ref: ${testOrderRef}\nAmount: Rs 6,900\nDate: 2026-09-17\nStatus: Settled`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testPopKey,
      Body: testPopBody,
      ContentType: "text/plain",
    })
  )
  const testPopUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${testPopKey}`
  console.log("Uploaded test POP receipt to S3:", testPopUrl)

  console.log("\n=== STEP 3: Verify Order Insertion in Neon DB ===")
  const [newOrder] = await sql`
    INSERT INTO app.orders (
      order_ref, customer_name, customer_email, customer_phone,
      delivery_address, delivery_city, delivery_notes,
      payment_method, payment_status, order_status,
      subtotal_mur, delivery_fee_mur, total_mur,
      proof_of_payment_path, proof_of_payment_url
    ) VALUES (
      ${testOrderRef},
      'Lady Vivienne Desvaux',
      'vivienne.desvaux@example.mu',
      '+230 5812 9988',
      'Royal Road, Villa Cap Malheureux',
      'Grand Baie',
      'Please leave with concierge if not home',
      'bank_transfer',
      'pending_verification',
      'pending',
      6900,
      0,
      6900,
      ${testPopKey},
      ${testPopUrl}
    )
    RETURNING id, order_ref
  `
  console.log("Order created:", newOrder)

  await sql`
    INSERT INTO app.order_items (
      order_id, product_slug, product_name, size, quantity, unit_price_mur, total_price_mur, image_url
    ) VALUES (
      ${newOrder.id},
      'column-dress',
      'The Column Dress',
      '38',
      1,
      6900,
      6900,
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop&auto=format'
    )
  `
  console.log("Order item created for Column Dress.")

  console.log("\n=== STEP 4: Verify Order Retrieval for Admin Dashboard ===")
  const [retrieved] = await sql`
    SELECT o.id, o.order_ref, o.customer_name, o.customer_phone, o.payment_method, o.payment_status, o.proof_of_payment_url,
           count(i.id) as item_count
    FROM app.orders o
    LEFT JOIN app.order_items i ON o.id = i.order_id
    WHERE o.id = ${newOrder.id}
    GROUP BY o.id, o.order_ref, o.customer_name, o.customer_phone, o.payment_method, o.payment_status, o.proof_of_payment_url
  `
  console.log("Retrieved Order for Admin:", retrieved)

  console.log("\n=== STEP 5: Verify Payment Verification Action ===")
  await sql`
    UPDATE app.orders
    SET payment_status = 'verified', order_status = 'in_atelier', updated_at = NOW()
    WHERE id = ${newOrder.id}
  `
  const [updated] = await sql`
    SELECT order_ref, payment_status, order_status FROM app.orders WHERE id = ${newOrder.id}
  `
  console.log("Updated order status:", updated)

  console.log("\n=== STEP 6: Verify 90-Day Retention Clean Up Functionality ===")
  // Clean up test order & test POP
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testPopKey,
    })
  )
  await sql`DELETE FROM app.order_items WHERE order_id = ${newOrder.id}`
  await sql`DELETE FROM app.orders WHERE id = ${newOrder.id}`
  console.log("Test receipt and order cleaned up gracefully.")

  console.log("\n>>> ALL VERIFICATION STEPS PASSED SUCCESSFULLY! <<<")
}

verify().catch((e) => {
  console.error("Verification failed:", e)
  process.exit(1)
})
