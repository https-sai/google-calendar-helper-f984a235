import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MessageSquare, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Calendar Assistant
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tell your AI assistant what tasks you need to accomplish, and watch as it intelligently time-blocks your calendar for maximum productivity.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8 py-6">
            Get Started with Google
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>AI Task Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Simply describe your tasks in natural language and let AI understand your priorities and requirements.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Smart Time Blocking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI automatically creates optimal time blocks based on task complexity, your schedule, and productivity patterns.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Google Calendar Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamlessly integrates with your Google Calendar to create and manage events without leaving the app.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
