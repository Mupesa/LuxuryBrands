import { useState } from "react"

export type LegalPolicyType = "returns" | "delivery" | "privacy" | "terms"

interface LegalModalsProps {
  isOpen: boolean
  initialTab?: LegalPolicyType
  onClose: () => void
}

export default function LegalModals({
  isOpen,
  initialTab = "returns",
  onClose,
}: LegalModalsProps) {
  const [activeTab, setActiveTab] = useState<LegalPolicyType>(initialTab)

  if (!isOpen) return null

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
        className="bg-white w-full max-w-3xl rounded-sm shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1a1814] text-white px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block">
              Maison Mauritius · Atelier Policies
            </span>
            <h2
              className="text-lg sm:text-xl tracking-wide font-normal"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Client Terms & Safeguards
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

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto no-scrollbar">
          {[
            { id: "returns", label: "Returns & Exchanges" },
            { id: "delivery", label: "Island Delivery" },
            { id: "privacy", label: "Privacy & Data (2017 Act)" },
            { id: "terms", label: "Terms of Sale" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LegalPolicyType)}
              className={`px-4 sm:px-6 py-3 text-xs tracking-wider uppercase whitespace-nowrap font-medium transition-all cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? "border-[#9a7a45] text-[#9a7a45] bg-white font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
          {activeTab === "returns" && (
            <div className="space-y-4">
              <h3
                className="text-base sm:text-lg font-medium text-stone-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Atelier Returns & Exchanges Policy
              </h3>
              <p>
                At <strong>Noir & Lumière</strong>, each piece is handcrafted
                with architectural precision. If a tailored garment or jewellery
                piece does not meet your expectations, we offer complimentary
                exchanges within Mauritius.
              </p>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm space-y-2">
                <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                  Conditions for Exchange or Return
                </h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600 text-xs">
                  <li>
                    Requests must be initiated within <strong>7 days</strong> of
                    physical delivery.
                  </li>
                  <li>
                    Items must be in pristine, unworn, and unwashed condition
                    with all hallmark tags attached.
                  </li>
                  <li>
                    Accompanied by the original bespoke wooden or suede atelier
                    packaging.
                  </li>
                  <li>
                    Bespoke commissions and personalized engravings are final
                    sale.
                  </li>
                </ul>
              </div>
              <p>
                To initiate an exchange, contact our Concierge via WhatsApp at{" "}
                <strong>+230 5250 8800</strong> or email{" "}
                <a
                  href="mailto:anesumupesa@gmail.com"
                  className="text-[#9a7a45] underline"
                >
                  anesumupesa@gmail.com
                </a>
                . Our private courier will collect the parcel from your
                residence.
              </p>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="space-y-4">
              <h3
                className="text-base sm:text-lg font-medium text-stone-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Island-wide White-Glove Delivery
              </h3>
              <p>
                We provide insured, discreet, white-glove courier delivery
                across all 9 districts of Mauritius. Every piece is packaged in
                protective temperature-controlled atelier transit boxes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm">
                  <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">
                    Port Louis & Northern Coast
                  </h4>
                  <p className="text-xs text-stone-600">
                    Grand Baie, Pereybere, Trou aux Biches, Port Louis:{" "}
                    <strong>24–48 Hours</strong>.
                  </p>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm">
                  <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">
                    West Coast & Center
                  </h4>
                  <p className="text-xs text-stone-600">
                    Tamarin, Black River, Ebene, Moka, Curepipe:{" "}
                    <strong>24–48 Hours</strong>.
                  </p>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm">
                  <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">
                    South & East Districts
                  </h4>
                  <p className="text-xs text-stone-600">
                    Flacq, Belle Mare, Mahebourg, Bel Ombre:{" "}
                    <strong>48–72 Hours</strong>.
                  </p>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm">
                  <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">
                    Rodrigues & Outer Islands
                  </h4>
                  <p className="text-xs text-stone-600">
                    Secured air courier transit:{" "}
                    <strong>3–5 Business Days</strong>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-500 italic">
                * Complimentary delivery applies to all orders over{" "}
                <strong>Rs 5,000</strong>. A nominal fee of Rs 350 applies to
                orders below this threshold.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3
                className="text-base sm:text-lg font-medium text-stone-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Privacy & Data Protection (Mauritius Act 2017)
              </h3>
              <p>
                Noir & Lumière adheres strictly to the{" "}
                <strong>Data Protection Act 2017 (DPA)</strong> of the Republic
                of Mauritius. We hold customer discretion and financial
                confidentiality at the core of our atelier ethos.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-stone-50 border-l-2 border-[#9a7a45]">
                  <strong className="text-stone-900 text-xs block">
                    1. Liaison Data Collected
                  </strong>
                  <span className="text-xs text-stone-600">
                    We collect client names, delivery villa/apartment addresses,
                    email addresses, and Mauritius contact phone numbers solely
                    for order allocation and courier delivery.
                  </span>
                </div>
                <div className="p-3 bg-stone-50 border-l-2 border-[#9a7a45]">
                  <strong className="text-stone-900 text-xs block">
                    2. 90-Day Proof of Payment Retention
                  </strong>
                  <span className="text-xs text-stone-600">
                    Receipts uploaded for MCB Juice/Bank transfers are stored in
                    an encrypted private cloud bucket. In compliance with data
                    minimization principles, all receipts are{" "}
                    <strong>
                      automatically and permanently deleted after 90 days
                    </strong>
                    .
                  </span>
                </div>
                <div className="p-3 bg-stone-50 border-l-2 border-[#9a7a45]">
                  <strong className="text-stone-900 text-xs block">
                    3. No Third-Party Brokerage
                  </strong>
                  <span className="text-xs text-stone-600">
                    Your personal details are never sold, rented, or shared with
                    commercial marketing brokers.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h3
                className="text-base sm:text-lg font-medium text-stone-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Terms of Sale & Atelier Commission
              </h3>
              <p>
                By placing an order on <strong>Noir & Lumière</strong>, you
                enter into a bespoke acquisition agreement under Mauritian
                jurisdiction.
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 text-xs">
                <li>
                  <strong>Pricing:</strong> All amounts are stated in Mauritian
                  Rupees (MUR) and include all applicable taxes.
                </li>
                <li>
                  <strong>Payment Verification:</strong> Bank Transfer and Juice
                  MCB orders are verified against the uploaded receipt prior to
                  dispatch. Cash on Delivery orders require physical presence
                  and cash settlement upon courier handover.
                </li>
                <li>
                  <strong>Material Authenticity:</strong> All precious metals
                  (18k vermeil, solid gold, sterling silver) and linen/silk
                  textiles are sourced in accordance with international ethical
                  standards and hallmarked in Mauritius.
                </li>
                <li>
                  <strong>Jurisdiction:</strong> Any dispute arising from an
                  atelier transaction shall be governed by the laws of the
                  Republic of Mauritius with exclusive jurisdiction in Port
                  Louis.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Noir & Lumière · Place d'Armes, Port Louis, Mauritius
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a1814] text-white text-xs tracking-wider uppercase font-semibold rounded-sm hover:bg-[#9a7a45] transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}
