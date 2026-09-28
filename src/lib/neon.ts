import { neon } from "@neondatabase/serverless"

export type ProductAudience = "Women" | "Men" | "All"
export type ProductCategory = "Clothing" | "Jewellery" | "Accessories"

export interface DbProductRow {
  slug: string
  name: string
  category: string
  audience: string
  price_mur: number
  description: string
  image_position: string
  image_path: string
  hover_image_path?: string
  is_published: boolean
  stock_quantity?: number
  in_stock?: boolean
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category: ProductCategory
  audience: ProductAudience
  price: number
  description: string
  image: string
  hoverImage: string
  details: string[]
  sizes: string[]
  designer: string
  imagePosition: string
  isPublished: boolean
  stockQuantity: number
  inStock: boolean
}

export interface CartItem extends Product {
  size: string
  qty: number
}

const PRODUCT_EDITORIAL_METADATA: Record<string, {
  designer: string
  image: string
  hoverImage: string
  details: string[]
  sizes: string[]
}> = {
  "column-dress": {
    designer: "Atelier Port Louis",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&auto=format",
    details: [
      "Sculpted column silhouette with gentle contouring",
      "Heavyweight duchess silk-satin blend",
      "Concealed back zipper with hook-and-eye closure",
      "Dry clean only",
      "Designed & tailored in Mauritius",
    ],
    sizes: ["34", "36", "38", "40", "42"],
  },
  "linen-shirt": {
    designer: "Chamarel Studio",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop&auto=format",
    details: [
      "100% fine European flax linen",
      "Natural iridescent mother-of-pearl buttons",
      "Relaxed resort collar with double-stitch hem",
      "Pre-washed for supple drape and softness",
      "Hand-finished in Mauritius",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  "sculpted-hoops": {
    designer: "Le Morne Orfevrerie",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop&auto=format",
    details: [
      "18k yellow gold vermeil over 925 sterling silver",
      "Hollow-form architecture for featherlight all-day wear",
      "Hypoallergenic titanium post with secure click latch",
      "Atelier hallmark stamped on inner hoop",
      "Accompanied by bespoke suede case",
    ],
    sizes: ["Standard (28mm)"],
  },
  "arc-cuff": {
    designer: "Le Morne Orfevrerie",
    image:
      "https://images.unsplash.com/photo-1611591475880-928646b2b716?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1000&fit=crop&auto=format",
    details: [
      "Architectural satin-finished brass dipped in 18k yellow gold",
      "Ergonomic smooth contoured edge for comfortable fit",
      "Width: 34mm with open back",
      "Gently malleable to fit most wrist sizes",
      "Polished presentation pouch included",
    ],
    sizes: ["Small (15cm)", "Medium (17cm)"],
  },
  "frame-belt": {
    designer: "Maison Riviere Noire",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1000&fit=crop&auto=format",
    details: [
      "Vegetable-tanned full-grain saddle leather",
      "Brushed palladium geometric buckle with quiet clasp",
      "Width: 32mm with beveled and burnished edges",
      "Tonal edge paint and hand-stitched leather keeper",
      "Custom sizing alterations available",
    ],
    sizes: ["75cm", "85cm", "95cm", "105cm"],
  },
  "silk-foulard": {
    designer: "Atelier Port Louis",
    image:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&h=1000&fit=crop&auto=format",
    details: [
      "100% Mulberry silk twill (16 momme)",
      "Graphic monochrome border with subtle tonal signature",
      "Hand-rolled and hand-sewn hem by master artisans",
      "Dimensions: 90cm x 90cm",
      "Dry clean recommended",
    ],
    sizes: ["One Size (90x90cm)"],
  },
  "contrast-scarf": {
    designer: "Atelier Port Louis",
    image:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&h=1000&fit=crop&auto=format",
    details: [
      "100% Mulberry silk twill (16 momme)",
      "Graphic monochrome border with subtle tonal signature",
      "Hand-rolled and hand-sewn hem by master artisans",
      "Dimensions: 90cm x 90cm",
      "Dry clean recommended",
    ],
    sizes: ["One Size (90x90cm)"],
  },
  "line-body-chain": {
    designer: "Le Morne Orfevrerie",
    image:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1000&fit=crop&auto=format",
    details: [
      "14k solid yellow gold fine cable link chain",
      "Fluid dual-layer design resting across collarbone and rib",
      "Dual lobster clasps with 6cm adjustment chains",
      "Water-resistant and sweat-tested finish",
      "Gift-wrapped in signature linen box",
    ],
    sizes: ["Adjustable (XS-M)", "Adjustable (L-XXL)"],
  },
  "trace-anklet": {
    designer: "Le Morne Orfevrerie",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop&auto=format",
    hoverImage:
      "https://images.unsplash.com/photo-1611591475880-928646b2b716?w=800&h=1000&fit=crop&auto=format",
    details: [
      "18k yellow gold vermeil curb link",
      "Centred with a single hand-cut geometric gold bar charm",
      "Length: 22cm with a 4cm extension link",
      "Engineered for subtle glimmer with movement",
      "Safe for ocean water and pool wear",
    ],
    sizes: ["Standard (22-26cm)"],
  },
}

const DEFAULT_EDITORIAL = {
  designer: "Maison Maurice",
  image:
    "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&h=1000&fit=crop&auto=format",
  hoverImage:
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&auto=format",
  details: [
    "Crafted from premium sustainable materials",
    "Hand-finished tailoring",
    "Exclusive limited run",
    "Made in Mauritius",
  ],
  sizes: ["Standard"],
}

export function getEditorial(slug: string) {
  return PRODUCT_EDITORIAL_METADATA[slug] || DEFAULT_EDITORIAL
}

export function formatPriceMUR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-MU", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount)
  return `Rs ${formatted}`
}

export function transformDbProduct(row: DbProductRow): Product {
  const editorial = getEditorial(row.slug)
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category: row.category as ProductCategory || "Clothing",
    audience: row.audience as ProductAudience || "All",
    price: row.price_mur,
    description: row.description,
    image:
      row.image_path && !row.image_path.startsWith("/assets")
        ? row.image_path
        : editorial.image,
    hoverImage:
      row.hover_image_path && !row.hover_image_path.startsWith("/assets")
        ? row.hover_image_path
        : editorial.hoverImage,
    details: editorial.details,
    sizes: editorial.sizes,
    designer: editorial.designer,
    imagePosition: row.image_position || "center",
    isPublished: row.is_published,
    stockQuantity: row.stock_quantity ?? 8,
    inStock:
      row.in_stock ??
      (row.stock_quantity !== undefined ? row.stock_quantity > 0 : true),
  }
}

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "column-dress",
    slug: "column-dress",
    name: "The Column Dress",
    category: "Clothing",
    audience: "Women",
    price: 6900,
    description: "A sculpted evening silhouette with a softly draped finish.",
    image: getEditorial("column-dress").image,
    hoverImage: getEditorial("column-dress").hoverImage,
    details: getEditorial("column-dress").details,
    sizes: getEditorial("column-dress").sizes,
    designer: getEditorial("column-dress").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 6,
    inStock: true,
  },
  {
    id: "linen-shirt",
    slug: "linen-shirt",
    name: "The Linen Shirt",
    category: "Clothing",
    audience: "Men",
    price: 4200,
    description: "An easy, considered layer in a light linen weave.",
    image: getEditorial("linen-shirt").image,
    hoverImage: getEditorial("linen-shirt").hoverImage,
    details: getEditorial("linen-shirt").details,
    sizes: getEditorial("linen-shirt").sizes,
    designer: getEditorial("linen-shirt").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 12,
    inStock: true,
  },
  {
    id: "sculpted-hoops",
    slug: "sculpted-hoops",
    name: "Sculpted Hoops",
    category: "Jewellery",
    audience: "Women",
    price: 2400,
    description: "A polished, weighty hoop with a clean architectural curve.",
    image: getEditorial("sculpted-hoops").image,
    hoverImage: getEditorial("sculpted-hoops").hoverImage,
    details: getEditorial("sculpted-hoops").details,
    sizes: getEditorial("sculpted-hoops").sizes,
    designer: getEditorial("sculpted-hoops").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 4,
    inStock: true,
  },
  {
    id: "arc-cuff",
    slug: "arc-cuff",
    name: "The Arc Cuff",
    category: "Jewellery",
    audience: "All",
    price: 3200,
    description: "A smooth statement cuff designed to sit close to the wrist.",
    image: getEditorial("arc-cuff").image,
    hoverImage: getEditorial("arc-cuff").hoverImage,
    details: getEditorial("arc-cuff").details,
    sizes: getEditorial("arc-cuff").sizes,
    designer: getEditorial("arc-cuff").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 3,
    inStock: true,
  },
  {
    id: "frame-belt",
    slug: "frame-belt",
    name: "The Frame Belt",
    category: "Accessories",
    audience: "All",
    price: 2900,
    description:
      "A structured leather belt finished with a quiet metal buckle.",
    image: getEditorial("frame-belt").image,
    hoverImage: getEditorial("frame-belt").hoverImage,
    details: getEditorial("frame-belt").details,
    sizes: getEditorial("frame-belt").sizes,
    designer: getEditorial("frame-belt").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 7,
    inStock: true,
  },
  {
    id: "silk-foulard",
    slug: "silk-foulard",
    name: "The Silk Foulard",
    category: "Accessories",
    audience: "All",
    price: 1800,
    description:
      "A square of fine silk twill with hand-rolled edges and a subtle graphic line.",
    image: getEditorial("silk-foulard").image,
    hoverImage: getEditorial("silk-foulard").hoverImage,
    details: getEditorial("silk-foulard").details,
    sizes: getEditorial("silk-foulard").sizes,
    designer: getEditorial("silk-foulard").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 10,
    inStock: true,
  },
  {
    id: "line-body-chain",
    slug: "line-body-chain",
    name: "The Line Body Chain",
    category: "Jewellery",
    audience: "Women",
    price: 4800,
    description: "An understated chain with a delicate drape across the body.",
    image: getEditorial("line-body-chain").image,
    hoverImage: getEditorial("line-body-chain").hoverImage,
    details: getEditorial("line-body-chain").details,
    sizes: getEditorial("line-body-chain").sizes,
    designer: getEditorial("line-body-chain").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 2,
    inStock: true,
  },
  {
    id: "trace-anklet",
    slug: "trace-anklet",
    name: "The Trace Anklet",
    category: "Jewellery",
    audience: "Women",
    price: 1900,
    description:
      "A fine, minimalist chain designed to sit lightly at the ankle.",
    image: getEditorial("trace-anklet").image,
    hoverImage: getEditorial("trace-anklet").hoverImage,
    details: getEditorial("trace-anklet").details,
    sizes: getEditorial("trace-anklet").sizes,
    designer: getEditorial("trace-anklet").designer,
    imagePosition: "center",
    isPublished: true,
    stockQuantity: 5,
    inStock: true,
  },
]

