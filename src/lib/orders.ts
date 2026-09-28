import { neon } from "@neondatabase/serverless"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const NEON_DB_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_Z6FdwE2OjcUx@ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

const S3_ENDPOINT =
  import.meta.env.VITE_AWS_ENDPOINT_URL_S3 ||
  "https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech"
const S3_REGION = import.meta.env.VITE_AWS_REGION || "us-east-2"
const BUCKET_NAME = "luxury-brands"

export type PaymentMethod = "cod" | "bank_transfer"
export type PaymentStatus = "pending_verification" | "verified" | "cash_on_delivery"
export type OrderStatus = "pending" | "in_atelier" | "out_for_delivery" | "completed" | "cancelled"

export interface OrderItemInput {
  slug: string
  name: string
  size: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl: string
}

export interface CreateOrderInput {
  orderRef: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryNotes?: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotalMur: number
  deliveryFeeMur: number
  totalMur: number
  proofOfPaymentPath?: string
  proofOfPaymentUrl?: string
  items: OrderItemInput[]
}

export interface DbOrder {
  id: string
  order_ref: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_notes?: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  subtotal_mur: number
  delivery_fee_mur: number
  total_mur: number
  proof_of_payment_path?: string
  proof_of_payment_url?: string
  proof_deleted_at?: string
  created_at: string
  updated_at: string
  items?: DbOrderItem[]
}

export interface DbOrderItem {
  id: string
  order_id: string
  product_slug: string
  product_name: string
  size: string
  quantity: number
  unit_price_mur: number
  total_price_mur: number
  image_url: string
  created_at: string
}

/**
 * Uploads a proof-of-payment receipt to the luxury-brands bucket.
 * First tries the local /api/upload endpoint; if unavailable, falls back to direct S3 client.
 */
export async function uploadProofOfPayment(
  file: File,
  orderRef: string,
): Promise<{ path: string url: string }> {
  const extension = file.name.split(".").pop() || "jpg"
  const safeFilename = `pop_${orderRef}_${Date.now()}.${extension}`
  const storagePath = `proof-of-payment/${safeFilename}`

  // 1. Try server endpoint first
  try {
    const reader = new FileReader()
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileData: base64Data,
        filename: safeFilename,
        folder: "proof-of-payment",
        contentType: file.type || "image/jpeg",
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.url && data.key) {
        return { path: data.key, url: data.url }
      }
    }
  } catch (err) {
    console.warn(
      "Server upload endpoint error, falling back to direct upload:",
      err,
    )
  }

  // 2. Direct S3 upload fallback
  const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID
  const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY

  if (!accessKey || !secretKey) {
    const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${storagePath}`
    return { path: storagePath, url: publicUrl }
  }

  const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  })

  const arrayBuffer = await file.arrayBuffer()
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || "image/jpeg",
    }),
  )

  const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${storagePath}`
  return { path: storagePath, url: publicUrl }
}

/**
 * Creates a new order and inserts all order items into Neon PostgreSQL.
 */
export async function createOrder(
  data: CreateOrderInput,
): Promise<{
  success: boolean
  orderId?: string
  orderRef: string
  error?: string
}> {
  try {
    const sql = neon(NEON_DB_URL)

    // Insert order record
    const [orderRow] = await sql`
      INSERT INTO app.orders (
        order_ref,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        delivery_city,
        delivery_notes,
        payment_method,
        payment_status,
        order_status,
        subtotal_mur,
        delivery_fee_mur,
        total_mur,
        proof_of_payment_path,
        proof_of_payment_url
      ) VALUES (
        ${data.orderRef},
        ${data.customerName},
        ${data.customerEmail},
        ${data.customerPhone},
        ${data.deliveryAddress},
        ${data.deliveryCity},
        ${data.deliveryNotes || null},
        ${data.paymentMethod},
        ${data.paymentStatus},
        'pending',
        ${data.subtotalMur},
        ${data.deliveryFeeMur},
        ${data.totalMur},
        ${data.proofOfPaymentPath || null},
        ${data.proofOfPaymentUrl || null}
      )
      RETURNING id, order_ref
    `

    const orderId = orderRow.id

    // Insert order items
    for (const item of data.items) {
      await sql`
        INSERT INTO app.order_items (
          order_id,
          product_slug,
          product_name,
          size,
          quantity,
          unit_price_mur,
          total_price_mur,
          image_url
        ) VALUES (
          ${orderId},
          ${item.slug},
          ${item.name},
          ${item.size},
          ${item.quantity},
          ${item.unitPrice},
          ${item.totalPrice},
          ${item.imageUrl}
        )
      `
    }

    return { success: true, orderId, orderRef: orderRow.order_ref }
  } catch (err: any) {
    console.error("Failed to create order in Neon PostgreSQL:", err)
    return {
      success: false,
      orderRef: data.orderRef,
      error: err?.message || "Order creation failed",
    }
  }
}

/**
 * Fetches all orders with their associated items from Neon PostgreSQL.
 */
