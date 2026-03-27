// api/src/routes/assets.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'

interface Env {
  DB: D1Database
}

const assets = new Hono<{ Bindings: Env }>()

const CreateAssetSchema = z.object({
  name: z.string().min(1).max(200),
  assetType: z.enum(['car', 'house', 'appliance']),
  description: z.string().max(500).optional(),
})

const UpdateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  assetType: z.enum(['car', 'house', 'appliance']).optional(),
  description: z.string().max(500).optional(),
})

// ============================================================================
// GET ALL ASSETS FOR TENANT
// ============================================================================
assets.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const db = c.env.DB as D1Database

    const result = await db
      .prepare('SELECT * FROM assets WHERE tenant_id = ? ORDER BY created_at DESC')
      .bind(tenantId)
      .all<{
        id: string
        tenant_id: string
        name: string
        asset_type: string
        description?: string
        created_at: string
        updated_at: string
      }>()

    return c.json({
      assets: result.results || [],
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return c.json({ error: 'Failed to fetch assets' }, 500)
  }
})

// ============================================================================
// GET SINGLE ASSET
// ============================================================================
assets.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const assetId = c.req.param('id')
    const db = c.env.DB as D1Database

    const asset = await db
      .prepare('SELECT * FROM assets WHERE id = ? AND tenant_id = ?')
      .bind(assetId, tenantId)
      .first()

    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404)
    }

    return c.json({ asset })
  } catch (error) {
    console.error('Error fetching asset:', error)
    return c.json({ error: 'Failed to fetch asset' }, 500)
  }
})

// ============================================================================
// CREATE ASSET
// ============================================================================
assets.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const body = await c.req.json()
    const validated = CreateAssetSchema.parse(body)

    const db = c.env.DB as D1Database
    const assetId = nanoid()

    await db
      .prepare(
        'INSERT INTO assets (id, tenant_id, name, asset_type, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
      )
      .bind(assetId, tenantId, validated.name, validated.assetType, validated.description || null)
      .run()

    const newAsset = await db
      .prepare('SELECT * FROM assets WHERE id = ?')
      .bind(assetId)
      .first()

    return c.json({ asset: newAsset }, 201)
  } catch (error) {
    console.error('Error creating asset:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create asset' }, 500)
  }
})

// ============================================================================
// UPDATE ASSET
// ============================================================================
assets.put('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const assetId = c.req.param('id')
    const body = await c.req.json()
    const validated = UpdateAssetSchema.parse(body)

    const db = c.env.DB as D1Database

    // Check ownership
    const asset = await db
      .prepare('SELECT id FROM assets WHERE id = ? AND tenant_id = ?')
      .bind(assetId, tenantId)
      .first()

    if (!asset) {
      return c.json({ error: 'Asset not found or unauthorized' }, 404)
    }

    // Build dynamic update
    const updates: string[] = []
    const values: any[] = []

    if (validated.name !== undefined) {
      updates.push('name = ?')
      values.push(validated.name)
    }
    if (validated.assetType !== undefined) {
      updates.push('asset_type = ?')
      values.push(validated.assetType)
    }
    if (validated.description !== undefined) {
      updates.push('description = ?')
      values.push(validated.description)
    }

    updates.push('updated_at = datetime("now")')

    const updateSQL = `UPDATE assets SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
    values.push(assetId, tenantId)

    await db.prepare(updateSQL).bind(...values).run()

    const updatedAsset = await db
      .prepare('SELECT * FROM assets WHERE id = ?')
      .bind(assetId)
      .first()

    return c.json({ asset: updatedAsset })
  } catch (error) {
    console.error('Error updating asset:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to update asset' }, 500)
  }
})

// ============================================================================
// DELETE ASSET
// ============================================================================
assets.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const assetId = c.req.param('id')
    const db = c.env.DB as D1Database

    // Check ownership
    const asset = await db
      .prepare('SELECT id FROM assets WHERE id = ? AND tenant_id = ?')
      .bind(assetId, tenantId)
      .first()

    if (!asset) {
      return c.json({ error: 'Asset not found or unauthorized' }, 404)
    }

    await db.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run()

    return c.json({ success: true, message: 'Asset deleted' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return c.json({ error: 'Failed to delete asset' }, 500)
  }
})

export default assets
