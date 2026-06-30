"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Check, Clock, User, CheckCircle2, X, Trash2 } from "lucide-react";
import { useFocus, CalendarEvent } from "@/context/focus-context";

const getEventStyles = (type: string) => {
  switch(type) {
    case 'hackathon': return { bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', dot: 'bg-[#9333EA]', border: 'border-white/60', extraBg: 'bg-[#E9D5FF]' };
    case 'meeting': return { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', dot: 'bg-[#0284C7]', border: 'border-white/60', extraBg: '' };
    case 'assignment': return { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]', border: 'border-white/60', extraBg: '' };
    case 'personal': return { bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]', dot: 'bg-[#DB2777]', border: 'border-white/60', extraBg: '' };
    case 'workout': return { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', dot: 'bg-[#D97706]', border: 'border-white/60', extraBg: '' };
    case 'study': return { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]', dot: 'bg-[#7C3AED]', border: 'border-white/60', extraBg: '' };
    case 'project': return { bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]', dot: 'bg-[#0D9488]', border: 'border-white/60', extraBg: '' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', border: 'border-white/60', extraBg: '' };
  }
};

const TimePickerDial = ({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  onClose: () => void; 
}) => {
  const [hours, mins] = value.split(":");
  const hNum = parseInt(hours, 10);
  const initialPeriod = hNum >= 12 ? "PM" : "AM";
  let initialHour = hNum % 12;
  if (initialHour === 0) initialHour = 12;

  const [hour, setHour] = useState(initialHour.toString().padStart(2, '0'));
  const [minute, setMinute] = useState(mins);
  const [period, setPeriod] = useState(initialPeriod);

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  const hoursList = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minsList = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = hoursList.indexOf(hour) * 32;
    if (minRef.current) minRef.current.scrollTop = minsList.indexOf(minute) * 32;
    if (periodRef.current) periodRef.current.scrollTop = period === "AM" ? 0 : 32;
  }, []);

  useEffect(() => {
    let h24 = parseInt(hour, 10);
    if (period === "PM" && h24 !== 12) h24 += 12;
    if (period === "AM" && h24 === 12) h24 = 0;
    onChange(`${h24.toString().padStart(2, '0')}:${minute}`);
  }, [hour, minute, period]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-4 z-[1200] w-[240px]">
      <div className="flex justify-between items-center h-[120px] relative">
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-gray-50 border-y border-gray-100 pointer-events-none rounded-md z-0" />

        <div ref={hourRef} className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-20"
             onScroll={(e) => {
               const el = e.currentTarget;
               const idx = Math.max(0, Math.min(hoursList.length - 1, Math.round(el.scrollTop / 32)));
               if (hoursList[idx] !== hour) setHour(hoursList[idx]);
             }}>
          <div className="h-[44px]" />
          {hoursList.map((h) => (
            <div key={h} className={`h-8 flex items-center justify-center text-[15px] snap-center cursor-pointer transition-colors ${h === hour ? 'text-[#111827] font-semibold' : 'text-gray-400'}`}>{h}</div>
          ))}
          <div className="h-[44px]" />
        </div>

        <div className="text-gray-300 font-bold px-1 relative z-20">:</div>

        <div ref={minRef} className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-20"
             onScroll={(e) => {
               const el = e.currentTarget;
               const idx = Math.max(0, Math.min(minsList.length - 1, Math.round(el.scrollTop / 32)));
               if (minsList[idx] !== minute) setMinute(minsList[idx]);
             }}>
          <div className="h-[44px]" />
          {minsList.map((m) => (
            <div key={m} className={`h-8 flex items-center justify-center text-[15px] snap-center cursor-pointer transition-colors ${m === minute ? 'text-[#111827] font-semibold' : 'text-gray-400'}`}>{m}</div>
          ))}
          <div className="h-[44px]" />
        </div>

        <div className="w-2" />

        <div ref={periodRef} className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-20"
             onScroll={(e) => {
               const el = e.currentTarget;
               const idx = Math.max(0, Math.min(1, Math.round(el.scrollTop / 32)));
               const p = idx === 0 ? "AM" : "PM";
               if (p !== period) setPeriod(p);
             }}>
          <div className="h-[44px]" />
          {["AM", "PM"].map((p) => (
             <div key={p} className={`h-8 flex items-center justify-center text-[14px] snap-center cursor-pointer transition-colors ${p === period ? 'text-[#111827] font-semibold' : 'text-gray-400'}`}>{p}</div>
          ))}
          <div className="h-[44px]" />
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-100 pt-3">
        <button onClick={onClose} className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-lg h-9 text-[13px] font-medium transition-colors">
          Done
        </button>
      </div>
    </div>
  );
};

export const CalendarView: React.FC = () => {
  const { calendarEvents: events, setCalendarEvents: setEvents } = useFocus();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState("Weekly");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [filters, setFilters] = useState([
    { name: "College", color: "bg-blue-500", active: true },
    { name: "Personal", color: "bg-purple-500", active: true },
    { name: "Meetings", color: "bg-orange-500", active: true },
    { name: "Assignments", color: "bg-rose-500", active: true },
    { name: "Projects", color: "bg-emerald-500", active: true },
    { name: "Hackathons", color: "bg-cyan-500", active: true },
    { name: "Completed", color: "bg-gray-400", active: true },
  ]);



  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setSelectedEvent(null);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("10:00");
  const [newEventCategory, setNewEventCategory] = useState("personal");
  const [newEventIsAllDay, setNewEventIsAllDay] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
  
  const formatTimeTo12h = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    let h12 = parseInt(h, 10) % 12;
    if (h12 === 0) h12 = 12;
    const ampm = parseInt(h, 10) >= 12 ? "PM" : "AM";
    return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
  };
  
  const getLocalYMD = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };
  const [newEventDate, setNewEventDate] = useState(getLocalYMD(new Date()));
  const [newEventPriority, setNewEventPriority] = useState("Medium");

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handlePrevDate = () => {
    if (activeView === 'Daily') setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    else if (activeView === 'Weekly') setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextDate = () => {
    if (activeView === 'Daily') setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    else if (activeView === 'Weekly') setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => setCurrentDate(new Date());
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const handleOptimizeSchedule = () => {
    setIsOptimizing(true);
    setTimeout(() => {
          setEvents(prev => prev.map(ev => {
            if (ev.title.includes("Standup") || ev.title.includes("Sync")) {
               return { ...ev, top: ev.top + 80, timeString: "Updated by AI (1h Later)" };
            }
            return ev;
          }));
      setIsOptimizing(false);
    }, 1500);
  };
  const handleCreateEvent = () => {
    setNewEventDate(getLocalYMD(currentDate));
    setIsModalOpen(true);
  };
  
  const saveNewEvent = () => {
    if (!newEventTitle.trim()) return;
    
    const parsedDate = new Date(newEventDate);
    parsedDate.setMinutes(parsedDate.getMinutes() + parsedDate.getTimezoneOffset());
    const targetDate = parsedDate.toDateString();
    
    const formatTime = (timeStr: string) => {
      if (!timeStr) return "";
      const [hoursStr, minsStr] = timeStr.split(":");
      let hours = parseInt(hoursStr);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours.toString().padStart(2, '0')}:${minsStr} ${ampm}`;
    };

    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const [hours, mins] = timeStr.split(":").map(Number);
      return hours + mins / 60;
    };

    const startHourNum = newEventIsAllDay ? 0 : parseTime(newEventStartTime);
    let endHourNum = newEventIsAllDay ? 0 : parseTime(newEventEndTime);
    if (!newEventIsAllDay && endHourNum <= startHourNum) {
      endHourNum = startHourNum + 0.5;
    }
    const top = newEventIsAllDay ? 0 : Math.max(0, startHourNum * 80);
    const height = newEventIsAllDay ? 0 : (endHourNum - startHourNum) * 80;

    const newEv: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: newEventTitle,
      type: newEventCategory as any,
      date: targetDate,
      timeString: newEventIsAllDay ? "All Day" : `${formatTime(newEventStartTime)} - ${formatTime(newEventEndTime)}`,
      top: top,
      height: height,
      priority: newEventPriority as "High" | "Medium" | "Low",
      allDay: newEventIsAllDay,
    };
    
    setEvents([...events, newEv]);
    setIsModalOpen(false);
    setNewEventTitle("");
    setNewEventStartTime("09:00");
    setNewEventEndTime("10:00");
    setNewEventIsAllDay(false);
    setIsStartTimePickerOpen(false);
    setIsEndTimePickerOpen(false);
  };

  const toggleFilter = (name: string) => {
    setFilters(filters.map(f => f.name === name ? { ...f, active: !f.active } : f));
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay() || 7; 
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);
    return [0, 1, 2, 3, 4, 5, 6].map(offset => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      return d;
    });
  };
  const weekDays = getWeekDays(currentDate);

  const startHour = 0;
  const rowHeight = 80;
  const topOffset = (now.getHours() - startHour) * rowHeight + (now.getMinutes() / 60) * rowHeight;
  const activeColIndex = weekDays.findIndex(d => d.toDateString() === now.toDateString());

  const formattedMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const formattedFullDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  const visibleEvents = events.filter(ev => {
    // Map internal event type to UI filter name
    let filterName = "";
    switch(ev.type) {
      case "study": filterName = "College"; break;
      case "workout": 
      case "personal": filterName = "Personal"; break;
      case "meeting": filterName = "Meetings"; break;
      case "assignment": filterName = "Assignments"; break;
      case "project": filterName = "Projects"; break;
      case "hackathon": filterName = "Hackathons"; break;
      default: filterName = "Personal";
    }
    
    if (ev.completed) {
      const completedFilter = filters.find(f => f.name === "Completed");
      if (completedFilter && !completedFilter.active) return false;
    }
    
    const filterObj = filters.find(f => f.name === filterName);
    return filterObj ? filterObj.active : true;
  });

  const todayEvents = visibleEvents.filter(e => e.date === now.toDateString());
  const totalTasks = todayEvents.length;
  const totalMeetings = todayEvents.filter(e => e.type === 'meeting').length;
  const totalDeepWorkHours = todayEvents.reduce((acc, ev) => acc + (ev.allDay ? 0 : ev.height / 80), 0);
  const totalDeadlines = todayEvents.filter(e => e.priority === 'High').length;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full font-sans bg-[#F8FAFC] min-h-screen text-[#111827]">
      {/* 
        Core Layout & Grid System 
        Using a 4-column grid to achieve the 25% / 75% split 
      */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        
        {/* Left Panel (25% width on large screens) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* 1. Mini Calendar */}
          <div className="bg-white rounded-[20px] p-5 lg:p-6 border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#111827] text-[15px]">{formattedMonth}</h3>
              <div className="flex items-center gap-1">
                <button onClick={handlePrevMonth} className="p-1 text-[#9CA3AF] hover:text-[#111827] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={handleNextMonth} className="p-1 text-[#9CA3AF] hover:text-[#111827] transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-medium text-[#9CA3AF]">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-[13px] font-medium text-[#111827]">
              {/* Padding */}
              <div className="p-1.5 text-transparent">0</div>
              <div className="p-1.5 text-transparent">0</div>
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isToday = dateObj.toDateString() === now.toDateString();
                const isSelected = dateObj.toDateString() === currentDate.toDateString();
                
                return (
                  <div key={day} className="flex justify-center items-center">
                    <div 
                      onClick={() => setCurrentDate(dateObj)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors ${isSelected ? 'bg-[#10B981] text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]' : (isToday ? 'bg-gray-100 text-[#10B981] font-bold' : 'hover:bg-gray-100 text-[#111827]')}`}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 2. AI Schedule Summary Card */}
          <div className="bg-gradient-to-br from-[#ECFDF5]/80 to-[#CFFAFE]/80 backdrop-blur-md rounded-[20px] p-5 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3 relative overflow-hidden">
            {/* Subtle glow orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-semibold text-[#111827] text-[15px] z-10 flex items-center gap-1.5">
              ✨ AI Schedule - Today's Focus
            </h3>
            
            <div className="text-[12px] font-medium text-[#6B7280] leading-relaxed z-10 flex flex-wrap gap-x-2 gap-y-1">
              <span>• {totalTasks} Task{totalTasks !== 1 ? 's' : ''}</span>
              <span>• {totalMeetings} Meeting{totalMeetings !== 1 ? 's' : ''}</span>
              <span>• {totalDeepWorkHours}h Deep Work</span>
              <span className="text-[#059669]">• {totalDeadlines} Deadline{totalDeadlines !== 1 ? 's' : ''} Today</span>
            </div>
            
            <div className="bg-white/60 p-3 rounded-[12px] border border-white/40 mt-1 z-10">
              <p className="text-[13px] text-[#111827] font-medium leading-snug">
                Move your DSA session to 6 PM for a longer uninterrupted focus block.
              </p>
            </div>
            
            <button onClick={handleOptimizeSchedule} className="mt-2 w-full h-[38px] rounded-full bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-medium text-[13px] shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-[1px] z-10 flex items-center justify-center gap-2">
              {isOptimizing ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Optimizing...
                 </>
              ) : "Optimize My Schedule"}
            </button>
          </div>

          {/* 3. Filters */}
          <div className="bg-white rounded-[20px] p-5 lg:p-6 border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
            <h3 className="font-semibold text-[#111827] text-[15px] mb-4">Filters</h3>
            <div className="flex flex-col gap-3">
              {filters.map((filter) => (
                <label key={filter.name} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="hidden" checked={filter.active} onChange={() => toggleFilter(filter.name)} />
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${filter.active ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-300 group-hover:border-[#10B981]'}`}>
                    {filter.active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="flex-1 text-[14px] text-[#4B5563] font-medium">{filter.name}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${filter.color}`} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Panel (75% width on large screens) */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-100px)] min-h-[800px]">
          
          {/* Header Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
             {/* Left - Date Navigation */}
             <div className="flex items-center gap-3 bg-white rounded-full px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
                <button onClick={handlePrevDate} className="text-[#9CA3AF] hover:text-[#111827] transition-colors p-1 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold text-[#111827] text-[16px] min-w-[140px] text-center whitespace-nowrap">
                  {activeView === 'Daily' ? formattedFullDate : 
                   activeView === 'Monthly' ? formattedMonth : 
                   `${weekDays[0].toLocaleString('default', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </span>
                <button onClick={handleNextDate} className="text-[#9CA3AF] hover:text-[#111827] transition-colors p-1 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5" />
                </button>
             </div>
             
             {/* Center - View Toggles */}
             <div className="flex items-center gap-3">
               <button onClick={handleToday} className="h-[42px] px-5 bg-white rounded-full text-[14px] font-medium text-[#111827] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                 Today
               </button>
               <div className="flex items-center p-1 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
                 {["Daily", "Weekly", "Monthly"].map(view => (
                   <button 
                     key={view}
                     onClick={() => setActiveView(view)}
                     className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${activeView === view ? 'bg-[#F3F4F6] text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
                   >
                     {view}
                   </button>
                 ))}
               </div>
             </div>
             
             {/* Right - Action Button */}
             <button onClick={handleCreateEvent} className="flex items-center justify-center h-[42px] px-6 rounded-full bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-medium text-[14px] shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02]">
               + Create Event
             </button>
          </div>
          {/* Main Calendar Workspace (Timeline Grid) */}
          <div className="bg-white rounded-[20px] flex-1 flex flex-col border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            {activeView === "Monthly" ? (
              <div className="flex-1 flex flex-col bg-white">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F8FAFC]/50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="py-3 text-center text-[12px] font-medium text-[#6B7280] border-r border-[#E5E7EB] last:border-0">{day}</div>
                  ))}
                </div>
                {/* Monthly Grid Block */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-gray-50/30">
                  {(() => {
                    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                    const daysCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const cells = [];
                    for (let i = 0; i < 42; i++) {
                      const dateNum = i - firstDay + 1;
                      const isCurrentMonth = dateNum > 0 && dateNum <= daysCount;
                      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                      
                      const isToday = cellDate.toDateString() === now.toDateString();
                      const cellEvents = isCurrentMonth ? visibleEvents.filter(e => e.date === cellDate.toDateString()) : [];
                      
                      cells.push(
                        <div key={i} className={`border-r border-b border-[#E5E7EB] p-2 flex flex-col gap-1 min-h-[100px] hover:bg-gray-50/50 transition-colors ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : 'bg-white'}`}>
                          <div className="flex justify-between items-center mb-1">
                             <span className={`text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday && isCurrentMonth ? 'bg-[#10B981] text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-[#4B5563]'}`}>
                               {cellDate.getDate()}
                             </span>
                          </div>
                          <div className="flex-1 overflow-y-auto flex flex-col gap-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                            {cellEvents.map(ev => {
                              const style = getEventStyles(ev.type);
                              const priorityColor = ev.priority === "High" ? "bg-red-500" : ev.priority === "Medium" ? "bg-amber-500" : ev.priority === "Low" ? "bg-slate-400" : style.dot;
                              return (
                                <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`px-2 py-1 rounded-[4px] text-[10px] font-medium truncate cursor-pointer ${style.bg} ${style.text} border ${style.border} hover:opacity-80 transition-opacity flex items-center gap-1.5`}>
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} />
                                  <span className="truncate">{ev.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-x-hidden">
                {/* Header Row: Days */}
                <div className={`grid ${activeView === 'Daily' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,minmax(0,1fr))]'} border-b border-[#E5E7EB] bg-[#F8FAFC]/50 w-full box-border`}>
                  <div className="flex items-center justify-center p-4 border-r border-[#E5E7EB] sticky left-0 bg-[#F8FAFC]/90 backdrop-blur z-30">
                  <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider text-center">
                    {(() => {
                      const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      return systemTz ? (systemTz.split('/')[1]?.replace(/_/g, ' ') || systemTz) : "LOCAL TIME";
                    })()}
                  </span>
                </div>
                
                {/* Day Columns */}
                {(activeView === 'Daily' ? [currentDate] : weekDays).map((d, i) => {
                  const isToday = d.toDateString() === now.toDateString();
                  const dayName = d.toLocaleString('default', { weekday: 'long' });
                  const dateNum = d.getDate();
                  return (
                    <div key={i} className="flex flex-col items-center justify-center py-6 border-r border-[#E5E7EB] last:border-0 relative bg-white m-1 rounded-xl">
                      {isToday && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40px] h-[3px] bg-[#10B981] rounded-b-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      )}
                      <span className={`text-[12px] font-medium mb-1 transition-colors ${isToday ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}>{dayName}</span>
                      <span className={`text-[26px] font-semibold transition-colors ${isToday ? 'text-[#111827]' : 'text-[#4B5563]'}`}>{dateNum}</span>
                    </div>
                  );
                })}
              </div>
              
                {/* All-Day Event Row */}
                <div className={`grid ${activeView === 'Daily' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,minmax(0,1fr))]'} border-b border-[#E5E7EB] bg-white w-full box-border min-h-[40px]`}>
                  <div className="flex items-center justify-center p-2 border-r border-[#E5E7EB] sticky left-0 bg-white z-30">
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider text-center">All-Day</span>
                  </div>
                  
                  {/* All-Day Cells */}
                  {(activeView === 'Daily' ? [0] : [0, 1, 2, 3, 4, 5, 6]).map((colIndex) => {
                    const cellDate = activeView === 'Daily' ? currentDate.toDateString() : weekDays[colIndex].toDateString();
                    const allDayEvents = visibleEvents.filter(e => e.date === cellDate && e.allDay);
                    
                    return (
                      <div key={colIndex} className="border-r border-[#E5E7EB] last:border-0 p-1 flex flex-col gap-1 relative bg-white min-h-[40px]">
                        {allDayEvents.map(ev => {
                          const style = getEventStyles(ev.type);
                          const priorityColor = ev.priority === "High" ? "bg-red-500" : ev.priority === "Medium" ? "bg-amber-500" : ev.priority === "Low" ? "bg-slate-400" : style.dot;
                          return (
                            <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`px-2 py-1 rounded-[4px] text-[10px] font-medium truncate cursor-pointer ${style.bg} ${style.text} border ${style.border} hover:opacity-80 transition-opacity flex items-center gap-1.5`}>
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} />
                              <span className="truncate">{ev.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Scrollable Timeline Container */}
                <div className="flex-1 overflow-y-scroll relative pb-10 w-full h-[calc(100vh-120px)] box-border">
                
                {/* Current Time Indicator (Absolute Positioning over grid) */}
                {activeColIndex !== -1 && topOffset >= 0 && (
                  <div 
                    className="absolute z-0 flex items-center pointer-events-none transition-all duration-1000 ease-linear"
                    style={{
                      top: `${topOffset}px`,
                      left: activeView === 'Daily' ? '80px' : `calc(80px + (100% - 80px) * ${activeColIndex} / 7)`,
                      width: activeView === 'Daily' ? 'calc(100% - 80px)' : `calc((100% - 80px) / 7)`
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.8)] -ml-[5px] relative z-10 shrink-0" />
                    <div className="h-[2px] flex-1 bg-[#10B981]/40 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981] to-transparent animate-pulse" />
                    </div>
                  </div>
                )}
  
                {/* Hourly Grid Rows */}
                {[
                  "12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM",
                  "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM"
                ].map((time, idx) => (
                  <div key={time} className={`grid ${activeView === 'Daily' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,minmax(0,1fr))]'} min-h-[80px] group w-full box-border`}>
                    {/* Time Axis */}
                    <div className="border-r border-[rgba(0,0,0,0.05)] border-b border-[rgba(0,0,0,0.05)] relative bg-white sticky left-0 z-20">
                      <span className="absolute top-[-10px] right-4 text-[12px] font-medium text-[#9CA3AF]">
                        {time}
                      </span>
                    </div>
                    {/* Column Cells */}
                    {(activeView === 'Daily' ? [0] : [0, 1, 2, 3, 4, 5, 6]).map((colIndex) => (
                      <div key={colIndex} className="border-r border-[rgba(0,0,0,0.05)] border-b border-[rgba(0,0,0,0.05)] hover:bg-gray-50/30 transition-colors"></div>
                    ))}
                  </div>
                ))}
                
                {/* Event Cards Overlay */}
                <div className="absolute top-0 left-[80px] right-0 h-[1920px] pointer-events-none w-[calc(100%-80px)]">
                  {events.length === 0 && (
                    <div className="absolute top-20 left-0 right-0 flex justify-center z-30 pointer-events-auto">
                      <p className="text-slate-400 text-sm text-center py-4 px-6 bg-white/80 rounded-full backdrop-blur border border-slate-100 shadow-sm">No events scheduled for today</p>
                    </div>
                  )}
                  <div className={`grid ${activeView === 'Daily' ? 'grid-cols-1' : 'grid-cols-7'} h-full relative`}>
                    {(activeView === 'Daily' ? [0] : [0, 1, 2, 3, 4, 5, 6]).map((colIndex, renderIndex) => (
                      <div key={renderIndex} className="relative h-full w-full pointer-events-none">
                        {(() => {
                          const dayEvents = visibleEvents.filter(e => e.date === (activeView === 'Daily' ? currentDate.toDateString() : weekDays[colIndex].toDateString()) && !e.allDay).sort((a, b) => a.top - b.top);
                          const processedEvents: (CalendarEvent & { overlapIndex: number, overlapCount: number })[] = [];
                          let currentGroup: typeof dayEvents = [];
                          let groupEnd = 0;
  
                          dayEvents.forEach(ev => {
                            if (currentGroup.length === 0) {
                              currentGroup.push(ev);
                              groupEnd = ev.top + ev.height;
                            } else if (ev.top < groupEnd) {
                              currentGroup.push(ev);
                              groupEnd = Math.max(groupEnd, ev.top + ev.height);
                            } else {
                              currentGroup.forEach((ce, i) => {
                                processedEvents.push({ ...ce, overlapIndex: i, overlapCount: currentGroup.length });
                              });
                              currentGroup = [ev];
                              groupEnd = ev.top + ev.height;
                            }
                          });
                          currentGroup.forEach((ce, i) => {
                            processedEvents.push({ ...ce, overlapIndex: i, overlapCount: currentGroup.length });
                          });
  
                          return processedEvents.map((ev) => {
                            const style = getEventStyles(ev.type);
                            const priorityColor = ev.priority === "High" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" : ev.priority === "Medium" ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" : ev.priority === "Low" ? "bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.6)]" : style.dot;
                            
                            const widthStr = ev.overlapCount > 1 ? `calc(${100 / ev.overlapCount}% - 8px)` : 'auto';
                            const leftStr = ev.overlapCount > 1 ? `calc(${ev.overlapIndex * (100 / ev.overlapCount)}% + 4px)` : '8px';
                            const rightStr = ev.overlapCount === 1 ? '8px' : 'auto';
  
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className={`absolute rounded-[14px] p-3 shadow-sm border pointer-events-auto hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out cursor-pointer flex flex-col group overflow-hidden z-10 hover:z-20 ${style.bg} ${style.border}`}
                                style={{ top: `${ev.top}px`, height: `${ev.height}px`, width: widthStr, left: leftStr, right: rightStr }}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className={`text-[13px] font-semibold leading-tight break-words whitespace-normal line-clamp-2 ${style.text}`}>
                                    {ev.title}
                                  </h4>
                                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${priorityColor}`} />
                                </div>
                                
                                <div className={`flex items-center gap-1.5 text-[11px] font-medium ${ev.height > 60 ? 'mb-auto' : ''} ${style.text}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{ev.timeString}</span>
                                </div>
  
                                {ev.height > 60 && (ev.avatars || ev.completed) && (
                                  <div className="flex items-center justify-between mt-2">
                                    {ev.avatars && (
                                      <div className="flex -space-x-1.5">
                                        {ev.avatars.map((avatarSeed, i) => (
                                          <div key={i} className={`w-[22px] h-[22px] rounded-full bg-gray-200 border-2 overflow-hidden ${style.border}`}>
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}&backgroundColor=e5e7eb`} alt="avatar" />
                                          </div>
                                        ))}
                                        {ev.extraAvatars && (
                                          <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${style.border} ${style.extraBg} ${style.text}`}>
                                            +{ev.extraAvatars}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {ev.completed && (
                                      <CheckCircle2 className={`w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity ${style.text}`} />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Drawer Overlay for Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#111827]">Event Details</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedEvent(null)} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Drawer Content */}
            <div className="p-6 flex flex-col gap-6">
              <div>
                <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider mb-1">Title</div>
                <h3 className="text-[20px] font-semibold text-[#111827]">{selectedEvent.title}</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[#10B981]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Scheduled Time</div>
                  <div className="text-[14px] font-medium text-[#111827]">{selectedEvent.timeString}</div>
                </div>
              </div>
              
              <div>
                <div className="text-[12px] font-medium text-[#6B7280] mb-3">Participants</div>
                <div className="flex gap-2">
                  {selectedEvent.avatars ? selectedEvent.avatars.map(s => (
                    <img key={s} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${s}&backgroundColor=e5e7eb`} className="w-10 h-10 rounded-full border border-gray-200" alt="avatar" />
                  )) : (
                    <span className="text-[13px] text-gray-500 italic">No external participants</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-[440px] bg-white rounded-[20px] shadow-2xl p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-[20px] font-semibold text-[#111827] mb-6">Create New Event</h2>
            
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Event Title</label>
                <input 
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Weekly Standup"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
                  autoFocus
                />
              </div>
              <div className="relative">
                <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Date</label>
                <div 
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] flex items-center cursor-pointer hover:border-[#10B981] transition-all"
                >
                  {new Date(newEventDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {isDatePickerOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-4 z-[1100] w-[260px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold">{pickerDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.preventDefault(); setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1)); }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.preventDefault(); setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1)); }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 mb-2">
                      <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-medium text-gray-700">
                      {(() => {
                        const days = getDaysInMonth(pickerDate.getFullYear(), pickerDate.getMonth());
                        const firstDay = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();
                        const cells = [];
                        for(let i=0; i<firstDay; i++) cells.push(<div key={`empty-${i}`} className="p-1 text-transparent">0</div>);
                        for(let i=1; i<=days; i++) {
                          const d = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), i);
                          const isSelected = d.toDateString() === new Date(newEventDate).toDateString();
                          cells.push(
                            <div 
                              key={i} 
                              onClick={() => { setNewEventDate(getLocalYMD(d)); setIsDatePickerOpen(false); }}
                              className={`p-1 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-[#10B981] text-white hover:bg-[#10B981]' : ''}`}
                            >
                              {i}
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer group mb-4">
                  <input type="checkbox" checked={newEventIsAllDay} onChange={(e) => setNewEventIsAllDay(e.target.checked)} className="hidden" />
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${newEventIsAllDay ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-300 group-hover:border-[#10B981]'}`}>
                    {newEventIsAllDay && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[13px] font-medium text-[#4B5563]">All-Day Event</span>
                </label>
                
                <div className={`grid grid-cols-2 gap-4 transition-opacity ${newEventIsAllDay ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="relative">
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Start Time</label>
                    <div 
                      onClick={() => !newEventIsAllDay && setIsStartTimePickerOpen(!isStartTimePickerOpen)}
                      className={`w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] flex items-center cursor-pointer transition-all ${!newEventIsAllDay && 'hover:border-[#10B981]'}`}
                    >
                      {formatTimeTo12h(newEventStartTime)}
                    </div>
                    {isStartTimePickerOpen && !newEventIsAllDay && (
                      <TimePickerDial 
                        value={newEventStartTime} 
                        onChange={setNewEventStartTime} 
                        onClose={() => setIsStartTimePickerOpen(false)} 
                      />
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">End Time</label>
                    <div 
                      onClick={() => !newEventIsAllDay && setIsEndTimePickerOpen(!isEndTimePickerOpen)}
                      className={`w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] flex items-center cursor-pointer transition-all ${!newEventIsAllDay && 'hover:border-[#10B981]'}`}
                    >
                      {formatTimeTo12h(newEventEndTime)}
                    </div>
                    {isEndTimePickerOpen && !newEventIsAllDay && (
                      <TimePickerDial 
                        value={newEventEndTime} 
                        onChange={setNewEventEndTime} 
                        onClose={() => setIsEndTimePickerOpen(false)} 
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Category</label>
                  <select 
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="personal">Personal</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workout">Workout</option>
                    <option value="study">Study</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Priority</label>
                  <select 
                    value={newEventPriority}
                    onChange={(e) => setNewEventPriority(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 h-10 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveNewEvent}
                className="px-5 h-10 rounded-[10px] bg-[#111827] text-white text-[14px] font-medium hover:bg-black transition-colors"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
