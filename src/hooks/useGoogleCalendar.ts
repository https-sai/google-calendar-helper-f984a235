import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Task, CalendarEvent } from "@/types/calendar";

declare global {
  interface Window {
    gapi: any;
  }
}

export const useGoogleCalendar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCalendarEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          ...event,
          start: {
            ...event.start,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            ...event.end,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      });
      
      return response.result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }, []);

  const createMultipleEvents = useCallback(async (tasks: Task[]) => {
    setIsLoading(true);
    const results = [];
    
    try {
      for (const task of tasks) {
        const event: CalendarEvent = {
          summary: task.title,
          description: task.description,
          start: {
            dateTime: task.start_time
          },
          end: {
            dateTime: task.end_time
          },
          colorId: getColorIdByPriority(task.priority)
        };
        
        const result = await createCalendarEvent(event);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error creating multiple events:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createCalendarEvent]);

  const getColorIdByPriority = (priority?: Task['priority']): string => {
    switch (priority) {
      case 'high': return '11'; // Red
      case 'medium': return '5'; // Yellow
      case 'low': return '2'; // Green
      default: return '1'; // Blue
    }
  };

  const parseTasksFromMessage = useCallback((message: string): Task[] => {
    try {
      // Try to extract JSON from the message
      const jsonMatch = message.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return Array.isArray(tasks) ? tasks : [];
      }
      
      // If no JSON found, try to parse structured text
      const lines = message.split('\n');
      const tasks: Task[] = [];
      let currentTask: Partial<Task> = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('Title:') || trimmed.startsWith('Task:')) {
          if (currentTask.title) {
            tasks.push(currentTask as Task);
            currentTask = {};
          }
          currentTask.title = trimmed.split(':')[1].trim();
        } else if (trimmed.startsWith('Description:')) {
          currentTask.description = trimmed.split(':')[1].trim();
        } else if (trimmed.startsWith('Start:') || trimmed.startsWith('Start Time:')) {
          const timeStr = trimmed.split(':').slice(1).join(':').trim();
          currentTask.start_time = parseTimeString(timeStr);
        } else if (trimmed.startsWith('End:') || trimmed.startsWith('End Time:')) {
          const timeStr = trimmed.split(':').slice(1).join(':').trim();
          currentTask.end_time = parseTimeString(timeStr);
        } else if (trimmed.startsWith('Priority:')) {
          const priority = trimmed.split(':')[1].trim().toLowerCase();
          if (priority === 'low' || priority === 'medium' || priority === 'high') {
            currentTask.priority = priority;
          }
        } else if (trimmed.startsWith('Category:')) {
          currentTask.category = trimmed.split(':')[1].trim();
        }
      }
      
      if (currentTask.title) {
        tasks.push(currentTask as Task);
      }
      
      return tasks.filter(task => task.title && task.start_time && task.end_time);
    } catch (error) {
      console.error('Error parsing tasks:', error);
      return [];
    }
  }, []);

  const parseTimeString = (timeStr: string): string => {
    try {
      // Handle various time formats
      const now = new Date();
      
      // If it's already an ISO string, return it
      if (timeStr.includes('T') && timeStr.includes('Z')) {
        return timeStr;
      }
      
      // Parse relative times like "today at 2:00 PM"
      if (timeStr.toLowerCase().includes('today')) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const minute = parseInt(timeMatch[2]);
          const isPM = timeMatch[3].toLowerCase() === 'pm';
          
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          
          const date = new Date();
          date.setHours(hour, minute, 0, 0);
          return date.toISOString();
        }
      }
      
      // Parse tomorrow
      if (timeStr.toLowerCase().includes('tomorrow')) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const minute = parseInt(timeMatch[2]);
          const isPM = timeMatch[3].toLowerCase() === 'pm';
          
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          
          const date = new Date();
          date.setDate(date.getDate() + 1);
          date.setHours(hour, minute, 0, 0);
          return date.toISOString();
        }
      }
      
      // Try parsing as a date
      const parsed = new Date(timeStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
      // Default to current time if parsing fails
      return now.toISOString();
    } catch (error) {
      console.error('Error parsing time string:', error);
      return new Date().toISOString();
    }
  };

  return {
    createCalendarEvent,
    createMultipleEvents,
    parseTasksFromMessage,
    isLoading
  };
};