import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Message {
  id: string;
  content: string;
  sender_brand_id: string;
  created_at: string;
  sender_brand: {
    brand_name: string;
    industry: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  connection_id: string;
  last_message_at: string;
  connection: {
    requester_brand: {
      id: string;
      brand_name: string;
      industry: string;
    };
    requested_brand: {
      id: string;
      brand_name: string;
      industry: string;
    };
  };
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userBrands, setUserBrands] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!connectionId) {
      navigate('/connections');
      return;
    }
    fetchData();
  }, [user, navigate, connectionId]);

  // Real-time message subscription
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      // Fetch user's brands
      const { data: brands, error: brandsError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user?.id);

      if (brandsError) throw brandsError;
      setUserBrands(brands || []);

      // Fetch or create conversation for this connection
      let conversationData = await getOrCreateConversation();
      if (!conversationData) return;

      setConversation(conversationData);

      // Fetch messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_brand:brand_profiles!sender_brand_id(brand_name, industry)
        `)
        .eq('conversation_id', conversationData.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching chat data:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateConversation = async () => {
    // First check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        connection:brand_connections!connection_id(
          requester_brand:brand_profiles!requester_brand_id(id, brand_name, industry),
          requested_brand:brand_profiles!requested_brand_id(id, brand_name, industry)
        )
      `)
      .eq('connection_id', connectionId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation if it doesn't exist
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        connection_id: connectionId,
        title: null // Will be auto-generated based on brand names
      })
      .select(`
        *,
        connection:brand_connections!connection_id(
          requester_brand:brand_profiles!requester_brand_id(id, brand_name, industry),
          requested_brand:brand_profiles!requested_brand_id(id, brand_name, industry)
        )
      `)
      .single();

    if (createError) throw createError;
    return newConversation;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !userBrands.length) return;

    setSending(true);
    try {
      const senderBrandId = userBrands[0].id; // Use first brand for now

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_brand_id: senderBrandId,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherBrand = () => {
    if (!conversation || !userBrands.length) return null;
    
    const userBrandIds = userBrands.map(b => b.id);
    const { requester_brand, requested_brand } = conversation.connection;
    
    return userBrandIds.includes(requester_brand.id) 
      ? requested_brand 
      : requester_brand;
  };

  const isMyMessage = (message: Message) => {
    const userBrandIds = userBrands.map(b => b.id);
    return userBrandIds.includes(message.sender_brand_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Conversation Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The conversation you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/connections')}>
              Back to Connections
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const otherBrand = getOtherBrand();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Chat Header */}
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/connections')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              {otherBrand && (
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {otherBrand.brand_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{otherBrand.brand_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{otherBrand.industry}</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="flex flex-col h-[600px]">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = isMyMessage(message);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMine
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;