-- Real-Time Chat System Database Schema
-- Adds WebRTC/WebSocket-based messaging infrastructure

-- Create chat_rooms table for organizing conversations
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type TEXT NOT NULL CHECK (room_type IN ('order_delivery', 'customer_support', 'admin_broadcast', 'emergency')),
  room_name TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  participant_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Additional room-specific data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_participants table for room memberships
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table for message storage
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system', 'typing_indicator')),
  content TEXT,
  metadata JSONB DEFAULT '{}', -- File info, location data, etc.
  reply_to_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  read_by UUID[] DEFAULT '{}', -- Array of user IDs who have read the message
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_typing_indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.chat_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 seconds'),
  UNIQUE(room_id, user_id)
);

-- Create push_notification_tokens table for device push notifications
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL, -- Unique device identifier
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'desktop')),
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Create chat_file_attachments table for file storage metadata
CREATE TABLE IF NOT EXISTS public.chat_file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  checksum TEXT, -- SHA256 hash for integrity
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  is_image BOOLEAN NOT NULL DEFAULT false,
  image_width INTEGER,
  image_height INTEGER,
  thumbnail_path TEXT,
  expires_at TIMESTAMP WITH TIME ZONE, -- For temporary files
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_order_id ON public.chat_rooms(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON public.chat_rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON public.chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_typing_room ON public.chat_typing_indicators(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires ON public.chat_typing_indicators(expires_at);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_notification_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_file_attachments_message ON public.chat_file_attachments(message_id);

-- Enable RLS

-- Chat rooms: Users can see rooms they participate in
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they participate in"
ON public.chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_rooms.id AND user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
CREATE POLICY "Users can create rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Room owners/admins can update rooms" ON public.chat_rooms;
CREATE POLICY "Room owners/admins can update rooms"
ON public.chat_rooms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_rooms.id AND user_id = auth.uid()
      AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- Chat participants: Users manage their own participation
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants in their rooms"
ON public.chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid() AND cp.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can manage their own participation" ON public.chat_participants;
CREATE POLICY "Users can manage their own participation"
ON public.chat_participants FOR ALL
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Room admins can manage participants" ON public.chat_participants;
CREATE POLICY "Room admins can manage participants"
ON public.chat_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
      AND cp.role IN ('owner', 'admin') AND cp.is_active = true
  )
);

-- Chat messages: Users can see messages in rooms they participate in
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;
CREATE POLICY "Users can edit their own messages"
ON public.chat_messages FOR UPDATE
USING (sender_id = auth.uid() AND is_deleted = false);

-- Typing indicators: Users can manage their own indicators
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.chat_typing_indicators;
CREATE POLICY "Users can manage their own typing indicators"
ON public.chat_typing_indicators FOR ALL
USING (user_id = auth.uid());

-- Push notification tokens: Users manage their own tokens
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_notification_tokens;
CREATE POLICY "Users can manage their own push tokens"
ON public.push_notification_tokens FOR ALL
USING (user_id = auth.uid());

-- File attachments: Users can see attachments in their rooms
ALTER TABLE public.chat_file_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view attachments in their rooms" ON public.chat_file_attachments;
CREATE POLICY "Users can view attachments in their rooms"
ON public.chat_file_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.chat_participants cp ON cm.room_id = cp.room_id
    WHERE cm.id = chat_file_attachments.message_id AND cp.user_id = auth.uid() AND cp.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can upload attachments to their rooms" ON public.chat_file_attachments;
CREATE POLICY "Users can upload attachments to their rooms"
ON public.chat_file_attachments FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.chat_participants cp ON cm.room_id = cp.room_id
    WHERE cm.id = chat_file_attachments.message_id AND cp.user_id = auth.uid() AND cp.is_active = true
  )
);

-- Create function to create an order delivery chat room
CREATE OR REPLACE FUNCTION public.create_order_delivery_room(
  p_order_id UUID,
  p_delivery_partner_id UUID,
  p_customer_id UUID
) RETURNS UUID AS $$
DECLARE
  room_uuid UUID;
  room_name TEXT;
