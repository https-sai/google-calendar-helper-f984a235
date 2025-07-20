export interface Task {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
}