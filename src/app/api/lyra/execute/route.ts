import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { transcript = "", userId } = body;

    if (!transcript) {
      return NextResponse.json({ type: 'CHAT_REPLY', speech: "I didn't quite catch that." });
    }

    const systemInstruction = `You are Lyra, the intelligent voice agent core of DeadlineAI. The user has just spoken a command to you. Your goal is to return a clean JSON payload mapping their speech to explicit app database modifications. If they say 'add a math assignment', output: { "type": "ADD_TASK", "payload": { "title": "Math Assignment", "priority": "high" }, "speech": "I have added that task to your checklist." }. If they ask a general productivity question, return: { "type": "CHAT_REPLY", "payload": {}, "speech": "Your focus is holding strong today, keep pushing!" }.`;

    if (!isGeminiConfigured || !aiClient) {
      return NextResponse.json({ 
        type: 'CHAT_REPLY', 
        payload: {},
        speech: "Lyra backend is running in mock mode. I heard you say: " + transcript
      });
    }

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: transcript,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const replyText = response.text || "{}";
      const payload = JSON.parse(replyText);
      
      return NextResponse.json(payload);
    } catch (apiError: any) {
      console.warn("Gemini API error in /api/lyra/execute:", apiError.message);
      return NextResponse.json({ 
        type: 'CHAT_REPLY', 
        speech: "I'm having trouble processing that command right now." 
      });
    }
  } catch (error: any) {
    console.error("Critical Error in /api/lyra/execute:", error);
    return NextResponse.json({ 
      type: 'CHAT_REPLY', 
      speech: "A critical system error occurred." 
    });
  }
}
