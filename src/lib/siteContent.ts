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

export interface SiteContentItem {
  key: string
  section: string
  title: string
  subtitle: string | null
  body_text: string | null
  image_url: string | null
  cta_text: string | null
  cta_link: string | null
  metadata?: any
  updated_at?: string
}

export const DEFAULT_SITE_CONTENT: Record<string, SiteContentItem> = {
  hero: {
    key: "hero",
    section: "hero",
    title: "The Weight of Silence",
    subtitle: "Mauritius Atelier · Collection 2026",
    body_text: null,
    image_url:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&h=900&fit=crop&auto=format",
    cta_text: "Explore Collection",
    cta_link: "collection",
  },
  editorial_draped: {
    key: "editorial_draped",
    section: "editorial",
    title: "Draped Silk & Sculpted Gold",
    subtitle: "Atelier Creations",
    body_text: null,
    image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=900&fit=crop&auto=format",
    cta_text: "Shop Curated Pieces",
    cta_link: "collection",
  },
  editorial_evening: {
    key: "editorial_evening",
    section: "editorial",
    title: "The Arc & Hoops",
    subtitle: "Jewellery & Adornment",
    body_text:
      "Founded in Mauritius. Every garment and jewellery silhouette is designed with architectural precision and timeless material permanence.",
    image_url:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop&auto=format",
    cta_text: null,
    cta_link: null,
    metadata: {
      quote: '"We craft pieces for individuals who embrace quiet discernment."',
      motto: "The Maison",
    },
  },
  announcements: {
    key: "announcements",
    section: "announcement",
    title: "Store Service Promises",
    subtitle: null,
    body_text: null,
    image_url: null,
    cta_text: null,
    cta_link: null,
    metadata: {
      deliveryTitle: "Island-Wide Delivery",
      deliveryDesc:
        "Complimentary delivery across Mauritius on orders over Rs 5,000",
      fittingTitle: "Atelier Fittings",
      fittingDesc: "Private salon appointments in Port Louis & Grand Baie",
      tailoringTitle: "Bespoke Alterations",
      tailoringDesc:
        "Complimentary hand adjustments included with all tailoring",
    },
  },
}

/**
 * Fetches all dynamic site content elements from Neon PostgreSQL.
 */
export async function fetchSiteContent(): Promise<Record<string, SiteContentItem>> {
  try {
    const sql = neon(NEON_DB_URL)
    const rows = (await sql.query(
      `SELECT key, section, title, subtitle, body_text, image_url, cta_text, cta_link, metadata, updated_at
       FROM app.site_content`,
    )) as SiteContentItem[]

    if (!rows || rows.length === 0) {
      return DEFAULT_SITE_CONTENT
    }

    const contentMap = { ...DEFAULT_SITE_CONTENT }
    for (const row of rows) {
      contentMap[row.key] = {
        ...DEFAULT_SITE_CONTENT[row.key],
        ...row,
        metadata:
          typeof row.metadata === "string"
            ? JSON.parse(row.metadata)
            : row.metadata || DEFAULT_SITE_CONTENT[row.key]?.metadata,
      }
    }
    return contentMap
  } catch (err) {
    console.error(
      "Failed to query site content from Neon, using default luxury assets:",
      err,
    )
    return DEFAULT_SITE_CONTENT
  }
}

/**
 * Updates a specific site content block in Neon PostgreSQL.
 */
export async function updateSiteContent(
  key: string,
  updates: Partial<SiteContentItem>,
): Promise<{ success: boolean error?: string }> {
  try {
    const sql = neon(NEON_DB_URL)

    await sql`
      INSERT INTO app.site_content (
        key, section, title, subtitle, body_text, image_url, cta_text, cta_link, metadata, updated_at
      ) VALUES (
        ${key},
        ${updates.section || "general"},
        ${updates.title ?? null},
        ${updates.subtitle ?? null},
        ${updates.body_text ?? null},
        ${updates.image_url ?? null},
        ${updates.cta_text ?? null},
        ${updates.cta_link ?? null},
        ${updates.metadata ? JSON.stringify(updates.metadata) : null},
        NOW()
      )
      ON CONFLICT (key) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, app.site_content.title),
        subtitle = COALESCE(EXCLUDED.subtitle, app.site_content.subtitle),
        body_text = COALESCE(EXCLUDED.body_text, app.site_content.body_text),
        image_url = COALESCE(EXCLUDED.image_url, app.site_content.image_url),
        cta_text = COALESCE(EXCLUDED.cta_text, app.site_content.cta_text),
        cta_link = COALESCE(EXCLUDED.cta_link, app.site_content.cta_link),
        metadata = COALESCE(EXCLUDED.metadata, app.site_content.metadata),
        updated_at = NOW()
    `
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update site content in Neon:", err)
    return { success: false, error: err?.message || "Content update failed" }
  }
}

/**
 * Uploads an image asset (product image, campaign hero, editorial banner) to Neon Object Storage.
 */
export async function uploadSiteAsset(
  file: File,
  folder: "products" | "site-content" | "hero" = "site-content",
): Promise<{ url: string path: string }> {
  const extension = file.name.split(".").pop() || "jpg"
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
  const key = `${folder}/${cleanName}-${Date.now()}.${extension}`

  // 1. Try server endpoint
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
        filename: `${cleanName}-${Date.now()}.${extension}`,
        folder,
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
      "Server upload endpoint error, falling back to direct S3 client:",
      err,
    )
  }

  // 2. Direct S3 client fallback
  const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID
  const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY

  if (!accessKey || !secretKey) {
    const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${key}`
    return { path: key, url: publicUrl }
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
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || "image/jpeg",
    }),
  )

  const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${key}`
  return { path: key, url: publicUrl }
}
