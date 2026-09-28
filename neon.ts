import { defineConfig } from "@neon/config/v1"

export default defineConfig({
  preview: {
    buckets: {
      "luxury-brands": { access: "public_read" },
    },
  },
})
