"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type RoadmapTask = {
  id: string;
  title: string;
  durationHours: number;
  priority: "High" | "Medium" | "Low";
  type: string;
  checked: boolean;
  startTime?: string;
  endTime?: string;
  list?: "todo" | "today";
};

export interface AdaptiveState {
  isFatigued: boolean;
  pomodoroTime: number;
  shortBreakTime: number;
}

export type CalendarEvent = {
  id: string;
  date: string;
  top: number;
  height: number;
  type: "meeting" | "assignment" | "hackathon" | "personal" | "workout" | "study" | "project";
  title: string;
  timeString: string;
  avatars?: number[];
  extraAvatars?: number;
  completed?: boolean;
  priority?: "High" | "Medium" | "Low";
  allDay?: boolean;
};

export type PlannerBlueprint = {
  activeGoal: string;
  availableHours: number;
  peakFocusWindow: "morning" | "afternoon" | "night";
  smartBufferSlots: boolean;
  targetDate: string | null;
};

export interface TelemetryData {
  focusMinutesLogged: number;
  completedTasksCount: number;
  totalTasksCreated: number;
  pauseTriggerCount: number;
  abandonedTimerCount: number;
  currentStreak: number;
}

export interface TelemetryEvent {
  timestamp: string;
  focusMinutes: number;
  tasksCompleted: number;
  pauseCount: number;
  abandonedCount: number;
}

interface FocusContextType {
  isFocusMode: boolean;
  activeTaskId: string | null;
  startFocus: (taskId: string) => void;
  stopFocus: () => void;
  setIsFocusMode: (value: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  roadmapTasks: RoadmapTask[];
  setRoadmapTasks: React.Dispatch<React.SetStateAction<RoadmapTask[]>>;
  toggleRoadmapTask: (id: string) => void;
  moveRoadmapTask: (id: string, targetList: "todo" | "today") => void;
  totalXP: number;
  setTotalXP: React.Dispatch<React.SetStateAction<number>>;
  userLevel: number;
  adaptiveState: AdaptiveState;
  telemetry: TelemetryData;
  telemetryHistory: TelemetryEvent[];
  updateTelemetry: (key: keyof TelemetryData, value: number | ((prev: number) => number)) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  plannerBlueprint: PlannerBlueprint;
  setPlannerBlueprint: React.Dispatch<React.SetStateAction<PlannerBlueprint>>;
  isLyraOpen: boolean;
  setIsLyraOpen: (val: boolean) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isLyraOpen, setIsLyraOpen] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>([]);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>({
    isFatigued: false,
    pomodoroTime: 1500,
    shortBreakTime: 300
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    focusMinutesLogged: 0,
    completedTasksCount: 0,
    totalTasksCreated: 0,
    pauseTriggerCount: 0,
    abandonedTimerCount: 0,
    currentStreak: 0,
  });

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryEvent[]>([]);


  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [plannerBlueprint, setPlannerBlueprint] = useState<PlannerBlueprint>({
    activeGoal: "",
    availableHours: 8,
    peakFocusWindow: "morning",
    smartBufferSlots: true,
    targetDate: null,
  });

  // Load telemetry from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("deadline_ai_telemetry");
    if (stored) {
      try {
        setTelemetry(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse telemetry data", e);
      }
    }
    
    const storedHistory = localStorage.getItem("deadline_ai_telemetry_history");
    if (storedHistory) {
      try {
        setTelemetryHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse telemetry history", e);
      }
    }
  }, []);

  // Save telemetry on change
  useEffect(() => {
    localStorage.setItem("deadline_ai_telemetry", JSON.stringify(telemetry));
  }, [telemetry]);

  useEffect(() => {
    localStorage.setItem("deadline_ai_telemetry_history", JSON.stringify(telemetryHistory));
  }, [telemetryHistory]);

  const updateTelemetry = (key: keyof TelemetryData, value: number | ((prev: number) => number)) => {
    setTelemetry(prev => {
      const nextVal = typeof value === 'function' ? value(prev[key]) : value;
      const updated = { ...prev, [key]: nextVal };
      
      // Save an event snapshot to history for charting
      setTelemetryHistory(hist => {
        const newEvent: TelemetryEvent = {
          timestamp: new Date().toISOString(),
          focusMinutes: key === 'focusMinutesLogged' ? (nextVal - prev.focusMinutesLogged) : 0,
          tasksCompleted: key === 'completedTasksCount' ? Math.max(0, nextVal - prev.completedTasksCount) : 0,
          pauseCount: key === 'pauseTriggerCount' ? (nextVal - prev.pauseTriggerCount) : 0,
          abandonedCount: key === 'abandonedTimerCount' ? (nextVal - prev.abandonedTimerCount) : 0,
        };
        // Only keep events that actually recorded something
        if (newEvent.focusMinutes > 0 || newEvent.tasksCompleted > 0 || newEvent.pauseCount > 0 || newEvent.abandonedCount > 0) {
          return [...hist, newEvent];
        }
        return hist;
      });
      
      return updated;
    });
  };

  useEffect(() => {
    // Dynamic import to avoid SSR issues if any, or directly load it
    import("@/lib/cognitive-engine").then(({ analyzeCognitiveLoad }) => {
      const historyString = localStorage.getItem("deadline_ai_reflections");
      if (historyString) {
        try {
          const history = JSON.parse(historyString);
          const state = analyzeCognitiveLoad(history);
          setAdaptiveState(state);
        } catch (e) {
          console.error("Failed to parse reflections for cognitive engine", e);
        }
      }
    });
    
    const storedXP = localStorage.getItem("deadline_ai_xp");
    if (storedXP) setTotalXP(parseInt(storedXP, 10));
  }, []);

  const userLevel = Math.floor(Math.sqrt(totalXP / 25)) + 1;

  useEffect(() => {
    if (totalXP > 0) {
      localStorage.setItem("deadline_ai_xp", totalXP.toString());
    }
  }, [totalXP]);

  const toggleRoadmapTask = (id: string) => {
    setRoadmapTasks((prev) => 
      prev.map((t) => {
        if (t.id === id) {
          const newChecked = !t.checked;
          updateTelemetry('completedTasksCount', c => newChecked ? c + 1 : c - 1);
          return { ...t, checked: newChecked };
        }
        return t;
      })
    );
  };

  const moveRoadmapTask = (id: string, targetList: "todo" | "today") => {
    setRoadmapTasks(prev => prev.map(t => t.id === id ? { ...t, list: targetList } : t));
  };

  const startFocus = (taskId: string) => {
    setActiveTaskId(taskId);
    setIsFocusMode(true);
  };

  const stopFocus = () => {
    setIsFocusMode(false);
    setActiveTaskId(null);
  };

  // If focus mode is turned off, reset the active task id
  useEffect(() => {
    if (!isFocusMode) {
      setActiveTaskId(null);
    }
  }, [isFocusMode]);

  return (
    <FocusContext.Provider
      value={{
        isFocusMode,
        isLyraOpen,
        setIsLyraOpen,
        activeTaskId,
        startFocus,
        stopFocus,
        setIsFocusMode,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        roadmapTasks,
        setRoadmapTasks,
        toggleRoadmapTask,
        moveRoadmapTask,
        totalXP,
        setTotalXP,
        userLevel,
        adaptiveState,
        telemetry,
        telemetryHistory,
        updateTelemetry,
        calendarEvents,
        setCalendarEvents,
        plannerBlueprint,
        setPlannerBlueprint
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
};
