import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatSidebar = ({ selectedChatId, onChatSelect, onNewChat }: ChatSidebarProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chats",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(chats.filter(chat => chat.id !== chatId));
      
      if (selectedChatId === chatId) {
        onNewChat();
      }

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat",
      });
    }
  };

  const addNewChat = (newChat: Chat) => {
    setChats([newChat, ...chats]);
  };

  // Expose addNewChat function to parent
  useEffect(() => {
    (window as any).addNewChatToSidebar = addNewChat;
    return () => {
      delete (window as any).addNewChatToSidebar;
    };
  }, [chats]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chats</span>
            <Button size="sm" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading chats...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chats</span>
          <Button size="sm" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 p-4">
            {chats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No chats yet</p>
                <p className="text-sm">Create a new chat to get started</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                    selectedChatId === chat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-xs opacity-70">
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      selectedChatId === chat.id ? 'hover:bg-primary-foreground/20' : ''
                    }`}
                    onClick={(e) => deleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatSidebar;