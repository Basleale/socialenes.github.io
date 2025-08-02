-- Create public_messages table
CREATE TABLE IF NOT EXISTS public_messages (
  id SERIAL PRIMARY KEY,
  content TEXT,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(10) NOT NULL DEFAULT 'text',
  voice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create private_messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id SERIAL PRIMARY KEY,
  content TEXT,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  recipient_id VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(10) NOT NULL DEFAULT 'text',
  voice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_messages_created_at ON public_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_users ON private_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);

-- Create comments table for media
CREATE TABLE IF NOT EXISTS media_comments (
  id SERIAL PRIMARY KEY,
  media_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table for media
CREATE TABLE IF NOT EXISTS media_likes (
  id SERIAL PRIMARY KEY,
  media_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

-- Create indexes for media interactions
CREATE INDEX IF NOT EXISTS idx_media_comments_media_id ON media_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
