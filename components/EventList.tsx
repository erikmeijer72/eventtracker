

import React from 'react';
import type { Event } from '../types';
import EventItem from './EventItem';
import { CalendarIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { iconMap, categoryToIconMap } from './icons';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  filter: 'all' | 'upcoming' | 'today' | 'past';
}

const EventList: React.FC<EventListProps> = ({ events, onEdit, filter }) => {
  const { t } = useLanguage();

  if (events.length === 0) {
    const messages = {
      all: {
        title: t("noEventsYetTitle"),
        body: t("noEventsYetBody"),
      },
      upcoming: {
        title: t("noUpcomingEventsTitle"),
        body: t("noUpcomingEventsBody"),
      },
      today: {
        title: t("noEventsTodayTitle"),
        body: t("noEventsTodayBody"),
      },
      past: {
        title: t("noPastEventsTitle"),
        body: t("noPastEventsBody"),
      },
    };
    const { title, body } = messages[filter];

    return (
      <div className="text-center py-20 px-6">
        <CalendarIcon className="w-16 h-16 mx-auto text-slate-300" />
        <h2 className="mt-4 text-2xl font-bold text-base-content">{title}</h2>
        <p className="mt-2 text-slate-500">{body}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const iconName = event.icon || categoryToIconMap[event.category || 'General'] || 'Calendar';
        const Icon = iconMap[iconName] || iconMap['Calendar'];
        return <EventItem key={event.id} event={event} onEdit={onEdit} index={index} Icon={Icon} />;
      })}
    </div>
  );
};

export default EventList;