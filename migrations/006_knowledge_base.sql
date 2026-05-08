-- migrations/006_knowledge_base.sql

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'hvac', 'safety', 'lawn', 'vehicle', etc.
  content_md TEXT NOT NULL,
  related_task_keywords TEXT, -- comma separated keywords like 'filter,ac,hvac'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_keywords ON knowledge_articles(related_task_keywords);
