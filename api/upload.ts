import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const {
      fileData,
      filename,
      folder = "uploads",
      contentType = "image/jpeg",
    } = req.body || {}

    if (!fileData || !filename) {
      return res.status(400).json({ error: "Missing fileData or filename" })
    }

    const base64Index = fileData.indexOf(";base64,")
    const base64String =
      base64Index !== -1 ? fileData.slice(base64Index + 8) : fileData
    const buffer = Buffer.from(base64String, "base64")

    const s3Endpoint =
      process.env.AWS_ENDPOINT_URL_S3 ||
      "https://br-floral-fire-ay44fv5z.storage.c-5.us-east-2.aws.neon.tech"
    const region = process.env.AWS_REGION || "us-east-2"
    const bucketName = "luxury-brands"
    const key = `${folder}/${filename}`

    const s3 = new S3Client({
      region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    })

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    const publicUrl = `${s3Endpoint}/${bucketName}/${key}`

    return res.status(200).json({ success: true, key, url: publicUrl })
  } catch (err: any) {
    console.error("[API Upload Error]:", err)
    return res.status(500).json({ error: err?.message || "Upload failed" })
  }
}
