-- Communication & Collaboration System Tables

-- Brand Connections table to manage relationships between brands
CREATE TABLE public.brand_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  requested_brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  intro_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_brand_id, requested_brand_id)
);

-- Enable RLS on brand_connections
ALTER TABLE public.brand_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_connections
CREATE POLICY "Users can view connections for their brands" 
ON public.brand_connections 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE (id = requester_brand_id OR id = requested_brand_id) 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create connections for their brands" 
ON public.brand_connections 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE id = requester_brand_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update connections for their brands" 
ON public.brand_connections 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE (id = requester_brand_id OR id = requested_brand_id) 
    AND user_id = auth.uid()
  )
);

-- Conversations table for chat channels between connected brands
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.brand_connections(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations for their connections" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM brand_connections bc
    JOIN brand_profiles bp ON (bp.id = bc.requester_brand_id OR bp.id = bc.requested_brand_id)
    WHERE bc.id = connection_id 
    AND bp.user_id = auth.uid()
    AND bc.status = 'accepted'
  )
);

CREATE POLICY "Users can create conversations for their connections" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_connections bc
    JOIN brand_profiles bp ON (bp.id = bc.requester_brand_id OR bp.id = bc.requested_brand_id)
    WHERE bc.id = connection_id 
    AND bp.user_id = auth.uid()
    AND bc.status = 'accepted'
  )
);

-- Messages table for individual messages within conversations
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN brand_connections bc ON bc.id = c.connection_id
    JOIN brand_profiles bp ON (bp.id = bc.requester_brand_id OR bp.id = bc.requested_brand_id)
    WHERE c.id = conversation_id 
    AND bp.user_id = auth.uid()
    AND bc.status = 'accepted'
  )
);

CREATE POLICY "Users can create messages for their brands" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE id = sender_brand_id 
    AND user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN brand_connections bc ON bc.id = c.connection_id
    JOIN brand_profiles bp ON (bp.id = bc.requester_brand_id OR bp.id = bc.requested_brand_id)
    WHERE c.id = conversation_id 
    AND bp.user_id = auth.uid()
    AND bc.status = 'accepted'
  )
);

-- Collaboration Campaigns table for GPT-generated campaign ideas
CREATE TABLE public.collaboration_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.brand_connections(id) ON DELETE CASCADE,
  creator_brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  campaign_data JSONB, -- Stores GPT-generated campaign details
  collaboration_type TEXT, -- e.g., 'co-marketing', 'product-collab', 'event'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'accepted', 'rejected', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaboration_campaigns
ALTER TABLE public.collaboration_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaboration_campaigns
CREATE POLICY "Users can view campaigns for their connections" 
ON public.collaboration_campaigns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM brand_connections bc
    JOIN brand_profiles bp ON (bp.id = bc.requester_brand_id OR bp.id = bc.requested_brand_id)
    WHERE bc.id = connection_id 
    AND bp.user_id = auth.uid()
    AND bc.status = 'accepted'
  )
);

CREATE POLICY "Users can create campaigns for their brands" 
ON public.collaboration_campaigns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE id = creator_brand_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update campaigns they created" 
ON public.collaboration_campaigns 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM brand_profiles 
    WHERE id = creator_brand_id 
    AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_brand_connections_requester ON public.brand_connections(requester_brand_id);
CREATE INDEX idx_brand_connections_requested ON public.brand_connections(requested_brand_id);
CREATE INDEX idx_brand_connections_status ON public.brand_connections(status);
CREATE INDEX idx_conversations_connection ON public.conversations(connection_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_brand_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_campaigns_connection ON public.collaboration_campaigns(connection_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_brand_connections_updated_at
BEFORE UPDATE ON public.brand_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.collaboration_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation last_message_at when new message is added
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Enable realtime for real-time messaging
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.brand_connections REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_connections;