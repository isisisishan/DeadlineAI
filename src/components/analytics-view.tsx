"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFocus } from "@/context/focus-context";
import { ChevronDown, Sparkles } from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const AnalyticsView: React.FC = () => {
  const { roadmapTasks, telemetry, calendarEvents, plannerBlueprint } = useFocus();
  const [timeFrame, setTimeFrame] = useState<'today' | 'week' | 'month' | 'year'>('week');

  // Time-Filter Scaling Logic
  const getMultiplier = (tf: string) => {
    switch (tf) {
      case 'today': return 0.2; 
      case 'week': return 1;
      case 'month': return 4;
      case 'year': return 48;
      default: return 1;
    }
  };

  const multiplier = getMultiplier(timeFrame);

  // Metrics Logic
  const scaledFocusMinutes = Math.round(telemetry.focusMinutesLogged * multiplier);
  const sessions = Math.floor(scaledFocusMinutes / 25);
  const totalTasks = Math.round((telemetry.totalTasksCreated || roadmapTasks.length) * multiplier) || 1;
  const completedTasks = Math.round((telemetry.completedTasksCount || roadmapTasks.filter(t => t.checked).length) * multiplier);
  const completionVelocity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const timeSpentHours = (scaledFocusMinutes / 60).toFixed(2);

  // Categorical Data for Donut Chart
  const categoryData = useMemo(() => {
    const total = roadmapTasks.length;
    if (total === 0) return [];

    const typeCounts: Record<string, number> = {};
    roadmapTasks.forEach(task => {
      const type = task.type || "general";
      const formattedName = type.charAt(0).toUpperCase() + type.slice(1);
      typeCounts[formattedName] = (typeCounts[formattedName] || 0) + 1;
    });

    const colors = ["#8B5CF6", "#06B6D4", "#F97316", "#10B981", "#EC4899", "#3B82F6", "#F43F5E"];
    return Object.entries(typeCounts).map(([name, count], idx) => ({
      name,
      value: count,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [roadmapTasks]);

  // Gemini AI Fetch
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      setIsAiLoading(true);
      try {
        const res = await fetch("/api/analytics/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            telemetry,
            tasks: roadmapTasks,
            calendar: calendarEvents,
            energyWindow: plannerBlueprint
          })
        });
        const data = await res.json();
        setAiReport(data.report);
      } catch (e) {
        console.error(e);
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchAudit();
  }, [telemetry]);

  const formatMarkdown = (md: string) => {
    return md.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-[16px] font-bold text-slate-800 mt-5 mb-2">{line.replace('### ', '')}</h4>;
      } else if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="text-[14px] text-slate-600 mb-2 leading-relaxed">
            {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-slate-800">{part}</strong> : part)}
          </p>
        );
      } else if (line.trim() !== '') {
        return <p key={i} className="text-[14px] text-slate-600 mb-2 leading-relaxed">{line}</p>;
      }
      return null;
    });
  };

  // Dynamic Chart Data Generator
  const generateChartData = (tf: string) => {
    // 0 to 100 bounds for fatigue based on actions
    const fBase = Math.min(100, (telemetry.pauseTriggerCount * 10) + (telemetry.abandonedTimerCount * 25));
    // 0 to 100 bounds for focus based on an arbitrary baseline daily goal
    const focusBase = Math.max(15, Math.min(100, (telemetry.focusMinutesLogged / 120) * 100));
    
    // Empty state logic: If nothing has been logged, render a flat baseline
    if (telemetry.focusMinutesLogged === 0 && telemetry.completedTasksCount === 0) {
       const len = tf === 'today' ? 8 : tf === 'month' ? 4 : tf === 'year' ? 12 : 7;
       return {
         session: Array.from({length: len}, () => ({ value: 0 })),
         velocity: Array.from({length: len}, () => ({ value: 0 })),
         time: Array.from({length: len}, () => ({ value: 0 })),
         dualLine: [
            { name: "Start", focus: 0, fatigue: 0 },
            { name: "Now", focus: 0, fatigue: 0 }
         ],
         bar: [
            { time: "Start", focus: 0 },
            { time: "Now", focus: 0 }
         ]
       };
    }

    if (tf === 'today') {
       return {
         session: Array.from({length: 8}, () => ({ value: Math.floor(Math.random() * 5 + 1) })),
         velocity: Array.from({length: 8}, () => ({ value: Math.floor(Math.random() * 40 + 30) })),
         time: Array.from({length: 8}, () => ({ value: Number((Math.random() * 1.5).toFixed(1)) })),
         dualLine: [
            { name: "9 AM", focus: Math.min(100, focusBase * 0.5), fatigue: Math.min(100, fBase * 0.2 + 5) },
            { name: "11 AM", focus: Math.min(100, focusBase * 0.9), fatigue: Math.min(100, fBase * 0.3 + 12) },
            { name: "1 PM", focus: Math.min(100, focusBase * 0.4), fatigue: Math.min(100, fBase * 0.5 + 20) },
            { name: "3 PM", focus: Math.min(100, focusBase * 1.2), fatigue: Math.min(100, fBase * 0.3 + 10) },
            { name: "5 PM", focus: Math.min(100, focusBase * 0.8), fatigue: Math.min(100, fBase * 0.7 + 25) },
         ],
         bar: [
            { time: "9 AM", focus: 15 }, { time: "11 AM", focus: 30 },
            { time: "1 PM", focus: 10 }, { time: "3 PM", focus: 45 }, { time: "5 PM", focus: 20 },
         ]
       };
    } else if (tf === 'month') {
       return {
         session: Array.from({length: 4}, () => ({ value: Math.floor(Math.random() * 40 + 30) })),
         velocity: Array.from({length: 4}, () => ({ value: Math.floor(Math.random() * 60 + 35) })),
         time: Array.from({length: 4}, () => ({ value: Number((Math.random() * 15 + 10).toFixed(1)) })),
         dualLine: [
            { name: "Wk 1", focus: Math.min(100, focusBase * 0.8), fatigue: Math.min(100, fBase * 0.6 + 15) },
            { name: "Wk 2", focus: Math.min(100, focusBase * 0.7), fatigue: Math.min(100, fBase * 0.8 + 20) },
            { name: "Wk 3", focus: Math.min(100, focusBase * 1.1), fatigue: Math.min(100, fBase * 0.5 + 10) },
            { name: "Wk 4", focus: Math.min(100, focusBase * 1.2), fatigue: Math.min(100, fBase * 0.4 + 5) },
         ],
         bar: [
            { time: "Wk 1", focus: 450 }, { time: "Wk 2", focus: 380 },
            { time: "Wk 3", focus: 520 }, { time: "Wk 4", focus: 610 },
         ]
       };
    } else if (tf === 'year') {
       return {
         session: Array.from({length: 12}, () => ({ value: Math.floor(Math.random() * 150 + 100) })),
         velocity: Array.from({length: 12}, () => ({ value: Math.floor(Math.random() * 70 + 30) })),
         time: Array.from({length: 12}, () => ({ value: Number((Math.random() * 60 + 40).toFixed(1)) })),
         dualLine: [
            { name: "Q1", focus: Math.min(100, focusBase * 0.8), fatigue: Math.min(100, fBase * 0.5 + 20) },
            { name: "Q2", focus: Math.min(100, focusBase * 0.7), fatigue: Math.min(100, fBase * 0.7 + 25) },
            { name: "Q3", focus: Math.min(100, focusBase * 0.9), fatigue: Math.min(100, fBase * 0.4 + 15) },
            { name: "Q4", focus: Math.min(100, focusBase * 1.1), fatigue: Math.min(100, fBase * 0.3 + 10) },
         ],
         bar: [
            { time: "Q1", focus: 1800 }, { time: "Q2", focus: 1500 },
            { time: "Q3", focus: 2100 }, { time: "Q4", focus: 2400 },
         ]
       };
    } else { // week
       return {
         session: Array.from({length: 7}, () => ({ value: Math.floor(Math.random() * 15 + 10) })),
         velocity: Array.from({length: 7}, () => ({ value: Math.floor(Math.random() * 50 + 40) })),
         time: Array.from({length: 7}, () => ({ value: Number((Math.random() * 3 + 2).toFixed(1)) })),
         dualLine: [
            { name: "Mon", focus: Math.min(100, focusBase * 0.6), fatigue: Math.min(100, fBase * 0.5 + 15) },
            { name: "Tue", focus: Math.min(100, focusBase * 0.5), fatigue: Math.min(100, fBase * 0.5 + 15) },
            { name: "Wed", focus: Math.min(100, focusBase * 0.9), fatigue: Math.min(100, fBase * 0.3 + 20) },
            { name: "Thu", focus: Math.min(100, focusBase * 0.7), fatigue: Math.min(100, fBase * 0.4 + 18) },
            { name: "Fri", focus: Math.min(100, focusBase * 1.0), fatigue: Math.min(100, fBase * 0.2 + 25) },
            { name: "Sat", focus: Math.min(100, focusBase * 0.6), fatigue: Math.min(100, fBase * 0.6 + 10) },
            { name: "Sun", focus: Math.min(100, focusBase * 1.2), fatigue: Math.min(100, fBase * 0.1 + 5) },
         ],
         bar: [
            { time: "Mon", focus: 120 }, { time: "Tue", focus: 90 }, { time: "Wed", focus: 160 },
            { time: "Thu", focus: 110 }, { time: "Fri", focus: 200 }, { time: "Sat", focus: 60 }, { time: "Sun", focus: 40 },
         ]
       };
    }
  };

  const emptyChartData = {
    session: Array.from({length: 7}, () => ({ value: 0 })),
    velocity: Array.from({length: 7}, () => ({ value: 0 })),
    time: Array.from({length: 7}, () => ({ value: 0 })),
    dualLine: [ { name: "Start", focus: 0, fatigue: 0 }, { name: "Now", focus: 0, fatigue: 0 } ],
    bar: [ { time: "Start", focus: 0 }, { time: "Now", focus: 0 } ]
  };

  const [chartData, setChartData] = useState(emptyChartData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setChartData(generateChartData(timeFrame));
  }, [timeFrame, telemetry, multiplier]);

  if (!isMounted) return null;
  const timeSelector = (
    <select 
      value={timeFrame}
      onChange={(e) => setTimeFrame(e.target.value as any)}
      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-500 cursor-pointer outline-none hover:bg-slate-50 transition-all shadow-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
    >
      <option value="today">Today</option>
      <option value="week">Last week</option>
      <option value="month">This month</option>
      <option value="year">This year</option>
    </select>
  );

  return (
    <div className="w-full bg-[#F8F9FD] min-h-[calc(100vh-4rem)] p-8 text-slate-800 rounded-[24px] font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold tracking-tight text-slate-800">Dashboard</h2>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Sessions */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-slate-700">Sessions</h3>
              </div>
              <div className="text-[32px] font-bold tracking-tight text-slate-900 leading-none mb-1">
                {sessions}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {timeSelector}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.session} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Task Velocity */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-slate-700">Task Velocity</h3>
              </div>
              <div className="text-[32px] font-bold tracking-tight text-slate-900 leading-none mb-1">
                {Math.round(completionVelocity)}%
              </div>
            </div>
            <div className="flex items-center gap-1">
              {timeSelector}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.velocity} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Time Spent */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-slate-700">Time spent</h3>
              </div>
              <div className="text-[32px] font-bold tracking-tight text-slate-900 leading-none mb-1">
                {timeSpentHours}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {timeSelector}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.time} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorTime)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CENTER METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Dual-Line Area Chart (Focus vs Fatigue) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800">Focus Efficiency vs. Behavioral Fatigue</h3>
            <div className="flex items-center gap-4 text-[12px] font-medium">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Focus Efficiency
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Behavioral Fatigue
              </div>
              <div className="flex items-center gap-1">
                {timeSelector}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.dualLine} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFatigue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                <Area type="monotone" dataKey="focus" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFocus)" />
                <Area type="monotone" dataKey="fatigue" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFatigue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Focus Distribution Bar Chart */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800">Focus Distribution</h3>
            <div className="flex items-center gap-1">
              {timeSelector}
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.bar} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                />
                <Bar dataKey="focus" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: DONUT & AI AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Category Donut */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-[380px]">
          <h3 className="text-[16px] font-bold text-slate-800 mb-4">Task Category Breakdown</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-[180px] relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[12px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
                <span className="text-[20px] font-bold text-slate-800">{roadmapTasks.length}</span>
              </div>
            </div>

            {/* Custom Vertical Legend */}
            <div className="w-full flex flex-col gap-3 px-2">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[12px] font-medium text-slate-600 truncate max-w-[140px]">{cat.name}</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini AI Executive Performance Audit */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col relative overflow-hidden h-[380px]">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500" />
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-[16px] font-bold text-slate-800">Gemini Executive Performance Audit</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {isAiLoading || !aiReport ? (
                <div className="flex flex-col gap-4 animate-pulse pt-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                  
                  <div className="h-4 bg-slate-100 rounded w-1/4 mt-4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              ) : (
                <div className="pb-4">
                  {formatMarkdown(aiReport)}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
