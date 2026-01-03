import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import type { Event } from '../types';
import type { TranslationKey } from '../i18n';

// A map to store active timers to avoid setting duplicates
const activeTimers = new Map<string, number>();

const useNotificationScheduler = (events: Event[], t: (key: TranslationKey, ...args: (string | number)[]) => string) => {
  const [shownNotifications, setShownNotifications] = useLocalStorage<Record<string, boolean>>('shownNotifications', {});

  useEffect(() => {
    const currentTimerKeys = new Set(
        events
            .filter(e => e.reminder && e.reminder !== 'none')
            .map(e => `${e.id}-${e.date}-${e.reminder}`)
    );

    // Clean up timers for events that no longer exist or have been changed
    for (const key of activeTimers.keys()) {
        if (!currentTimerKeys.has(key)) {
            clearTimeout(activeTimers.get(key));
            activeTimers.delete(key);
        }
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    events.forEach(event => {
        if (!event.reminder || event.reminder === 'none') {
            return;
        }
        
        const timerKey = `${event.id}-${event.date}-${event.reminder}`;
        
        if (shownNotifications[timerKey] || activeTimers.has(timerKey)) {
            return;
        }

        const eventDate = new Date(`${event.date}T00:00:00`);
        const reminderTime = new Date(eventDate);
        reminderTime.setHours(9, 0, 0, 0); // Set reminder for 9 AM

        let daysBefore = 0;
        let timeDescription = t('reminderTimeToday');

        switch (event.reminder) {
            case 'on-day':
                daysBefore = 0;
                break;
            case '1-day-before':
                daysBefore = 1;
                timeDescription = t('reminderTimeTomorrow');
                break;
            case '2-days-before':
                daysBefore = 2;
                timeDescription = t('reminderTimeInXDays', 2);
                break;
            case '1-week-before':
                daysBefore = 7;
                timeDescription = t('reminderTimeInAWeek');
                break;
            default:
                return;
        }
        
        reminderTime.setDate(reminderTime.getDate() - daysBefore);

        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();
        
        if (delay > 0) {
            const timerId = window.setTimeout(() => {
                const notificationBody = t('eventReminderBody', event.name, timeDescription);
                new Notification(t('eventReminderTitle'), {
                    body: notificationBody,
                    icon: '/vite.svg',
                });
                
                setShownNotifications(prev => ({ ...prev, [timerKey]: true }));
                activeTimers.delete(timerKey);
            }, delay);
            activeTimers.set(timerKey, timerId);
        }
    });

    // Cleanup: Remove shown notifications for events that no longer exist
    const allPossibleTimerKeys = new Set<string>();
    events.forEach(e => {
        if (e.reminder && e.reminder !== 'none') {
            allPossibleTimerKeys.add(`${e.id}-${e.date}-${e.reminder}`);
        }
    });

    const updatedShownNotifications = { ...shownNotifications };
    let changed = false;
    for (const key in updatedShownNotifications) {
      if (!allPossibleTimerKeys.has(key)) {
        delete updatedShownNotifications[key];
        changed = true;
      }
    }
    if (changed) {
      setShownNotifications(updatedShownNotifications);
    }
    
    // Cleanup all timers on unmount
    return () => {
        for (const timerId of activeTimers.values()) {
            clearTimeout(timerId);
        }
        activeTimers.clear();
    };

  }, [events, shownNotifications, setShownNotifications, t]);
};

export default useNotificationScheduler;
