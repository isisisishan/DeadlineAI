import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { history, schedule } = await request.json();

    if (!isGeminiConfigured || !aiClient) {
      return NextResponse.json({ 
        briefing: "Welcome to your Daily Briefing. Keep your focus tight and take smart breaks today. (Mock Mode Active)" 
      });
    }

    const systemPrompt = `You are a high-end Cognitive Productivity Coach named DeadlineAI.
Your task is to write a personalized "Daily Executive Briefing" based on the user's past focus history and today's schedule.
The briefing should be concise, professional, and visually structured.
Keep it under 3 short paragraphs.
Highlight specific trends (e.g. "I noticed you were fatigued yesterday, so we are keeping timers shorter today").
Recommend an ideal soundscape (e.g. Lo-Fi or Alpha Waves).`;

    const userContent = `User History: ${JSON.stringify(history?.slice(-5) || [])}
User Schedule Today: ${JSON.stringify(schedule || [])}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      config: {
        systemInstruction: systemPrompt
      }
    });

    return NextResponse.json({ briefing: response.text || "Ready for a productive day." });
  } catch (error: any) {
    console.error("Error in /api/briefing:", error);
    return NextResponse.json({ error: error.message || "Failed to query AI Briefing" }, { status: 500 });
  }
}
