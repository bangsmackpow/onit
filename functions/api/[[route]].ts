import { handle } from 'hono/cloudflare-pages'
import app from './server/index'

// Direct health check for troubleshooting
app.get('/api/functions-debug', (c) => c.text('Functions are ACTIVE at [[route]].ts'))

export const onRequest = handle(app)