const NEON_DB_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_Z6FdwE2OjcUx@ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

export async function fetchProducts(): Promise<{
  products: Product[]
  isLive: boolean
  error?: string
}> {
  try {
    if (!NEON_DB_URL) {
      console.warn(
        "Neon DATABASE_URL is not set. Using curated luxury fallback catalog.",
      )
      return { products: FALLBACK_PRODUCTS, isLive: false }
    }

    const sql = neon(NEON_DB_URL)
    const rows = (await sql.query(
      `SELECT slug, name, category, audience, price_mur, description, image_position, image_path, hover_image_path, is_published, stock_quantity, in_stock, created_at, updated_at
       FROM app.products
       WHERE is_published = true
       ORDER BY created_at ASC`,
    )) as DbProductRow[]

    if (!rows || rows.length === 0) {
      return { products: FALLBACK_PRODUCTS, isLive: false }
    }

    const products = rows.map(transformDbProduct)
    return { products, isLive: true }
  } catch (err: any) {
    console.error("Failed to query Neon PostgreSQL database:", err)
    return {
      products: FALLBACK_PRODUCTS,
      isLive: false,
      error: err?.message || "Database connection error",
    }
  }
}

export async function updateProductImage(
  slug: string,
  imageUrl: string,
  isHover = false,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    if (isHover) {
      await sql`UPDATE app.products SET hover_image_path = ${imageUrl}, updated_at = NOW() WHERE slug = ${slug}`
    } else {
      await sql`UPDATE app.products SET image_path = ${imageUrl}, updated_at = NOW() WHERE slug = ${slug}`
    }
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update image in Neon database:", err)
    return { success: false, error: err?.message || "Database update failed" }
  }
}

