"use client";

import React, { useState } from "react";
import { 
  Zap, 
  CalendarRange, 
  Sliders, 
  GripVertical, 
  Check, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Server,
  Coffee,
  CheckCircle2,
  Target,
  Timer,
  Brain,
  Activity,
  BarChart3
} from "lucide-react";
import { useFocus, type CalendarEvent } from "@/context/focus-context";

type GeneratedStep = {
  id: string;
  title: string;
  durationHours: number;
  priority: "High" | "Medium" | "Low";
  type: "study" | "project" | "personal" | "meeting" | "assignment" | "hackathon" | "workout";
  checked: boolean;
  startTime?: string;
  endTime?: string;
  list?: "todo" | "today";
};

export const PlannerView: React.FC = () => {
  const { 
    calendarEvents: events, 
    setCalendarEvents: setEvents, 
    setRoadmapTasks, 
    updateTelemetry,
    plannerBlueprint,
    setPlannerBlueprint 
  } = useFocus();

  const [roadmapView, setRoadmapView] = useState<'input' | 'generated'>('input');
  const [generatedSteps, setGeneratedSteps] = useState<GeneratedStep[]>([]);
  
  const activeGoal = plannerBlueprint.activeGoal;
  const availableHours = plannerBlueprint.availableHours;
  const peakHours = plannerBlueprint.peakFocusWindow;
  const smartBufferSlots = plannerBlueprint.smartBufferSlots;
  const targetDate = plannerBlueprint.targetDate;

  const setActiveGoal = (val: string) => setPlannerBlueprint(p => ({ ...p, activeGoal: val }));
  const setAvailableHours = (val: number) => setPlannerBlueprint(p => ({ ...p, availableHours: val }));
  const setPeakHours = (val: any) => setPlannerBlueprint(p => ({ ...p, peakFocusWindow: val }));
  const setSmartBufferSlots = (val: boolean) => setPlannerBlueprint(p => ({ ...p, smartBufferSlots: val }));
  const setTargetDate = (val: string | null) => setPlannerBlueprint(p => ({ ...p, targetDate: val }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = async () => {
    if (!activeGoal.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeGoal,
          availableHours,
          peakFocusWindow: peakHours,
          currentDate: new Date().toISOString().split('T')[0],
          smartBufferSlots
        })
      });

      if (!response.ok) throw new Error("Failed to fetch roadmap");
      const data = await response.json();
      
      if (data.steps && data.steps.length > 0) {
        setGeneratedSteps(data.steps);
        const focusTasks = data.steps.map((s: GeneratedStep) => ({ ...s, checked: false, list: 'todo' as const }));
        setRoadmapTasks(focusTasks);
        updateTelemetry("totalTasksCreated", p => p + focusTasks.length);
        if (data.targetDate) {
          // Convert "YYYY-MM-DD" to matching calendar grid format
          const d = new Date(data.targetDate + "T12:00:00Z");
          setTargetDate(d.toDateString());
        } else {
          setTargetDate(null);
        }
      } else {
        throw new Error("No steps returned");
      }
      
      setRoadmapView('generated');
    } catch (err) {
      console.error(err);
      // Mock Fallback
      const mockSteps: GeneratedStep[] = [
        { id: "step-1", title: "Review Core Theory & Formulas", durationHours: 1.5, priority: "High", type: "study", checked: true },
        { id: "step-2", title: "Solve Textbook Exercises & Examples", durationHours: 2, priority: "High", type: "assignment", checked: true },
        { id: "step-3", title: "Practice Speed Drills", durationHours: 1.5, priority: "Medium", type: "study", checked: true },
        { id: "step-4", title: "Self-Assessment Quiz", durationHours: 1, priority: "Medium", type: "personal", checked: true }
      ];
      setGeneratedSteps(mockSteps);
      const mockFocusTasks = mockSteps.map(s => ({ ...s, checked: false, list: 'todo' as const }));
      setRoadmapTasks(mockFocusTasks);
      updateTelemetry("totalTasksCreated", p => p + mockFocusTasks.length);
      setRoadmapView('generated');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetPlanner = () => {
    setActiveGoal('');
    setAvailableHours(8);
    setPeakHours('morning');
    setSmartBufferSlots(true);
    setGeneratedSteps([]);
    setRoadmapTasks([]);
    setRoadmapView('input');
  };

  const toggleStep = (id: string) => {
    setGeneratedSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const handleSyncToCalendar = () => {
    const activeSteps = generatedSteps.filter(s => s.checked);
    if (activeSteps.length === 0) return;

    const parseTimeStr = (tStr: string) => {
      const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return (h + m / 60) * 80;
    };

    // Calculate dynamic start time based on preferred peak focus
    const startHour = peakHours === 'morning' ? 8 : peakHours === 'afternoon' ? 12 : 18;
    let currentTop = startHour * 80; // 80px per hour
    const eventDateStr = targetDate || new Date().toDateString();
    
    const newEvents: CalendarEvent[] = activeSteps.map((step, idx) => {
      let top = currentTop;
      let height = step.durationHours * 80;
      let timeString = "";

      if (step.startTime && step.endTime) {
        top = parseTimeStr(step.startTime);
        height = parseTimeStr(step.endTime) - top;
        timeString = `${step.startTime} - ${step.endTime}`;
        // Update currentTop for fallback if mixing formats
        currentTop = top;
      } else {
        const startTimeH = Math.floor(currentTop / 80);
        const startTimeM = Math.round((currentTop % 80) / 80 * 60);
        const endTimeH = Math.floor((currentTop + height) / 80);
        const endTimeM = Math.round(((currentTop + height) % 80) / 80 * 60);
        
        const formatTime = (h: number, m: number) => {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        };

        timeString = `${formatTime(startTimeH, startTimeM)} - ${formatTime(endTimeH, endTimeM)}`;
      }
      
      const newEvent: CalendarEvent = {
        id: `ai-gen-${Date.now()}-${idx}`,
        date: eventDateStr,
        top: top,
        height: height,
        type: step.type,
        title: step.title,
        timeString: timeString,
        priority: step.priority,
      };
      
      currentTop += height + (smartBufferSlots ? 20 : 0); // 15 mins buffer roughly if enabled
      
      return newEvent;
    });

    setEvents(prev => [...prev, ...newEvents]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getEventStyles = (type: string) => {
    switch(type) {
      case 'hackathon': return { bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', dot: 'bg-[#9333EA]', border: 'border-white/60' };
      case 'meeting': return { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', dot: 'bg-[#0284C7]', border: 'border-white/60' };
      case 'assignment': return { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]', border: 'border-white/60' };
      case 'personal': return { bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]', dot: 'bg-[#DB2777]', border: 'border-white/60' };
      case 'workout': return { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', dot: 'bg-[#D97706]', border: 'border-white/60' };
      case 'study': return { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]', dot: 'bg-[#7C3AED]', border: 'border-white/60' };
      case 'project': return { bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]', dot: 'bg-[#0D9488]', border: 'border-white/60' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', border: 'border-white/60' };
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full font-manrope bg-[#F3F6FA] min-h-screen text-[#111827]">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-[34px] font-bold text-slate-800 tracking-tight leading-tight">
              AI Engine Planner
            </h1>
            <p className="text-[15px] text-[#6B7280] font-medium">
              Intelligent scheduling for your peak performance hours.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#6B7280] text-[14px] font-medium bg-white px-4 py-2 rounded-full border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <CalendarRange className="h-4 w-4 text-emerald-500" />
          <span>{new Date().toDateString()}</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 p-6">
        
        {/* LEFT COLUMN: Input & Generation */}
        <div className="w-full xl:w-[500px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Main Generate Box */}
          <div className="bg-white rounded-[22px] border border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 transition-transform hover:-translate-y-1 duration-300">
            <h2 className="text-[20px] font-semibold text-slate-800 mb-1">What's Your Mission Today?</h2>
            <p className="text-[14px] text-gray-500 mb-6">Describe your goal and DeadlineAI will generate the smartest execution strategy for you.</p>
            
            <textarea
              value={activeGoal}
              onChange={(e) => setActiveGoal(e.target.value)}
              placeholder="e.g., Crush advanced matrices end-sem prep, train the automated e-waste detection model, or secure a flawless gaming session..."
              rows={4}
              className="mt-2 w-full min-h-[130px] h-32 p-5 rounded-2xl border border-slate-200/60 bg-white text-slate-800 shadow-sm transition-all resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base leading-relaxed placeholder:text-slate-400"
            />
          </div>

          {/* Card 2: Optimization Panel */}
          <div className="bg-white rounded-[22px] border border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="h-5 w-5 text-emerald-500" />
              <h3 className="text-[13px] font-medium uppercase tracking-widest text-emerald-600">⚙️ Focus Blueprint</h3>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[14px] font-semibold text-slate-700">⏳ My Available Hours</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[14px]">{availableHours}h</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
              />
            </div>

            {/* Peak Focus Chips */}
            <div className="mb-8">
              <label className="text-[14px] font-semibold text-slate-700 block mb-3">⚡ My Peak Energy</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "morning", label: "Morning" },
                  { value: "afternoon", label: "Afternoon" },
                  { value: "night", label: "Night" }
                ].map((item) => {
                  const selected = peakHours === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setPeakHours(item.value as any)}
                      className={`py-3 rounded-[12px] text-[14px] font-medium text-center transition-all duration-200 active:scale-95 border ${
                        selected 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20" 
                          : "bg-[#F8FAFC] border-gray-100 text-gray-500 hover:border-emerald-200 hover:text-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buffer Switch */}
            <div className="flex items-center justify-between w-full gap-4 p-4 bg-[#F8FAFC] rounded-[16px] border border-gray-100">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-slate-700 mb-0.5">🛡️ Smart Buffer Slots</span>
                <span className="text-[13px] text-gray-500">Add 15m breaks between intense tasks</span>
              </div>
              <div 
                onClick={() => setSmartBufferSlots(!smartBufferSlots)}
                className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out flex items-center ${
                  smartBufferSlots ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' : 'bg-slate-700'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    smartBufferSlots ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 w-full">
              <button
                onClick={handleResetPlanner}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-slate-500 hover:text-slate-700 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap h-14"
              >
                Reset Planner
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !activeGoal.trim()}
                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-[16px] font-semibold text-[15px] text-white transition-all duration-300 active:scale-[0.98] ${
                  isGenerating || !activeGoal.trim() 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_24px_rgba(16,185,129,0.35)]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Goal...
                  </>
                ) : (
                  <>
                    ✨ Generate AI Strategy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {roadmapView === 'input' ? (
            // Premium AI Assistant Empty State
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-[22px] border border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center min-h-[400px] p-12 text-center transition-transform hover:-translate-y-1 duration-300">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-[24px] rotate-3 border border-white shadow-lg flex items-center justify-center relative z-10">
                    <Sparkles className="absolute top-2 right-2 w-4 h-4 text-cyan-400 animate-pulse" />
                    <Zap className="h-10 w-10 text-emerald-500" />
                  </div>
                  {/* Floating Particles */}
                  <div className="absolute -top-4 -left-4 w-3 h-3 bg-lavender-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.2s', backgroundColor: '#C084FC' }} />
                  <div className="absolute -bottom-2 -right-6 w-2 h-2 bg-amber-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
                <h2 className="text-[24px] font-bold text-slate-800 mb-3">AI Planning Assistant</h2>
                <h3 className="text-[16px] font-semibold text-emerald-600 mb-4">Waiting for your mission.</h3>
                <p className="text-gray-500 text-[15px] max-w-md leading-relaxed">
                  Your personalized roadmap, optimized schedule, and AI recommendations will appear here once you describe your goal.
                </p>
              </div>

              {/* AI Insights Placeholders */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Timer, label: "Est. Duration", value: "--", color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Brain, label: "Deep Work", value: "--", color: "text-purple-500", bg: "bg-purple-50" },
                  { icon: Activity, label: "AI Confidence", value: "--", color: "text-emerald-500", bg: "bg-emerald-50" },
                  { icon: BarChart3, label: "Productivity", value: "--", color: "text-amber-500", bg: "bg-amber-50" }
                ].map((insight, i) => (
                  <div key={i} className="bg-white rounded-[16px] border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
                    <div className={`w-8 h-8 rounded-full ${insight.bg} flex items-center justify-center mb-3`}>
                      <insight.icon className={`w-4 h-4 ${insight.color}`} />
                    </div>
                    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">{insight.label}</span>
                    <span className="text-[16px] font-bold text-slate-800">{insight.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Generated Stepper Timeline
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-[22px] border border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-[20px] font-bold text-slate-800 mb-1">Execution Roadmap</h2>
                    <p className="text-[14px] text-gray-500">{generatedSteps.length} Steps Optimized</p>
                  </div>
                  <button 
                    onClick={handleSyncToCalendar}
                    className="px-6 py-2.5 bg-white border border-gray-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-600 rounded-[12px] font-semibold text-[14px] shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <CalendarRange className="h-4 w-4" /> Sync to Calendar
                  </button>
                </div>

                <div className="space-y-4">
                  {generatedSteps.map((step, index) => {
                    const style = getEventStyles(step.type);
                    const priorityColor = step.priority === "High" ? "bg-red-500" : step.priority === "Medium" ? "bg-amber-500" : style.dot;
                    
                    return (
                      <div key={step.id} className="group flex items-start gap-4">
                        {/* Stepper Line */}
                        <div className="flex flex-col items-center mt-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 ${step.checked ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                            {index + 1}
                          </div>
                          {index !== generatedSteps.length - 1 && (
                            <div className="w-[2px] h-full min-h-[40px] bg-gray-100 my-1 group-hover:bg-emerald-100 transition-colors" />
                          )}
                        </div>

                        {/* Task Card */}
                        <div className={`flex-1 flex items-center gap-4 p-5 rounded-[22px] border transition-all duration-300 ${step.checked ? `${style.bg} ${style.border} shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:-translate-y-0.5` : 'border-gray-100 bg-[#F8FAFC] opacity-70 grayscale'}`}>
                          <GripVertical className={`h-5 w-5 ${step.checked ? style.text : 'text-gray-300'} opacity-50 cursor-grab active:cursor-grabbing hover:opacity-100 transition-opacity`} />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
                              <h4 className={`text-[16px] font-semibold ${step.checked ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                {step.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4">
                              {step.startTime && step.endTime ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/60 ${style.text} text-[13px] font-medium`}>
                                  <Clock className="h-3.5 w-3.5" /> {step.startTime} - {step.endTime}
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/60 ${style.text} text-[13px] font-medium`}>
                                  <Clock className="h-3.5 w-3.5" /> {step.durationHours}h
                                </span>
                              )}
                              <span className={`text-[13px] font-medium uppercase tracking-wider ${style.text} opacity-80`}>{step.type}</span>
                            </div>
                          </div>

                          <label className="relative flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.checked}
                              onChange={() => toggleStep(step.id)}
                              className="hidden"
                            />
                            <div className={`w-7 h-7 rounded-[10px] border-2 flex items-center justify-center transition-all ${step.checked ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-white border-gray-300'}`}>
                              {step.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* AI Insights Placeholders for Generated State */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Timer, label: "Total Duration", value: `${generatedSteps.reduce((acc, curr) => acc + curr.durationHours, 0)}h`, color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Brain, label: "Deep Work", value: "High", color: "text-purple-500", bg: "bg-purple-50" },
                  { icon: Activity, label: "AI Confidence", value: "98%", color: "text-emerald-500", bg: "bg-emerald-50" },
                  { icon: BarChart3, label: "Focus Quality", value: "Optimal", color: "text-amber-500", bg: "bg-amber-50" }
                ].map((insight, i) => (
                  <div key={i} className="bg-white rounded-[16px] border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
                    <div className={`w-8 h-8 rounded-full ${insight.bg} flex items-center justify-center mb-3`}>
                      <insight.icon className={`w-4 h-4 ${insight.color}`} />
                    </div>
                    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">{insight.label}</span>
                    <span className="text-[16px] font-bold text-slate-800">{insight.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-800 rounded-[16px] shadow-2xl border border-slate-700 p-4 px-6 flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-[14px]">Mission Synced</h4>
            <p className="text-slate-300 text-[13px]">{generatedSteps.filter(s => s.checked).length} blocks deployed to calendar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
