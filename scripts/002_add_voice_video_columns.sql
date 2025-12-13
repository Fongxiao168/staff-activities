-- Add new columns for voice and video call activities
-- These are inserted between the existing activities:
-- 16. Today Send voice
-- 17. Today Voice Call
-- 18. Today Video Call

ALTER TABLE daily_records
ADD COLUMN IF NOT EXISTS today_send_voice INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS today_voice_call INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS today_video_call INTEGER DEFAULT 0;