export async function fetchAllAdminProducts(): Promise<{
  products: Product[]
  isLive: boolean
  error?: string
}> {
  try {
    const sql = neon(NEON_DB_URL)
    const rows = (await sql.query(
      `SELECT slug, name, category, audience, price_mur, description, image_position, image_path, hover_image_path, is_published, stock_quantity, in_stock, created_at, updated_at
       FROM app.products
       ORDER BY created_at ASC`,
    )) as DbProductRow[]

    if (!rows || rows.length === 0) {
      return { products: FALLBACK_PRODUCTS, isLive: false }
    }

    const products = rows.map(transformDbProduct)
    return { products, isLive: true }
  } catch (err: any) {
    console.error("Failed to fetch admin products:", err)
    return { products: FALLBACK_PRODUCTS, isLive: false, error: err?.message }
  }
}

export async function createProduct(product: {
  slug: string
  name: string
  category: ProductCategory
  audience: ProductAudience
  price_mur: number
  description: string
  image_path: string
  hover_image_path?: string
  is_published?: boolean
  stock_quantity?: number
  in_stock?: boolean
}): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    await sql`
      INSERT INTO app.products (
        slug, name, category, audience, price_mur, description,
        image_position, image_path, hover_image_path, is_published,
        stock_quantity, in_stock, created_at, updated_at
      ) VALUES (
        ${product.slug},
        ${product.name},
        ${product.category},
        ${product.audience},
        ${product.price_mur},
        ${product.description},
        'center',
        ${product.image_path},
        ${product.hover_image_path || null},
        ${product.is_published ?? true},
        ${product.stock_quantity ?? 8},
        ${product.in_stock ?? true},
        NOW(),
        NOW()
      )
    `
    return { success: true }
  } catch (err: any) {
    console.error("Failed to create product in Neon:", err)
    return { success: false, error: err?.message || "Creation failed" }
  }
}

