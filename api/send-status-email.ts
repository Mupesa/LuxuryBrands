import { Resend } from "resend"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const payload = req.body || {}
    const customerRecipient = payload.customerRecipient
    const customerSubject =
      payload.customerSubject ||
      `[Noir & Lumière] Order Status Update #${payload.orderRef}`
    const customerHtml = payload.customerHtml || ""
    const resendApiKey = process.env.RESEND_API_KEY

    let delivered = false
    if (resendApiKey && customerRecipient && customerHtml) {
      try {
        const resend = new Resend(resendApiKey)
        await resend.emails.send({
          from: "Noir & Lumière <onboarding@resend.dev>",
          to: [customerRecipient],
          subject: customerSubject,
          html: customerHtml,
        })
        delivered = true
      } catch (resendError) {
        console.warn("[Resend Status Send Failed]:", resendError)
      }
    }

    return res.status(200).json({
      success: true,
      delivered,
      recipient: customerRecipient,
      orderRef: payload.orderRef,
    })
  } catch (err: any) {
    console.error("[Status Email Dispatch Error]:", err)
    return res.status(500).json({
      error: err?.message || "Status email dispatch failed",
    })
  }
}
