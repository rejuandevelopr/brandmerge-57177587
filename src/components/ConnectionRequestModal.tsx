import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBrand: {
    id: string;
    brand_name: string;
    industry: string;
    mission_statement: string;
  };
  currentBrandId: string;
}

const ConnectionRequestModal = ({ 
  isOpen, 
  onClose, 
  targetBrand, 
  currentBrandId 
}: ConnectionRequestModalProps) => {
  const [introMessage, setIntroMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const { toast } = useToast();

  const generateIntroMessage = async () => {
    setIsGeneratingMessage(true);
    try {
      // Generate a personalized intro message using GPT
      const { data, error } = await supabase.functions.invoke('generate-intro-message', {
        body: {
          targetBrand: targetBrand,
          currentBrandId: currentBrandId
        }
      });

      if (error) throw error;

      setIntroMessage(data.message);
      toast({
        title: "Message Generated",
        description: "A personalized intro message has been created for you!",
      });
    } catch (error) {
      console.error('Error generating intro message:', error);
      // Fallback to template message
      const fallbackMessage = `Hi ${targetBrand.brand_name} team!

I discovered your brand through our platform and I'm really impressed by your mission: "${targetBrand.mission_statement}"

I believe there could be great synergy between our brands. I'd love to explore potential collaboration opportunities that could benefit both of us.

Looking forward to connecting!`;
      
      setIntroMessage(fallbackMessage);
      toast({
        title: "Template Message Ready",
        description: "A template message has been prepared. Feel free to customize it!",
      });
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const sendConnectionRequest = async () => {
    if (!introMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please write an introduction message before sending the request.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('brand_connections')
        .insert({
          requester_brand_id: currentBrandId,
          requested_brand_id: targetBrand.id,
          intro_message: introMessage.trim(),
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Connection request already exists with this brand.');
        }
        throw error;
      }

      toast({
        title: "Connection Request Sent!",
        description: `Your request has been sent to ${targetBrand.brand_name}. You'll be notified when they respond.`,
      });

      onClose();
      setIntroMessage('');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Failed to Send Request",
        description: error.message || "There was an error sending your connection request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Connect with {targetBrand.brand_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{targetBrand.brand_name}</h4>
            <p className="text-sm text-muted-foreground">{targetBrand.industry}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {targetBrand.mission_statement}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="intro-message">Introduction Message</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateIntroMessage}
                disabled={isGeneratingMessage}
                className="text-xs"
              >
                {isGeneratingMessage ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {isGeneratingMessage ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <Textarea
              id="intro-message"
              placeholder="Write a personalized message to introduce your brand and collaboration interests..."
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {introMessage.length}/500 characters
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={sendConnectionRequest}
              disabled={isSubmitting || !introMessage.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionRequestModal;