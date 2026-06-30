import { db, isFirebaseConfigured } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} from "firebase/firestore";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  duration: number; // in hours
  isMicro?: boolean; // 2-minute starter step
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  deadline: string; // ISO string or YYYY-MM-DD
  duration: number; // estimated hours
  urgency: number; // 1 to 5
  priority: number; // ranking order
  status: "pending" | "completed" | "overdue";
  subtasks: SubTask[];
  dependencies: string[]; // task titles or ids
  riskScore: number; // percentage (0 to 100)
  riskReason: string;
  explanation: string; // "Why is this order?" explanation
  confidence: number; // confidence score (0 to 100)
  category: string;
  draft?: string; // editable message template if communications task
  isCommunicationTask?: boolean;
  addedAt: string;
}

export interface ScheduleBlock {
  id: string;
  type: "work" | "break" | "buffer" | "sleep";
  title?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // in minutes
  taskId?: string; // reference to a task if type is 'work'
}

export interface DailySchedule {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  blocks: ScheduleBlock[];
  isCrisisMode: boolean;
  conflictResolver?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface AIMemory {
  studyTimePreference: string; // e.g. "Morning study, late night coding"
  averageCodingSpeed: string; // e.g. "Average speed, breaks every 45 mins"
  typicalProcrastinationPattern: string; // e.g. "Snoozes assignment tasks twice"
  preferredWorkSessionLength: number; // in minutes
  notes: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  peakHours: "morning" | "afternoon" | "night";
  onboarded: boolean;
  aiMemory?: AIMemory;
}

// Local Storage Keys
const KEYS = {
  TASKS: "deadline_ai_tasks",
  SCHEDULES: "deadline_ai_schedules",
  CHAT: "deadline_ai_chat",
  PROFILE: "deadline_ai_profile",
};

// Check if localStorage is available
const isClient = typeof window !== "undefined";

// Helper to get local data
const getLocal = <T>(key: string, fallback: T): T => {
  if (!isClient) return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

// Helper to set local data
const setLocal = <T>(key: string, value: T): void => {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Unified DB Functions
export const dbService = {
  // --- USER PROFILE & ONBOARDING ---
  async saveProfile(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured && db) {
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, profile, { merge: true });
    } else {
      setLocal(KEYS.PROFILE, profile);
    }
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } else {
      const local = getLocal<UserProfile | null>(KEYS.PROFILE, null);
      if (local && local.uid === uid) return local;
      return null;
    }
  },

  // --- TASKS ---
  async getTasks(userId: string): Promise<Task[]> {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "tasks"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const list: Task[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Task);
      });
      return list;
    } else {
      const allTasks = getLocal<Task[]>(KEYS.TASKS, []);
      return allTasks.filter(t => t.userId === userId);
    }
  },

  async saveTask(task: Task): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "tasks", task.id);
      await setDoc(docRef, task);
    } else {
      const allTasks = getLocal<Task[]>(KEYS.TASKS, []);
      const index = allTasks.findIndex(t => t.id === task.id);
      if (index >= 0) {
        allTasks[index] = task;
      } else {
        allTasks.push(task);
      }
      setLocal(KEYS.TASKS, allTasks);
    }
  },

  async saveTasksBulk(tasks: Task[]): Promise<void> {
    if (isFirebaseConfigured && db) {
      for (const task of tasks) {
        const docRef = doc(db, "tasks", task.id);
        await setDoc(docRef, task);
      }
    } else {
      const allTasks = getLocal<Task[]>(KEYS.TASKS, []);
      // Replace existing or add new
      for (const task of tasks) {
        const index = allTasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
          allTasks[index] = task;
        } else {
          allTasks.push(task);
        }
      }
      setLocal(KEYS.TASKS, allTasks);
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "tasks", taskId);
      await deleteDoc(docRef);
    } else {
      const allTasks = getLocal<Task[]>(KEYS.TASKS, []);
      const filtered = allTasks.filter(t => t.id !== taskId);
      setLocal(KEYS.TASKS, filtered);
    }
  },

  // --- DAILY SCHEDULES ---
  async getSchedule(userId: string, date: string): Promise<DailySchedule | null> {
    const id = `${userId}_${date}`;
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "schedules", id);
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as DailySchedule) : null;
    } else {
      const allSchedules = getLocal<DailySchedule[]>(KEYS.SCHEDULES, []);
      const found = allSchedules.find(s => s.userId === userId && s.date === date);
      return found || null;
    }
  },

  async saveSchedule(schedule: DailySchedule): Promise<void> {
    const id = `${schedule.userId}_${schedule.date}`;
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "schedules", id);
      await setDoc(docRef, schedule);
    } else {
      const allSchedules = getLocal<DailySchedule[]>(KEYS.SCHEDULES, []);
      const index = allSchedules.findIndex(
        s => s.userId === schedule.userId && s.date === schedule.date
      );
      if (index >= 0) {
        allSchedules[index] = schedule;
      } else {
        allSchedules.push(schedule);
      }
      setLocal(KEYS.SCHEDULES, allSchedules);
    }
  },

  // --- CHAT HISTORY ---
  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "chatHistory", userId);
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data().messages as ChatMessage[]) : [];
    } else {
      const allChats = getLocal<Record<string, ChatMessage[]>>(KEYS.CHAT, {});
      return allChats[userId] || [];
    }
  },

  async saveChatHistory(userId: string, messages: ChatMessage[]): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "chatHistory", userId);
      await setDoc(docRef, { messages });
    } else {
      const allChats = getLocal<Record<string, ChatMessage[]>>(KEYS.CHAT, {});
      allChats[userId] = messages;
      setLocal(KEYS.CHAT, allChats);
    }
  },

  async clearChatHistory(userId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "chatHistory", userId);
      await setDoc(docRef, { messages: [] });
    } else {
      const allChats = getLocal<Record<string, ChatMessage[]>>(KEYS.CHAT, {});
      allChats[userId] = [];
      setLocal(KEYS.CHAT, allChats);
    }
  }
};
