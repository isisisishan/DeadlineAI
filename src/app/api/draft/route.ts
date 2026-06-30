import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { title, category, details } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Missing task title" }, { status: 400 });
    }

    if (!isGeminiConfigured || !aiClient) {
      const draft = geminiFallback.draft(title, category);
      return NextResponse.json({ draft });
    }

    const systemPrompt = `You are a professional Executive Draft Assistant.
Generate a copy-pasteable, editable communication draft based on a task.
Understand the context:
- If task contains "email" or "professor" or "extension", generate a formal email requesting an extension or asking a question.
- If task contains "team", "slack", "slack update", or "status", generate a professional team status update.
- If task contains "whatsapp" or "friend" or "peer", generate an appropriate chat message.
- Otherwise, generate a standard template that fits the task description.

Use placeholder text like [Name] or [Date] where appropriate so the user can easily customize it.
Output ONLY the draft text itself. Do not wrap in extra commentary or conversational pleasantries.`;

    const userPrompt = `Task title: "${title}"
Category: "${category}"
Extra details: "${details || "None"}"

Generate the draft.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const draftText = response.text || "";
    return NextResponse.json({ draft: draftText.trim() });
  } catch (error: any) {
    console.error("Error in /api/draft:", error);
    return NextResponse.json({ error: error.message || "Failed to generate draft" }, { status: 500 });
  }
}
