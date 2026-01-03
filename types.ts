


// A centralized list of default category keys.
export const DEFAULT_CATEGORY_KEYS = [
    "General", 
    "Anniversary", 
    "Birthday", 
    "Concert", 
    "Fitness", 
    "Holiday", 
    "Meeting", 
    "Milestone", 
    "Movie Night", 
    "Shopping", 
    "Travel", 
    "Vacation", 
] as const;

export type DefaultCategory = typeof DEFAULT_CATEGORY_KEYS[number];

export type ReminderOption = 'none' | 'on-day' | '1-day-before' | '2-days-before' | '1-week-before';

export interface Event {
  id: string;
  name: string;
  date: string; // Stored in 'YYYY-MM-DD' format
  time?: string; // Stored in 'HH:MM' format
  category?: string;
  reminder?: ReminderOption;
  icon?: string;
}
