import { Resend } from "resend"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const payload = req.body || {}
    const adminRecipient =
      payload.recipient ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
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
    const resendApiKey = process.env.RESEND_API_KEY

    let adminDelivered = false
    let customerDelivered = false

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)

      // 1. Send Admin Notification
      try {
        await resend.emails.send({
          from: "Noir & Lumière <onboarding@resend.dev>",
          to: [adminRecipient],
          subject: adminSubject,
          html: adminHtml,
        })
        adminDelivered = true
      } catch (resendAdminError) {
        console.warn("[Resend Admin Send Failed]:", resendAdminError)
      }

      // 2. Send Customer Confirmation
      if (customerRecipient && customerHtml) {
        try {
          await resend.emails.send({
            from: "Noir & Lumière <onboarding@resend.dev>",
            to: [customerRecipient],
            subject: customerSubject,
            html: customerHtml,
          })
          customerDelivered = true
        } catch (resendCustError) {
          console.warn("[Resend Customer Send Failed]:", resendCustError)
        }
      }
    } else {
      console.log(
        "[Note: RESEND_API_KEY is not configured yet. Formatted admin & customer receipts previewed in log.]",
      )
    }

    return res.status(200).json({
      success: true,
      delivered: adminDelivered || customerDelivered,
      adminDelivered,
      customerDelivered,
      recipient: adminRecipient,
      orderRef: payload.orderRef,
    })
  } catch (err: any) {
    console.error("[Email Dispatch Error]:", err)
    return res.status(500).json({
      error: err?.message || "Email dispatch failed",
    })
  }
}
