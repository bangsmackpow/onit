// api/src/routes/media.ts
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { Env, Variables } from '../types'

const media = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// UPLOAD MEDIA
// ============================================================================
media.post('/upload', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const body = await c.req.parseBody()
    const file = body['file'] as File
    const assetId = body['assetId'] as string

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    if (!assetId) {
      return c.json({ error: 'assetId is required' }, 400)
    }

    const fileId = nanoid()
    const extension = file.name.split('.').pop()
    const key = `${tenantId}/${fileId}.${extension}`

    // 1. Upload to R2
    await c.env.MEDIA.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        tenantId: tenantId,
        assetId: assetId,
      }
    })

    // 2. Log in D1
    await c.env.DB
      .prepare(
        'INSERT INTO asset_media (id, asset_id, tenant_id, file_key, file_name, file_type) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(fileId, assetId, tenantId, key, file.name, file.type)
      .run()

    return c.json({ 
      success: true, 
      file: {
        id: fileId,
        key: key,
        url: `/api/media/view/${key}`
      }
    }, 201)
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Failed to upload file' }, 500)
  }
})

// ============================================================================
// VIEW MEDIA (Authenticated Proxy)
// ============================================================================
media.get('/view/:tenantId/:filename', async (c) => {
  try {
    const authTenantId = c.get('tenantId')
    const reqTenantId = c.req.param('tenantId')
    const filename = c.req.param('filename')

    // Security: Only allow access to tenant's own files
    if (authTenantId !== reqTenantId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const key = `${reqTenantId}/${filename}`
    const object = await c.env.MEDIA.get(key)

    if (!object) {
      return c.json({ error: 'File not found' }, 404)
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)

    return new Response(object.body, {
      headers,
    })
  } catch (error) {
    console.error('Download error:', error)
    return c.json({ error: 'Failed to retrieve file' }, 500)
  }
})

// ============================================================================
// LIST MEDIA FOR ASSET
// ============================================================================
media.get('/asset/:assetId', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const assetId = c.req.param('assetId')
    const db = c.env.DB

    const result = await db
      .prepare('SELECT * FROM asset_media WHERE asset_id = ? AND tenant_id = ? ORDER BY created_at DESC')
      .bind(assetId, tenantId)
      .all()

    const mediaList = (result.results || []).map((m: any) => ({
      ...m,
      url: `/api/media/view/${m.file_key}`
    }))

    return c.json({ media: mediaList })
  } catch (error) {
    console.error('List media error:', error)
    return c.json({ error: 'Failed to list media' }, 500)
  }
})

export default media
