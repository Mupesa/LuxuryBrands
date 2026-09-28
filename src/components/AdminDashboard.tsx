import { useState, useEffect } from "react"
import {
  Product,
  ProductCategory,
  ProductAudience,
  formatPriceMUR,
  fetchAllAdminProducts,
  createProduct,
  updateProduct,
  updateProductImage,
} from "@/lib/neon"
import {
  DbOrder,
  fetchAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  triggerRetentionPurge,
  OrderStatus,
  PaymentStatus,
} from "@/lib/orders"
import { sendOrderStatusNotificationEmail } from "@/lib/email"
import {
  SiteContentItem,
  fetchSiteContent,
  updateSiteContent,
  uploadSiteAsset,
} from "@/lib/siteContent"

interface AdminDashboardProps {
  onExit: () => void
  onCatalogUpdated?: () => void
}

type AdminTab = "orders" | "products" | "content"

export default function AdminDashboard({
  onExit,
  onCatalogUpdated,
}: AdminDashboardProps) {
  // Authentication State
  const [passcode, setPasscode] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("noir_admin_auth") === "true"
  })
  const [authError, setAuthError] = useState(false)

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>("orders")

  // Orders State
  const [orders, setOrders] = useState<DbOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderFilter, setOrderFilter] = useState<string>("all")
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  )
  const [selectedReceiptOrder, setSelectedReceiptOrder] =
    useState<DbOrder | null>(null)
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null)
  const [isPurging, setIsPurging] = useState(false)

  // Products State
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [editingPriceSlug, setEditingPriceSlug] = useState<string | null>(null)
  const [newPriceValue, setNewPriceValue] = useState<string>("")
  const [editingStockSlug, setEditingStockSlug] = useState<string | null>(null)
  const [newStockValue, setNewStockValue] = useState<string>("")
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [uploadingImageSlug, setUploadingImageSlug] = useState<string | null>(
    null,
  )

  // New Product Form State
  const [newProdName, setNewProdName] = useState("")
  const [newProdCategory, setNewProdCategory] =
    useState<ProductCategory>("Clothing")
  const [newProdAudience, setNewProdAudience] = useState<ProductAudience>("All")
  const [newProdPrice, setNewProdPrice] = useState("")
  const [newProdStock, setNewProdStock] = useState("8")
  const [newProdDescription, setNewProdDescription] = useState("")
  const [newProdImageFile, setNewProdImageFile] = useState<File | null>(null)
  const [newProdHoverFile, setNewProdHoverFile] = useState<File | null>(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)

  // Site Content State
  const [siteContent, setSiteContent] =
    useState<Record<string, SiteContentItem>>({})
  const [contentLoading, setContentLoading] = useState(false)
  const [savingContentKey, setSavingContentKey] = useState<string | null>(null)
  const [contentNotification, setContentNotification] = useState<string | null>(
    null,
  )

  // Verify PIN (admin passcode: 1002)
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim() === "1002" || passcode.trim() === "atelier") {
      setIsAuthenticated(true)
      sessionStorage.setItem("noir_admin_auth", "true")
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("noir_admin_auth")
  }

  // Load Orders
  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await fetchAllOrders(
        orderFilter === "all" ? undefined : orderFilter,
      )
      if (res.success) {
        setOrders(res.orders)
      }
    } catch (err) {
      console.error("Failed to load orders:", err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Load Products
  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await fetchAllAdminProducts()
      setProducts(res.products)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Load Site Content
  const loadSiteContent = async () => {
    setContentLoading(true)
    try {
      const content = await fetchSiteContent()
      setSiteContent(content)
    } catch (err) {
      console.error("Failed to load site content:", err)
    } finally {
      setContentLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "orders") loadOrders()
      if (activeTab === "products") loadProducts()
      if (activeTab === "content") loadSiteContent()
    }
  }, [isAuthenticated, activeTab, orderFilter])

  // Handle Order Status Change
  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const res = await updateOrderStatus(orderId, status)
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, order_status: status } : o,
        ),
      )
      const targetOrder = orders.find((o) => o.id === orderId)
      if (targetOrder) {
        sendOrderStatusNotificationEmail(targetOrder, status)
      }
    }
  }

  // Handle Payment Verification
  const handleVerifyPayment = async (order: DbOrder) => {
    const res = await updatePaymentStatus(order.id, "verified")
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, payment_status: "verified" } : o,
        ),
      )
      if (selectedReceiptOrder?.id === order.id) {
        setSelectedReceiptOrder({
          ...selectedReceiptOrder,
          payment_status: "verified",
        })
      }
    }
  }

  // Handle 90-Day Retention Purge
  const handleTriggerPurge = async () => {
    setIsPurging(true)
    setPurgeStatus("Running 90-day retention query across Neon Storage...")
    try {
      const result = await triggerRetentionPurge()
      if (result.success) {
        setPurgeStatus(
          `Retention check completed: ${result.purgedCount} expired receipts purged from storage.`,
        )
        loadOrders()
      } else {
        setPurgeStatus(
          `Purge notice: ${result.message || "No expired receipts found."}`,
        )
      }
    } catch (e: any) {
      setPurgeStatus(`Purge error: ${e.message}`)
    } finally {
      setIsPurging(false)
    }
  }

  // Replace Product Image
  const handleProductImageUpload = async (
    slug: string,
    file: File,
    isHover = false,
  ) => {
    setUploadingImageSlug(`${slug}-${isHover ? "hover" : "main"}`)
    try {
      const uploadRes = await uploadSiteAsset(file, "products")
      if (uploadRes.url) {
        await updateProductImage(slug, uploadRes.url, isHover)
        await loadProducts()
        if (onCatalogUpdated) onCatalogUpdated()
      }
    } catch (e) {
      console.error("Image upload failed:", e)
    } finally {
      setUploadingImageSlug(null)
    }
  }

  // Update Product Price
  const handleSavePrice = async (slug: string) => {
    const priceNum = parseInt(newPriceValue.replace(/[^0-9]/g, ""))
    if (isNaN(priceNum) || priceNum <= 0) return

    await updateProduct(slug, { price_mur: priceNum })
    setEditingPriceSlug(null)
    loadProducts()
    if (onCatalogUpdated) onCatalogUpdated()
  }

  // Update Product Stock
  const handleSaveStock = async (slug: string) => {
    const stockNum = parseInt(newStockValue.replace(/[^0-9]/g, ""))
    if (isNaN(stockNum) || stockNum < 0) return

    await updateProduct(slug, {
      stock_quantity: stockNum,
      in_stock: stockNum > 0,
    })
    setEditingStockSlug(null)
    loadProducts()
    if (onCatalogUpdated) onCatalogUpdated()
  }

  // Export Orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return
    const headers = [
      "Order Reference",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Delivery Address",
      "Delivery City",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Subtotal (MUR)",
      "Delivery Fee (MUR)",
      "Total (MUR)",
      "Items Summary",
    ]

    const rows = orders.map((o) => {
      const itemsSummary = (o.items || [])
        .map((i) => `${i.product_name} (${i.size}) x${i.quantity}`)
        .join("; ")
      return [
        `"${o.order_ref}"`,
        `"${new Date(o.created_at).toISOString()}"`,
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${(o.customer_email || "").replace(/"/g, '""')}"`,
        `"${(o.customer_phone || "").replace(/"/g, '""')}"`,
        `"${(o.delivery_address || "").replace(/"/g, '""')}"`,
        `"${(o.delivery_city || "").replace(/"/g, '""')}"`,
        `"${o.payment_method}"`,
        `"${o.payment_status}"`,
        `"${o.order_status}"`,
        o.subtotal_mur,
        o.delivery_fee_mur,
        o.total_mur,
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",")
    })

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `noir-lumiere-orders-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Courier Packing Slip
  const handlePrintPackingSlip = (order: DbOrder) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const itemsRows = (order.items || [])
      .map(
        (i) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${i.size}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${i.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${i.unit_price_mur.toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">Rs ${i.total_price_mur.toLocaleString()}</td>
        </tr>
      `,
      )
      .join("")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Slip #${order.order_ref} — Noir & Lumière</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1a1814; }
          .header { border-bottom: 2px solid #1a1814; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
          .meta { font-size: 13px; color: #666; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #9a7a45; font-weight: bold; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #1a1814; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          .totals { margin-top: 20px; text-align: right; font-size: 14px; }
          .total-line { margin-bottom: 5px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #9a7a45; margin-top: 10px; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; font-size: 11px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Noir & Lumière</div>
            <div class="meta">Maison Mauritius · Port Louis Atelier</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; font-family: monospace;">#${order.order_ref}</div>
            <div class="meta">${new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <div class="section-title">Recipient & Delivery Destination</div>
            <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">${order.customer_name}</div>
            <div style="font-size: 13px; line-height: 1.5;">
              ${order.delivery_address}<br>
              <strong>${order.delivery_city}</strong>, Mauritius<br>
              Phone: ${order.customer_phone}<br>
              Email: ${order.customer_email}
            </div>
            ${
              order.delivery_notes
                ? `<div style="margin-top: 8px; font-size: 12px; color: #666; font-style: italic;">Courier Note: "${order.delivery_notes}"</div>`
                : ""
            }
          </div>
          <div style="width: 48%; text-align: right;">
            <div class="section-title">Order Logistics</div>
            <div style="font-size: 13px; line-height: 1.6;">
              Payment Method: <strong>${
                order.payment_method === "bank_transfer"
                  ? "Bank Transfer / Juice (MCB)"
                  : "Cash on Delivery"
              }</strong><br>
              Payment Status: <strong>${order.payment_status}</strong><br>
              Handling: White-Glove Atelier Courier
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Allocated Pieces</div>
          <table>
            <thead>
              <tr>
                <th>Piece</th>
                <th style="text-align: center;">Size</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-line">Subtotal: Rs ${order.subtotal_mur.toLocaleString()}</div>
            <div class="total-line">Delivery: ${
              order.delivery_fee_mur === 0
                ? "Complimentary"
                : "Rs " + order.delivery_fee_mur.toLocaleString()
            }</div>
            <div class="grand-total">Total: Rs ${order.total_mur.toLocaleString()}</div>
          </div>
        </div>

        <div class="footer">
          Noir & Lumière Atelier · Place d'Armes, Port Louis, Mauritius · +230 5250 8800
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Toggle Product Published
  const handleTogglePublish = async (slug: string, current: boolean) => {
    await updateProduct(slug, { is_published: !current })
    setProducts((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, isPublished: !current } : p)),
    )
    if (onCatalogUpdated) onCatalogUpdated()
  }

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProdName || !newProdPrice) return
    setIsCreatingProduct(true)

    try {
      const slug = newProdName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      let mainImageUrl =
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop&auto=format"
      let hoverImageUrl =
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&auto=format"

      if (newProdImageFile) {
        const upload = await uploadSiteAsset(newProdImageFile, "products")
        if (upload.url) mainImageUrl = upload.url
      }
      if (newProdHoverFile) {
        const upload = await uploadSiteAsset(newProdHoverFile, "products")
        if (upload.url) hoverImageUrl = upload.url
      }

      const initialStock = parseInt(newProdStock) || 8

      await createProduct({
        slug,
        name: newProdName,
        category: newProdCategory,
        audience: newProdAudience,
        price_mur: parseInt(newProdPrice.replace(/[^0-9]/g, "")),
        description:
          newProdDescription || "An exquisite piece crafted in Mauritius.",
        image_path: mainImageUrl,
        hover_image_path: hoverImageUrl,
        is_published: true,
        stock_quantity: initialStock,
        in_stock: initialStock > 0,
      })

      setShowAddProductModal(false)
      setNewProdName("")
      setNewProdPrice("")
      setNewProdStock("8")
      setNewProdDescription("")
      setNewProdImageFile(null)
      setNewProdHoverFile(null)
      await loadProducts()
      if (onCatalogUpdated) onCatalogUpdated()
    } catch (e) {
      console.error("Failed to create product:", e)
    } finally {
      setIsCreatingProduct(false)
    }
  }

  // Save Content Section
  const handleSaveContent = async (
    key: string,
    updates: Partial<SiteContentItem>,
  ) => {
    setSavingContentKey(key)
    try {
      const res = await updateSiteContent(key, updates)
      if (res.success) {
        setContentNotification(`Section "${key}" saved to Neon database.`)
        setTimeout(() => setContentNotification(null), 4000)
        await loadSiteContent()
      }
    } catch (e) {
      console.error("Failed to save content:", e)
    } finally {
      setSavingContentKey(null)
    }
  }

  // Upload Content Banner Photo
  const handleContentImageUpload = async (key: string, file: File) => {
    setSavingContentKey(key)
    try {
      const upload = await uploadSiteAsset(file, "site-content")
      if (upload.url) {
        await updateSiteContent(key, { image_url: upload.url })
        await loadSiteContent()
        setContentNotification(
          `Image for "${key}" updated in Neon Object Storage.`,
        )
        setTimeout(() => setContentNotification(null), 4000)
      }
    } catch (e) {
      console.error("Failed to upload content image:", e)
    } finally {
      setSavingContentKey(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Passcode Login Screen
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1814]/95 backdrop-blur-md p-4">
        <div className="w-full max-w-md bg-[#f8f6f1] p-8 sm:p-10 rounded-sm shadow-2xl border border-stone-300">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 font-semibold mb-2">
              Port Louis Atelier
            </p>
            <h1
              className="text-2xl sm:text-3xl tracking-[0.16em] uppercase text-stone-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Maison Portal
            </h1>
            <p className="text-xs text-stone-600 mt-2">
              Administrative access to orders, payments, catalog & page content.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase font-semibold text-stone-700 mb-2">
                Atelier Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (1002)"
                autoFocus
                className="w-full px-4 py-3 bg-white border border-stone-300 text-stone-900 text-sm tracking-widest focus:outline-none focus:border-[#9a7a45] rounded-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-stone-500">
                  Atelier Key: <strong className="text-stone-800">1002</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPasscode("1002")
                    setIsAuthenticated(true)
                    sessionStorage.setItem("noir_admin_auth", "true")
                  }}
                  className="text-[10px] text-[#9a7a45] hover:underline font-semibold cursor-pointer uppercase tracking-wider"
                >
                  Quick Unlock →
                </button>
              </div>
              {authError && (
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  Invalid passcode. Please enter the correct atelier key.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#1a1814] text-[#f8f6f1] text-xs tracking-[0.25em] uppercase font-semibold rounded-sm hover:bg-[#9a7a45] transition-colors cursor-pointer"
            >
              Unlock Maison Portal
            </button>

            <button
              type="button"
              onClick={onExit}
              className="w-full text-center text-xs tracking-[0.15em] uppercase text-stone-500 hover:text-stone-900 transition-colors pt-2 cursor-pointer"
            >
              Return to Luxury Shop
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Authenticated Portal
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1a1814] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#1a1814] text-[#f8f6f1] border-b border-stone-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c9a96e] font-semibold border-r border-stone-700 pr-4">
              Atelier Admin
            </span>
            <h1
              className="text-lg sm:text-xl tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Noir & Lumière
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Neon Postgres Live
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 text-xs tracking-[0.18em] uppercase rounded-sm transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === "orders"
                  ? "bg-[#9a7a45] text-white"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Orders & POP
              {orders.filter((o) => o.payment_status === "pending_verification")
                .length > 0 && (
                <span className="ml-2 px-1.5 py-0.2 bg-rose-600 text-white text-[9px] rounded-full font-bold">
                  {
                    orders.filter(
                      (o) => o.payment_status === "pending_verification",
                    ).length
                  }
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-1.5 text-xs tracking-[0.18em] uppercase rounded-sm transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === "products"
                  ? "bg-[#9a7a45] text-white"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Product CMS
            </button>

            <button
              onClick={() => setActiveTab("content")}
              className={`px-3 py-1.5 text-xs tracking-[0.18em] uppercase rounded-sm transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === "content"
                  ? "bg-[#9a7a45] text-white"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Page Customizer
            </button>

            <div className="h-4 w-px bg-stone-700 mx-1 hidden sm:block" />

            <button
              onClick={onExit}
              className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-stone-300 hover:text-[#c9a96e] transition-colors cursor-pointer border border-stone-700 hover:border-[#c9a96e] rounded-sm whitespace-nowrap"
            >
              Storefront →
            </button>

            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 text-xs tracking-[0.15em] uppercase text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Lock Admin Portal"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {contentNotification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs tracking-wider rounded-sm flex items-center justify-between">
            <span>✓ {contentNotification}</span>
            <button
              onClick={() => setContentNotification(null)}
              className="font-bold text-sm cursor-pointer ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: ORDERS & PROOF OF PAYMENT                                    */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Top Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-sm border border-stone-200 shadow-sm">
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold">
                  Total Orders
                </p>
                <p
                  className="text-2xl sm:text-3xl font-bold mt-1 text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {orders.length}
                </p>
              </div>

              <div className="bg-white p-5 rounded-sm border border-amber-300 bg-amber-50/40 shadow-sm">
                <p className="text-[10px] tracking-[0.2em] uppercase text-amber-800 font-semibold">
                  Pending Verification
                </p>
                <p
                  className="text-2xl sm:text-3xl font-bold mt-1 text-amber-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {
                    orders.filter(
                      (o) => o.payment_status === "pending_verification",
                    ).length
                  }
                </p>
              </div>

              <div className="bg-white p-5 rounded-sm border border-stone-200 shadow-sm">
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold">
                  In Atelier Handcrafting
                </p>
                <p
                  className="text-2xl sm:text-3xl font-bold mt-1 text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {orders.filter((o) => o.order_status === "in_atelier").length}
                </p>
              </div>

              <div className="bg-white p-5 rounded-sm border border-stone-200 shadow-sm">
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold">
                  Total Order Value
                </p>
                <p
                  className="text-xl sm:text-2xl font-bold mt-1 text-[#9a7a45]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatPriceMUR(
                    orders.reduce((acc, o) => acc + (o.total_mur || 0), 0),
                  )}
                </p>
              </div>
            </div>

            {/* Actions & Filters Bar */}
            <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[10px] tracking-[0.18em] uppercase text-stone-400 font-semibold mr-2">
                  Filter:
                </span>
                {[
                  { id: "all", label: "All Orders" },
                  { id: "pending", label: "Pending" },
                  { id: "in_atelier", label: "In Atelier" },
                  { id: "out_for_delivery", label: "Out for Delivery" },
                  { id: "completed", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderFilter(tab.id)}
                    className={`px-3 py-1.5 text-[11px] tracking-[0.15em] uppercase rounded-sm transition-all cursor-pointer font-medium whitespace-nowrap ${
                      orderFilter === tab.id
                        ? "bg-[#1a1814] text-[#f8f6f1]"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 90-Day Retention Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerPurge}
                  disabled={isPurging}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] tracking-[0.15em] uppercase font-medium rounded-sm border border-stone-300 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Checks storage and purges proof of payment receipts older than 90 days"
                >
                  {isPurging ? "Purging..." : "Run 90-Day Retention Purge"}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-[#9a7a45] hover:bg-[#856838] text-white text-[11px] tracking-[0.15em] uppercase font-semibold rounded-sm transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  title="Download all orders as a CSV spreadsheet"
                >
                  <span>⬇ Export CSV</span>
                </button>

                <button
                  onClick={loadOrders}
                  className="px-3 py-1.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-[11px] tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Retention Status Message */}
            {purgeStatus && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs tracking-wider rounded-sm flex items-center justify-between">
                <span>🛡 {purgeStatus}</span>
                <button
                  onClick={() => setPurgeStatus(null)}
                  className="font-bold text-sm cursor-pointer ml-4"
                >
                  ×
                </button>
              </div>
            )}

            {/* Orders List */}
            {ordersLoading ? (
              <div className="py-20 text-center text-stone-500 text-xs tracking-[0.2em] uppercase">
                Loading orders from Neon PostgreSQL...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-sm border border-stone-200">
                <p
                  className="text-lg italic text-stone-500 mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  No orders found matching current filter.
                </p>
                <p className="text-xs text-stone-400">
                  New orders placed through the checkout flow will appear here
                  in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isBankTransfer =
                    order.payment_method === "bank_transfer"
                  const hasPop = Boolean(
                    order.proof_of_payment_url || order.proof_of_payment_path,
                  )
                  const isPurged = Boolean(order.proof_deleted_at)

                  // Days remaining calculation for 90-day retention
                  let daysRemaining = 90
                  if (order.created_at) {
                    const createdDate = new Date(order.created_at)
                    const diffDays = Math.floor(
                      (Date.now() - createdDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                    daysRemaining = Math.max(0, 90 - diffDays)
                  }

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden"
                    >
                      {/* Order Header Bar */}
                      <div className="bg-stone-50 border-b border-stone-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="font-bold text-sm tracking-wider text-stone-900"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            #{order.order_ref}
                          </span>
                          <span className="text-xs text-stone-500">
                            {new Date(order.created_at).toLocaleString(
                              "en-GB",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold ${
                              order.order_status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.order_status === "out_for_delivery"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.order_status === "in_atelier"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.order_status.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Status Controls & Packing Slip */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => handlePrintPackingSlip(order)}
                            className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 text-xs rounded-sm border border-stone-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                            title="Print courier packing slip / delivery note"
                          >
                            <span>🖨 Slip</span>
                          </button>

                          <label className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                            Status:
                          </label>
                          <select
                            value={order.order_status}
                            onChange={(e) =>
                              handleStatusChange(
                                order.id,
                                e.target.value as OrderStatus,
                              )
                            }
                            className="px-2.5 py-1 bg-white border border-stone-300 text-stone-900 text-xs rounded-sm focus:outline-none focus:border-[#9a7a45]"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_atelier">In Atelier</option>
                            <option value="out_for_delivery">
                              Out for Delivery
                            </option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Order Body */}
                      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Client Liaison & Delivery */}
                        <div className="space-y-3">
                          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-bold">
                            Client & Destination
                          </p>
                          <div>
                            <p className="font-semibold text-sm text-stone-900">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-stone-600">
                              {order.customer_email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="text-xs text-[#9a7a45] font-semibold hover:underline"
                              >
                                {order.customer_phone}
                              </a>
                              <a
                                href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded tracking-wider uppercase font-semibold"
                                title="Open chat in WhatsApp"
                              >
                                WhatsApp
                              </a>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 text-xs text-stone-700">
                            <p className="font-medium text-stone-900">
                              Delivery Address:
                            </p>
                            <p>{order.delivery_address}</p>
                            <p className="font-semibold">
                              {order.delivery_city}, Mauritius
                            </p>
                            {order.delivery_notes && (
                              <p className="mt-1 text-stone-500 italic">
                                "{order.delivery_notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Items List */}
                        <div className="space-y-3 border-t md:border-t-0 md:border-l md:border-r border-stone-100 md:px-6 pt-4 md:pt-0">
                          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-bold">
                            Selected Items ({order.items?.length || 0})
                          </p>
                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 text-xs border-b border-stone-100 pb-2"
                                >
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="w-9 h-11 object-cover rounded-sm border border-stone-200"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-stone-900 truncate">
                                      {item.product_name}
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                      Size: <strong>{item.size}</strong>{" "}
                                      &nbsp;·&nbsp; Qty:{" "}
                                      <strong>{item.quantity}</strong>
                                    </p>
                                  </div>
                                  <p className="font-semibold text-stone-900 whitespace-nowrap">
                                    {formatPriceMUR(item.total_price_mur)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-stone-400 italic">
                                Piece details recorded under reference.
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-xs">
                            <span className="text-stone-500">Total MUR:</span>
                            <span className="text-sm font-bold text-[#9a7a45]">
                              {formatPriceMUR(order.total_mur)}
                            </span>
                          </div>
                        </div>

                        {/* Column 3: Payment & Proof of Payment (POP) */}
                        <div className="space-y-3 pt-4 md:pt-0">
                          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-bold">
                            Payment & POP Verification
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-900">
                              Method:
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-800 text-[10px] tracking-wider uppercase font-semibold rounded">
                              {isBankTransfer
                                ? "Bank Transfer / Juice"
                                : "Cash on Delivery"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-900">
                              Payment:
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] tracking-wider uppercase font-bold rounded ${
                                order.payment_status === "verified"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.payment_status === "cash_on_delivery"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.payment_status.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* POP Receipt Preview & Retention */}
                          {isBankTransfer && (
                            <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-sm">
                              <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-stone-600 mb-2">
                                Customer Receipt
                              </p>

                              {isPurged ? (
                                <div className="text-xs text-stone-500 italic bg-stone-100 p-2 rounded">
                                  🛡 Proof of payment purged on{" "}
                                  {order.proof_deleted_at
                                    ? new Date(
                                        order.proof_deleted_at,
                                      ).toLocaleDateString()
                                    : "retention schedule"}
                                  . (90-day retention fulfilled).
                                </div>
                              ) : hasPop ? (
                                <div className="space-y-2">
                                  <div
                                    onClick={() => {
                                      setSelectedReceiptUrl(
                                        order.proof_of_payment_url || null,
                                      )
                                      setSelectedReceiptOrder(order)
                                    }}
                                    className="relative group cursor-pointer overflow-hidden rounded border border-stone-300 bg-black/5"
                                    style={{ height: "90px" }}
                                  >
                                    <img
                                      src={order.proof_of_payment_url}
                                      alt="Proof of Payment"
                                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] tracking-widest uppercase font-semibold">
                                      Zoom Receipt
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                                    <span className="font-semibold text-emerald-700">
                                      ● Active in Storage
                                    </span>
                                    <span>Expires in {daysRemaining} days</span>
                                  </div>

                                  {order.payment_status !== "verified" && (
                                    <button
                                      onClick={() => handleVerifyPayment(order)}
                                      className="w-full py-1.5 bg-[#9a7a45] hover:bg-[#836737] text-white text-[10px] tracking-[0.2em] uppercase font-semibold rounded-sm transition-colors cursor-pointer"
                                    >
                                      ✓ Verify Payment
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-amber-700 italic">
                                  No receipt uploaded yet by customer.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* POP Lightbox Zoom Modal */}
            {selectedReceiptUrl && selectedReceiptOrder && (
              <div
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => {
                  setSelectedReceiptUrl(null)
                  setSelectedReceiptOrder(null)
                }}
              >
                <div
                  className="bg-white max-w-2xl w-full rounded-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 bg-[#1a1814] text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a96e]">
                        Proof of Payment Verification
                      </p>
                      <h3
                        className="text-lg tracking-wider"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Order #{selectedReceiptOrder.order_ref}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReceiptUrl(null)
                        setSelectedReceiptOrder(null)
                      }}
                      className="text-stone-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 bg-stone-900 flex items-center justify-center min-h-[300px]">
                    <img
                      src={selectedReceiptUrl}
                      alt="Full Resolution Proof of Payment"
                      className="max-w-full max-h-[65vh] object-contain rounded border border-stone-700"
                    />
                  </div>

                  <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-stone-600">
                      Customer:{" "}
                      <strong>{selectedReceiptOrder.customer_name}</strong> (
                      {formatPriceMUR(selectedReceiptOrder.total_mur)})
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={selectedReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 border border-stone-300 hover:bg-stone-200 text-stone-800 text-xs tracking-wider uppercase font-semibold rounded-sm transition-colors"
                      >
                        Open In New Tab ↗
                      </a>

                      {selectedReceiptOrder.payment_status !== "verified" && (
                        <button
                          onClick={() =>
                            handleVerifyPayment(selectedReceiptOrder)
                          }
                          className="px-4 py-1.5 bg-[#9a7a45] hover:bg-[#836737] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer"
                        >
                          ✓ Confirm Payment Verified
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: PRODUCT CATALOG CMS                                          */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-sm border border-stone-200 shadow-sm">
              <div>
                <h2
                  className="text-xl tracking-wider text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Maison Catalog Management
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Upload card photos directly to Neon Object Storage
                  (`luxury-brands`), edit prices, and manage piece availability.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer shadow"
                >
                  + Add New Piece
                </button>
                <button
                  onClick={loadProducts}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs tracking-wider uppercase rounded-sm transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="py-20 text-center text-stone-500 text-xs tracking-[0.2em] uppercase">
                Loading products from Neon database...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const isEditingPrice = editingPriceSlug === product.slug
                  const isUploading = uploadingImageSlug?.startsWith(
                    product.slug,
                  )

                  return (
                    <div
                      key={product.slug}
                      className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Dual Photos Preview */}
                        <div className="grid grid-cols-2 gap-1 p-2 bg-stone-50 border-b border-stone-200">
                          {/* Primary Image */}
                          <div className="relative group overflow-hidden rounded aspect-[4/5] bg-stone-200">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-center p-2 cursor-pointer">
                              <span className="text-[10px] tracking-wider uppercase font-bold">
                                {isUploading
                                  ? "Uploading..."
                                  : "Replace Primary"}
                              </span>
                              <span className="text-[9px] text-stone-300 mt-1">
                                Saves to Neon S3
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleProductImageUpload(
                                      product.slug,
                                      e.target.files[0],
                                      false,
                                    )
                                  }
                                }}
                              />
                            </label>
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded font-mono">
                              Primary
                            </span>
                          </div>

                          {/* Hover Image */}
                          <div className="relative group overflow-hidden rounded aspect-[4/5] bg-stone-200">
                            <img
                              src={product.hoverImage}
                              alt={`${product.name} Hover`}
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-center p-2 cursor-pointer">
                              <span className="text-[10px] tracking-wider uppercase font-bold">
                                {isUploading ? "Uploading..." : "Replace Hover"}
                              </span>
                              <span className="text-[9px] text-stone-300 mt-1">
                                Saves to Neon S3
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleProductImageUpload(
                                      product.slug,
                                      e.target.files[0],
                                      true,
                                    )
                                  }
                                }}
                              />
                            </label>
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded font-mono">
                              Hover
                            </span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold">
                                {product.designer || "Atelier Port Louis"}
                              </p>
                              <h3
                                className="text-base font-medium text-stone-900 line-clamp-1"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {product.name}
                              </h3>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[9px] tracking-wider uppercase font-bold rounded ${
                                product.isPublished
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {product.isPublished ? "Live" : "Draft"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] rounded uppercase font-semibold">
                              {product.category}
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] rounded uppercase font-semibold">
                              {product.audience}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 line-clamp-2">
                            {product.description}
                          </p>

                          {/* Price Inline Editor */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-xs text-stone-500 font-medium">
                              Price:
                            </span>
                            {isEditingPrice ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newPriceValue}
                                  onChange={(e) =>
                                    setNewPriceValue(e.target.value)
                                  }
                                  placeholder="MUR"
                                  className="w-24 px-2 py-1 text-xs border border-[#9a7a45] rounded-sm focus:outline-none font-bold"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSavePrice(product.slug)}
                                  className="px-2 py-1 bg-[#9a7a45] text-white text-[10px] font-bold rounded-sm uppercase cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPriceSlug(null)}
                                  className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#9a7a45]">
                                  {formatPriceMUR(product.price)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingPriceSlug(product.slug)
                                    setNewPriceValue(String(product.price))
                                  }}
                                  className="text-[10px] text-stone-400 hover:text-stone-800 underline uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stock Inline Editor */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-xs text-stone-500 font-medium">
                              Stock:
                            </span>
                            {editingStockSlug === product.slug ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={newStockValue}
                                  onChange={(e) =>
                                    setNewStockValue(e.target.value)
                                  }
                                  className="w-16 px-2 py-1 text-xs border border-[#9a7a45] rounded-sm focus:outline-none font-bold"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveStock(product.slug)}
                                  className="px-2 py-1 bg-[#9a7a45] text-white text-[10px] font-bold rounded-sm uppercase cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingStockSlug(null)}
                                  className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    product.stockQuantity <= 0
                                      ? "text-rose-600"
                                      : product.stockQuantity <= 3
                                        ? "text-amber-600"
                                        : "text-stone-800"
                                  }`}
                                >
                                  {product.stockQuantity <= 0
                                    ? "Sold Out (0)"
                                    : `${product.stockQuantity} in atelier`}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingStockSlug(product.slug)
                                    setNewStockValue(
                                      String(product.stockQuantity),
                                    )
                                  }}
                                  className="text-[10px] text-stone-400 hover:text-stone-800 underline uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
                        <button
                          onClick={() =>
                            handleTogglePublish(
                              product.slug,
                              product.isPublished,
                            )
                          }
                          className="text-[10px] tracking-wider uppercase font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                        >
                          {product.isPublished
                            ? "Unpublish Piece"
                            : "Publish to Shop"}
                        </button>
                        <span className="text-[9px] text-stone-400 font-mono">
                          slug: {product.slug}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add New Product Modal */}
            {showAddProductModal && (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowAddProductModal(false)}
              >
                <div
                  className="bg-white max-w-lg w-full rounded-sm overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 bg-[#1a1814] text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a96e]">
                        Neon Catalog CMS
                      </p>
                      <h3
                        className="text-lg tracking-wider"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Add New Atelier Creation
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="text-stone-400 hover:text-white text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateProduct}
                    className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
                  >
                    <div>
                      <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                        Piece Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="e.g. The Sculpted Silk Kaftan"
                        className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newProdCategory}
                          onChange={(e) =>
                            setNewProdCategory(
                              e.target.value as ProductCategory,
                            )
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        >
                          <option value="Clothing">Clothing</option>
                          <option value="Jewellery">Jewellery</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Audience
                        </label>
                        <select
                          value={newProdAudience}
                          onChange={(e) =>
                            setNewProdAudience(
                              e.target.value as ProductAudience,
                            )
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        >
                          <option value="All">All</option>
                          <option value="Women">Women</option>
                          <option value="Men">Men</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Price (MUR) *
                        </label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          placeholder="e.g. 7500"
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value)}
                          placeholder="e.g. 8"
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newProdDescription}
                        onChange={(e) => setNewProdDescription(e.target.value)}
                        placeholder="Describe fabric, craftsmanship, and silhouette..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                      />
                    </div>

                    {/* Image uploads */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Primary Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setNewProdImageFile(e.target.files?.[0] || null)
                          }
                          className="text-xs text-stone-600"
                        />
                        {newProdImageFile && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                            ✓ {newProdImageFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Hover Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setNewProdHoverFile(e.target.files?.[0] || null)
                          }
                          className="text-xs text-stone-600"
                        />
                        {newProdHoverFile && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                            ✓ {newProdHoverFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-4 py-2 text-xs tracking-wider uppercase text-stone-600 hover:text-stone-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingProduct}
                        className="px-6 py-2.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingProduct
                          ? "Saving to Neon..."
                          : "Publish Piece"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: SITE CONTENT & CAMPAIGN CUSTOMIZER                           */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-sm border border-stone-200 shadow-sm">
              <h2
                className="text-xl tracking-wider text-stone-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Storefront Visuals & Campaign Customizer
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Customize every headline, slogan, and campaign photo across Noir
                & Lumière. All images are uploaded directly to the Neon S3
                storage bucket and persisted in PostgreSQL.
              </p>
            </div>

            {contentLoading ? (
              <div className="py-20 text-center text-stone-500 text-xs tracking-[0.2em] uppercase">
                Loading site content from Neon...
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. HERO CAMPAIGN BANNER */}
                <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-5">
                  <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#9a7a45] font-bold">
                        Section 1
                      </span>
                      <h3
                        className="text-lg tracking-wider text-stone-900"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Hero Campaign Banner
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">
                      key: hero
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Hero Preview & Image Upload */}
                    <div className="space-y-3">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Campaign Background Photo
                      </p>
                      <div className="relative rounded overflow-hidden aspect-[16/10] bg-stone-900 border border-stone-300 group">
                        <img
                          src={siteContent.hero?.image_url || ""}
                          alt="Hero Background"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer p-4 text-center">
                          <span className="text-xs tracking-wider uppercase font-bold">
                            {savingContentKey === "hero"
                              ? "Uploading..."
                              : "Upload New Hero Photo"}
                          </span>
                          <span className="text-[10px] text-stone-300 mt-1">
                            Direct to Neon Object Storage
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleContentImageUpload(
                                  "hero",
                                  e.target.files[0],
                                )
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-stone-500 italic">
                        Tip: High-resolution landscape photos (1400×900+)
                        provide the most cinematic visual presentation.
                      </p>
                    </div>

                    {/* Hero Text Fields */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Subtitle / Campaign Label
                        </label>
                        <input
                          type="text"
                          value={siteContent.hero?.subtitle || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, subtitle: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Main Headline
                        </label>
                        <input
                          type="text"
                          value={siteContent.hero?.title || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, title: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={siteContent.hero?.cta_text || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, cta_text: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() =>
                            handleSaveContent("hero", {
                              title: siteContent.hero.title,
                              subtitle: siteContent.hero.subtitle,
                              cta_text: siteContent.hero.cta_text,
                            })
                          }
                          disabled={savingContentKey === "hero"}
                          className="px-5 py-2.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingContentKey === "hero"
                            ? "Saving..."
                            : "Save Hero Settings"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. EDITORIAL SPLIT FEATURE 1 (DRAPED SILK) */}
                <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-5">
                  <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#9a7a45] font-bold">
                        Section 2
                      </span>
                      <h3
                        className="text-lg tracking-wider text-stone-900"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Editorial Feature 1 (Creations Split)
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">
                      key: editorial_draped
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="space-y-3">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Editorial Photo
                      </p>
                      <div className="relative rounded overflow-hidden aspect-[4/5] bg-stone-900 border border-stone-300 group">
                        <img
                          src={siteContent.editorial_draped?.image_url || ""}
                          alt="Editorial 1"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer p-4 text-center">
                          <span className="text-xs tracking-wider uppercase font-bold">
                            {savingContentKey === "editorial_draped"
                              ? "Uploading..."
                              : "Upload Editorial Photo"}
                          </span>
                          <span className="text-[10px] text-stone-300 mt-1">
                            Direct to Neon S3
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleContentImageUpload(
                                  "editorial_draped",
                                  e.target.files[0],
                                )
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Subtitle / Label
                        </label>
                        <input
                          type="text"
                          value={siteContent.editorial_draped?.subtitle || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_draped: {
                                ...prev.editorial_draped,
                                subtitle: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Feature Title
                        </label>
                        <input
                          type="text"
                          value={siteContent.editorial_draped?.title || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_draped: {
                                ...prev.editorial_draped,
                                title: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          CTA Link Text
                        </label>
                        <input
                          type="text"
                          value={siteContent.editorial_draped?.cta_text || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_draped: {
                                ...prev.editorial_draped,
                                cta_text: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() =>
                            handleSaveContent("editorial_draped", {
                              title: siteContent.editorial_draped.title,
                              subtitle: siteContent.editorial_draped.subtitle,
                              cta_text: siteContent.editorial_draped.cta_text,
                            })
                          }
                          disabled={savingContentKey === "editorial_draped"}
                          className="px-5 py-2.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingContentKey === "editorial_draped"
                            ? "Saving..."
                            : "Save Feature 1"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. EDITORIAL SPLIT FEATURE 2 & MAISON PHILOSOPHY */}
                <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-5">
                  <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#9a7a45] font-bold">
                        Section 3
                      </span>
                      <h3
                        className="text-lg tracking-wider text-stone-900"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Editorial Feature 2 & Maison Philosophy
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">
                      key: editorial_evening
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="space-y-3">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Editorial Photo
                      </p>
                      <div className="relative rounded overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-300 group">
                        <img
                          src={siteContent.editorial_evening?.image_url || ""}
                          alt="Editorial 2"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer p-4 text-center">
                          <span className="text-xs tracking-wider uppercase font-bold">
                            {savingContentKey === "editorial_evening"
                              ? "Uploading..."
                              : "Upload Editorial Photo"}
                          </span>
                          <span className="text-[10px] text-stone-300 mt-1">
                            Direct to Neon S3
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleContentImageUpload(
                                  "editorial_evening",
                                  e.target.files[0],
                                )
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Subtitle / Label
                        </label>
                        <input
                          type="text"
                          value={siteContent.editorial_evening?.subtitle || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_evening: {
                                ...prev.editorial_evening,
                                subtitle: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={siteContent.editorial_evening?.title || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_evening: {
                                ...prev.editorial_evening,
                                title: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Maison Philosophy Quote
                        </label>
                        <input
                          type="text"
                          value={
                            siteContent.editorial_evening?.metadata?.quote || ""
                          }
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_evening: {
                                ...prev.editorial_evening,
                                metadata: {
                                  ...prev.editorial_evening?.metadata,
                                  quote: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                          Philosophy Description
                        </label>
                        <textarea
                          rows={2}
                          value={siteContent.editorial_evening?.body_text || ""}
                          onChange={(e) =>
                            setSiteContent((prev) => ({
                              ...prev,
                              editorial_evening: {
                                ...prev.editorial_evening,
                                body_text: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#9a7a45]"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() =>
                            handleSaveContent("editorial_evening", {
                              title: siteContent.editorial_evening.title,
                              subtitle: siteContent.editorial_evening.subtitle,
                              body_text:
                                siteContent.editorial_evening.body_text,
                              metadata: siteContent.editorial_evening.metadata,
                            })
                          }
                          disabled={savingContentKey === "editorial_evening"}
                          className="px-5 py-2.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingContentKey === "editorial_evening"
                            ? "Saving..."
                            : "Save Feature 2 & Quote"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. ANNOUNCEMENTS & SERVICE PROMISES */}
                <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-5">
                  <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#9a7a45] font-bold">
                        Section 4
                      </span>
                      <h3
                        className="text-lg tracking-wider text-stone-900"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Service Promises (Intro Strip)
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">
                      key: announcements
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Delivery */}
                    <div className="space-y-2 p-4 bg-stone-50 rounded border border-stone-200">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Promise 1: Delivery
                      </p>
                      <input
                        type="text"
                        value={
                          siteContent.announcements?.metadata?.deliveryTitle ||
                          "Island-Wide Delivery"
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                deliveryTitle: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                      <textarea
                        rows={2}
                        value={
                          siteContent.announcements?.metadata?.deliveryDesc ||
                          ""
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                deliveryDesc: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                    </div>

                    {/* Fittings */}
                    <div className="space-y-2 p-4 bg-stone-50 rounded border border-stone-200">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Promise 2: Fittings
                      </p>
                      <input
                        type="text"
                        value={
                          siteContent.announcements?.metadata?.fittingTitle ||
                          "Atelier Fittings"
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                fittingTitle: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                      <textarea
                        rows={2}
                        value={
                          siteContent.announcements?.metadata?.fittingDesc || ""
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                fittingDesc: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                    </div>

                    {/* Alterations */}
                    <div className="space-y-2 p-4 bg-stone-50 rounded border border-stone-200">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Promise 3: Alterations
                      </p>
                      <input
                        type="text"
                        value={
                          siteContent.announcements?.metadata?.tailoringTitle ||
                          "Bespoke Alterations"
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                tailoringTitle: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                      <textarea
                        rows={2}
                        value={
                          siteContent.announcements?.metadata?.tailoringDesc ||
                          ""
                        }
                        onChange={(e) =>
                          setSiteContent((prev) => ({
                            ...prev,
                            announcements: {
                              ...prev.announcements,
                              metadata: {
                                ...prev.announcements?.metadata,
                                tailoringDesc: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() =>
                        handleSaveContent("announcements", {
                          metadata: siteContent.announcements.metadata,
                        })
                      }
                      disabled={savingContentKey === "announcements"}
                      className="px-5 py-2.5 bg-[#1a1814] hover:bg-[#9a7a45] text-white text-xs tracking-[0.2em] uppercase font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingContentKey === "announcements"
                        ? "Saving..."
                        : "Save Service Promises"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
