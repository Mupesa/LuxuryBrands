import { formatPriceMUR } from "@/lib/neon"
import {
  DbOrder,
  DbOrderItem,
  CreateOrderInput,
  OrderStatus,
} from "@/lib/orders"

export const ADMIN_EMAIL = "anesumupesa@gmail.com"

export interface SendOrderEmailPayload {
  order: CreateOrderInput | DbOrder
  items: (DbOrderItem | any)[]
}

/**
 * Builds the elegant HTML email body for Noir & Lumière atelier admin notifications.
 */
export function generateOrderNotificationHtml(
  order: CreateOrderInput | DbOrder,
  items: any[],
): string {
  const isBankTransfer = order.paymentMethod === "bank_transfer"
  const popUrl =
    (order as any).proofOfPaymentUrl || (order as any).proof_of_payment_url
  const orderRef = (order as any).orderRef || (order as any).order_ref
  const customerName =
    (order as any).customerName || (order as any).customer_name
  const customerEmail =
    (order as any).customerEmail || (order as any).customer_email
  const customerPhone =
    (order as any).customerPhone || (order as any).customer_phone
  const address =
    (order as any).deliveryAddress || (order as any).delivery_address
  const city = (order as any).deliveryCity || (order as any).delivery_city
  const notes = (order as any).deliveryNotes || (order as any).delivery_notes
  const subtotal =
    (order as any).subtotalMur || (order as any).subtotal_mur || 0
  const deliveryFee =
    (order as any).deliveryFeeMur ?? (order as any).delivery_fee_mur ?? 0
  const total = (order as any).totalMur || (order as any).total_mur || 0

  const itemsRows = items
    .map((item) => {
      const name = item.name || item.product_name
      const size = item.size
      const qty = item.quantity || item.qty
      const unit = item.unitPrice || item.unit_price_mur
      const lineTotal = item.totalPrice || item.total_price_mur || unit * qty
      const img = item.imageUrl || item.image_url || item.image

      return `
        <tr>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e8e4dc;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${
                img
                  ? `<img src="${img}" alt="${name}" width="54" height="68" style="object-fit: cover; border-radius: 2px; border: 1px solid #dfdbd2;" />`
                  : ""
              }
              <div>
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #1a1814; font-weight: 500;">
                  ${name}
                </div>
                <div style="font-size: 12px; color: #78716c; margin-top: 3px; font-family: sans-serif;">
                  Size: <strong>${size}</strong> &nbsp;·&nbsp; Qty: <strong>${qty}</strong>
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e8e4dc; text-align: right; font-family: sans-serif; font-size: 14px; color: #1a1814;">
            ${formatPriceMUR(unit)}
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e8e4dc; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #9a7a45;">
            ${formatPriceMUR(lineTotal)}
          </td>
        </tr>
      `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Order ${orderRef} — Noir & Lumière Atelier</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f1ea; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f1ea; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e6e2d8;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #1a1814; padding: 32px 30px; text-align: center;">
                  <div style="color: #c9a96e; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 8px; font-family: sans-serif;">
                    Port Louis Atelier · Mauritius
                  </div>
                  <div style="color: #ffffff; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; letter-spacing: 0.18em; text-transform: uppercase;">
                    Noir & Lumière
                  </div>
                </td>
              </tr>

              <!-- Order Summary Header -->
              <tr>
                <td style="padding: 28px 30px 20px 30px; border-bottom: 1px solid #eeebe3;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="display: inline-block; background-color: #f0ebe1; color: #785a28; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px;">
                          Atelier Order Dispatch
                        </span>
                        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #1a1814; margin: 12px 0 4px 0; font-weight: 400;">
                          New Order Allocation: #${orderRef}
                        </h1>
                        <p style="color: #78716c; font-size: 13px; margin: 0;">
                          Received on ${new Date().toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} · Port Louis Time
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Customer & Delivery Liaison Details -->
              <tr>
                <td style="padding: 24px 30px; background-color: #faf8f5; border-bottom: 1px solid #eeebe3;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 15px;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 6px;">
                          Client Details
                        </div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a1814; margin-bottom: 4px;">
                          ${customerName}
                        </div>
                        <div style="font-size: 13px; color: #57534e; margin-bottom: 3px;">
                          <a href="mailto:${customerEmail}" style="color: #57534e; text-decoration: none;">${customerEmail}</a>
                        </div>
                        <div style="font-size: 13px; color: #57534e;">
                          <a href="tel:${customerPhone}" style="color: #57534e; text-decoration: none;">${customerPhone}</a>
                        </div>
                      </td>
                      <td width="50%" valign="top" style="padding-left: 15px; border-left: 1px solid #e8e4dc;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 6px;">
                          Island-wide Delivery Address
                        </div>
                        <div style="font-size: 13px; color: #1a1814; line-height: 1.4;">
                          ${address}<br>
                          <strong>${city}</strong>, Mauritius
                        </div>
                        ${
                          notes
                            ? `<div style="font-size: 12px; color: #78716c; margin-top: 6px; font-style: italic;">“${notes}”</div>`
                            : ""
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Payment Method & Proof of Payment -->
              <tr>
                <td style="padding: 22px 30px; border-bottom: 1px solid #eeebe3;">
                  <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 8px;">
                    Settlement Method
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 14px; font-weight: 600; color: #1a1814;">
                      ${
                        isBankTransfer
                          ? "Bank Transfer / Juice (MCB)"
                          : "Cash on Delivery (White Glove Courier)"
                      }
                    </span>
                    <span style="font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 2px; ${
                      isBankTransfer
                        ? "background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;"
                        : "background-color: #fefce8; color: #854d0e; border: 1px solid #fef08a;"
                    }">
                      ${
                        isBankTransfer
                          ? "Verification Pending"
                          : "Cash on Delivery"
                      }
                    </span>
                  </div>

                  ${
                    popUrl
                      ? `
                    <div style="margin-top: 14px; padding: 14px; background-color: #fdfbf7; border: 1px solid #e8e2d5; border-radius: 4px;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #785a28; margin-bottom: 6px;">
                        Attached Proof of Payment
                      </div>
                      <div style="font-size: 12px; color: #78716c; margin-bottom: 10px;">
                        The client uploaded a payment receipt which has been archived in private object storage (90-day retention).
                      </div>
                      <a href="${popUrl}" target="_blank" style="display: inline-block; background-color: #1a1814; color: #ffffff; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 8px 16px; border-radius: 2px;">
                        Inspect Receipt
                      </a>
                    </div>
                  `
                      : ""
                  }
                </td>
              </tr>

              <!-- Items Breakdown -->
              <tr>
                <td style="padding: 24px 30px;">
                  <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 14px;">
                    Allocated Pieces
                  </div>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr style="border-bottom: 1px solid #dcd7cb;">
                        <th style="text-align: left; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Item</th>
                        <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Price</th>
                        <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsRows}
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 18px;">
                    <tr>
                      <td style="padding: 4px 0; font-size: 13px; color: #78716c;">Subtotal</td>
                      <td style="padding: 4px 0; font-size: 13px; color: #1a1814; text-align: right;">${formatPriceMUR(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-size: 13px; color: #78716c;">Mauritius Delivery</td>
                      <td style="padding: 4px 0; font-size: 13px; color: #1a1814; text-align: right;">
                        ${
                          deliveryFee === 0
                            ? "Complimentary"
                            : formatPriceMUR(deliveryFee)
                        }
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0 0 0; font-size: 14px; font-weight: 700; color: #1a1814; border-top: 1px solid #e8e4dc;">Total (MUR)</td>
                      <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #9a7a45; text-align: right; border-top: 1px solid #e8e4dc;">
                        ${formatPriceMUR(total)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f6f1; padding: 22px 30px; text-align: center; border-top: 1px solid #e8e4dc;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #78716c; letter-spacing: 0.05em;">
                    This notification was generated automatically by the Noir & Lumière Mauritius Maison platform.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #a8a29e;">
                    Confidential · Customer Proof of Payment is stored securely and retained for 90 days.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Builds the bespoke customer-facing order confirmation receipt for clients.
 */
export function generateCustomerConfirmationHtml(
  order: CreateOrderInput | DbOrder,
  items: any[],
): string {
  const isBankTransfer = order.paymentMethod === "bank_transfer"
  const orderRef = (order as any).orderRef || (order as any).order_ref
  const customerName =
    (order as any).customerName || (order as any).customer_name
  const address =
    (order as any).deliveryAddress || (order as any).delivery_address
  const city = (order as any).deliveryCity || (order as any).delivery_city
  const subtotal =
    (order as any).subtotalMur || (order as any).subtotal_mur || 0
  const deliveryFee =
    (order as any).deliveryFeeMur ?? (order as any).delivery_fee_mur ?? 0
  const total = (order as any).totalMur || (order as any).total_mur || 0

  const itemsRows = items
    .map((item) => {
      const name = item.name || item.product_name
      const size = item.size
      const qty = item.quantity || item.qty
      const unit = item.unitPrice || item.unit_price_mur
      const lineTotal = item.totalPrice || item.total_price_mur || unit * qty
      const img = item.imageUrl || item.image_url || item.image

      return `
        <tr>
          <td style="padding: 16px 10px; border-bottom: 1px solid #eeebe3;">
            <div style="display: flex; align-items: center; gap: 14px;">
              ${
                img
                  ? `<img src="${img}" alt="${name}" width="56" height="72" style="object-fit: cover; border-radius: 2px; border: 1px solid #dfdbd2;" />`
                  : ""
              }
              <div>
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #1a1814; font-weight: 500;">
                  ${name}
                </div>
                <div style="font-size: 12px; color: #78716c; margin-top: 4px; font-family: sans-serif;">
                  Size: <strong>${size}</strong> &nbsp;·&nbsp; Quantity: <strong>${qty}</strong>
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 16px 10px; border-bottom: 1px solid #eeebe3; text-align: right; font-family: sans-serif; font-size: 14px; color: #1a1814;">
            ${formatPriceMUR(unit)}
          </td>
          <td style="padding: 16px 10px; border-bottom: 1px solid #eeebe3; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #9a7a45;">
            ${formatPriceMUR(lineTotal)}
          </td>
        </tr>
      `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Your Order Confirmation #${orderRef} — Noir & Lumière</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 36px 15px;">
        <tr>
          <td align="center">
            <table width="620" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.06); border: 1px solid #e8e4dc;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #1a1814; padding: 36px 30px; text-align: center;">
                  <div style="color: #c9a96e; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 8px; font-family: sans-serif;">
                    Maison Mauritius · Port Louis
                  </div>
                  <div style="color: #ffffff; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.2em; text-transform: uppercase;">
                    Noir & Lumière
                  </div>
                </td>
              </tr>

              <!-- Personal Greeting & Order Allocation -->
              <tr>
                <td style="padding: 36px 36px 24px 36px;">
                  <span style="display: inline-block; background-color: #f4efe6; color: #8a6a35; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px;">
                    Order Confirmation
                  </span>
                  <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1a1814; margin: 16px 0 8px 0; font-weight: 400; line-height: 1.3;">
                    Dear ${customerName},<br>
                    Thank you for your acquisition.
                  </h1>
                  <p style="color: #57534e; font-size: 14px; line-height: 1.6; margin: 0;">
                    Your bespoke allocation has been registered under reference <strong style="color: #1a1814; font-family: monospace; font-size: 15px;">#${orderRef}</strong>. Our Port Louis atelier is now preparing your selected pieces with meticulous craftsmanship.
                  </p>
                </td>
              </tr>

              <!-- Payment & Delivery Notice -->
              <tr>
                <td style="padding: 0 36px 24px 36px;">
                  <div style="padding: 18px 20px; background-color: #faf8f5; border: 1px solid #eee8db; border-radius: 4px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #9a7a45; font-weight: 600; margin-bottom: 6px;">
                      ${
                        isBankTransfer
                          ? "Bank Transfer / Juice (MCB) Confirmation"
                          : "Cash on Delivery Arrangement"
                      }
                    </div>
                    <p style="font-size: 13px; color: #57534e; line-height: 1.5; margin: 0;">
                      ${
                        isBankTransfer
                          ? "We have securely received your Proof of Payment. Our liaison team will verify the transfer and notify you as soon as your parcel is scheduled for white-glove dispatch."
                          : "Your payment of <strong>" +
                            formatPriceMUR(total) +
                            "</strong> will be collected in cash upon physical delivery by our private courier liaison."
                      }
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Items Breakdown -->
              <tr>
                <td style="padding: 0 36px 30px 36px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 14px;">
                    Your Atelier Selection
                  </div>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr style="border-bottom: 1px solid #e8e4dc;">
                        <th style="text-align: left; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Piece</th>
                        <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Price</th>
                        <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsRows}
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 18px;">
                    <tr>
                      <td style="padding: 5px 0; font-size: 13px; color: #78716c;">Subtotal</td>
                      <td style="padding: 5px 0; font-size: 13px; color: #1a1814; text-align: right;">${formatPriceMUR(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-size: 13px; color: #78716c;">Mauritius White-Glove Delivery</td>
                      <td style="padding: 5px 0; font-size: 13px; color: #1a1814; text-align: right;">
                        ${
                          deliveryFee === 0
                            ? "Complimentary"
                            : formatPriceMUR(deliveryFee)
                        }
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 14px 0 0 0; font-size: 15px; font-weight: 700; color: #1a1814; border-top: 1px solid #e8e4dc;">Total (MUR)</td>
                      <td style="padding: 14px 0 0 0; font-size: 19px; font-weight: 700; color: #9a7a45; text-align: right; border-top: 1px solid #e8e4dc;">
                        ${formatPriceMUR(total)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Destination & Concierge Support -->
              <tr>
                <td style="padding: 24px 36px; background-color: #faf8f5; border-top: 1px solid #eee8db;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="55%" valign="top" style="padding-right: 15px;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 6px;">
                          Delivery Destination
                        </div>
                        <div style="font-size: 13px; color: #1a1814; line-height: 1.4;">
                          ${address}<br>
                          <strong>${city}</strong>, Mauritius
                        </div>
                      </td>
                      <td width="45%" valign="top" style="padding-left: 15px; border-left: 1px solid #e8e4dc;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 6px;">
                          Atelier Concierge
                        </div>
                        <div style="font-size: 13px; color: #57534e; line-height: 1.5;">
                          WhatsApp: <strong>+230 5250 8800</strong><br>
                          Email: <a href="mailto:${ADMIN_EMAIL}" style="color: #9a7a45; text-decoration: none;">${ADMIN_EMAIL}</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1814; padding: 26px 36px; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #c9a96e; letter-spacing: 0.2em; text-transform: uppercase;">
                    Noir & Lumière · Mauritius
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #a8a29e;">
                    Place d'Armes, Port Louis · Grand Baie · Mauritius
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Builds the customer-facing order status update notification HTML.
 */
export function generateOrderStatusUpdateHtml(
  order: CreateOrderInput | DbOrder,
  newStatus: OrderStatus,
): string {
  const orderRef = (order as any).orderRef || (order as any).order_ref
  const customerName =
    (order as any).customerName || (order as any).customer_name
  const total = (order as any).totalMur || (order as any).total_mur || 0

  const statusDescriptions: Record<OrderStatus, {
    title: string
    desc: string
    badgeColor: string
  }> = {
    pending: {
      title: "Order Received",
      desc: "Your order allocation has been received and is queued for atelier verification.",
      badgeColor: "#92400e",
    },
    in_atelier: {
      title: "Handcrafting & Preparation in Atelier",
      desc: "Your selected pieces are being carefully inspected, tailored, and hand-packaged with signature Noir & Lumière ribbons at our Port Louis atelier.",
      badgeColor: "#785a28",
    },
    out_for_delivery: {
      title: "Out for White-Glove Delivery",
      desc: "Your parcel has departed our atelier and is in transit with our dedicated private courier liaison across Mauritius. You will receive a call prior to arrival.",
      badgeColor: "#1e40af",
    },
    completed: {
      title: "Order Completed & Delivered",
      desc: "Your order has been successfully delivered. We trust you cherish your new creation. Our atelier remains at your service for any future bespoke consultations.",
      badgeColor: "#065f46",
    },
    cancelled: {
      title: "Order Allocation Cancelled",
      desc: "Your order allocation has been cancelled. If this was done in error, please contact our atelier concierge.",
      badgeColor: "#991b1b",
    },
  }

  const statusInfo = statusDescriptions[newStatus] || statusDescriptions.pending

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Order Status Update #${orderRef} — Noir & Lumière</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 36px 15px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8e4dc;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #1a1814; padding: 32px 30px; text-align: center;">
                  <div style="color: #c9a96e; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 8px;">
                    Port Louis Atelier · Mauritius
                  </div>
                  <div style="color: #ffffff; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase;">
                    Noir & Lumière
                  </div>
                </td>
              </tr>

              <!-- Status Body -->
              <tr>
                <td style="padding: 36px 36px 28px 36px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a7a45; font-weight: 600; margin-bottom: 12px;">
                    Atelier Dispatch Update · #${orderRef}
                  </div>
                  <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1a1814; margin: 0 0 16px 0; font-weight: 400;">
                    ${statusInfo.title}
                  </h1>
                  <p style="color: #57534e; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Dear ${customerName},<br><br>
                    ${statusInfo.desc}
                  </p>
                  <div style="padding: 16px; background-color: #faf8f5; border: 1px solid #eee8db; border-radius: 4px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #78716c;">Order Reference</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1a1814; text-align: right;">#${orderRef}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #78716c; padding-top: 6px;">Total Amount</td>
                        <td style="font-size: 14px; font-weight: 700; color: #9a7a45; text-align: right; padding-top: 6px;">${formatPriceMUR(total)}</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Support -->
              <tr>
                <td style="padding: 20px 36px; background-color: #f8f6f1; border-top: 1px solid #eee8db; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #78716c;">
                    Questions about your delivery? Contact our WhatsApp Concierge at <strong>+230 5250 8800</strong> or reply directly to this notice.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Dispatches the order notification email to the store owner AND the customer confirmation email.
 */
export async function sendOrderNotificationEmail(
  order: CreateOrderInput | DbOrder,
  items: any[],
): Promise<{ success: boolean delivered: boolean error?: string }> {
  try {
    const adminHtml = generateOrderNotificationHtml(order, items)
    const customerHtml = generateCustomerConfirmationHtml(order, items)
    const orderRef = (order as any).orderRef || (order as any).order_ref
    const isBankTransfer = order.paymentMethod === "bank_transfer"
    const customerEmail =
      (order as any).customerEmail || (order as any).customer_email
    const customerName =
      (order as any).customerName || (order as any).customer_name

    const subject = `[Noir & Lumière] New Order #${orderRef} (${
      isBankTransfer ? "Bank Transfer + POP" : "Cash on Delivery"
    })`
    const customerSubject = `[Noir & Lumière] Order Confirmation #${orderRef}`

    const response = await fetch("/api/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: ADMIN_EMAIL,
        subject,
        html: adminHtml,
        customerRecipient: customerEmail,
        customerSubject,
        customerHtml,
        orderRef,
        customerName,
        customerEmail,
        paymentMethod: order.paymentMethod,
        proofUrl:
          (order as any).proofOfPaymentUrl ||
          (order as any).proof_of_payment_url,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, delivered: Boolean(data.delivered) }
    }
    return { success: true, delivered: false }
  } catch (err: any) {
    console.warn(
      "Could not dispatch via /api/send-order-email, recorded in local fallback:",
      err,
    )
    return { success: true, delivered: false, error: err?.message }
  }
}

/**
 * Dispatches an order status update email to the customer when the admin changes order status.
 */
export async function sendOrderStatusNotificationEmail(
  order: DbOrder,
  newStatus: OrderStatus,
): Promise<{ success: boolean delivered: boolean error?: string }> {
  try {
    if (!order.customer_email) return { success: true, delivered: false }

    const html = generateOrderStatusUpdateHtml(order, newStatus)
    const subject = `[Noir & Lumière] Update on Order #${order.order_ref}: ${
      newStatus === "in_atelier"
        ? "In Atelier Preparation"
        : newStatus === "out_for_delivery"
          ? "Out for Delivery"
          : newStatus === "completed"
            ? "Delivered"
            : "Status Update"
    }`

    const response = await fetch("/api/send-status-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerRecipient: order.customer_email,
        customerSubject: subject,
        customerHtml: html,
        orderRef: order.order_ref,
        customerName: order.customer_name,
        newStatus,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, delivered: Boolean(data.delivered) }
    }
    return { success: true, delivered: false }
  } catch (err: any) {
    console.warn("Could not dispatch status update email:", err)
    return { success: true, delivered: false, error: err?.message }
  }
}
