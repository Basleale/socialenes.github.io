-- Create media_likes table
CREATE TABLE IF NOT EXISTS media_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

-- Create media_comments table
CREATE TABLE IF NOT EXISTS media_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_media_id ON media_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_user_id ON media_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_created_at ON media_comments(created_at);
