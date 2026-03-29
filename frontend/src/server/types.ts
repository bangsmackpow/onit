// api/src/types.ts
export interface Env {
  DB: D1Database
  JWT_SECRET: string
  MEDIA: R2Bucket
  SMTP2GO_API_KEY: string
  SMTP_FROM_EMAIL: string
}

export interface Variables {
  userId: string
  tenantId: string
  email: string
}
