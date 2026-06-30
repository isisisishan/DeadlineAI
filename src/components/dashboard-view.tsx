"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useFocus } from "@/context/focus-context";
import { dbService, Task, DailySchedule, AIMemory } from "@/lib/db";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, doc, setDoc, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Zap, 
  Target, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  BrainCircuit, 
  CalendarRange, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Edit2,
  Save,
  Clock,
  CheckSquare,
  Timer,
  ChevronDown,
  BarChart2,
  BarChart,
  MessageSquare
} from "lucide-react";
import confetti from "canvas-confetti";

export const DashboardView: React.FC = () => {
  const { user, updateMemory } = useAuth();
  const { isFocusMode, setIsFocusMode, activeTaskId, startFocus, stopFocus, setActiveTab, setSelectedDate, telemetry, roadmapTasks } = useFocus();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const hasSeededRef = useRef(false);

  // Focus Timer States
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<any>(null);

  // 2-Minute Timer
  const [twoMinTime, setTwoMinTime] = useState(120);
  const [twoMinRunning, setTwoMinRunning] = useState(false);
  const twoMinInterval = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro Timer
  const [pomoMode, setPomoMode] = useState<"focus" | "break">("focus");
  const [pomoTime, setPomoTime] = useState(25 * 60); // 25 mins
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoInterval = useRef<NodeJS.Timeout | null>(null);

  // AI Quote State
  const [aiQuote, setAiQuote] = useState(
    "Procrastination is emotional regulation, not laziness. Let's start with a single, tiny 2-minute step."
  );

  // AI Memory Edit States
  const [editingMemory, setEditingMemory] = useState(false);
  const [studyPref, setStudyPref] = useState(user?.aiMemory?.studyTimePreference || "");
  const [codingSpeed, setCodingSpeed] = useState(user?.aiMemory?.averageCodingSpeed || "");
  const [procrastination, setProcrastination] = useState(user?.aiMemory?.typicalProcrastinationPattern || "");
  const [notes, setNotes] = useState(user?.aiMemory?.notes || "");

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setTasks([]);
      setEvents([]);
      setSchedule(null);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);

    const tasksQ = query(collection(db!, "tasks"), where("userId", "==", user.uid));
    const unsubTasks = onSnapshot(tasksQ, async (snap) => {
      if (snap.size === 0 && !hasSeededRef.current) {
        hasSeededRef.current = true;
        console.log("Database empty. Seeding initial tech tasks...");
        const seedTasksData = [
          { title: "Optimize Teachable Machine e-waste classification model", status: "completed", priority: 1, urgency: 5, duration: 2 },
          { title: "Format lab presentation to PSIT Kanpur standard PDF", status: "pending", priority: 2, urgency: 3, duration: 1 },
          { title: "Debug JSESSIONID network bypass script for tournament", status: "pending", priority: 1, urgency: 5, duration: 3 },
          { title: "Implement 5-variable function using 4x1 multiplexers", status: "pending", priority: 2, urgency: 4, duration: 4 }
        ];

        for (const t of seedTasksData) {
          const newTask: Task = {
            id: crypto.randomUUID(),
            userId: user.uid,
            title: t.title,
            deadline: new Date().toISOString().split("T")[0],
            duration: t.duration,
            urgency: t.urgency,
            priority: t.priority,
            status: t.status as "pending" | "completed",
            subtasks: [
              { id: crypto.randomUUID(), title: "Initial setup", completed: t.status === "completed", duration: 0.5, isMicro: true },
              { id: crypto.randomUUID(), title: "Core execution", completed: t.status === "completed", duration: t.duration - 0.5 }
            ],
            dependencies: [],
            riskScore: 30,
            riskReason: "Standard operational risk",
            explanation: "Auto-generated seed task",
            confidence: 90,
            category: "Development",
            addedAt: new Date().toISOString()
          };
          await setDoc(doc(db!, "tasks", newTask.id), newTask);
        }
      } else {
        const list: Task[] = [];
        snap.forEach(d => list.push({ ...d.data(), id: d.id } as Task));
        setTasks(list);
        
        const pending = list.filter(t => t.status === "pending").sort((a, b) => a.priority - b.priority);
        if (pending.length > 0) {
          setFocusTask(pending[0]);
          const firstSub = pending[0].subtasks.find(st => !st.completed);
          setActiveSubtask(firstSub || pending[0].subtasks[0] || null);
        } else {
          setFocusTask(null);
          setActiveSubtask(null);
        }
      }
      setLoadingTasks(false);
    });

    const eventsQ = query(collection(db!, "events"), where("userId", "==", user.uid));
    const unsubEvents = onSnapshot(eventsQ, (snap) => {
      const evList: any[] = [];
      snap.forEach(d => evList.push({ ...d.data(), id: d.id }));
      setEvents(evList);
    });

    const todayStr = new Date().toISOString().split("T")[0];
    dbService.getSchedule(user.uid, todayStr).then(res => setSchedule(res));

    return () => {
      unsubTasks();
      unsubEvents();
    };
  }, [user]);

  const toggleTaskStatus = async (task: Task) => {
    if (!db) return;
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateDoc(doc(db!, "tasks", task.id), { status: newStatus });
  };

  // Synchronize focus task if context activeTaskId is set (e.g. from task list focus button)
  useEffect(() => {
    if (activeTaskId && tasks.length > 0) {
      const target = tasks.find(t => t.id === activeTaskId);
      if (target) {
        setFocusTask(target);
        const firstSub = target.subtasks.find(st => !st.completed);
        setActiveSubtask(firstSub || target.subtasks[0] || null);
      }
    }
  }, [activeTaskId, tasks]);



  // --- 2-Minute Timer Loop ---
  useEffect(() => {
    if (twoMinRunning) {
      twoMinInterval.current = setInterval(() => {
        setTwoMinTime(prev => {
          if (prev <= 1) {
            setTwoMinRunning(false);
            if (twoMinInterval.current) clearInterval(twoMinInterval.current);
            // Completed 2 min step: give reward
            confetti({ particleCount: 50, spread: 45, colors: ["#6366f1", "#10b981"] });
            setAiQuote("Incredible job starting! The friction is broken. You are ready to keep going now!");
            return 120;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (twoMinInterval.current) clearInterval(twoMinInterval.current);
    }
    return () => {
      if (twoMinInterval.current) clearInterval(twoMinInterval.current);
    };
  }, [twoMinRunning]);

  // --- Pomodoro Timer Loop ---
  useEffect(() => {
    if (pomoRunning) {
      pomoInterval.current = setInterval(() => {
        setPomoTime(prev => {
          if (prev <= 1) {
            setPomoRunning(false);
            if (pomoInterval.current) clearInterval(pomoInterval.current);
            
            // Trigger alarm/switch mode
            if (pomoMode === "focus") {
              confetti({ particleCount: 100, spread: 80 });
              setPomoMode("break");
              setAiQuote("Focused block completed. Rest now, clear your mind. 5-minute break started!");
              return 5 * 60; // 5 min break
            } else {
              setPomoMode("focus");
              setAiQuote("Break over! Let's resume focus on our target task. 25-minute Pomodoro started.");
              return 25 * 60; // 25 min focus
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoInterval.current) clearInterval(pomoInterval.current);
    }
    return () => {
      if (pomoInterval.current) clearInterval(pomoInterval.current);
    };
  }, [pomoRunning, pomoMode]);

  // Save AI Memory Changes
  const handleSaveMemory = async () => {
    if (!user) return;
    const newMemory: AIMemory = {
      studyTimePreference: studyPref,
      averageCodingSpeed: codingSpeed,
      typicalProcrastinationPattern: procrastination,
      preferredWorkSessionLength: user.aiMemory?.preferredWorkSessionLength || 45,
      notes: notes
    };
    await updateMemory(newMemory);
    setEditingMemory(false);
    setAiQuote("AI Memory updated. Priority engines updated with user parameters.");
  };

  // Complete Subtask
  const handleCompleteSubtask = async (subtaskId: string) => {
    if (!focusTask || !user) return;
    
    const updatedSubtasks = focusTask.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // If subtask completed, fire confetti
    const sub = focusTask.subtasks.find(st => st.id === subtaskId);
    if (sub && !sub.completed) {
      confetti({ particleCount: 40, spread: 30, origin: { y: 0.8 } });
    }

    const allCompleted = updatedSubtasks.every(st => st.completed);
    const updatedTask: Task = {
      ...focusTask,
      subtasks: updatedSubtasks,
      status: allCompleted ? "completed" : focusTask.status
    };

    await dbService.saveTask(updatedTask);
  };

  // One-Click Recovery
  const handleOneClickRecovery = async () => {
    if (!user || tasks.length === 0) return;
    try {
      setAiQuote("AI Rebuilder initializing... Calculating non-overlapping schedule recovery blocks.");
      
      // Select all overdue and pending tasks
      const pendingAndOverdue = tasks.map(t => {
        if (t.status === "overdue" || (new Date(t.deadline).getTime() < Date.now() && t.status === "pending")) {
          return { ...t, status: "pending" as const, urgency: 5 }; // Bump urgency for recovery
        }
        return t;
      });

      // Call schedule rebuilder
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: pendingAndOverdue,
          peakHours: user.peakHours,
          availableHours: 6 // Recovery default available hours
        })
      });
      const data = await res.json();
      
      if (data.blocks) {
        // Save recovered tasks and schedule
        await dbService.saveTasksBulk(pendingAndOverdue);
        await dbService.saveSchedule({
          id: new Date().toISOString().split("T")[0],
          userId: user.uid,
          date: new Date().toISOString().split("T")[0],
          blocks: data.blocks,
          isCrisisMode: data.isCrisisMode,
          conflictResolver: data.conflictResolver
        });
        
        confetti({ particleCount: 150, spread: 100, colors: ["#10b981", "#059669"] });
        setAiQuote("Recovery Schedule active! Overdue guilt removed. Follow your hourly recovery blocks.");
      }
    } catch (e) {
      console.error(e);
      setAiQuote("Failed to trigger recovery. Please try again.");
    }
  };

  // Format timer displays
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Calculations for Stats Card
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const overdueCount = tasks.filter(t => 
    t.status === "overdue" || (new Date(t.deadline).getTime() < Date.now() && t.status === "pending")
  ).length;

  const totalTasksCount = Math.max(telemetry.totalTasksCreated || roadmapTasks.length || tasks.length, 1);
  const globalCompletedCount = telemetry.completedTasksCount || roadmapTasks.filter(t => t.checked).length || completedCount;
  
  const productivityScore = totalTasksCount > 0 
    ? Math.round((globalCompletedCount / totalTasksCount) * 100) 
    : 100;

  const highestRisk = tasks.reduce((max, t) => {
    if (t.status === "pending" && t.riskScore > max) return t.riskScore;
    return max;
  }, 0);

  const riskLevel = highestRisk > 80 ? "CRITICAL" : highestRisk > 40 ? "ELEVATED" : "LOW";
  const upcomingCrisis = overdueCount > 0 || pendingCount >= 4;

  // Interactive Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- FULL SCREEN FOCUS MODE WRAPPER ---
  if (isFocusMode && focusTask) {
    return (
      <div className="w-full min-h-screen bg-transparent flex flex-col justify-between items-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        {/* Background stars effect */}
        <div className="absolute top-[20%] left-[20%] w-32 h-32 rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none pulse-ring-slow"></div>
        
        {/* Exit Button */}
        <div className="w-full flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-current" />
            <span className="font-mono text-xs text-fog uppercase tracking-widest">Focus Terminal</span>
          </div>
          <button 
            onClick={() => stopFocus()}
            className="flex items-center gap-1.5 px-3 py-1.5 dala-ghost-action text-xs"
          >
            <Minimize2 className="h-3.5 w-3.5" /> Exit Focus
          </button>
        </div>

        {/* Centered Focus Card */}
        <div className="max-w-2xl w-full py-12 flex flex-col items-center">
          <p className="text-xs text-aurora font-semibold uppercase tracking-widest mb-2">Currently Focus Target</p>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-snow mb-2">{focusTask.title}</h2>
          <p className="text-sm text-fog mb-8 max-w-md">
            {activeSubtask ? `Current micro-step: "${activeSubtask.title}"` : "Work on completion of main task milestones."}
          </p>

          {/* Large Radial Timer Display */}
          <div className="relative h-64 w-64 rounded-full border border-fog/10 bg-trench flex flex-col justify-center items-center shadow-lg mb-10">
            {twoMinRunning ? (
              <>
                <span className="text-[10px] text-aurora font-mono tracking-widest uppercase mb-1">Micro Step Timer</span>
                <span className="text-5xl font-mono font-bold text-snow tracking-tight">{formatTime(twoMinTime)}</span>
                <span className="text-[10px] text-fog mt-2 font-mono">Breaking the friction</span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-ice font-mono tracking-widest uppercase mb-1">
                  {pomoMode === "focus" ? "Work session" : "Break period"}
                </span>
                <span className={`text-5xl font-mono font-bold tracking-tight ${pomoMode === "focus" ? "text-snow" : "text-aurora"}`}>
                  {formatTime(pomoTime)}
                </span>
                <span className="text-[10px] text-fog mt-2 font-mono">Pomodoro Technique</span>
              </>
            )}
          </div>

          {/* Timers Controls */}
          <div className="flex gap-4 mb-8">
            {twoMinRunning ? (
              <button 
                onClick={() => setTwoMinRunning(false)} 
                className="px-6 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Pause className="h-4 w-4" /> Pause Starter
              </button>
            ) : pomoRunning ? (
              <button 
                onClick={() => setPomoRunning(false)} 
                className="px-6 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Pause className="h-4 w-4" /> Pause Pomodoro
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setTwoMinTime(120);
                    setTwoMinRunning(true);
                    setPomoRunning(false);
                  }} 
                  className="dala-primary-action shadow-md"
                >
                  <Play className="h-4 w-4 mr-1.5" /> Start 2-Min Micro
                </button>
                <button 
                  onClick={() => {
                    setTwoMinRunning(false);
                    setPomoRunning(true);
                  }} 
                  className="dala-outlined-action shadow-md"
                >
                  <Play className="h-4 w-4 mr-1.5" /> Start Pomodoro
                </button>
              </div>
            )}

            <button 
              onClick={() => {
                setTwoMinRunning(false);
                setTwoMinTime(120);
                setPomoRunning(false);
                setPomoTime(25 * 60);
                setPomoMode("focus");
              }}
              className="p-2.5 dala-ghost-action rounded-xl"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Subtask Check List */}
          {focusTask.subtasks && focusTask.subtasks.length > 0 && (
            <div className="w-full max-w-md dala-hairline-card p-4 text-left">
              <span className="text-[10px] text-fog font-mono tracking-widest uppercase block mb-3">Steps Checklist</span>
              <div className="space-y-2">
                {focusTask.subtasks.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleCompleteSubtask(st.id)}
                    className="flex items-center gap-2.5 w-full text-left py-1 text-ice hover:text-snow transition-all text-xs"
                  >
                    <CheckCircle2 className={`h-4.5 w-4.5 ${st.completed ? "text-aurora" : "text-fog"}`} />
                    <span className={st.completed ? "line-through text-fog" : "font-medium"}>
                      {st.title} {st.isMicro && <span className="text-[9px] text-current font-mono">(2-Min Starter)</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Motivation Guidance Footer */}
        <div className="w-full max-w-2xl mx-auto p-4 rounded-[var(--radius-cards)] bg-black/5 border border-black/5 mb-4 shadow-sm">
          <div className="flex gap-2.5 items-start text-left">
            <BrainCircuit className="h-5 w-5 text-current shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-aurora font-normal tracking-wider">Coach Intervention</p>
              <p className="text-xs text-fog leading-normal mt-0.5">{aiQuote}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const focusTimeHours = telemetry.focusMinutesLogged > 0 
    ? (telemetry.focusMinutesLogged / 60).toFixed(1)
    : Math.round((pomoMode === "focus" && !pomoRunning ? 25 * 60 - pomoTime : 0) / 3600 * 10) / 10 || 1.2;

  return (
    <div className="w-full bg-[#F8F9FD] h-full min-h-fit p-8 pb-8 text-slate-800 rounded-[24px] font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold tracking-tight text-slate-800">Dashboard</h2>
      </div>

      {/* Overview Row - Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px]">
        {/* Card 1 */}
        <div className="dala-hairline-card rounded-[22px] p-6 hover-lift flex items-center gap-[18px]">
          <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center text-[22px]">📋</div>
          <div className="flex flex-col min-w-0 items-start">
            <h3 className="text-[15px] font-semibold text-fog mb-0.5 truncate">Tasks Today</h3>
            <p className="text-[38px] font-bold text-snow leading-none mb-2">{tasks.length}</p>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
              {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}% done` : 'Ready to start'}
            </span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="dala-hairline-card rounded-[22px] p-6 hover-lift flex items-center gap-[18px]">
          <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-[22px]">✅</div>
          <div className="flex flex-col min-w-0 items-start">
            <h3 className="text-[15px] font-semibold text-fog mb-0.5 truncate">Completed</h3>
            <p className="text-[38px] font-bold text-snow leading-none mb-2">{completedCount}</p>
            <span className="text-[11px] font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">
               {pendingCount} remaining
            </span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="dala-hairline-card rounded-[22px] p-6 hover-lift flex items-center gap-[18px]">
          <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center text-[22px]">⏱</div>
          <div className="flex flex-col min-w-0 items-start">
            <h3 className="text-[15px] font-semibold text-fog mb-0.5 truncate">Focus Time</h3>
            <p className="text-[38px] font-bold text-snow leading-none mb-2">{focusTimeHours}h</p>
            <span className="text-[11px] font-medium text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded">
              Productivity: {productivityScore}%
            </span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="dala-hairline-card rounded-[22px] p-6 hover-lift flex items-center gap-[18px]">
          <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-orange-500/10 flex items-center justify-center text-[22px]">🔥</div>
          <div className="flex flex-col min-w-0 items-start">
            <h3 className="text-[15px] font-semibold text-fog mb-0.5 truncate">Current Streak</h3>
            <p className="text-[38px] font-bold text-snow leading-none mb-2">{completedCount > 0 ? 1 : 0}</p>
            <span className="text-[11px] font-medium text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded">
               Keep it up!
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid: 2 Columns for dense vertical packing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Card 1: Today's Main Task (Hero) */}
          <div className="dala-hairline-card rounded-[22px] px-6 py-5 relative overflow-hidden group bg-white border border-[#E5E7EB] shadow-sm">
            {/* Priority Badge */}
            {focusTask && (
              <span className="absolute top-5 right-6 px-3 py-1 bg-teal-50 text-[#006837] text-[12px] font-medium rounded-full">
                Priority #{focusTask.priority}
              </span>
            )}

            {/* Section Label */}
            <div className="text-[14px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] mb-4">
              Today's Main Task
            </div>

            {focusTask ? (
              <div className="flex flex-col">
                {/* Task Title */}
                <h2 className="text-[32px] font-bold text-[#1A1A1A] leading-[1.15] tracking-tight mb-3 pr-24">
                  {focusTask.title}
                </h2>
                
                {/* Metadata row */}
                <div className="flex items-center gap-4 text-[14px] font-medium text-[#6B7280] mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{focusTask.duration}h estimated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarRange className="h-4 w-4" />
                    <span>Due: {focusTask.deadline}</span>
                  </div>
                </div>

                {/* Progress Bar Row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-[999px] h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-[999px] bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-1000 ease-out" 
                      style={{ width: `${(focusTask.subtasks.filter(st => st.completed).length / Math.max(focusTask.subtasks.length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[13px] text-[#1A1A1A] font-semibold">
                    {Math.round((focusTask.subtasks.filter(st => st.completed).length / Math.max(focusTask.subtasks.length, 1)) * 100)}%
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("timer")}
                    className="h-[44px] px-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-[15px] font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Play className="h-4 w-4" fill="currentColor" /> Continue Working
                  </button>
                  <button 
                    onClick={() => setActiveTab("planner")}
                    className="h-[44px] px-6 bg-white text-[#1A1A1A] text-[15px] font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                  >
                    <CalendarRange className="h-4 w-4" /> View Schedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <h2 className="text-[32px] font-bold text-[#1A1A1A] leading-[1.15] tracking-tight mb-3 pr-24">
                  No Main Task Set
                </h2>
                
                <div className="flex items-center gap-4 text-[14px] font-medium text-[#6B7280] mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarRange className="h-4 w-4" />
                    <span>Due: N/A</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-[999px] h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-[999px] bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-1000 ease-out" 
                      style={{ width: `0%` }}
                    />
                  </div>
                  <span className="text-[13px] text-[#1A1A1A] font-semibold">
                    0%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    disabled
                    className="h-[44px] px-6 bg-gray-200 text-gray-400 text-[15px] font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-not-allowed"
                  >
                    <Play className="h-4 w-4" fill="currentColor" /> Continue Working
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sub-grid for My Tasks & Weekly Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 7: My Tasks */}
            <div className="dala-hairline-card rounded-[22px] p-5 flex flex-col hover-lift h-[240px]">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-current" />
                  <h3 className="text-[14px] font-semibold text-snow">My Tasks</h3>
                </div>
                <button 
                  onClick={() => setActiveTab("tasks")}
                  className="text-[11px] text-fog hover:text-snow font-medium transition-colors"
                >
                  View All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 group cursor-pointer" onClick={() => setActiveTab("tasks")}>
                    <div 
                      className="mt-0.5" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleTaskStatus(task); 
                      }}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-aurora hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="h-4 w-4 rounded-[4px] border border-fog/30 group-hover:border-current hover:bg-black/5 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] truncate transition-colors leading-tight ${task.status === "completed" ? 'text-fog line-through' : 'text-ice group-hover:text-snow font-medium'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.status === "overdue" && (
                          <span className="text-[9px] px-1.5 py-0 bg-rose-100 text-rose-600 border border-rose-200 rounded font-semibold leading-relaxed">OVERDUE</span>
                        )}
                        <span className="text-[10px] text-fog font-normal">P{task.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-[12px] text-snow font-semibold mb-0.5">All clear!</p>
                    <p className="text-[11px] text-fog font-normal">No tasks currently assigned.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Weekly Progress */}
            <div className="dala-hairline-card rounded-[22px] p-5 flex flex-col hover-lift h-[240px]">
              <h3 className="text-[14px] font-semibold text-snow mb-2 shrink-0">Weekly Progress</h3>
              
              {tasks.length > 0 ? (
                <>
                  <div className="flex items-end flex-1 gap-1.5 mb-2">
                    {[...Array(7)].map((_, i) => {
                      const c = 0;
                      const p = 0;
                      const o = 0;
                      const total = c + p + o;
                      
                      const h1 = total === 0 ? 0 : (c / total) * 100;
                      const h2 = total === 0 ? 0 : (p / total) * 100;
                      const h3 = total === 0 ? 0 : (o / total) * 100;

                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 group h-full">
                          <div className="w-full flex flex-col justify-end gap-0.5 px-0.5 h-full">
                            {total === 0 ? (
                              <div className="w-full bg-black/5 border border-black/5 rounded-sm h-[3px]" />
                            ) : (
                              <>
                                {o > 0 && <div className="w-full bg-rose-400 rounded-t-sm" style={{ height: `${h3}%`, minHeight: '3px' }} />}
                                {p > 0 && <div className={`w-full bg-current/30 ${o === 0 ? 'rounded-t-sm' : ''} ${c === 0 ? 'rounded-b-sm' : ''}`} style={{ height: `${h2}%`, minHeight: '3px' }} />}
                                {c > 0 && <div className={`w-full bg-aurora ${p === 0 && o === 0 ? 'rounded-t-sm' : ''} rounded-b-sm`} style={{ height: `${h1}%`, minHeight: '3px' }} />}
                              </>
                            )}
                          </div>
                          <span className={`text-[9px] font-semibold ${i === 6 ? 'text-snow' : 'text-fog/60'}`}>
                            {['M','T','W','T','F','S','Su'][i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-black/5 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-aurora" />
                        <span className="text-[9px] text-fog font-medium uppercase tracking-wider">Done</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-current/30" />
                        <span className="text-[9px] text-fog font-medium uppercase tracking-wider">Pending</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <BarChart className="h-5 w-5 text-fog/30 mb-1" />
                   <p className="text-[12px] text-snow font-semibold mb-0.5">No data yet</p>
                   <p className="text-[11px] text-fog font-normal">Complete tasks to see progress.</p>
                </div>
              )}
            </div>

            {/* Card 8: Focus Timer */}
            <div className="dala-hairline-card rounded-[22px] p-5 flex flex-col items-center justify-center text-center hover-lift h-[240px]">
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-current" />
                  <h3 className="text-[13px] font-semibold text-snow">Focus Timer</h3>
                </div>
                {pomoRunning && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
              </div>
              
              <div className="text-[48px] font-mono font-bold text-snow tracking-tight mb-2 leading-none">
                {formatTime(pomoTime)}
              </div>
              
              <div className="flex items-center gap-2 w-full mt-auto">
                <button 
                  onClick={() => { setPomoRunning(!pomoRunning); setActiveTab("timer"); }}
                  className={`flex-1 py-1.5 text-[12px] font-medium h-[34px] ${pomoRunning ? 'dala-outlined-action bg-rose-50 border-rose-200 text-rose-600' : 'dala-primary-action shadow-sm'}`}
                >
                  {pomoRunning ? 'Pause' : 'Start'}
                </button>
                <button 
                  onClick={() => setPomoTime(25 * 60)}
                  className="px-2.5 py-1.5 h-[34px] dala-ghost-action flex items-center justify-center"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card 6: AI Coach */}
            <div className="dala-hairline-card rounded-[22px] p-5 flex flex-col justify-between hover-lift h-[240px]">
              <div className="flex items-center gap-1.5 mb-2 shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-aurora" />
                <h3 className="text-[13px] font-semibold text-snow">AI Coach</h3>
              </div>
              
              <div className="bg-[#F9F9F6] p-2.5 rounded-xl border border-black/5 flex-1 flex flex-col justify-center relative shadow-inner mb-2">
                <p className="text-[11px] text-fog leading-relaxed font-normal">
                  <strong className="text-snow font-semibold">✨ Welcome back!</strong><br/>
                  Add your tasks to receive AI insights.
                </p>
              </div>

              <button 
                onClick={() => setActiveTab("chat")}
                className="w-full dala-outlined-action shadow-sm py-1.5 text-[12px] font-medium h-[34px] shrink-0"
              >
                Open AI Coach →
              </button>
            </div>

          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 4: Calendar & Today's Agenda */}
          <div className="dala-hairline-card rounded-[22px] p-6 hover-lift flex flex-col">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-snow tracking-tight">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                  <button onClick={handlePrevMonth} className="p-1 text-fog hover:bg-black/5 hover:text-snow rounded-md transition-colors"><ChevronDown className="h-4 w-4 rotate-90" /></button>
                  <button onClick={handleNextMonth} className="p-1 text-fog hover:bg-black/5 hover:text-snow rounded-md transition-colors"><ChevronDown className="h-4 w-4 -rotate-90" /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 text-center mb-1 gap-x-0">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-[11px] font-semibold text-fog/70">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center mb-4">
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="w-full flex justify-center"><div className="w-7 h-7" /></div>
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  const hasDeadline = tasks.some(t => {
                    const d = new Date(t.deadline);
                    return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                  });
                  const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0];
                  
                  return (
                    <div key={day} className="w-full flex justify-center">
                      <button 
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setActiveTab("planner");
                        }}
                        className={`w-7 h-7 rounded-full text-[12px] flex items-center justify-center relative transition-all ${
                          isToday 
                            ? 'bg-[#006837] text-white font-bold' 
                            : 'text-fog hover:bg-black/5 hover:text-snow font-medium'
                        }`}
                      >
                        <span>{day}</span>
                        {hasDeadline && !isToday && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Agenda - Compact */}
            <div className="space-y-2 mt-auto">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${ev.type === 'meeting' ? 'bg-aurora' : 'bg-[#006837]'}`} />
                      <p className="text-[13px] text-ice font-medium truncate max-w-[200px]">{ev.title}</p>
                    </div>
                    <span className="text-[11px] text-fog font-medium whitespace-nowrap">{ev.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-fog">No events scheduled.</div>
              )}
            </div>
          </div>

          {/* Card 5: AI Insight */}
          <div className="bg-[#0f172a] rounded-[20px] p-5 shadow-xl flex flex-col relative overflow-hidden hover-lift border border-white/10 h-[220px]">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full blur-2xl opacity-40 mix-blend-screen pointer-events-none" />
            <div className="absolute top-16 right-6 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-[1.5rem] rotate-12 blur-xl opacity-30 mix-blend-screen pointer-events-none" />
            
            <div className="z-10 relative flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <span className="text-[14px]">🧠</span>
                <h3 className="text-[14px] font-semibold text-white tracking-tight">AI Insight</h3>
              </div>
              
              {tasks.length > 0 ? (
                <>
                  <p className="text-[12px] text-slate-300 leading-relaxed font-normal flex-1 overflow-y-auto">
                    Your AI planner is ready. Add tasks to see optimized scheduling insights.
                  </p>
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 backdrop-blur-sm shadow-sm py-1.5 text-[12px] transition-colors shrink-0 mt-2 h-[34px]">
                    Apply AI Plan
                  </button>
                </>
              ) : (
                <p className="text-[12px] text-slate-400 leading-relaxed font-normal flex-1 flex items-center">
                  You're on track today. No schedule changes are needed.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
