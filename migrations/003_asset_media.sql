-- migrations/003_asset_media.sql

-- Table to link R2 media keys to assets
CREATE TABLE IF NOT EXISTS asset_media (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Index for quick lookup of media for an asset
CREATE INDEX IF NOT EXISTS idx_asset_media_asset_id ON asset_media(asset_id);
