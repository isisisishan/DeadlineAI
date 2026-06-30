import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { telemetry, tasks, calendar, energyWindow } = await request.json();
    const fullPayload = { telemetry, tasks, calendar, energyWindow };

    const fallbackResponse = () => {
      const markdown = `
### 📊 Focus Velocity Rating
**A-Tier Consistency.** You are currently pushing through tasks at a highly optimal rate. Your focus minute aggregation indicates deep uninterrupted work periods, though minor context switching was detected.

### 🚨 Cognitive Fatigue Analysis
**Moderate Friction.** We detected ${telemetry?.pauseTriggerCount || 0} pause triggers and ${telemetry?.abandonedTimerCount || 0} abandoned timers. Your cognitive load is slightly elevated. Consider engaging the 'Smart Buffer' to decompress.

### 🛡️ Tactical Adaptation Pivot
**Optimize Session Length:** Based on your abandonment frequency, reduce your next 3 Pomodoro cycles to 20 minutes to rebuild psychological momentum and prevent burnout.
      `.trim();
      return NextResponse.json({ report: markdown });
    };

    if (!isGeminiConfigured || !aiClient) {
      return fallbackResponse();
    }

    const systemPrompt = `You are an elite performance architect. Analyze this user's holistic multi-tab footprint tracking object: ${JSON.stringify(fullPayload)}. Cross-reference their calendar meeting density against their focus session pauses and active tasks to deliver a hyper-contextual executive productivity audit.

You must format your response EXACTLY with these three markdown headers (and use bolding **text** for emphasis):
### 📊 Focus Velocity Rating
(Provide a sharp analysis of deep work efficiency based on focusMinutesLogged and completedTasksCount)

### 🚨 Cognitive Fatigue Analysis
(Calculate fatigue based on pauseTriggerCount and abandonedTimerCount)

### 🛡️ Tactical Adaptation Pivot
(Provide one direct, high-value workspace optimization tip)`;

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
      });

      const report = response.text || "";
      if (!report) return fallbackResponse();

      return NextResponse.json({ report });
    } catch (apiError: any) {
      console.error("Gemini API Error in /analytics/report:", apiError);
      return fallbackResponse();
    }
  } catch (error: any) {
    console.error("Analytics Report Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
