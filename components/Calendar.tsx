import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ value, onChange }) => {
    // Ensure the initial date is valid, otherwise default to today
    const initialDate = useMemo(() => {
        const date = new Date(`${value}T00:00:00`);
        return isNaN(date.getTime()) ? new Date() : date;
    }, [value]);
    
    const [displayDate, setDisplayDate] = useState(initialDate);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const monthName = displayDate.toLocaleString('default', { month: 'long' });
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const isSelected = initialDate.getTime() === dayDate.getTime();
        const isToday = today.getTime() === dayDate.getTime();
        
        let dayClasses = 'w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors text-slate-900 ';
        if (isSelected) {
            dayClasses += 'bg-indigo-600 text-white font-bold shadow-md';
        } else if (isToday) {
            dayClasses += 'bg-indigo-100 text-indigo-600';
        } else {
            dayClasses += 'hover:bg-slate-100';
        }

        calendarDays.push(
            <button 
                type="button"
                key={day} 
                className={dayClasses} 
                onClick={() => {
                    const newDate = new Date(year, month, day);
                    // Format date manually to avoid timezone issues with toISOString()
                    const y = newDate.getFullYear();
                    const m = (newDate.getMonth() + 1).toString().padStart(2, '0');
                    const d = newDate.getDate().toString().padStart(2, '0');
                    onChange(`${y}-${m}-${d}`);
                }}
            >
                {day}
            </button>
        );
    }

    const handlePrevMonth = () => {
        setDisplayDate(new Date(year, month - 1, 1));
    };
    const handleNextMonth = () => {
        setDisplayDate(new Date(year, month + 1, 1));
    };

    return (
        <div className="p-3 bg-white rounded-lg shadow-inner border border-slate-200">
            <div className="flex justify-between items-center mb-3">
                <button type="button" onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100" aria-label="Previous month">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <div className="font-bold text-base text-slate-800">{monthName} {year}</div>
                <button type="button" onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100" aria-label="Next month">
                    <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2 font-semibold">
                {daysOfWeek.map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {calendarDays}
            </div>
        </div>
    );
};

export default Calendar;