BEGIN
  -- Get order details for room name
  SELECT CONCAT('Order #', id::text) INTO room_name
  FROM public.orders WHERE id = p_order_id;

  -- Create chat room
  INSERT INTO public.chat_rooms (
    room_type,
    room_name,
    order_id,
    created_by,
    metadata
  ) VALUES (
    'order_delivery',
    room_name,
    p_order_id,
    p_customer_id,
    jsonb_build_object('order_id', p_order_id)
  ) RETURNING id INTO room_uuid;

  -- Add participants
  INSERT INTO public.chat_participants (room_id, user_id, role) VALUES
    (room_uuid, p_customer_id, 'owner'),
    (room_uuid, p_delivery_partner_id, 'member');

  -- Add any available admins for monitoring
  INSERT INTO public.chat_participants (room_id, user_id, role)
  SELECT room_uuid, user_id, 'admin'::text
  FROM public.profiles
  WHERE role = 'admin' AND user_id != p_customer_id AND user_id != p_delivery_partner_id;

  -- Update participant count
  UPDATE public.chat_rooms
  SET participant_count = (
    SELECT COUNT(*) FROM public.chat_participants WHERE room_id = room_uuid AND is_active = true
  )
  WHERE id = room_uuid;

  RETURN room_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send chat message
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_room_id UUID,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_reply_to UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  message_uuid UUID;
BEGIN
  -- Verify user is participant in room
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = p_room_id AND user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this chat room';
  END IF;

  -- Insert message
  INSERT INTO public.chat_messages (
    room_id,
    sender_id,
    message_type,
    content,
    metadata,
    reply_to_message_id
  ) VALUES (
    p_room_id,
    auth.uid(),
    p_message_type,
    p_content,
    p_metadata,
    p_reply_to
  ) RETURNING id INTO message_uuid;

  -- Update room's last message timestamp
  UPDATE public.chat_rooms
  SET last_message_at = now(),
      updated_at = now()
  WHERE id = p_room_id;

  -- Clean up expired typing indicators
  DELETE FROM public.chat_typing_indicators WHERE expires_at < now();

  RETURN message_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_room_id UUID,
  p_message_ids UUID[]
) RETURNS VOID AS $$
BEGIN
  -- Update read_by arrays for the specified messages
  UPDATE public.chat_messages
  SET read_by = array_append(read_by, auth.uid()::text)
  WHERE id = ANY(p_message_ids)
    AND room_id = p_room_id
    AND NOT (auth.uid()::text = ANY(read_by))
    AND delivered_at IS NOT NULL;

  -- Update participant's last seen timestamp
  UPDATE public.chat_participants
  SET last_seen_at = now()
  WHERE room_id = p_room_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count for user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.chat_messages cm
    JOIN public.chat_participants cp ON cm.room_id = cp.room_id
    WHERE cp.user_id = COALESCE(p_user_id, auth.uid())
      AND cp.is_active = true
      AND cm.sender_id != cp.user_id
      AND cm.delivered_at IS NOT NULL
      AND cm.is_deleted = false
      AND NOT (cp.user_id::text = ANY(cm.read_by))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle typing indicators
CREATE OR REPLACE FUNCTION public.update_typing_indicator(
  p_room_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID AS $$
BEGIN
  IF p_is_typing THEN
    INSERT INTO public.chat_typing_indicators (room_id, user_id)
    VALUES (p_room_id, auth.uid())
    ON CONFLICT (room_id, user_id) DO UPDATE SET
      started_at = now(),
      expires_at = now() + INTERVAL '10 seconds';
  ELSE
    DELETE FROM public.chat_typing_indicators
    WHERE room_id = p_room_id AND user_id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_order_delivery_room(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_chat_message(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_typing_indicator(UUID, BOOLEAN) TO authenticated;
