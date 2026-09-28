import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';

// 1. Read .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
}

const BUCKET = 'luxury-brands';
const ENDPOINT = env.AWS_ENDPOINT_URL_S3 || 'https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech';
const REGION = env.AWS_REGION || 'us-east-2';
const DB_URL = env.DATABASE_URL;

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const sql = neon(DB_URL);

function getContentType(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Upload an image buffer to the bucket and update the database row.
 */
export async function uploadAndLinkProductImage({ slug, buffer, ext = '.jpg', isHover = false }) {
  const suffix = isHover ? '-hover' : '';
  const key = `products/${slug}${suffix}${ext}`;
  const contentType = getContentType(ext);

  console.log(`[Neon Storage] Uploading ${key} (${buffer.length} bytes)...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const publicUrl = `${ENDPOINT}/${BUCKET}/${key}`;
  console.log(`[Neon Storage] Saved to: ${publicUrl}`);

  console.log(`[Neon Database] Updating app.products (${slug}) in Lakebase Postgres...`);
  if (isHover) {
    await sql`UPDATE app.products SET hover_image_path = ${publicUrl}, updated_at = NOW() WHERE slug = ${slug}`;
  } else {
    await sql`UPDATE app.products SET image_path = ${publicUrl}, updated_at = NOW() WHERE slug = ${slug}`;
  }

  console.log(`[Neon Database] Successfully updated ${isHover ? 'hover_image_path' : 'image_path'}!`);
  return publicUrl;
}

/**
 * Upload an image from a URL or local file path.
 */
export async function processImageSource({ slug, source, isHover = false }) {
  let buffer;
  let ext = '.jpg';

  if (source.startsWith('http://') || source.startsWith('https://')) {
    console.log(`Fetching remote image for ${slug} from ${source}...`);
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('png')) ext = '.png';
    else if (ct.includes('webp')) ext = '.webp';
    const arrayBuf = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
  } else {
    const resolvedPath = path.resolve(source);
    ext = path.extname(resolvedPath) || '.jpg';
    buffer = fs.readFileSync(resolvedPath);
  }

  return await uploadAndLinkProductImage({ slug, buffer, ext, isHover });
}

// ─── Preset Catalog Images to Seed ───────────────────────────────────────────

const SEED_CATALOG = [
  {
    slug: 'column-dress',
    primary: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'linen-shirt',
    primary: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'sculpted-hoops',
    primary: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'arc-cuff',
    primary: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'frame-belt',
    primary: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'contrast-scarf',
    primary: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'line-body-chain',
    primary: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&h=1100&fit=crop&auto=format',
  },
  {
    slug: 'trace-anklet',
    primary: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&h=1100&fit=crop&auto=format',
    hover: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&h=1100&fit=crop&auto=format',
  },
];

async function seedAll() {
  console.log(`Starting batch upload of ${SEED_CATALOG.length} luxury products into Neon Storage...`);
  for (const item of SEED_CATALOG) {
    console.log(`\n=== Processing: ${item.slug} ===`);
    await processImageSource({ slug: item.slug, source: item.primary, isHover: false });
    await processImageSource({ slug: item.slug, source: item.hover, isHover: true });
  }
  console.log('\nAll products successfully uploaded to Neon Object Storage and synced to database!');
}

// ─── CLI Entrypoint ─────────────────────────────────────────────────────────

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes('--seed-all')) {
    await seedAll();
    return;
  }

  const slugIdx = args.indexOf('--slug');
  const fileIdx = args.indexOf('--file');
  const isHover = args.includes('--hover');

  if (slugIdx !== -1 && fileIdx !== -1) {
    const slug = args[slugIdx + 1];
    const source = args[fileIdx + 1];
    await processImageSource({ slug, source, isHover });
    return;
  }

  console.log(`
Usage:
  node scripts/upload-product-image.mjs --seed-all
  node scripts/upload-product-image.mjs --slug <slug> --file <local_path_or_url> [--hover]
  `);
}

cli().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
