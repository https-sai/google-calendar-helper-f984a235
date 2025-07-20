import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Send, LogOut, Calendar } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";
import TaskPreview from "@/components/TaskPreview";
import CalendarEmbed from "@/components/CalendarEmbed";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Task } from "@/types/calendar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>("");
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  const { createMultipleEvents, parseTasksFromMessage } = useGoogleCalendar();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages((data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
    }
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user?.id,
          title: `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentChatId(data.id);
      setChatMessages([]);
      
      // Add to sidebar
      if ((window as any).addNewChatToSidebar) {
        (window as any).addNewChatToSidebar(data);
      }

      toast({
        title: "Success",
        description: "New chat created",
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new chat",
      });
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    fetchChatMessages(chatId);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || sendingMessage) return;
    
    setSendingMessage(true);
    const messageText = message;
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(`https://btisolrshtfydukknzox.supabase.co/functions/v1/chat-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chatId: currentChatId,
          message: messageText,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Refresh messages
      await fetchChatMessages(currentChatId);
      
      // Store the assistant message for task parsing
      setLastAssistantMessage(result.message);

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
      setMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateCalendarEvents = async (tasks: Task[]) => {
    try {
      await createMultipleEvents(tasks);
      setCalendarRefresh(prev => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  // Parse tasks from the last assistant message
  const parsedTasks = lastAssistantMessage ? parseTasksFromMessage(lastAssistantMessage) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calendar Assistant</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)]">
        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <ChatSidebar
            selectedChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={createNewChat}
          />
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {currentChatId ? 'AI Task Scheduler' : 'Select or Create a Chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {currentChatId ? (
                <>
                  <ScrollArea className="flex-1 mb-4 h-96">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <p>Tell me what tasks you need to get done and I'll help you schedule them!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                                : 'bg-muted max-w-[80%]'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                      )}
                      {sendingMessage && (
                        <div className="p-3 rounded-lg bg-muted max-w-[80%]">
                          <p className="text-sm">Thinking...</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your task or request..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon"
                      disabled={sendingMessage || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Chat Selected</p>
                    <p className="text-sm">Create a new chat or select an existing one to start talking with the AI</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="space-y-6">
          {/* Task Preview */}
          {parsedTasks.length > 0 && (
            <TaskPreview 
              tasks={parsedTasks} 
              onCreateCalendarEvents={handleCreateCalendarEvents}
            />
          )}

          {/* Google Calendar Embed */}
          <CalendarEmbed refreshTrigger={calendarRefresh} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;