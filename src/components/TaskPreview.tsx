import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/calendar";

interface TaskPreviewProps {
  tasks: Task[];
  onCreateCalendarEvents: (tasks: Task[]) => Promise<void>;
}

const TaskPreview = ({ tasks, onCreateCalendarEvents }: TaskPreviewProps) => {
  const [creatingEvents, setCreatingEvents] = useState(false);
  const { toast } = useToast();

  const handleCreateEvents = async () => {
    setCreatingEvents(true);
    try {
      await onCreateCalendarEvents(tasks);
      toast({
        title: "Success",
        description: `${tasks.length} event(s) created in your calendar`,
      });
    } catch (error) {
      console.error('Error creating events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create calendar events",
      });
    } finally {
      setCreatingEvents(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Tasks Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {task.priority && (
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                )}
                {task.category && (
                  <Badge variant="outline">
                    {task.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(task.start_time)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(task.start_time)} - {formatTime(task.end_time)}
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleCreateEvents}
            disabled={creatingEvents}
            className="w-full sm:w-auto"
          >
            {creatingEvents ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Creating Events...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Add to Calendar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskPreview;