

import React, { useMemo } from 'react';
import type { Event } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import type { TranslationKey } from '../i18n';

interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  index: number;
  Icon: React.FC<{ className?: string }>;
}

const PALETTE = [
  { bg: 'bg-card-1-bg', text: 'text-card-1-text' },
  { bg: 'bg-card-2-bg', text: 'text-card-2-text' },
  { bg: 'bg-card-3-bg', text: 'text-card-3-text' },
  { bg: 'bg-card-4-bg', text: 'text-card-4-text' },
];

const calculateCountdown = (dateString: string, t: (key: TranslationKey) => string) => {
  const eventDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { count: diffDays, unit: diffDays === 1 ? t('countdownDay') : t('countdownDays'), status: 'upcoming' };
  }
  if (diffDays === 0) {
    return { count: t('countdownToday'), unit: '', status: 'today' };
  }
  return { count: Math.abs(diffDays), unit: Math.abs(diffDays) === 1 ? t('countdownDayAgo') : t('countdownDaysAgo'), status: 'past' };
};

const EventItem: React.FC<EventItemProps> = ({ event, onEdit, index, Icon }) => {
  const { t, language } = useLanguage();
  const countdown = useMemo(() => calculateCountdown(event.date, t), [event.date, t]);
  
  const formattedDate = useMemo(() => {
    const date = new Date(`${event.date}T00:00:00`);
    const dateString = date.toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return event.time ? `${dateString} ${event.time}` : dateString;
  }, [event.date, event.time, language]);

  const { bg, text } = PALETTE[index % PALETTE.length];

  return (
    <div
      className={`w-full text-left p-4 shadow-md rounded-xl ${bg} ${text} ${countdown.status === 'past' ? 'opacity-60' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={() => onEdit(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(event) }}
      aria-label={`${t('editEventAriaLabel')} ${event.name}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-semibold text-base-content leading-tight">{event.name}</h3>
          <p className="text-sm text-slate-500">{formattedDate}</p>
        </div>
      </div>
      <div className="mt-2">
        <span className={`text-4xl font-bold ${text}`}>{countdown.count}</span>
        <span className={`ml-2 text-xl font-bold uppercase tracking-wider ${text}`}>{countdown.unit}</span>
      </div>
    </div>
  );
};

export default EventItem;
