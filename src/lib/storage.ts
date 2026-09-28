/**
 * Neon Object Storage Helper
 * Bucket: luxury-brands (private)
 * Endpoint: AWS_ENDPOINT_URL_S3
 */

export interface StorageConfig {
  bucket: string
  endpoint?: string
  region?: string
}

export const STORAGE_CONFIG: StorageConfig = {
  bucket: "luxury-brands",
  endpoint:
    import.meta.env.VITE_AWS_ENDPOINT_URL_S3 ||
    "https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech",
  region: import.meta.env.VITE_AWS_REGION || "us-east-2",
}

/**
 * Resolves a storage asset path to a public or presigned preview URL.
 */
export function resolveStorageUrl(path: string): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${STORAGE_CONFIG.endpoint}/${STORAGE_CONFIG.bucket}/${cleanPath}`
}
