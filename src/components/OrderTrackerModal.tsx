import { useState } from "react"
import { DbOrder, trackOrder, OrderStatus, PaymentStatus } from "@/lib/orders"
import { formatPriceMUR } from "@/lib/neon"

interface OrderTrackerModalProps {
  isOpen: boolean
  onClose: () => void
  initialOrderRef?: string
}

export default function OrderTrackerModal({
  isOpen,
  onClose,
  initialOrderRef = "",
}: OrderTrackerModalProps) {
  const [orderRefInput, setOrderRefInput] = useState(initialOrderRef)
  const [emailInput, setEmailInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [trackedOrder, setTrackedOrder] = useState<DbOrder | null>(null)

  if (!isOpen) return null

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderRefInput.trim()) {
      setErrorMessage("Please enter your Order Reference (e.g. NL-MU-123456).")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await trackOrder(orderRefInput, emailInput)
      if (result.success && result.order) {
        setTrackedOrder(result.order)
      } else {
        setErrorMessage(
          result.error ||
            "Order allocation not found. Please verify your reference and email.",
        )
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to look up order.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step calculations
  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case "pending":
        return 0
      case "in_atelier":
        return 2
      case "out_for_delivery":
        return 3
      case "completed":
        return 4
      case "cancelled":
        return -1
      default:
        return 0
    }
  }

  const steps = [
    { title: "Order Placed", desc: "Registered in atelier" },
    { title: "Payment Verified", desc: "Liaison verified" },
    { title: "In Atelier", desc: "Hand-finished & packed" },
    { title: "Out for Delivery", desc: "White-glove courier" },
    { title: "Delivered", desc: "Acquisition complete" },
  ]

  const currentStep = trackedOrder ? getStepIndex(trackedOrder.order_status) : 0
  const isPaymentVerified =
    trackedOrder?.payment_status === "verified" ||
    trackedOrder?.payment_method === "cod"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: "rgba(26, 24, 20, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-sm shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1a1814] text-white px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block">
              Mauritius Atelier Liaison
            </span>
            <h2
              className="text-lg sm:text-xl tracking-wide font-normal"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Order Tracking & Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 sm:p-8 border-b border-stone-200 bg-stone-50">
          <form onSubmit={handleTrack} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="text-[10px] tracking-wider uppercase font-semibold text-stone-600 block mb-1">
                  Order Reference *
                </label>
                <input
                  type="text"
                  value={orderRefInput}
                  onChange={(e) => setOrderRefInput(e.target.value)}
                  placeholder="e.g. NL-MU-492104"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-stone-300 rounded-sm bg-white focus:outline-none focus:border-[#9a7a45] uppercase"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-[10px] tracking-wider uppercase font-semibold text-stone-600 block mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-sm bg-white focus:outline-none focus:border-[#9a7a45]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {errorMessage ? (
                <span className="text-xs text-rose-700 font-medium">
                  ⚠️ {errorMessage}
                </span>
              ) : (
                <span className="text-[11px] text-stone-500">
                  Enter the reference received in your order confirmation.
                </span>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-[#1a1814] text-white text-xs tracking-wider uppercase font-semibold rounded-sm hover:bg-[#9a7a45] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isLoading ? "Searching Atelier..." : "Track Order →"}
              </button>
            </div>
          </form>
        </div>

        {/* Tracked Order Result */}
        {trackedOrder && (
          <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6">
            {/* Top Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold block">
                  Allocation Reference
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-stone-900">
                  #{trackedOrder.order_ref}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold block">
                  Acquisition Date
                </span>
                <span className="text-xs text-stone-700">
                  {new Date(trackedOrder.created_at).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-4">
                Atelier Fulfillment Progress
              </h4>

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  let isComplete = false
                  let isCurrent = false

                  if (idx === 0) isComplete = true
                  else if (idx === 1) isComplete = isPaymentVerified
                  else if (idx <= currentStep) isComplete = true

                  if (idx === currentStep) isCurrent = true

                  return (
                    <div key={step.title} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isComplete
                            ? "bg-[#9a7a45] text-white"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {isComplete ? "✓" : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-xs font-semibold ${
                              isComplete ? "text-stone-900" : "text-stone-400"
                            }`}
                          >
                            {step.title}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#9a7a45]/15 text-[#9a7a45]">
                              Current State
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Items Summary */}
            {trackedOrder.items && trackedOrder.items.length > 0 && (
              <div className="pt-4 border-t border-stone-200">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-3">
                  Allocated Pieces ({trackedOrder.items.length})
                </h4>
                <div className="space-y-2">
                  {trackedOrder.items.map((item) => (
                    <div
                      key={item.id || item.product_slug}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-sm border border-stone-200 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-10 h-12 object-cover rounded border border-stone-200"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-stone-900">
                            {item.product_name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-stone-900">
                        {formatPriceMUR(item.total_price_mur)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Delivery Destination
                </span>
                <p className="text-stone-800 font-medium">
                  {trackedOrder.delivery_address}, {trackedOrder.delivery_city}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Total Settlement
                </span>
                <p className="text-sm font-bold text-[#9a7a45]">
                  {formatPriceMUR(trackedOrder.total_mur)}
                </p>
              </div>
            </div>

            {/* Concierge Help */}
            <div className="text-center pt-2">
              <a
                href={`https://wa.me/23052508800?text=Hello%20Noir%20%26%20Lumi%C3%A8re%2C%20I%20am%20inquiring%20about%20my%20order%20%23${trackedOrder.order_ref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#9a7a45] hover:underline"
              >
                <span>💬 Questions for our Atelier Concierge on WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Mauritius White-Glove Courier Liaison
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase font-semibold rounded-sm hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
