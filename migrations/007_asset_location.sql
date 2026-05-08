-- migrations/007_asset_location.sql

-- Add city/location context to assets for better identification
ALTER TABLE assets ADD COLUMN city TEXT;

-- Index for search performance
CREATE INDEX idx_assets_city ON assets(city);
