import React, { useState, useEffect, useMemo } from 'react';
import type { Event, DefaultCategory, ReminderOption } from '../types';
import { DEFAULT_CATEGORY_KEYS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeftIcon, iconMap, iconKeys, categoryToIconMap } from './icons';
import Calendar from './Calendar';

interface EventFormViewProps {
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  eventToEdit?: Event | null;
  categories: string[];
}

const EventFormView: React.FC<EventFormViewProps> = ({ onClose, onSave, onDelete, eventToEdit, categories }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [icon, setIcon] = useState(categoryToIconMap[category] || 'Calendar');
  const [reminder, setReminder] = useState<ReminderOption>('none');
  const { t, language } = useLanguage();

  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name);
      setDate(eventToEdit.date);
      setTime(eventToEdit.time || '');
      const eventCategory = eventToEdit.category || categories[0] || 'General'
      setCategory(eventCategory);
      setIcon(eventToEdit.icon || categoryToIconMap[eventCategory] || 'Calendar');
      setReminder(eventToEdit.reminder || 'none');
    } else {
      setName('');
      // Set default date to today, avoiding timezone issues from toISOString()
      const today = new Date();
      const y = today.getFullYear();
      const m = (today.getMonth() + 1).toString().padStart(2, '0');
      const d = today.getDate().toString().padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
      setTime('');
      const defaultCategory = categories[0] || 'General';
      setCategory(defaultCategory);
      setIcon(categoryToIconMap[defaultCategory] || 'Calendar');
      setReminder('none');
    }
  }, [eventToEdit, categories]);

  // Suggest a new icon when the category is changed for a new event
  useEffect(() => {
      if (!eventToEdit) {
          setIcon(categoryToIconMap[category] || 'Calendar');
      }
  }, [category, eventToEdit]);

  const formattedSelectedDate = useMemo(() => {
    if (!date) return '';
    const d = new Date(`${date}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(language, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  }, [date, language]);

  const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newReminder = e.target.value as ReminderOption;
    setReminder(newReminder);

    if (newReminder !== 'none' && 'Notification' in window && Notification.permission === 'default') {
        alert(t('notificationPermissionRequest'));
        Notification.requestPermission();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
        alert(t("formAlert"));
        return;
    }
    onSave({ id: eventToEdit?.id, name, date, time, category, icon, reminder });
  };

  const handleDelete = () => {
    if (eventToEdit && onDelete && window.confirm(`${t('deleteConfirmation')} "${eventToEdit.name}"?`)) {
        onDelete(eventToEdit.id);
    }
  }
  
  const reminderOptions: { value: ReminderOption; label: string }[] = [
    { value: 'none', label: t('reminderNone') },
    { value: 'on-day', label: t('reminderOnDay') },
    { value: '1-day-before', label: t('reminder1Day') },
    { value: '2-days-before', label: t('reminder2Days') },
    { value: '1-week-before', label: t('reminder1Week') },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-base-100">
        <header className="bg-gradient-to-br from-header-start to-header-end text-white shrink-0 z-10 shadow-md">
            <div className="mx-auto p-4 flex items-center justify-between">
                <button type="button" onClick={onClose} aria-label={t('backAriaLabel')} className="p-1 rounded-full hover:bg-white/20">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-center">{eventToEdit ? t('editEventTitle') : t('addEventTitle')}</h1>
                <div className="w-8 h-8"></div> {/* Spacer to center the title correctly */}
            </div>
        </header>

        <main className="flex-grow p-4 space-y-6 overflow-y-auto">
            <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-slate-700">{t('eventNameLabel')}</label>
                <input
                  type="text"
                  id="eventName"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('eventNamePlaceholder')}
                  required
                />
            </div>
            
            <div>
              <label htmlFor="eventCategory" className="block text-sm font-medium text-slate-700">{t('categoryLabel')}</label>
              <select
                id="eventCategory"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {categories.map(cat => {
                  const isDefault = (DEFAULT_CATEGORY_KEYS as readonly string[]).includes(cat);
                  const label = isDefault ? t(cat as DefaultCategory) : cat;
                  return <option key={cat} value={cat}>{label}</option>
                })}
              </select>
            </div>
           
            <div>
              <label htmlFor="eventReminder" className="block text-sm font-medium text-slate-700">{t('reminderLabel')}</label>
              <select
                id="eventReminder"
                value={reminder}
                onChange={handleReminderChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {reminderOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Icon</label>
                <div className="mt-2 grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {iconKeys.map(key => {
                        const IconComponent = iconMap[key];
                        const isSelected = icon === key;
                        return (
                            <button
                                type="button"
                                key={key}
                                onClick={() => setIcon(key)}
                                className={`p-2 rounded-lg flex justify-center items-center transition-all ${isSelected ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                aria-label={`Select ${key} icon`}
                                aria-pressed={isSelected}
                            >
                                <IconComponent className="w-6 h-6" />
                            </button>
                        )
                    })}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('dateLabel')}</label>
                        <p className="text-sm text-slate-500 mt-1 h-5">{formattedSelectedDate}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <label htmlFor="eventTime" className="text-sm font-medium text-slate-700 mb-1">{t('timeLabel')}</label>
                        <input
                            type="time"
                            id="eventTime"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-9"
                        />
                    </div>
                </div>
                <Calendar value={date} onChange={setDate} />
            </div>
        </main>
        
        <footer className="p-4 bg-base-100 border-t border-slate-200 shrink-0 sticky bottom-0">
            <div className="flex flex-col space-y-3">
                <button
                    type="submit"
                    className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t('saveButton')}
                </button>
                {eventToEdit && onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full px-4 py-2 bg-transparent text-red-600 font-semibold rounded-md hover:bg-red-50 transition-colors"
                    >
                        {t('deleteButton')}
                    </button>
                )}
            </div>
        </footer>
    </form>
  );
};

export default EventFormView;