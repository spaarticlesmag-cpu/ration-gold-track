import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Star, ThumbsUp, ThumbsDown, Send, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";

const CustomerDashboard = () => {
  const { profile } = useAuth();
  const cardType = profile?.ration_card_type as 'yellow' | 'pink' | 'blue' | 'white' | undefined;
  const members = profile?.household_members || 1;
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleSubmitReview = () => {
    if (rating && reviewText.trim()) {
      // In a real app, this would save to Supabase
      console.log("Review submitted:", { rating, reviewText });
      setReviewText("");
      setRating(null);
      setShowReview(false);
    }
  };

  const handleChatSend = () => {
    if (chatInput.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        text: chatInput,
        isUser: true,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for your feedback! We're here to help with any questions about your ration delivery. How can we assist you today?",
          isUser: false,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, botResponse]);
      }, 1000);
      
      setChatInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Card details summary */}
        {cardType && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Card: {cardType.toUpperCase()}</Badge>
                {typeof profile?.verification_status === 'string' && (
                  <Badge variant={profile.verification_status === 'verified' ? 'default' : profile.verification_status === 'pending' ? 'secondary' : 'destructive'}>
                    {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground ml-2">Members: {members}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const items: Array<{ name: string; qty: number; unit: string; priceText?: string; description?: string } > = [];
                  if (cardType === 'yellow') {
                    items.push({ name: 'Rice', qty: 20, unit: 'kg', priceText: '₹3/kg', description: 'Premium quality rice' });
                    items.push({ name: 'Wheat', qty: 15, unit: 'kg', priceText: '₹2/kg', description: 'Whole wheat flour' });
                    items.push({ name: 'Sugar', qty: 2, unit: 'kg', priceText: 'Free', description: 'White sugar' });
                  } else if (cardType === 'pink') {
                    items.push({ name: 'Rice', qty: 4 * members, unit: 'kg', priceText: '₹3/kg', description: 'Per family member' });
                    items.push({ name: 'Wheat', qty: 1 * members, unit: 'kg', priceText: '₹2/kg', description: 'Per family member' });
                    items.push({ name: 'Sugar', qty: 2, unit: 'kg', priceText: 'Free', description: 'Family allocation' });
                  } else if (cardType === 'blue') {
                    items.push({ name: 'Rice', qty: 2 * members, unit: 'kg', priceText: '₹4/kg', description: 'Subsidized rate' });
                    items.push({ name: 'Wheat', qty: 1, unit: 'kg', priceText: 'Market rate', description: 'Limited quantity' });
                  } else if (cardType === 'white') {
                    items.push({ name: 'Rice', qty: 5, unit: 'kg', priceText: '₹10.90/kg', description: 'Fixed allocation' });
                    items.push({ name: 'Wheat', qty: 1, unit: 'kg', priceText: 'Market rate', description: 'Limited quantity' });
                  }
                  return items.map((it, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm font-semibold">{it.qty} {it.unit}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{it.description}</div>
                      <div className="text-sm font-medium text-primary">{it.priceText}</div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        <Dashboard />
      
      {/* Review Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="icon-lg" />
            Share Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              How was your ration delivery?
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="icon"
                  className="tap-target"
                  onClick={() => handleRating(star)}
                >
                  <Star 
                    className={`icon-lg ${
                      rating && star <= rating 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </Button>
              ))}
            </div>

            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={rating === 1 ? "default" : "outline"}
                onClick={() => handleRating(1)}
                className="tap-target"
              >
                <ThumbsDown className="icon-lg mr-2" />
                Poor
              </Button>
              <Button
                variant={rating === 5 ? "default" : "outline"}
                onClick={() => handleRating(5)}
                className="tap-target"
              >
                <ThumbsUp className="icon-lg mr-2" />
                Excellent
              </Button>
            </div>

            {rating && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Tell us more about your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
                <Button 
                  onClick={handleSubmitReview}
                  className="w-full tap-target"
                  disabled={!reviewText.trim()}
                >
                  Submit Review
                </Button>
              </div>
            )}
          </div>

          {/* Chatbot Section */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="icon-lg text-primary" />
                <span className="text-lg font-medium">Need Help?</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowChatbot(!showChatbot)}
                className="tap-target"
              >
                {showChatbot ? 'Hide Chat' : 'Start Chat'}
              </Button>
            </div>

            {showChatbot && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <Bot className="icon-lg mx-auto mb-2" />
                      <p>Hello! I'm here to help with your ration delivery questions.</p>
                      <p className="text-sm mt-1">Traditional Values • Modern Technology</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-border'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 min-h-[60px] text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="tap-target"
                  >
                    <Send className="icon-lg" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;