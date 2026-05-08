// frontend/src/server/routes/knowledge.ts
import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { nanoid } from 'nanoid'

const knowledge = new Hono<{ Bindings: Env, Variables: Variables }>()

// Fetch all articles (optionally filter by category)
knowledge.get('/', async (c) => {
  const db = c.env.DB
  const category = c.req.query('category')
  
  try {
    let query = 'SELECT id, title, category, related_task_keywords FROM knowledge_articles'
    const params: any[] = []
    
    if (category) {
      query += ' WHERE category = ?'
      params.push(category)
    }
    
    const articles = await db.prepare(query).bind(...params).all()
    return c.json({ articles: articles.results || [] })
  } catch (error) {
    console.error('Fetch articles error:', error)
    return c.json({ error: 'Failed to fetch articles' }, 500)
  }
})

// Search for articles by keyword (used for task linking)
knowledge.get('/search', async (c) => {
  const db = c.env.DB
  const q = c.req.query('q')?.toLowerCase() || ''
  
  try {
    const articles = await db.prepare(`
      SELECT * FROM knowledge_articles 
      WHERE LOWER(title) LIKE ? 
      OR LOWER(related_task_keywords) LIKE ?
    `).bind(`%${q}%`, `%${q}%`).all()
    
    return c.json({ articles: articles.results || [] })
  } catch (error) {
    console.error('Search articles error:', error)
    return c.json({ error: 'Failed to search articles' }, 500)
  }
})

// Fetch single article
knowledge.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  
  try {
    const article = await db.prepare('SELECT * FROM knowledge_articles WHERE id = ?')
      .bind(id)
      .first()
      
    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }
    
    return c.json({ article })
  } catch (error) {
    console.error('Fetch article error:', error)
    return c.json({ error: 'Failed to fetch article' }, 500)
  }
})

export default knowledge