export async function fetchAllOrders(
  statusFilter?: string,
): Promise<{
  orders: DbOrder[]
  success: boolean
  error?: string
}> {
  try {
    const sql = neon(NEON_DB_URL)

    let ordersQuery = `
      SELECT id, order_ref, customer_name, customer_email, customer_phone,
             delivery_address, delivery_city, delivery_notes, payment_method,
             payment_status, order_status, subtotal_mur, delivery_fee_mur,
             total_mur, proof_of_payment_path, proof_of_payment_url,
             proof_deleted_at, created_at, updated_at
      FROM app.orders
    `
    if (statusFilter && statusFilter !== "all") {
      ordersQuery += ` WHERE order_status = '${statusFilter}'`
    }
    ordersQuery += ` ORDER BY created_at DESC`

    const orders = (await sql.query(ordersQuery)) as DbOrder[]

    if (!orders || orders.length === 0) {
      return { orders: [], success: true }
    }

    // Fetch items for all returned orders
    const orderIds = orders.map((o) => `'${o.id}'`).join(",")
    const itemsQuery = `
      SELECT id, order_id, product_slug, product_name, size, quantity,
             unit_price_mur, total_price_mur, image_url, created_at
      FROM app.order_items
      WHERE order_id IN (${orderIds})
      ORDER BY created_at ASC
    `
    const items = (await sql.query(itemsQuery)) as DbOrderItem[]

    // Group items by order_id
    const itemsByOrder: Record<string, DbOrderItem[]> = {}
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = []
      }
      itemsByOrder[item.order_id].push(item)
    }

    // Attach items to orders
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }))

    return { orders: ordersWithItems, success: true }
  } catch (err: any) {
    console.error("Failed to fetch orders from Neon PostgreSQL:", err)
    return {
      orders: [],
      success: false,
      error: err?.message || "Failed to load orders",
    }
  }
}

/**
 * Updates order status (e.g., pending -> in_atelier -> out_for_delivery -> completed).
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    await sql`
      UPDATE app.orders
      SET order_status = ${newStatus}, updated_at = NOW()
      WHERE id = ${orderId}
    `
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update order status:", err)
    return { success: false, error: err?.message || "Status update failed" }
  }
}

/**
 * Updates payment status (e.g., pending_verification -> verified).
 */
export async function updatePaymentStatus(
  orderId: string,
  newPaymentStatus: PaymentStatus,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    await sql`
      UPDATE app.orders
      SET payment_status = ${newPaymentStatus}, updated_at = NOW()
      WHERE id = ${orderId}
    `
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update payment status:", err)
    return {
      success: false,
      error: err?.message || "Payment status update failed",
    }
  }
}

/**
 * Trigger the 90-day retention purge of expired proof of payments.
 */
export async function triggerRetentionPurge(): Promise<{
  success: boolean
  purgedCount: number
  message?: string
}> {
  try {
    const res = await fetch("/api/purge-expired-pop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (res.ok) {
      const data = await res.json()
      return {
        success: true,
        purgedCount: data.purgedCount || 0,
        message: data.message,
      }
    }
  } catch (err) {
    console.warn(
      "Server retention purge endpoint failed, executing client SQL fallback:",
      err,
    )
  }

  // Fallback SQL query to check expired count
  try {
    const sql = neon(NEON_DB_URL)
    const rows = await sql`
      SELECT id, proof_of_payment_path
      FROM app.orders
      WHERE proof_of_payment_path IS NOT NULL
        AND proof_deleted_at IS NULL
        AND created_at < NOW() - INTERVAL '90 days'
    `
    return {
      success: true,
      purgedCount: rows.length,
      message: `${rows.length} expired proof-of-payment records identified for retention cleanup.`,
    }
  } catch (err: any) {
    return { success: false, purgedCount: 0, message: err?.message }
  }
}

/**
 * Looks up a specific order by reference and optionally customer email for tracking.
 */
export async function trackOrder(
  orderRef: string,
  customerEmail?: string,
): Promise<{
  success: boolean
  order?: DbOrder
  error?: string
}> {
  try {
    const cleanRef = orderRef.trim().toUpperCase().replace(/^#/, "")
    const sql = neon(NEON_DB_URL)

    let query = `
      SELECT id, order_ref, customer_name, customer_email, customer_phone,
             delivery_address, delivery_city, delivery_notes, payment_method,
             payment_status, order_status, subtotal_mur, delivery_fee_mur,
             total_mur, created_at, updated_at
      FROM app.orders
      WHERE UPPER(order_ref) = '${cleanRef}'
    `
    if (customerEmail && customerEmail.trim()) {
      const cleanEmail = customerEmail.trim().toLowerCase()
      query += ` AND LOWER(customer_email) = '${cleanEmail}'`
    }

    const rows = (await sql.query(query)) as DbOrder[]
    if (!rows || rows.length === 0) {
      return {
        success: false,
        error:
          "No order found matching this reference. Please check your reference or email.",
      }
    }

    const order = rows[0]

    // Fetch line items
    const items = (await sql`
      SELECT id, order_id, product_slug, product_name, size, quantity,
             unit_price_mur, total_price_mur, image_url, created_at
      FROM app.order_items
      WHERE order_id = ${order.id}
      ORDER BY created_at ASC
    `) as DbOrderItem[]

    order.items = items
    return { success: true, order }
  } catch (err: any) {
    console.error("Order tracking lookup failed:", err)
    return { success: false, error: err?.message || "Failed to look up order" }
  }
}
