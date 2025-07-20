import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarEmbedProps {
  calendarId?: string;
  refreshTrigger?: number;
}

declare global {
  interface Window {
    gapi: any;
  }
}

const CalendarEmbed = ({ calendarId = 'primary', refreshTrigger }: CalendarEmbedProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadGoogleAPI();
  }, []);

  useEffect(() => {
    if (refreshTrigger && isAuthenticated) {
      loadCalendarEvents();
    }
  }, [refreshTrigger, isAuthenticated]);

  const loadGoogleAPI = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initializeGapi;
    document.body.appendChild(script);
  };

  const initializeGapi = () => {
    window.gapi.load('auth2:client', initializeGoogleAuth);
  };

  const initializeGoogleAuth = async () => {
    try {
      await window.gapi.client.init({
        apiKey: 'AIzaSyBhVRdQ8h4DtDQr2Fm5l6u7K3PbKq2FwBo', // Placeholder - needs to be configured
        clientId: '255529244423-a3enrdhm5734olgops5ql7h2d1k2pv49.apps.googleusercontent.com', // From secrets
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      const authInstance = window.gapi.auth2.getAuthInstance();
      setIsAuthenticated(authInstance.isSignedIn.get());
      
      if (authInstance.isSignedIn.get()) {
        loadCalendarEvents();
      }
    } catch (error) {
      console.error('Error initializing Google API:', error);
    }
  };

  const signIn = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsAuthenticated(true);
      loadCalendarEvents();
      toast({
        title: "Success",
        description: "Connected to Google Calendar",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Google Calendar",
      });
    }
  };

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      setEvents(response.result.items || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar events",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: any) => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;
    
    if (event.start.date) {
      // All-day event
      return 'All day';
    }
    
    return `${new Date(start).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${new Date(end).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Your Calendar
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCalendarEvents}
            disabled={!isAuthenticated || loading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isAuthenticated ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Connect your Google Calendar to see your events and schedule new tasks
            </p>
            <Button onClick={signIn}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No upcoming events</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm">{event.summary}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEventTime(event)}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarEmbed;