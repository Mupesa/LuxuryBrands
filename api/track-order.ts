import { neon } from "@neondatabase/serverless"

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const params = req.method === "POST" ? req.body : req.query
    const orderRef = (params.orderRef || params.ref || "").trim().toUpperCase()
    const customerEmail = (params.email || "").trim().toLowerCase()

    if (!orderRef) {
      return res.status(400).json({ error: "Missing order reference" })
    }

    const dbUrl = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set")
    }

    const sql = neon(dbUrl)
    const orders = (await sql`
      SELECT id, order_ref, customer_name, customer_email, delivery_city,
             delivery_address, payment_method, payment_status, fulfillment_status,
             subtotal_mur, delivery_fee_mur, total_mur, tracking_number,
             courier_name, estimated_delivery, created_at, updated_at
      FROM app.orders
      WHERE UPPER(order_ref) = ${orderRef}
    `) as any[]

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: `Order #${orderRef} not found in atelier registry.` })
    }

    const order = orders[0]
    if (customerEmail && order.customer_email.toLowerCase() !== customerEmail) {
      return res.status(403).json({ error: "Email address does not match this order reference." })
    }

    const items = (await sql`
      SELECT id, slug, name, size, quantity, unit_price_mur, total_price_mur, image_url
      FROM app.order_items
      WHERE order_id = ${order.id}
    `) as any[]

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
      },
    })
  } catch (err: any) {
    console.error("[Track Order Error]:", err)
    return res.status(500).json({ error: err?.message || "Order tracking lookup failed" })
  }
}
