import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: any, res: any) {
  // Support both GET (Vercel Cron) and POST (manual or webhook trigger)
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  // Verify CRON_SECRET if configured (Vercel automatically sends Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers["authorization"] || ""
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron trigger" })
  }

  try {
    const dbUrl = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL
    const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3
    const region = process.env.AWS_REGION || "us-east-2"
    const bucketName = "luxury-brands"

    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set")
    }

    const sql = neon(dbUrl)
    const s3 = new S3Client({
      region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    })

    const expiredOrders = (await sql`
      SELECT id, order_ref, proof_of_payment_path
      FROM app.orders
      WHERE proof_of_payment_path IS NOT NULL
        AND proof_deleted_at IS NULL
        AND created_at < NOW() - INTERVAL '90 days'
    `) as any[]

    let purgedCount = 0
    const deletedKeys: string[] = []

    for (const order of expiredOrders) {
      const key = order.proof_of_payment_path
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          }),
        )
        await sql`
          UPDATE app.orders
          SET proof_deleted_at = NOW(), proof_of_payment_url = NULL, updated_at = NOW()
          WHERE id = ${order.id}
        `
        purgedCount++
        deletedKeys.push(key)
      } catch (e: any) {
        console.error(`Failed to purge ${key}:`, e.message)
      }
    }

    return res.status(200).json({
      success: true,
      purgedCount,
      deletedKeys,
      message: `Successfully purged ${purgedCount} expired proof-of-payment receipts according to the 90-day retention policy.`,
    })
  } catch (err: any) {
    console.error("[Purge Error]:", err)
    return res.status(500).json({ error: err?.message || "Purge failed" })
  }
}