export async function updateProduct(
  slug: string,
  updates: Partial<{
    name: string
    category: ProductCategory
    audience: ProductAudience
    price_mur: number
    description: string
    image_path: string
    hover_image_path: string
    is_published: boolean
    stock_quantity: number
    in_stock: boolean
  }>,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    await sql`
      UPDATE app.products
      SET
        name = COALESCE(${updates.name ?? null}, name),
        category = COALESCE(${updates.category ?? null}, category),
        audience = COALESCE(${updates.audience ?? null}, audience),
        price_mur = COALESCE(${updates.price_mur ?? null}, price_mur),
        description = COALESCE(${updates.description ?? null}, description),
        image_path = COALESCE(${updates.image_path ?? null}, image_path),
        hover_image_path = COALESCE(${updates.hover_image_path ?? null}, hover_image_path),
        is_published = COALESCE(${updates.is_published ?? null}, is_published),
        stock_quantity = COALESCE(${updates.stock_quantity ?? null}, stock_quantity),
        in_stock = COALESCE(${updates.in_stock ?? null}, in_stock),
        updated_at = NOW()
      WHERE slug = ${slug}
    `
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update product:", err)
    return { success: false, error: err?.message || "Update failed" }
  }
}

export async function deleteProduct(
  slug: string,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)
    await sql`DELETE FROM app.products WHERE slug = ${slug}`
    return { success: true }
  } catch (err: any) {
    console.error("Failed to delete product:", err)
    return { success: false, error: err?.message || "Delete failed" }
  }
}
