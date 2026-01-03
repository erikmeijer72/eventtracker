
import React, { useState, useMemo } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import type { Event } from './types';
import { DEFAULT_CATEGORY_KEYS } from './types';
import EventList from './components/EventList';
import EventFormView from './components/EventFormView';
import SettingsModal from './components/SettingsModal';
import { PlusIcon, SettingsIcon, CalendarIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';
import useNotificationScheduler from './hooks/useNotificationScheduler';

type FilterType = 'all' | 'upcoming' | 'today' | 'past';
type SortOrder = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc';
type ViewType = 'list' | 'form';

const getEventStatus = (dateString: string): 'upcoming' | 'today' | 'past' => {
  const eventDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return 'upcoming';
  if (diffDays === 0) return 'today';
  return 'past';
};


const App: React.FC = () => {
  const [events, setEvents] = useLocalStorage<Event[]>('events', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [...DEFAULT_CATEGORY_KEYS]);
  const [view, setView] = useState<ViewType>('list');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [sortOrder, setSortOrder] = useLocalStorage<SortOrder>('sortOrder', 'date-asc');
  const { t } = useLanguage();

  useNotificationScheduler(events, t);
  
  const handleAddEvent = () => {
    setEventToEdit(null);
    setView('form');
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setView('form');
  };
  
  const handleDeleteEvent = (id: string) => {
      setEvents(prevEvents => prevEvents.filter(e => e.id !== id));
      setView('list');
  }

  const handleSaveEvent = (eventData: Omit<Event, 'id'> & { id?: string }) => {
    if (eventData.id) {
      setEvents(prevEvents => 
        prevEvents.map(e => e.id === eventData.id ? { ...e, ...eventData } : e)
      );
    } else {
      // Adding new event
      const newEvent: Event = {
        id: new Date().toISOString() + Math.random(), // simple unique id
        name: eventData.name,
        date: eventData.date,
        time: eventData.time,
        category: eventData.category,
        reminder: eventData.reminder,
        icon: eventData.icon,
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);
    }
    setView('list');
  };
  
  const handleCloseForm = () => {
    setEventToEdit(null);
    setView('list');
  }

  const addCategory = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName && !categories.find(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        setCategories(prev => [...prev, trimmedName]);
        return true;
    }
    return false;
  };

  const deleteCategory = (name: string) => {
    if (name === 'General') return; // Cannot delete General
    setEvents(prev => prev.map(e => e.category === name ? { ...e, category: 'General' } : e));
    setCategories(prev => prev.filter(c => c !== name));
  }

  const processedEvents = useMemo(() => {
    const filtered = events.filter(event => {
      if (filter === 'all') return true;
      return getEventStatus(event.date) === filter;
    });

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [events, filter, sortOrder]);

  const filters: { label: string; value: FilterType }[] = [
      { label: t('filterAll'), value: 'all' },
      { label: t('filterUpcoming'), value: 'upcoming' },
      { label: t('filterToday'), value: 'today' },
      { label: t('filterPast'), value: 'past' },
  ];

  return (
    <div className="max-w-sm mx-auto bg-base-100 font-sans shadow-2xl rounded-3xl overflow-hidden my-4 border-4 border-slate-800 h-[85vh] min-h-[600px] flex flex-col relative">

        {view === 'list' ? (
          <>
            <header className="bg-gradient-to-br from-header-start to-header-end text-white shrink-0 z-10 shadow-md">
                <div className="mx-auto p-4 flex items-center justify-between relative">
                    <div className="w-8 h-8"></div>
                    <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                      <CalendarIcon className="w-6 h-6 text-yellow-300" />
                      <h1 className="text-xl font-bold text-center">{t('headerTitle')}</h1>
                    </div>
                    <button aria-label={t('settingsAriaLabel')} className="p-1 rounded-full hover:bg-white/20" onClick={() => setIsSettingsModalOpen(true)}><SettingsIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 relative scroll-smooth">
              <div className="mb-4">
                <div className="flex bg-slate-100 rounded-full p-1 max-w-md mx-auto">
                  {filters.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`flex-1 py-2 px-2 text-center text-sm font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                        filter === value 
                        ? 'bg-white text-indigo-600 shadow-md' 
                        : 'text-slate-500 hover:bg-slate-200'
                      }`}
                      aria-pressed={filter === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <EventList 
                events={processedEvents} 
                onEdit={handleEditEvent}
                filter={filter}
              />
              <div className="h-20"></div> {/* Spacer for FAB */}
            </main>

            <button
              onClick={handleAddEvent}
              className="absolute bottom-8 right-8 bg-fab hover:bg-orange-600 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fab z-20"
              aria-label={t('addEventAriaLabel')}
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </>
        ) : (
           <EventFormView
              onClose={handleCloseForm}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
              eventToEdit={eventToEdit}
              categories={categories}
            />
        )}
       
        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          events={events}
          setEvents={setEvents}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          categories={categories}
          addCategory={addCategory}
          deleteCategory={deleteCategory}
        />
    </div>
  );
};

export default App;
