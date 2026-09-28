import type { Plugin, ViteDevServer } from "vite"
import fs from "node:fs"
import path from "node:path"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"

// Helper to parse .env.local if not already in process.env
function getEnvConfig() {
  const env: Record<string, string> = { ...process.env } as any
  try {
    const envFile = path.resolve(process.cwd(), ".env.local")
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf-8")
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          let val = match[2] || ""
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (!env[match[1]]) env[match[1]] = val
        }
      }
    }
  } catch (e) {
    console.warn("Could not read .env.local:", e)
  }
  return env
}

export function noirApiPlugin(): Plugin {
  return {
    name: "noir-api-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ""

        // Handle JSON Body Parser
        const parseJsonBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = ""
            req.on("data", (chunk) => {
              body += chunk
            })
            req.on("end", () => {
              try {
                resolve(body ? JSON.parse(body) : {})
              } catch (e) {
                reject(e)
              }
            })
            req.on("error", reject)
          })
        }

        // Endpoint: POST /api/upload
        if (url === "/api/upload" && req.method === "POST") {
          try {
            const env = getEnvConfig()
            const {
              fileData,
              filename,
              folder = "uploads",
              contentType = "image/jpeg",
            } = await parseJsonBody()

            if (!fileData || !filename) {
              res.statusCode = 400
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ error: "Missing fileData or filename" }))
              return
            }

            // Extract base64 payload
            const base64Index = fileData.indexOf(";base64,")
            const base64String =
              base64Index !== -1 ? fileData.slice(base64Index + 8) : fileData
            const buffer = Buffer.from(base64String, "base64")

            const s3Endpoint =
              env.AWS_ENDPOINT_URL_S3 ||
              "https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech"
            const region = env.AWS_REGION || "us-east-2"
            const bucketName = "luxury-brands"
            const key = `${folder}/${filename}`

            const s3 = new S3Client({
              region,
              endpoint: s3Endpoint,
              credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
              },
              forcePathStyle: true,
            })

            await s3.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
              }),
            )

            const publicUrl = `${s3Endpoint}/${bucketName}/${key}`
            console.log(
              `[API Upload] Successfully uploaded to Neon Storage: ${publicUrl}`,
            )

            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ success: true, key, url: publicUrl }))
            return
          } catch (err: any) {
            console.error("[API Upload Error]:", err)
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: err?.message || "Upload failed" }))
            return
          }
        }

        // Endpoint: POST /api/send-order-email
        if (url === "/api/send-order-email" && req.method === "POST") {
          try {
            const env = getEnvConfig()
            const payload = await parseJsonBody()
            const adminRecipient =
              payload.recipient ||
              env.ADMIN_NOTIFICATION_EMAIL ||
              "anesumupesa@gmail.com"
            const adminSubject =
              payload.subject ||
              `[Noir & Lumière] Order Notification #${payload.orderRef}`
            const adminHtml = payload.html || ""
            const customerRecipient =
              payload.customerRecipient || payload.customerEmail
            const customerSubject =
              payload.customerSubject ||
              `[Noir & Lumière] Order Confirmation #${payload.orderRef}`
            const customerHtml = payload.customerHtml || ""
            const resendApiKey = env.RESEND_API_KEY

            console.log("--------------------------------------------------")
            console.log(`[Noir & Lumière Email Dispatch]`)
            console.log(`Admin Recipient: ${adminRecipient}`)
            console.log(`Customer Recipient: ${customerRecipient || "None"}`)
            console.log(`Order Ref: #${payload.orderRef}`)
            console.log(
              `Customer: ${payload.customerName} (${payload.customerEmail})`,
            )
            console.log(`Payment Method: ${payload.paymentMethod}`)
            if (payload.proofUrl) {
              console.log(`Proof of Payment Attached: ${payload.proofUrl}`)
            }

            let adminDelivered = false
            let customerDelivered = false

            if (resendApiKey) {
              const resend = new Resend(resendApiKey)

              // 1. Send Admin Notification
              try {
                const sendAdmin = await resend.emails.send({
                  from: "Noir & Lumière <onboarding@resend.dev>",
                  to: [adminRecipient],
                  subject: adminSubject,
                  html: adminHtml,
                })
                console.log("[Resend Admin Result]:", sendAdmin)
                adminDelivered = true
              } catch (resendAdminError) {
                console.warn("[Resend Admin Send Failed]:", resendAdminError)
              }

              // 2. Send Customer Confirmation
              if (customerRecipient && customerHtml) {
                try {
                  const sendCust = await resend.emails.send({
                    from: "Noir & Lumière <onboarding@resend.dev>",
                    to: [customerRecipient],
                    subject: customerSubject,
                    html: customerHtml,
                  })
                  console.log("[Resend Customer Result]:", sendCust)
                  customerDelivered = true
                } catch (resendCustError) {
                  console.warn(
                    "[Resend Customer Send Failed]:",
                    resendCustError,
                  )
                }
              }
            } else {
              console.log(
                "[Note: RESEND_API_KEY is not configured yet. Formatted admin & customer receipts previewed in log.]",
              )
            }
            console.log("--------------------------------------------------")

            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                success: true,
                delivered: adminDelivered || customerDelivered,
                adminDelivered,
                customerDelivered,
                recipient: adminRecipient,
                orderRef: payload.orderRef,
              }),
            )
            return
          } catch (err: any) {
            console.error("[Email Dispatch Error]:", err)
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                error: err?.message || "Email dispatch failed",
              }),
            )
            return
          }
        }

        // Endpoint: POST /api/send-status-email
        if (url === "/api/send-status-email" && req.method === "POST") {
          try {
            const env = getEnvConfig()
            const payload = await parseJsonBody()
            const customerRecipient = payload.customerRecipient
            const customerSubject =
              payload.customerSubject ||
              `[Noir & Lumière] Order Status Update #${payload.orderRef}`
            const customerHtml = payload.customerHtml || ""
            const resendApiKey = env.RESEND_API_KEY

            console.log("--------------------------------------------------")
            console.log(`[Noir & Lumière Status Update Email Dispatch]`)
            console.log(
              `Customer: ${payload.customerName} (${customerRecipient})`,
            )
            console.log(`Order: #${payload.orderRef} -> ${payload.newStatus}`)

            let delivered = false
            if (resendApiKey && customerRecipient && customerHtml) {
              try {
                const resend = new Resend(resendApiKey)
                const sendResult = await resend.emails.send({
                  from: "Noir & Lumière <onboarding@resend.dev>",
                  to: [customerRecipient],
                  subject: customerSubject,
                  html: customerHtml,
                })
                console.log("[Resend Status Update Result]:", sendResult)
                delivered = true
              } catch (resendError) {
                console.warn("[Resend Status Send Failed]:", resendError)
              }
            }
            console.log("--------------------------------------------------")

            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                success: true,
                delivered,
                recipient: customerRecipient,
                orderRef: payload.orderRef,
              }),
            )
            return
          } catch (err: any) {
            console.error("[Status Email Dispatch Error]:", err)
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                error: err?.message || "Status email dispatch failed",
              }),
            )
            return
          }
        }

        // Endpoint: POST /api/purge-expired-pop
        if (url === "/api/purge-expired-pop" && req.method === "POST") {
          try {
            const env = getEnvConfig()
            const dbUrl = env.DATABASE_URL || env.VITE_NEON_DATABASE_URL
            const s3Endpoint = env.AWS_ENDPOINT_URL_S3
            const region = env.AWS_REGION || "us-east-2"
            const bucketName = "luxury-brands"

            if (!dbUrl) {
              throw new Error("DATABASE_URL is not set")
            }

            const sql = neon(dbUrl)
            const s3 = new S3Client({
              region,
              endpoint: s3Endpoint,
              credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
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

            console.log(
              `[Retention Purge] Purged ${purgedCount} expired POP files.`,
            )

            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                success: true,
                purgedCount,
                deletedKeys,
                message: `Successfully purged ${purgedCount} expired proof-of-payment receipts according to the 90-day retention policy.`,
              }),
            )
            return
          } catch (err: any) {
            console.error("[Purge Error]:", err)
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: err?.message || "Purge failed" }))
            return
          }
        }

        next()
      })
    },
  }
}
