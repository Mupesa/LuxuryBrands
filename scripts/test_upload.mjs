import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Load .env.local
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

const s3 = new S3Client({
  region: env.AWS_REGION || 'us-east-2',
  endpoint: env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function main() {
  const testKey = 'test/hello.txt';
  console.log('Uploading test object to luxury-brands...');
  await s3.send(
    new PutObjectCommand({
      Bucket: 'luxury-brands',
      Key: testKey,
      Body: 'Hello from Noir & Lumière Luxury Shop!',
      ContentType: 'text/plain',
    })
  );
  console.log('Upload successful!');

  const publicUrl = `${env.AWS_ENDPOINT_URL_S3}/luxury-brands/${testKey}`;
  console.log('Testing public access on URL:', publicUrl);

  const res = await fetch(publicUrl);
  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response text:', text);
}

main().catch(console.error);
