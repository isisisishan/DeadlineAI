import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { text, image, imageType } = await request.json();

    if (!text && !image) {
      return NextResponse.json({ error: "Missing input text or image" }, { status: 400 });
    }

    const fallbackResponse = () => {
      const mockResult = geminiFallback.intake(text || "New task uploaded");
      return NextResponse.json(mockResult);
    };

    if (!isGeminiConfigured || !aiClient) {
      return fallbackResponse();
    }

    // Call Gemini 1.5 Flash
    const prompt = `Parse the input and extract task details. 
Return a JSON object matching this TypeScript structure:
{
  title: string;          // Clear, concise title of the task
  deadline: string;       // Due date formatted as YYYY-MM-DD (estimate if not explicitly stated, relative to today: ${new Date().toISOString().split('T')[0]})
  duration: number;       // Estimated time to complete in hours (use decimal if needed, e.g. 1.5, default to 2 if unsure)
  urgency: number;        // Urgency score from 1 (low) to 5 (extreme crisis / due in 24 hours)
  category: string;       // E.g. Academic, Career, Personal, Development, Finance, Health
  dependencies: string[]; // List of other tasks this task depends on (e.g. ['Write code'] for 'Deploy code'). Empty array if none.
  isCommunicationTask: boolean; // True if this task requires writing an email, whatsapp, request, or slack message.
}

Ensure the output is valid JSON. Do not include markdown wraps.

Input text: "${text || ""}"`;

    let contents: any[] = [prompt];

    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: imageType || "image/png",
          data: base64Data
        }
      });
    }

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert executive secretary. Parse messy tasks, text logs, or schedule screenshots into clean, structured data."
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (genError) {
      console.error("Gemini API Error or Parse Error:", genError);
      return fallbackResponse();
    }
  } catch (error: any) {
    console.error("Error in /api/intake:", error);
    return NextResponse.json({ error: error.message || "Failed to process task intake" }, { status: 500 });
  }
}
