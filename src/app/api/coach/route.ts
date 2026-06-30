import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages = [], currentFocusTask = null, isVoiceCommand = false } = body;

    const validMessages = Array.isArray(messages) ? messages : [];

    const focusTaskInfo = currentFocusTask 
      ? `User's current focus task: "${currentFocusTask.title}" (Due: ${currentFocusTask.deadline}, Urgency: ${currentFocusTask.urgency}/5)`
      : "User currently has no active focus task selected.";

    let systemPrompt = `You are an elite cognitive workspace coach specializing in behavioral psychology and anti-procrastination methods.
Your persona is encouraging, highly structured, logical, and firm but empathetic.
Your primary rules:
1. Never let users give up.
2. If they say they are procrastinating, feeling lazy, or paralyzed by a workload, immediately recommend a 2-minute micro-step.
3. Help them debug their time management.
4. Do not talk about topics unrelated to productivity, task management, scheduling, or stress management.
5. Keep your responses concise.

Current Context:
${focusTaskInfo}`;

    if (isVoiceCommand) {
      systemPrompt += `\n\nVOICE COMMAND DETECTED: The user has just submitted this command via voice. Analyze if this is a command to 'Plan a task', 'Change the schedule', or 'Query progress'. If it is a command, execute the action immediately.`;
    }

    // If Gemini is not configured, immediately use fallback
    if (!isGeminiConfigured || !aiClient || validMessages.length === 0) {
      const reply = geminiFallback.coach(validMessages);
      return NextResponse.json({ reply });
    }

    const geminiMessages = validMessages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }]
    }));

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: geminiMessages as any,
        config: {
          systemInstruction: systemPrompt
        }
      });

      const reply = response.text || "I'm here to support you. Let's focus on the first small step.";
      return NextResponse.json({ reply: reply.trim() });
    } catch (apiError: any) {
      console.warn("Gemini API error in /api/coach, applying graceful fallback:", apiError.message);
      const reply = geminiFallback.coach(validMessages);
      return NextResponse.json({ reply });
    }
  } catch (error: any) {
    console.error("Critical Error in /api/coach:", error);
    const reply = geminiFallback.coach([]);
    return NextResponse.json({ reply });
  }
}
