import { useState, useEffect } from "react"
import {
  Product,
  CartItem,
  fetchProducts,
  formatPriceMUR,
  ProductCategory,
  ProductAudience,
  FALLBACK_PRODUCTS,
} from "@/lib/neon"
import { createOrder, uploadProofOfPayment, PaymentMethod } from "@/lib/orders"
import { sendOrderNotificationEmail } from "@/lib/email"
import {
  SiteContentItem,
  fetchSiteContent,
  DEFAULT_SITE_CONTENT,
} from "@/lib/siteContent"
import AdminDashboard from "@/components/AdminDashboard"
import LegalModals, { LegalPolicyType } from "@/components/LegalModals"
import OrderTrackerModal from "@/components/OrderTrackerModal"
import WhatsAppConcierge from "@/components/WhatsAppConcierge"

type Page = "home" | "collection" | "product" | "cart" | "admin"

const CATEGORIES: ("All" | ProductCategory)[] = [
  "All",
  "Clothing",
  "Jewellery",
  "Accessories",
]
const AUDIENCES: ("All" | ProductAudience)[] = ["All", "Women", "Men"]

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&h=900&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=900&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop&auto=format",
]

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({
  page,
  setPage,
  cartCount,
  isLive,
  isScrolled,
  selectedCategory,
  setSelectedCategory,
  onOpenTracker,
}: {
  page: Page
  setPage: (p: Page) => void
  cartCount: number
  isLive: boolean
  isScrolled: boolean
  selectedCategory: "All" | ProductCategory
  setSelectedCategory: (c: "All" | ProductCategory) => void
  onOpenTracker: () => void
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer when page changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [page])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  // Transparent floating header on Home page before scrolling down
  const isTransparent = page === "home" && !isScrolled && !mobileMenuOpen

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 md:px-12"
        style={{
          background: isTransparent
            ? "transparent"
            : "rgba(248, 246, 241, 0.94)",
          backdropFilter: isTransparent ? "none" : "blur(16px)",
          WebkitBackdropFilter: isTransparent ? "none" : "blur(16px)",
          borderBottom: isTransparent
            ? "1px solid transparent"
            : "1px solid var(--border)",
          boxShadow: isTransparent
            ? "none"
            : "0 2px 12px rgba(26, 24, 20, 0.04)",
          paddingTop: isTransparent ? "1.25rem" : "0.85rem",
          paddingBottom: isTransparent ? "1.25rem" : "0.85rem",
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Mobile Hamburger & Desktop Links */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 -ml-1.5 rounded focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <span
                className="block w-5 h-0.5 transition-all duration-300 origin-center"
                style={{
                  background: isTransparent ? "#ffffff" : "var(--foreground)",
                  transform: mobileMenuOpen
                    ? "rotate(45deg) translate(2.5px, 3px)"
                    : "none",
                }}
              />
              <span
                className="block w-5 h-0.5 mt-1.5 transition-all duration-300 origin-center"
                style={{
                  background: isTransparent ? "#ffffff" : "var(--foreground)",
                  transform: mobileMenuOpen
                    ? "rotate(-45deg) translate(2.5px, -3px)"
                    : "none",
                }}
              />
            </button>

            <button
              onClick={() => setPage("collection")}
              className="hidden md:inline-block text-xs tracking-[0.25em] uppercase hover:opacity-70 transition-all cursor-pointer font-medium"
              style={{
                color: isTransparent ? "#ffffff" : "var(--foreground)",
                fontFamily: "var(--font-body)",
                textShadow: isTransparent
                  ? "0 1px 4px rgba(0,0,0,0.4)"
                  : "none",
              }}
            >
              Collection
            </button>

            <button
              onClick={onOpenTracker}
              className="hidden md:inline-block text-xs tracking-[0.25em] uppercase hover:opacity-70 transition-all cursor-pointer font-medium"
              style={{
                color: isTransparent ? "#ffffff" : "var(--foreground)",
                fontFamily: "var(--font-body)",
                textShadow: isTransparent
                  ? "0 1px 4px rgba(0,0,0,0.4)"
                  : "none",
              }}
            >
              Track Order
            </button>

            <span
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all"
              style={{
                background: isTransparent
                  ? "rgba(255, 255, 255, 0.16)"
                  : isLive
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(217, 119, 6, 0.12)",
                color: isTransparent
                  ? "#ffffff"
                  : isLive
                    ? "#065f46"
                    : "#92400e",
                border: isTransparent
                  ? "1px solid rgba(255, 255, 255, 0.28)"
                  : isLive
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(217, 119, 6, 0.3)",
                backdropFilter: isTransparent ? "blur(4px)" : "none",
              }}
              title={
                isLive
                  ? "Connected directly to Neon PostgreSQL database (soft-butterfly-02907949)"
                  : "Using catalog cache"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              {isLive ? "Neon Live" : "Catalog Ready"}
            </span>
          </div>

          {/* Center: Brand Identity */}
          <button
            onClick={() => setPage("home")}
            className="text-base sm:text-lg md:text-xl tracking-[0.16em] uppercase cursor-pointer hover:opacity-85 transition-all text-center"
            style={{
              fontFamily: "var(--font-display)",
              color: isTransparent ? "#ffffff" : "var(--foreground)",
              letterSpacing: "0.18em",
              textShadow: isTransparent ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
            }}
          >
            Noir & Lumière
          </button>

          {/* Right: Shopping Bag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage("cart")}
              className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase transition-all hover:opacity-75 cursor-pointer py-1 px-1.5"
              style={{
                color: isTransparent ? "#ffffff" : "var(--foreground)",
                fontFamily: "var(--font-body)",
                textShadow: isTransparent
                  ? "0 1px 4px rgba(0,0,0,0.4)"
                  : "none",
              }}
              aria-label="View Shopping Bag"
            >
              <span className="hidden sm:inline">Bag</span>
              <div className="relative flex items-center justify-center">
                {/* Minimal Luxury Bag Icon */}
                <svg
                  className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>

                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] rounded-full font-bold transition-transform scale-100"
                    style={{
                      background: isTransparent ? "#c9a96e" : "var(--primary)",
                      color: isTransparent
                        ? "#1a1814"
                        : "var(--primary-foreground)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: "rgba(26, 24, 20, 0.45)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`w-full max-w-sm bg-[#f8f6f1] h-full shadow-2xl transition-transform duration-300 flex flex-col justify-between p-6 pt-24 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            <div
              className="border-b pb-4"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-[10px] tracking-[0.25em] uppercase font-semibold text-stone-400 mb-1"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Mauritius Atelier
              </p>
              <h2
                className="text-xl tracking-[0.14em] uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--foreground)",
                }}
              >
                Noir & Lumière
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              <button
                onClick={() => {
                  setPage("home")
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm tracking-[0.2em] uppercase font-medium hover:text-[#9a7a45] transition-colors"
                style={{
                  color:
                    page === "home" ? "var(--primary)" : "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Home
              </button>

              <button
                onClick={() => {
                  setSelectedCategory("All")
                  setPage("collection")
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm tracking-[0.2em] uppercase font-medium hover:text-[#9a7a45] transition-colors"
                style={{
                  color:
                    page === "collection" && selectedCategory === "All"
                      ? "var(--primary)"
                      : "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                The Collection (All)
              </button>

              <div className="pl-4 space-y-3 border-l-2 border-[#9a7a45]/30 my-2">
                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setPage("collection")
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-xs tracking-[0.18em] uppercase text-stone-600 hover:text-[#9a7a45] transition-colors"
                    style={{
                      fontFamily: "var(--font-body)",
                      color:
                        page === "collection" && selectedCategory === cat
                          ? "var(--primary)"
                          : undefined,
                      fontWeight:
                        page === "collection" && selectedCategory === cat
                          ? 600
                          : 400,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setPage("cart")
                  setMobileMenuOpen(false)
                }}
                className="flex items-center justify-between w-full text-left text-sm tracking-[0.2em] uppercase font-medium pt-2 hover:text-[#9a7a45] transition-colors"
                style={{
                  color:
                    page === "cart" ? "var(--primary)" : "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span>Shopping Bag</span>
                {cartCount > 0 && (
                  <span
                    className="px-2 py-0.5 text-[10px] rounded-full font-semibold"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {cartCount} {cartCount === 1 ? "piece" : "pieces"}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onOpenTracker()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm tracking-[0.2em] uppercase font-medium pt-2 text-stone-700 hover:text-[#9a7a45] transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                Track Order
              </button>
            </div>
          </div>

          {/* Drawer Footer Info */}
          <div
            className="pt-6 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                {isLive ? "Neon PostgreSQL Connected" : "Catalog Cached"}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
              Port Louis · Grand Baie · Mauritius
              <br />
              Complimentary island delivery &gt; Rs 5,000
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onClick,
}: {
  product: Product
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="group cursor-pointer flex flex-col justify-between transition-all duration-300"
      style={{
        background: "var(--background)",
        boxShadow: "0 1px 3px rgba(26,24,20,0.06)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/5", background: "var(--secondary)" }}
      >
        <img
          src={hovered ? product.hoverImage : product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          style={{
            transform: hovered ? "scale(1.04)" : "scale(1)",
            filter: "brightness(0.96)",
          }}
          loading="lazy"
        />
        {/* Sold Out Overlay */}
        {(!product.inStock || product.stockQuantity <= 0) && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3 py-1 bg-[#1a1814] text-[#c9a96e] border border-[#c9a96e]/40 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold shadow-md">
              Sold Out
            </span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 z-20">
          <span
            className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] uppercase px-1.5 py-0.5 sm:px-2 sm:py-1 backdrop-blur-sm"
            style={{
              background: "rgba(26,24,20,0.78)",
              color: "#f8f6f1",
              fontFamily: "var(--font-body)",
            }}
          >
            {product.category}
          </span>
          {product.audience && product.audience !== "All" && (
            <span
              className="text-[8px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] uppercase px-1.5 py-0.5 backdrop-blur-sm"
              style={{
                background: "rgba(201,169,110,0.88)",
                color: "#1a1814",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
              }}
            >
              {product.audience}
            </span>
          )}
          {product.inStock &&
            product.stockQuantity > 0 &&
            product.stockQuantity <= 3 && (
              <span
                className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 backdrop-blur-sm font-semibold"
                style={{
                  background: "rgba(146, 64, 14, 0.88)",
                  color: "#fef3c7",
                  fontFamily: "var(--font-body)",
                }}
              >
                Only {product.stockQuantity} Left
              </span>
            )}
        </div>
      </div>
      <div className="p-3.5 sm:p-5 md:p-6">
        <p
          className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.15em] truncate"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          {product.designer}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
          <p
            className="text-xs sm:text-sm font-medium line-clamp-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--foreground)",
            }}
          >
            {product.name}
          </p>
          <p
            className="text-xs sm:text-sm font-semibold whitespace-nowrap"
            style={{
              color: "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {formatPriceMUR(product.price)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function HomePage({
  products,
  setPage,
  setSelectedProduct,
  siteContent,
}: {
  products: Product[]
  setPage: (p: Page) => void
  setSelectedProduct: (p: Product) => void
  siteContent?: Record<string, SiteContentItem>
}) {
  const featured = products.slice(0, 3)

  const heroImage = siteContent?.hero?.image_url || HERO_IMAGES[0]
  const heroSubtitle =
    siteContent?.hero?.subtitle || "Mauritius Atelier · Collection 2026"
  const heroTitle = siteContent?.hero?.title || "The Weight of Silence"
  const heroCta = siteContent?.hero?.cta_text || "Explore Collection"

  const deliveryTitle =
    siteContent?.announcements?.metadata?.deliveryTitle ||
    "Island-Wide Delivery"
  const deliveryDesc =
    siteContent?.announcements?.metadata?.deliveryDesc ||
    "Complimentary delivery across Mauritius on orders over Rs 5,000"
  const fittingTitle =
    siteContent?.announcements?.metadata?.fittingTitle || "Atelier Fittings"
  const fittingDesc =
    siteContent?.announcements?.metadata?.fittingDesc ||
    "Private salon appointments in Port Louis & Grand Baie"
  const tailoringTitle =
    siteContent?.announcements?.metadata?.tailoringTitle ||
    "Bespoke Alterations"
  const tailoringDesc =
    siteContent?.announcements?.metadata?.tailoringDesc ||
    "Complimentary hand adjustments included with all tailoring"

  const edit1Image = siteContent?.editorial_draped?.image_url || HERO_IMAGES[1]
  const edit1Subtitle =
    siteContent?.editorial_draped?.subtitle || "Atelier Creations"
  const edit1Title =
    siteContent?.editorial_draped?.title || "Draped Silk & Sculpted Gold"
  const edit1Cta =
    siteContent?.editorial_draped?.cta_text || "Shop Curated Pieces"

  const edit2Image = siteContent?.editorial_evening?.image_url || HERO_IMAGES[2]
  const edit2Subtitle =
    siteContent?.editorial_evening?.subtitle || "Jewellery & Adornment"
  const edit2Title = siteContent?.editorial_evening?.title || "The Arc & Hoops"
  const edit2Quote =
    siteContent?.editorial_evening?.metadata?.quote ||
    '"We craft pieces for individuals who embrace quiet discernment."'
  const edit2Body =
    siteContent?.editorial_evening?.body_text ||
    "Founded in Mauritius. Every garment and jewellery silhouette is designed with architectural precision and timeless material permanence."

  return (
    <div style={{ background: "var(--background)" }}>
      {/* Hero Section: min-h-[100dvh] ensures zero mobile URL bar layout jump */}
      <section className="relative min-h-[100dvh] flex items-end overflow-hidden">
        {/* Full Edge-to-Edge Hero Image */}
        <img
          src={heroImage}
          alt="Noir & Lumière — Mauritius Atelier"
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
          style={{ filter: "brightness(0.72)" }}
        />

        {/* Dual Soft Gradient Overlays:
            - Top gradient: makes transparent header text crystal clear over photo
            - Bottom gradient: makes title and CTA stand out beautifully
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80 pointer-events-none" />

        {/* Hero Content positioned comfortably at the bottom */}
        <div className="relative z-10 w-full px-5 pb-12 sm:px-10 sm:pb-16 md:px-20 md:pb-24 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div>
            <p
              className="mb-2 sm:mb-3 text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-semibold"
              style={{
                color: "#e6ca85",
                fontFamily: "var(--font-body)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {heroSubtitle}
            </p>
            <h1
              className="mb-5 sm:mb-6 leading-[1.05]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 8.5vw, 5.8rem)",
                color: "#ffffff",
                fontWeight: 400,
                textShadow: "0 2px 14px rgba(0,0,0,0.5)",
              }}
            >
              {heroTitle}
            </h1>
            <button
              onClick={() => setPage("collection")}
              className="inline-flex items-center gap-3 sm:gap-4 border-b-2 pb-1.5 text-xs sm:text-sm tracking-[0.2em] uppercase transition-all hover:opacity-80 cursor-pointer font-medium"
              style={{
                borderColor: "#d4af37",
                color: "#f5e6be",
                fontFamily: "var(--font-body)",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {heroCta}
              <span className="text-base sm:text-lg">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Intro strip */}
      <section
        className="px-5 py-8 sm:px-10 sm:py-12 md:px-20 border-b grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-2">
          <p
            className="text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {deliveryTitle}
          </p>
          <p
            className="text-xs mt-1.5"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {deliveryDesc}
          </p>
        </div>
        <div className="p-2 sm:border-l sm:border-r border-stone-200/60 sm:px-6">
          <p
            className="text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {fittingTitle}
          </p>
          <p
            className="text-xs mt-1.5"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {fittingDesc}
          </p>
        </div>
        <div className="p-2">
          <p
            className="text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {tailoringTitle}
          </p>
          <p
            className="text-xs mt-1.5"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {tailoringDesc}
          </p>
        </div>
      </section>

      {/* Editorial split feature */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] md:min-h-[80vh]">
        <div className="relative overflow-hidden min-h-[380px] sm:min-h-[460px]">
          <img
            src={edit1Image}
            alt={edit1Title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            style={{ filter: "brightness(0.64)" }}
          />
          <div className="absolute bottom-0 left-0 p-6 sm:p-10">
            <p
              className="mb-1 sm:mb-2 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-medium"
              style={{ color: "#d4af37", fontFamily: "var(--font-body)" }}
            >
              {edit1Subtitle}
            </p>
            <h2
              className="mb-3 sm:mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4.5vw, 2.4rem)",
                color: "#f8f6f1",
                fontWeight: 400,
                lineHeight: 1.15,
              }}
            >
              {edit1Title}
            </h2>
            <button
              onClick={() => setPage("collection")}
              className="text-xs tracking-[0.2em] uppercase underline underline-offset-4 transition-opacity hover:opacity-60 cursor-pointer"
              style={{ color: "#f8f6f1", fontFamily: "var(--font-body)" }}
            >
              {edit1Cta}
            </button>
          </div>
        </div>
        <div
          className="flex flex-col"
          style={{ background: "var(--secondary)" }}
        >
          <div className="flex-1 relative overflow-hidden min-h-[220px] sm:min-h-[280px]">
            <img
              src={edit2Image}
              alt={edit2Title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ filter: "brightness(0.58)" }}
            />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <p
                className="mb-1 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-medium"
                style={{ color: "#d4af37", fontFamily: "var(--font-body)" }}
              >
                {edit2Subtitle}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)",
                  color: "#f8f6f1",
                  fontWeight: 400,
                }}
              >
                {edit2Title}
              </h3>
            </div>
          </div>
          <div
            className="p-6 sm:p-10 flex flex-col justify-center"
            style={{ flex: "0 0 auto" }}
          >
            <p
              className="mb-1 sm:mb-2 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              The Maison
            </p>
            <p
              className="mb-4 sm:mb-6 leading-relaxed"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)",
                color: "var(--foreground)",
                fontWeight: 400,
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              {edit2Quote}
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-body)",
              }}
            >
              {edit2Body}
            </p>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="px-4 sm:px-8 md:px-20 py-14 sm:py-20">
        <div className="flex items-baseline justify-between mb-8 sm:mb-14">
          <div>
            <p
              className="mb-1 sm:mb-2 text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium"
              style={{
                color: "var(--primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              From the Neon Catalog
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                fontWeight: 400,
                color: "var(--foreground)",
              }}
            >
              Featured Pieces
            </h2>
          </div>
          <button
            onClick={() => setPage("collection")}
            className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs tracking-[0.18em] uppercase transition-opacity hover:opacity-60 cursor-pointer font-medium"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            All Pieces <span className="text-sm">→</span>
          </button>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-px"
          style={{ background: "var(--border)" }}
        >
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => {
                setSelectedProduct(p)
                setPage("product")
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Collection ───────────────────────────────────────────────────────────────

function CollectionPage({
  products,
  loading,
  setPage,
  setSelectedProduct,
  activeCategory,
  setActiveCategory,
}: {
  products: Product[]
  loading: boolean
  setPage: (p: Page) => void
  setSelectedProduct: (p: Product) => void
  activeCategory: "All" | ProductCategory
  setActiveCategory: (c: "All" | ProductCategory) => void
}) {
  const [activeAudience, setActiveAudience] = useState<"All" | ProductAudience>(
    "All",
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"curated" | "price-asc" | "price-desc">(
    "curated",
  )

  const filtered = products
    .filter((p) => {
      const matchCategory =
        activeCategory === "All" || p.category === activeCategory
      const matchAudience =
        activeAudience === "All" ||
        p.audience === "All" ||
        p.audience === activeAudience
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.designer &&
          p.designer.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCategory && matchAudience && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      return 0
    })

  return (
    <div
      className="pt-16 sm:pt-20"
      style={{ background: "var(--background)", minHeight: "100vh" }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-8 md:px-20 pt-8 sm:pt-14 pb-6 sm:pb-8 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <p
          className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          Mauritius Atelier · 2026
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
            fontWeight: 400,
            color: "var(--foreground)",
          }}
        >
          The Collection
        </h1>
      </div>

      {/* Dual Filter Bars (Mobile Optimized with Horizontal Scrolling) */}
      <div
        className="px-4 sm:px-8 md:px-20 py-3.5 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Category filters */}
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-1">
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 shrink-0"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Category:
          </span>
          <div className="flex items-center gap-4 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase whitespace-nowrap pb-1 transition-all cursor-pointer"
                style={{
                  fontFamily: "var(--font-body)",
                  color:
                    activeCategory === cat
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                  borderBottom:
                    activeCategory === cat
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                  fontWeight: activeCategory === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Audience filters */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 shrink-0"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Audience:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {AUDIENCES.map((aud) => (
              <button
                key={aud}
                onClick={() => setActiveAudience(aud)}
                className="px-2.5 py-1 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase transition-all rounded cursor-pointer shrink-0"
                style={{
                  fontFamily: "var(--font-body)",
                  background:
                    activeAudience === aud
                      ? "rgba(201,169,110,0.15)"
                      : "transparent",
                  color:
                    activeAudience === aud
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                  border:
                    activeAudience === aud
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  fontWeight: activeAudience === aud ? 600 : 400,
                }}
              >
                {aud}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div
        className="px-4 sm:px-8 md:px-20 py-3 bg-stone-50/70 border-b flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collection (e.g. silk, hoops, linen)..."
            className="w-full pl-8 pr-7 py-2 text-xs border border-stone-300 rounded-sm bg-white focus:outline-none focus:border-[#9a7a45]"
          />
          <span className="absolute left-2.5 top-2.5 text-stone-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-400">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-stone-300 text-stone-800 text-xs rounded-sm focus:outline-none focus:border-[#9a7a45]"
          >
            <option value="curated">Curated & Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3.5 sm:px-8 md:px-20 py-8 sm:py-12">
        <p
          className="mb-4 sm:mb-8 text-[11px] sm:text-xs tracking-[0.2em]"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          {loading
            ? "Loading pieces from Neon..."
            : `${filtered.length} ${
                filtered.length === 1 ? "piece" : "pieces"
              }`}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="animate-pulse bg-stone-200/60 aspect-[4/5] rounded"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p
              className="text-base sm:text-lg italic"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--muted-foreground)",
              }}
            >
              No pieces found for the selected criteria.
            </p>
            <button
              onClick={() => {
                setActiveCategory("All")
                setActiveAudience("All")
              }}
              className="mt-4 text-xs tracking-[0.2em] uppercase border-b pb-1 cursor-pointer"
              style={{
                borderColor: "var(--primary)",
                color: "var(--primary)",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-px"
            style={{ background: "var(--border)" }}
          >
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => {
                  setSelectedProduct(p)
                  setPage("product")
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Product Detail ────────────────────────────────────────────────────────────

function ProductPage({
  product,
  setPage,
  addToCart,
}: {
  product: Product
  setPage: (p: Page) => void
  addToCart: (p: Product, size: string) => void
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null,
  )
  const [added, setAdded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const images = [product.image, product.hoverImage]

  const handleAdd = () => {
    if (!selectedSize) return
    addToCart(product, selectedSize)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div
      className="pt-16 sm:pt-20"
      style={{ background: "var(--background)", minHeight: "100vh" }}
    >
      {/* Breadcrumb */}
      <div
        className="px-4 sm:px-8 md:px-20 py-4 sm:py-6 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs overflow-x-auto whitespace-nowrap no-scrollbar"
        style={{
          color: "var(--muted-foreground)",
          fontFamily: "var(--font-body)",
        }}
      >
        <button
          onClick={() => setPage("home")}
          className="hover:opacity-70 transition-opacity tracking-[0.15em] uppercase cursor-pointer"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => setPage("collection")}
          className="hover:opacity-70 transition-opacity tracking-[0.15em] uppercase cursor-pointer"
        >
          Collection
        </button>
        <span>/</span>
        <span
          className="truncate max-w-[160px] sm:max-w-none"
          style={{ color: "var(--foreground)" }}
        >
          {product.name}
        </span>
      </div>

      {/* Main layout */}
      <div className="px-4 sm:px-8 md:px-20 pb-16 sm:pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20">
        {/* Images */}
        <div>
          <div
            className="relative overflow-hidden mb-3 cursor-pointer rounded-sm"
            style={{ aspectRatio: "4/5", background: "var(--secondary)" }}
            onClick={() => setImgIdx((i) => (i + 1) % images.length)}
          >
            <img
              src={images[imgIdx]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ filter: "brightness(0.96)" }}
            />
          </div>
          <div className="flex gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className="overflow-hidden transition-opacity cursor-pointer rounded-sm"
                style={{
                  width: "60px",
                  height: "75px",
                  opacity: imgIdx === i ? 1 : 0.45,
                  border:
                    imgIdx === i
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.93)" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="pt-1 md:pt-4">
            <div className="flex items-center justify-between mb-1">
              <p
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium"
                style={{
                  color: "var(--primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {product.designer}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] sm:text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded font-semibold ${
                    !product.inStock || product.stockQuantity <= 0
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : product.stockQuantity <= 3
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {!product.inStock || product.stockQuantity <= 0
                    ? "Sold Out"
                    : product.stockQuantity <= 3
                      ? `Only ${product.stockQuantity} Remaining`
                      : "In Stock · Atelier Ready"}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                  style={{
                    background: "var(--secondary)",
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {product.audience}
                </span>
              </div>
            </div>

            <h1
              className="mb-1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
                fontWeight: 400,
                color: "var(--foreground)",
                lineHeight: 1.15,
              }}
            >
              {product.name}
            </h1>
            <p
              className="mb-1 text-[11px] sm:text-xs tracking-[0.2em] uppercase"
              style={{
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-body)",
              }}
            >
              {product.category}
            </p>
            <p
              className="mt-3 sm:mt-4 mb-6 sm:mb-8 text-xl sm:text-2xl font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {formatPriceMUR(product.price)}
            </p>

            <div
              className="w-12 mb-6 sm:mb-8"
              style={{ borderTop: "1px solid var(--border)" }}
            />

            <p
              className="mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm"
              style={{
                color: "var(--foreground)",
                fontFamily: "var(--font-body)",
                lineHeight: 1.8,
                opacity: 0.88,
              }}
            >
              {product.description}
            </p>

            {/* Size */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-baseline justify-between mb-2.5">
                <p
                  className="text-[11px] sm:text-xs tracking-[0.2em] uppercase font-medium"
                  style={{
                    color: "var(--muted-foreground)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Size / Fit
                </p>
                {!selectedSize && (
                  <p
                    className="text-xs font-medium"
                    style={{
                      color: "var(--primary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Please select a size
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="min-h-[44px] px-4 py-2.5 text-xs tracking-[0.15em] transition-all cursor-pointer rounded-sm"
                    style={{
                      fontFamily: "var(--font-body)",
                      border:
                        selectedSize === size
                          ? "1px solid var(--primary)"
                          : "1px solid var(--border)",
                      color:
                        selectedSize === size
                          ? "var(--primary)"
                          : "var(--muted-foreground)",
                      background:
                        selectedSize === size
                          ? "rgba(201,169,110,0.12)"
                          : "transparent",
                      fontWeight: selectedSize === size ? 600 : 400,
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              disabled={
                !selectedSize || !product.inStock || product.stockQuantity <= 0
              }
              className="w-full min-h-[48px] py-4 text-xs sm:text-sm tracking-[0.25em] uppercase transition-all mb-3 cursor-pointer rounded-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-body)",
                background: added
                  ? "rgba(201,169,110,0.2)"
                  : !product.inStock || product.stockQuantity <= 0
                    ? "var(--secondary)"
                    : selectedSize
                      ? "var(--primary)"
                      : "var(--secondary)",
                color: added
                  ? "var(--primary)"
                  : selectedSize
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                border: added ? "1px solid var(--primary)" : "none",
              }}
            >
              {added
                ? "Added to Selection ✓"
                : !product.inStock || product.stockQuantity <= 0
                  ? "Sold Out · Atelier Waitlist"
                  : "Add to Bag"}
            </button>

            {/* Details */}
            <div
              className="mt-8 sm:mt-10 border-t pt-6 sm:pt-8"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="mb-3 sm:mb-4 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
                style={{
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Details & Atelier Craftsmanship
              </p>
              <ul className="space-y-2">
                {product.details.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs"
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-body)",
                      opacity: 0.85,
                    }}
                  >
                    <span style={{ color: "var(--primary)", marginTop: "1px" }}>
                      —
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Cart & Checkout ──────────────────────────────────────────────────────────

const MAURITIUS_CITIES = [
  "Port Louis",
  "Grand Baie",
  "Curepipe",
  "Ebène / Rose Hill",
  "Tamarin / Black River",
  "Flic-en-Flac",
  "Quatre Bornes",
  "Vacoas-Phoenix",
  "Moka",
  "Grand Gaube / Pereybere",
  "Trou aux Biches",
  "Mahebourg / Blue Bay",
  "Flacq / Belle Mare",
  "Bel Ombre / Le Morne",
]

function CartPage({
  cart,
  setPage,
  removeFromCart,
  updateQty,
  clearCart,
  onOpenLegal,
}: {
  cart: CartItem[]
  setPage: (p: Page) => void
  removeFromCart: (id: string, size: string) => void
  updateQty: (id: string, size: string, qty: number) => void
  clearCart: () => void
  onOpenLegal: (tab: LegalPolicyType) => void
}) {
  const [checkoutStep, setCheckoutStep] = useState<"bag" | "checkout">("bag")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStep, setSubmittingStep] = useState("")
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderRef, setOrderRef] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedJuice, setCopiedJuice] = useState(false)

  // Customer Form State
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("+230 ")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryCity, setDeliveryCity] = useState("Port Louis")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer")

  // Proof of Payment Upload State
  const [popFile, setPopFile] = useState<File | null>(null)
  const [popPreview, setPopPreview] = useState<string | null>(null)

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const freeShippingThreshold = 5000
  const shipping =
    subtotal >= freeShippingThreshold || cart.length === 0 ? 0 : 350
  const total = subtotal + shipping

  // Handle POP File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      setValidationError("Receipt file must be under 15MB.")
      return
    }

    setPopFile(file)
    setValidationError(null)

    const reader = new FileReader()
    reader.onload = () => {
      setPopPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePopFile = () => {
    setPopFile(null)
    setPopPreview(null)
  }

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Form Validation
    if (!customerName.trim()) {
      setValidationError("Please enter your full name.")
      return
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setValidationError(
        "Please enter a valid email address for your order confirmation.",
      )
      return
    }
    const cleanPhone = customerPhone.replace(/\s+/g, "").replace(/^\+230/, "")
    if (
      !cleanPhone ||
      cleanPhone.length !== 8 ||
      !/^[2456789]\d{7}$/.test(cleanPhone)
    ) {
      setValidationError(
        "Please enter a valid 8-digit Mauritius phone number (e.g. 5812 3456 or +230 5812 3456).",
      )
      return
    }
    if (!deliveryAddress.trim()) {
      setValidationError(
        "Please enter your delivery street address or villa details.",
      )
      return
    }

    setIsSubmitting(true)

    try {
      const generatedRef =
        "NL-MU-" + Math.floor(100000 + Math.random() * 900000)
      setOrderRef(generatedRef)

      let proofPath: string | undefined = undefined
      let proofUrl: string | undefined = undefined

      // 1. Upload POP if bank transfer and file provided
      if (paymentMethod === "bank_transfer" && popFile) {
        setSubmittingStep(
          "Uploading proof of payment to secure private storage...",
        )
        try {
          const uploadRes = await uploadProofOfPayment(popFile, generatedRef)
          proofPath = uploadRes.path
          proofUrl = uploadRes.url
        } catch (uploadErr) {
          console.warn(
            "Storage upload warning, proceeding with order creation:",
            uploadErr,
          )
        }
      }

      // 2. Prepare items input
      const itemsInput = cart.map((item) => ({
        slug: item.slug,
        name: item.name,
        size: item.size,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
        imageUrl: item.image,
      }))

      // 3. Create Order in Neon PostgreSQL
      setSubmittingStep("Registering order in atelier registry...")
      const orderPayload = {
        orderRef: generatedRef,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity,
        deliveryNotes: deliveryNotes.trim() || undefined,
        paymentMethod,
        paymentStatus:
          paymentMethod === "bank_transfer"
            ? "pending_verification" as const
            : "cash_on_delivery" as const,
        subtotalMur: subtotal,
        deliveryFeeMur: shipping,
        totalMur: total,
        proofOfPaymentPath: proofPath,
        proofOfPaymentUrl: proofUrl,
        items: itemsInput,
      }

      const orderResult = await createOrder(orderPayload)
      if (!orderResult.success) {
        throw new Error(orderResult.error || "Failed to record order")
      }

      // 4. Dispatch Email to Admin & Customer
      setSubmittingStep(
        "Dispatching order notification and atelier dispatch notice...",
      )
      await sendOrderNotificationEmail(orderPayload, itemsInput)

      // 5. Complete Order
      setIsSubmitting(false)
      setOrderConfirmed(true)
      clearCart()
    } catch (err: any) {
      console.error("Order submission error:", err)
      setIsSubmitting(false)
      setValidationError(
        err?.message ||
          "An error occurred while securing your order. Please try again.",
      )
    }
  }

  return (
    <div
      className="pt-16 sm:pt-20"
      style={{ background: "var(--background)", minHeight: "100vh" }}
    >
      <div
        className="px-4 sm:px-8 md:px-20 pt-8 sm:pt-14 pb-5 sm:pb-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--foreground)",
            }}
          >
            {orderConfirmed
              ? "Order Confirmed"
              : checkoutStep === "checkout"
                ? "Atelier Checkout"
                : "Your Selection"}
          </h1>
          {!orderConfirmed && cart.length > 0 && (
            <div className="flex items-center gap-4 text-xs tracking-[0.2em] uppercase font-medium text-stone-500">
              <button
                onClick={() => setCheckoutStep("bag")}
                className={`transition-colors cursor-pointer ${
                  checkoutStep === "bag"
                    ? "text-[#9a7a45] font-bold"
                    : "hover:text-stone-900"
                }`}
              >
                1. Selection ({cart.reduce((s, i) => s + i.qty, 0)})
              </button>
              <span>/</span>
              <button
                onClick={() => setCheckoutStep("checkout")}
                className={`transition-colors cursor-pointer ${
                  checkoutStep === "checkout"
                    ? "text-[#9a7a45] font-bold"
                    : "hover:text-stone-900"
                }`}
              >
                2. Delivery & Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {orderConfirmed ? (
        /* Order Confirmed Screen */
        <div className="px-5 sm:px-8 md:px-20 py-16 sm:py-24 flex flex-col items-center text-center gap-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#9a7a45]/15 text-[#9a7a45] text-3xl font-bold border border-[#9a7a45]/30">
            ✓
          </div>
          <div className="space-y-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#9a7a45] font-semibold">
              Port Louis Atelier Allocation
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4.5vw, 2.4rem)",
                fontWeight: 400,
                color: "var(--foreground)",
              }}
            >
              Thank You for Your Patronage
            </h2>
          </div>

          <div className="w-full bg-white p-6 rounded-sm border border-stone-200 text-left space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <span className="text-xs text-stone-500 uppercase tracking-wider">
                Order Reference
              </span>
              <span className="font-mono font-bold text-sm text-stone-900">
                #{orderRef}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <span className="text-xs text-stone-500 uppercase tracking-wider">
                Payment Method
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9a7a45]">
                {paymentMethod === "bank_transfer"
                  ? "Bank Transfer · Pending POP Verification"
                  : "Cash on Delivery"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <span className="text-xs text-stone-500 uppercase tracking-wider">
                Delivery Destination
              </span>
              <span className="text-xs font-medium text-stone-800 text-right">
                {deliveryAddress}, {deliveryCity}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500 uppercase tracking-wider">
                Order Total
              </span>
              <span className="text-base font-bold text-[#9a7a45]">
                {formatPriceMUR(total)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-stone-100 rounded-sm border border-stone-200 text-xs text-stone-600 leading-relaxed max-w-lg">
            <p className="font-semibold text-stone-800 mb-1">
              Estimated Delivery: 24–48 Hours across Mauritius
            </p>
            <p>
              An automated notification with your order details has been
              dispatched to <strong>{customerEmail}</strong> and our atelier
              liaison team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-sm">
            <button
              onClick={() => {
                setOrderConfirmed(false)
                setCheckoutStep("bag")
                setPage("collection")
              }}
              className="flex-1 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold text-white bg-[#1a1814] hover:bg-[#9a7a45] transition-colors rounded-sm cursor-pointer"
            >
              Explore Collection
            </button>
            <button
              onClick={() => {
                setOrderConfirmed(false)
                setCheckoutStep("bag")
                setPage("home")
              }}
              className="py-3.5 px-6 text-xs tracking-[0.2em] uppercase text-stone-600 hover:text-stone-900 border border-stone-300 rounded-sm transition-colors cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Bag */
        <div className="px-5 sm:px-8 md:px-20 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.3rem",
              fontStyle: "italic",
              color: "var(--muted-foreground)",
              fontWeight: 400,
            }}
          >
            Your shopping bag is empty.
          </p>
          <button
            onClick={() => setPage("collection")}
            className="text-xs tracking-[0.25em] uppercase border-b pb-1 transition-opacity hover:opacity-60 cursor-pointer font-medium"
            style={{
              color: "var(--primary)",
              borderColor: "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Explore the Collection
          </button>
        </div>
      ) : checkoutStep === "bag" ? (
        /* STEP 1: BAG REVIEW */
        <div className="px-4 sm:px-8 md:px-20 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
          {/* Items List */}
          <div className="md:col-span-2 space-y-0">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="flex gap-4 sm:gap-6 py-6 sm:py-8 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="flex-shrink-0 overflow-hidden rounded-sm"
                  style={{
                    width: "85px",
                    height: "108px",
                    background: "var(--secondary)",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.93)" }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="mb-0.5 text-[10px] sm:text-xs tracking-[0.15em] truncate"
                      style={{
                        color: "var(--muted-foreground)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item.designer}
                    </p>
                    <p
                      className="mb-1 text-xs sm:text-sm font-medium"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--foreground)",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-[11px] sm:text-xs"
                      style={{
                        color: "var(--muted-foreground)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Size: {item.size} &nbsp;·&nbsp; {item.category}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-stone-300 rounded overflow-hidden">
                      <button
                        onClick={() =>
                          item.qty > 1
                            ? updateQty(item.id, item.size, item.qty - 1)
                            : removeFromCart(item.id, item.size)
                        }
                        className="w-8 h-8 flex items-center justify-center text-xs hover:bg-stone-100 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        –
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-medium">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.id, item.size, item.qty + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center text-xs hover:bg-stone-100 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <p
                        style={{
                          color: "var(--primary)",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {formatPriceMUR(item.price * item.qty)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-[11px] sm:text-xs tracking-[0.12em] uppercase transition-opacity hover:opacity-50 cursor-pointer"
                        style={{
                          color: "var(--muted-foreground)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Column */}
          <div>
            <div
              className="border p-6 sm:p-8 sticky top-24 rounded-sm"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                boxShadow: "0 2px 12px rgba(26,24,20,0.07)",
              }}
            >
              <p
                className="mb-4 sm:mb-6 text-xs tracking-[0.25em] uppercase font-semibold"
                style={{
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Order Summary
              </p>
              <div className="space-y-3 mb-6">
                <div
                  className="flex justify-between text-xs"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Subtotal
                  </span>
                  <span style={{ color: "var(--foreground)" }}>
                    {formatPriceMUR(subtotal)}
                  </span>
                </div>
                <div
                  className="flex justify-between text-xs"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Mauritius Delivery
                  </span>
                  <span style={{ color: "var(--foreground)" }}>
                    {shipping === 0
                      ? "Complimentary"
                      : formatPriceMUR(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p
                    className="text-[11px] sm:text-xs"
                    style={{
                      color: "var(--muted-foreground)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    Add {formatPriceMUR(freeShippingThreshold - subtotal)} more
                    to qualify for complimentary island delivery.
                  </p>
                )}
              </div>
              <div
                className="border-t pt-4 mb-6 sm:mb-8 flex justify-between"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="text-xs tracking-[0.15em] uppercase font-semibold"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Total (MUR)
                </span>
                <span
                  style={{
                    color: "var(--primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {formatPriceMUR(total)}
                </span>
              </div>
              <button
                onClick={() => setCheckoutStep("checkout")}
                className="w-full min-h-[46px] py-3.5 text-xs tracking-[0.25em] uppercase transition-all hover:opacity-85 cursor-pointer rounded-sm font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Proceed to Checkout →
              </button>
              <button
                onClick={() => setPage("collection")}
                className="w-full mt-2.5 py-3 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-60 cursor-pointer"
                style={{
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: CHECKOUT & PAYMENT SELECTION */
        <form
          onSubmit={handlePlaceOrder}
          className="px-4 sm:px-8 md:px-20 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14"
        >
          {/* Left / Main Column: Details & Payment */}
          <div className="lg:col-span-7 space-y-8">
            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-sm flex items-center justify-between">
                <span>⚠️ {validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-sm font-bold ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Section 1: Customer Liaison */}
            <div className="bg-white p-6 sm:p-8 rounded-sm border border-stone-200 shadow-sm space-y-5">
              <div className="border-b pb-3 border-stone-100 flex items-center justify-between">
                <h3
                  className="text-base sm:text-lg font-medium tracking-wide text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  1. Customer Liaison & Destination
                </h3>
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Marie Laurent"
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                    Mauritius Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+230 5..."
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                    Delivery Town / District *
                  </label>
                  <select
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45] bg-white"
                  >
                    {MAURITIUS_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                  Delivery Street Address or Villa *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Royal Road, Villa Lumière, Apt 4"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45]"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase font-semibold text-stone-700 mb-1">
                  Special Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Gate passcode, building floor, or preferred handover time..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs focus:outline-none focus:border-[#9a7a45]"
                />
              </div>
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-sm border border-stone-200 shadow-sm space-y-6">
              <div className="border-b pb-3 border-stone-100 flex items-center justify-between">
                <h3
                  className="text-base sm:text-lg font-medium tracking-wide text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  2. Payment Method
                </h3>
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">
                  Secure
                </span>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Transfer Option */}
                <div
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === "bank_transfer"
                      ? "border-[#9a7a45] bg-[#9a7a45]/5 ring-1 ring-[#9a7a45]"
                      : "border-stone-200 hover:border-stone-400 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-wider uppercase font-bold text-stone-900">
                      Bank Transfer / Juice
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                      className="accent-[#9a7a45]"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Transfer via MCB Juice or bank app and upload your receipt
                    screenshot.
                  </p>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-[#9a7a45] bg-[#9a7a45]/5 ring-1 ring-[#9a7a45]"
                      : "border-stone-200 hover:border-stone-400 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-wider uppercase font-bold text-stone-900">
                      Cash on Delivery
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-[#9a7a45]"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Pay by Cash or Juice upon hand delivery by our private
                    atelier courier.
                  </p>
                </div>
              </div>

              {/* Bank Transfer Details & POP Upload */}
              {paymentMethod === "bank_transfer" && (
                <div className="space-y-4 pt-2">
                  {/* MCB Banking Card */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#9a7a45]">
                        The Mauritius Commercial Bank (MCB)
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 font-medium">
                        Atelier Account
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                          Account Name
                        </p>
                        <p className="font-semibold text-stone-900">
                          NOIR & LUMIÈRE ATELIER LTD
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                          Account Number
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-mono font-bold text-stone-900">
                            000441234567
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("000441234567")
                              setCopiedAccount(true)
                              setTimeout(() => setCopiedAccount(false), 2000)
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 border border-stone-300 hover:border-[#9a7a45] text-stone-600 hover:text-[#9a7a45] rounded transition-colors cursor-pointer"
                          >
                            {copiedAccount ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                          MCB Juice / Phone
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-mono font-bold text-[#9a7a45]">
                            +230 5812 3456
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("+23058123456")
                              setCopiedJuice(true)
                              setTimeout(() => setCopiedJuice(false), 2000)
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 border border-stone-300 hover:border-[#9a7a45] text-stone-600 hover:text-[#9a7a45] rounded transition-colors cursor-pointer"
                          >
                            {copiedJuice ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                          Reference
                        </p>
                        <p className="text-stone-700 italic">
                          Your Name / Order Ref
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Payment Uploader */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] tracking-wider uppercase font-semibold text-stone-700">
                        Upload Proof of Payment (Screenshot / PDF)
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">
                        Retained 90 Days
                      </span>
                    </div>

                    {!popPreview ? (
                      <label className="border-2 border-dashed border-stone-300 hover:border-[#9a7a45] rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50/50 group">
                        <div className="w-10 h-10 rounded-full bg-stone-200 group-hover:bg-[#9a7a45]/20 flex items-center justify-center text-stone-600 group-hover:text-[#9a7a45] mb-2 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-stone-800">
                          Click or drag receipt screenshot here
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1">
                          JPG, PNG, WEBP or PDF (Max 15MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="p-3 bg-stone-50 border border-[#9a7a45]/40 rounded-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={popPreview}
                            alt="Receipt Preview"
                            className="w-12 h-14 object-cover rounded border border-stone-200"
                          />
                          <div>
                            <p className="text-xs font-semibold text-stone-900 line-clamp-1">
                              {popFile?.name || "Receipt Screenshot"}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {popFile
                                ? `${Math.round(popFile.size / 1024)} KB`
                                : "Attached"}{" "}
                              &nbsp;·&nbsp; Ready for upload
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removePopFile}
                          className="text-xs text-stone-400 hover:text-rose-600 font-bold p-1 cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-stone-500 leading-relaxed italic">
                      🛡 <strong>Privacy & Retention Guarantee:</strong> Your
                      payment receipt will be securely stored in our private
                      storage bucket and automatically deleted after 90 days.
                    </p>
                  </div>
                </div>
              )}

              {/* Cash on Delivery Notice */}
              {paymentMethod === "cod" && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-sm text-xs text-emerald-900 leading-relaxed">
                  <p className="font-semibold mb-1">
                    Private Atelier Hand Delivery
                  </p>
                  <p>
                    Our private courier will bring your bespoke pieces directly
                    to your address. You may settle the balance of{" "}
                    <strong>{formatPriceMUR(total)}</strong> upon delivery via
                    cash or instant MCB Juice transfer.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-5">
            <div
              className="border p-6 sm:p-8 sticky top-24 rounded-sm space-y-6"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                boxShadow: "0 2px 12px rgba(26,24,20,0.07)",
              }}
            >
              <div>
                <p
                  className="mb-1 text-xs tracking-[0.25em] uppercase font-semibold text-stone-500"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Order Summary
                </p>
                <p className="text-xs text-stone-400">
                  {cart.reduce((s, i) => s + i.qty, 0)} atelier creations
                  selected
                </p>
              </div>

              {/* Mini Item List */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border-b pb-4 border-stone-200">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex items-center gap-3 text-xs"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-12 object-cover rounded-sm border border-stone-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Size: {item.size} &nbsp;·&nbsp; Qty: {item.qty}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-900">
                      {formatPriceMUR(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="text-stone-900">
                    {formatPriceMUR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Island-Wide Delivery</span>
                  <span className="text-stone-900">
                    {shipping === 0
                      ? "Complimentary"
                      : formatPriceMUR(shipping)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline font-bold text-sm">
                  <span className="uppercase tracking-wider text-stone-900">
                    Total (MUR)
                  </span>
                  <span className="text-lg text-[#9a7a45]">
                    {formatPriceMUR(total)}
                  </span>
                </div>
              </div>

              {/* Submission CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 text-xs tracking-[0.25em] uppercase font-bold transition-all hover:opacity-90 cursor-pointer disabled:opacity-50 rounded-sm text-white bg-[#1a1814] hover:bg-[#9a7a45]"
                >
                  {isSubmitting
                    ? submittingStep || "Securing Order..."
                    : "Confirm & Secure Order"}
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutStep("bag")}
                  className="w-full py-2.5 text-xs tracking-[0.18em] uppercase text-stone-500 hover:text-stone-800 transition-colors cursor-pointer text-center"
                >
                  ← Return to Bag Review
                </button>
              </div>

              <div className="pt-2 text-[10px] text-stone-400 text-center leading-relaxed">
                By securing this order, you authorize allocation from our Port
                Louis atelier and agree to our{" "}
                <button
                  type="button"
                  onClick={() => onOpenLegal("terms")}
                  className="text-stone-600 underline hover:text-[#9a7a45] cursor-pointer"
                >
                  Terms of Sale
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => onOpenLegal("returns")}
                  className="text-stone-600 underline hover:text-[#9a7a45] cursor-pointer"
                >
                  Return Policy
                </button>
                . Island-wide delivery in 24–48 hours.
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  onOpenTracker,
  onOpenLegal,
}: {
  onOpenTracker: () => void
  onOpenLegal: (tab: LegalPolicyType) => void
}) {
  return (
    <footer
      className="px-5 py-12 sm:px-10 sm:py-14 md:px-20 border-t mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10"
      style={{ borderColor: "var(--border)", background: "var(--background)" }}
    >
      <div>
        <p
          className="mb-3 sm:mb-4 text-base sm:text-lg tracking-[0.15em] uppercase"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--foreground)",
          }}
        >
          Noir & Lumière
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          Maison Mauritius
          <br />
          Place d'Armes, Port Louis
          <br />
          Mauritius · +230 5250 8800
        </p>
        <div className="mt-4">
          <button
            onClick={onOpenTracker}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9a7a45] hover:underline cursor-pointer tracking-wider uppercase"
          >
            <span>📦</span> Track Your Order →
          </button>
        </div>
      </div>

      <div>
        <p
          className="mb-3 sm:mb-4 text-xs tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          Client Services
        </p>
        <div className="space-y-2 text-xs">
          <button
            onClick={onOpenTracker}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Order Fulfillment Tracker
          </button>
          <button
            onClick={() => onOpenLegal("shipping")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Island-wide Courier Delivery
          </button>
          <button
            onClick={() => onOpenLegal("returns")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Returns & 7-Day Exchange
          </button>
          <p className="text-stone-700">Private Showroom Appointments</p>
        </div>
      </div>

      <div>
        <p
          className="mb-3 sm:mb-4 text-xs tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          Legal & Compliance
        </p>
        <div className="space-y-2 text-xs">
          <button
            onClick={() => onOpenLegal("privacy")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Privacy Policy (DPA 2017)
          </button>
          <button
            onClick={() => onOpenLegal("terms")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Terms of Sale & Authenticity
          </button>
          <button
            onClick={() => onOpenLegal("returns")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Exchange Policy
          </button>
          <button
            onClick={() => onOpenLegal("shipping")}
            className="block text-left hover:text-[#9a7a45] transition-colors cursor-pointer text-stone-700"
          >
            Mauritius Delivery Coverage
          </button>
        </div>
      </div>

      <div>
        <p
          className="mb-3 sm:mb-4 text-xs tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          Mauritius Concierge
        </p>
        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          Available Monday to Saturday, 9:00 - 18:00 (MUT) via WhatsApp for
          styling, sizing, and VIP orders.
        </p>
        <a
          href="https://wa.me/23052508800?text=Bonjour%2C%20I%20would%20like%20to%20inquire%20with%20Noir%20%26%20Lumi%C3%A8re%20Mauritius."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9a7a45]/10 hover:bg-[#9a7a45]/20 text-[#9a7a45] rounded-sm text-xs font-medium transition-colors"
        >
          <span>💬</span> Chat via WhatsApp
        </a>
      </div>

      {/* Footer Bottom */}
      <div className="pt-6 border-t border-stone-200/80 col-span-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <p>
          © 2026 Noir & Lumière Mauritius. Tailored with architectural
          precision.
        </p>
        <div className="flex items-center gap-4 text-[11px] text-stone-500">
          <button
            onClick={() => onOpenLegal("terms")}
            className="hover:underline cursor-pointer"
          >
            Terms
          </button>
          <span>·</span>
          <button
            onClick={() => onOpenLegal("privacy")}
            className="hover:underline cursor-pointer"
          >
            Privacy
          </button>
          <span>·</span>
          <button
            onClick={() => onOpenLegal("returns")}
            className="hover:underline cursor-pointer"
          >
            Returns
          </button>
          <span>·</span>
          <button
            onClick={() => onOpenLegal("shipping")}
            className="hover:underline cursor-pointer"
          >
            Delivery
          </button>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Application ─────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      const search = window.location.search
      const path = window.location.pathname
      if (
        hash === "#admin" ||
        search.includes("admin") ||
        path.endsWith("/admin")
      ) {
        return "admin"
      }
    }
    return "home"
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS)
  const [siteContent, setSiteContent] =
    useState<Record<string, SiteContentItem>>(DEFAULT_SITE_CONTENT)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<"All" | ProductCategory>("All")
  const [isScrolled, setIsScrolled] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("noir_lumiere_cart")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Modal states for Order Tracker and Legal Modals
  const [trackerModalOpen, setTrackerModalOpen] = useState(false)
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyType>("returns")

  // Track window scroll for dynamic floating header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Listen for navigation changes (#admin, ?admin=true, or /admin)
  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash
      const search = window.location.search
      const path = window.location.pathname
      if (
        hash === "#admin" ||
        search.includes("admin") ||
        path.endsWith("/admin")
      ) {
        setPage("admin")
      }
    }
    handleNavigation()
    window.addEventListener("hashchange", handleNavigation)
    window.addEventListener("popstate", handleNavigation)
    return () => {
      window.removeEventListener("hashchange", handleNavigation)
      window.removeEventListener("popstate", handleNavigation)
    }
  }, [])

  // Secret admin shortcut (Ctrl+Shift+A or Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") ||
        (e.altKey && e.key.toLowerCase() === "a")
      ) {
        e.preventDefault()
        setPage((prev) => (prev === "admin" ? "home" : "admin"))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  // Load products and dynamic site content from Neon PostgreSQL on mount
  const loadCatalog = async () => {
    setLoading(true)
    try {
      const result = await fetchProducts()
      setProducts(result.products)
      setIsLive(result.isLive)
    } catch (err) {
      console.error("Error loading products:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadSiteData = async () => {
    try {
      const content = await fetchSiteContent()
      setSiteContent(content)
    } catch (err) {
      console.warn("Could not load dynamic site content:", err)
    }
  }

  useEffect(() => {
    loadCatalog()
    loadSiteData()
  }, [])

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("noir_lumiere_cart", JSON.stringify(cart))
    } catch (e) {
      console.warn("Could not persist cart to localStorage:", e)
    }
  }, [cart])

  const addToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i,
        )
      }
      return [...prev, { ...product, size, qty: 1 }]
    })
  }

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)))
  }

  const updateQty = (id: string, size: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id, size)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size ? { ...item, qty } : item,
      ),
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  // Dedicated Admin Portal View
  if (page === "admin") {
    return (
      <AdminDashboard
        onExit={() => {
          if (window.location.hash === "#admin") {
            window.location.hash = ""
          }
          setPage("home")
        }}
        onCatalogUpdated={() => {
          loadCatalog()
          loadSiteData()
        }}
      />
    )
  }

  return (
    <div
      style={{
        background: "var(--background)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav
        page={page}
        setPage={setPage}
        cartCount={cartCount}
        isLive={isLive}
        isScrolled={isScrolled}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenTracker={() => setTrackerModalOpen(true)}
      />

      <div style={{ flex: 1 }}>
        {page === "home" && (
          <HomePage
            products={products}
            setPage={setPage}
            setSelectedProduct={setSelectedProduct}
            siteContent={siteContent}
          />
        )}
        {page === "collection" && (
          <CollectionPage
            products={products}
            loading={loading}
            setPage={setPage}
            setSelectedProduct={setSelectedProduct}
            activeCategory={selectedCategory}
            setActiveCategory={setSelectedCategory}
          />
        )}
        {page === "product" && selectedProduct && (
          <ProductPage
            product={selectedProduct}
            setPage={setPage}
            addToCart={addToCart}
          />
        )}
        {page === "cart" && (
          <CartPage
            cart={cart}
            setPage={setPage}
            removeFromCart={removeFromCart}
            updateQty={updateQty}
            clearCart={clearCart}
            onOpenLegal={(tab) => {
              setLegalModalTab(tab)
              setLegalModalOpen(true)
            }}
          />
        )}
      </div>

      <Footer
        onOpenTracker={() => setTrackerModalOpen(true)}
        onOpenLegal={(tab) => {
          setLegalModalTab(tab)
          setLegalModalOpen(true)
        }}
      />

      <OrderTrackerModal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
      />

      <LegalModals
        isOpen={legalModalOpen}
        activePolicy={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
        onSelectPolicy={setLegalModalTab}
      />

      <WhatsAppConcierge />
    </div>
  )
}
