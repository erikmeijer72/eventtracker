import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Event, DefaultCategory } from '../types';
import { DEFAULT_CATEGORY_KEYS } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { TrashIcon, StarIcon, CloseIcon, ArrowsExpandIcon, ArrowsContractIcon, CalendarIcon } from './icons';

type SortOrder = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  categories: string[];
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => void;
  deferredPrompt?: any;
  onInstallApp?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, events, setEvents, sortOrder, setSortOrder, 
  categories, addCategory, deleteCategory, deferredPrompt, onInstallApp
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [eventsToImport, setEventsToImport] = useState<Event[] | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleExport = () => {
    const eventsToExport = events.map(({ id, ...rest }) => rest);
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(eventsToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "events.json";
    link.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const validateAndConfirmImport = (jsonContent: string) => {
    try {
      const parsedEvents: Omit<Event, 'id'>[] = JSON.parse(jsonContent);
      
      if (Array.isArray(parsedEvents) && (parsedEvents.length === 0 || (parsedEvents[0].name && parsedEvents[0].date))) {
        const eventsWithIds: Event[] = parsedEvents.map((event, index) => ({
          ...event,
          id: `${new Date().getTime()}-${index}-${Math.random()}`
        }));
        setEventsToImport(eventsWithIds);
        setIsImportConfirmOpen(true);
      } else {
        alert(t('importError'));
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert(t('importError'));
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
          validateAndConfirmImport(content);
      } else {
        alert(t('importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (eventsToImport) {
      setEvents(eventsToImport);
    }
    setIsImportConfirmOpen(false);
    setEventsToImport(null);
    onClose();
  };
  
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (addCategory(newCategory)) {
        setNewCategory('');
    } else {
        alert(t('categoryInUseAlert'));
    }
  }

  const handleDeleteCategory = (name: string) => {
    setCategoryToDelete(name);
  }

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
        deleteCategory(categoryToDelete);
    }
  }

  const getEasterDate = (year: number): Date => {
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(year, month - 1, day);
  };

  const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
  };

  const formatDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
  };

  const handleAddDutchHolidays = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    const newEvents: Event[] = [];

    years.forEach(year => {
        const easter = getEasterDate(year);
        
        const holidays = [
            { name: `Nieuwjaarsdag ${year}`, date: `${year}-01-01` },
            { name: `Koningsdag ${year}`, date: `${year}-04-27` },
            { name: `Dodenherdenking ${year}`, date: `${year}-05-04` },
            { name: `Bevrijdingsdag ${year}`, date: `${year}-05-05` },
            { name: `1e Kerstdag ${year}`, date: `${year}-12-25` },
            { name: `2e Kerstdag ${year}`, date: `${year}-12-26` },
            { name: `Oudejaarsdag ${year}`, date: `${year}-12-31` },
            { name: `Goede Vrijdag ${year}`, date: formatDate(addDays(easter, -2)) },
            { name: `1e Paasdag ${year}`, date: formatDate(easter) },
            { name: `2e Paasdag ${year}`, date: formatDate(addDays(easter, 1)) },
            { name: `Hemelvaartsdag ${year}`, date: formatDate(addDays(easter, 39)) },
            { name: `1e Pinksterdag ${year}`, date: formatDate(addDays(easter, 49)) },
            { name: `2e Pinksterdag ${year}`, date: formatDate(addDays(easter, 50)) },
        ];

        holidays.forEach(h => {
            const exists = events.some(e => e.name === h.name && e.date === h.date);
            if (!exists) {
                 newEvents.push({
                    id: `${new Date().getTime()}-${h.name}-${Math.random()}`,
                    name: h.name,
                    date: h.date,
                    category: 'Holiday',
                    icon: 'Star',
                    reminder: 'on-day'
                });
            }
        });
    });

    if (newEvents.length > 0) {
        setEvents([...events, ...newEvents]);
        alert(t('holidaysAdded'));
    } else {
        alert(t('holidaysAdded'));
    }
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
        onClick={onClose} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="settings-title"
      >
        <div 
          className="bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-slate-800" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <header className="bg-gradient-to-br from-header-start to-header-end text-white shrink-0 z-10 p-4 flex items-center justify-between shadow-md">
            <div className="w-8"></div> {/* Spacer to center title */}
            <h2 id="settings-title" className="text-xl font-bold">{t('settingsTitle')}</h2>
            <button 
                onClick={onClose} 
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label={t('closeSettingsAriaLabel')}
            >
                <CloseIcon className="w-6 h-6" />
            </button>
          </header>
          
          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-5">
            
            {deferredPrompt && (
              <div className="mb-4">
                <button
                  onClick={onInstallApp}
                  className="w-full px-4 py-3 bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarIcon className="w-5 h-5" />
                  Installeer App
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <label className="text-sm font-medium text-slate-700">{t('fullscreenLabel')}</label>
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  isFullscreen 
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-label={isFullscreen ? t('disableFullscreen') : t('enableFullscreen')}
              >
                {isFullscreen ? <ArrowsContractIcon className="w-5 h-5" /> : <ArrowsExpandIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label htmlFor="sort-order-select" className="block text-sm font-medium text-slate-700">{t('sortOrderLabel')}</label>
              <select
                id="sort-order-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as SortOrder)}
                className="mt-2 block w-full px-3 py-3 bg-white border border-slate-300 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="date-asc">{t('sortDateAsc')}</option>
                <option value="date-desc">{t('sortDateDesc')}</option>
                <option value="name-asc">{t('sortNameAsc')}</option>
                <option value="name-desc">{t('sortNameDesc')}</option>
              </select>
            </div>

            <div className="border-t border-slate-200 pt-4">
                <h3 className="block text-sm font-medium text-slate-700 mb-2">{t('manageCategoriesTitle')}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
                    {categories.map(cat => {
                        const isDefault = (DEFAULT_CATEGORY_KEYS as readonly string[]).includes(cat);
                        const label = isDefault ? t(cat as DefaultCategory) : cat;
                        return (
                            <div key={cat} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-sm font-medium text-slate-700">{label}</span>
                                {cat !== 'General' && (
                                    <button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 hover:text-red-600 transition-colors" aria-label={`Delete ${cat} category`}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder={t('addCategoryPlaceholder')}
                        className="flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 shadow-sm" disabled={!newCategory.trim()}>
                        {t('addCategoryButton')}
                    </button>
                </form>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('exportSectionTitle')}</label>
                    <button onClick={handleExport} className="w-full px-4 py-3 bg-slate-600 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors shadow-sm">
                        {t('exportButton')}
                    </button>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('importSectionTitle')}</label>
                    <div className="space-y-3">
                        <button onClick={handleImportClick} className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                            {t('importFromFileButton')}
                        </button>
                        <button onClick={handleAddDutchHolidays} className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <StarIcon className="w-5 h-5" />
                            {t('addHolidaysButton')}
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange}
                          className="hidden" 
                          accept=".json"
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isImportConfirmOpen}
        onClose={() => setIsImportConfirmOpen(false)}
        onConfirm={handleImportConfirm}
        title={t('importConfirmationTitle')}
        message={t('importConfirmationMessage')}
        confirmText={t('confirmReplaceButton')}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
        title={t('deleteCategoryConfirmationTitle')}
        message={t('deleteCategoryConfirmationMessage', categoryToDelete || '')}
        confirmText={t('deleteButton')}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};

export default SettingsModal;