-- Create the media table to store metadata
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  extension VARCHAR(10) NOT NULL,
  blob_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by VARCHAR(100) NOT NULL DEFAULT 'Current User',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on uploaded_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media(uploaded_at DESC);

-- Create an index on tags for faster tag-based queries
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN(tags);

-- Create an index on type for filtering by media type
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
