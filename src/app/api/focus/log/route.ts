import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Simulate DB delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("=========================================");
    console.log("[API/FOCUS] Database Persisted Sync Event");
    console.log("Telemetry Payload:", JSON.stringify(data, null, 2));
    console.log("=========================================");

    return NextResponse.json({ status: 'success', message: 'Logged successfully' }, { status: 200 });
  } catch (error) {
    console.error("API Logging Error:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to log telemetry' }, { status: 500 });
  }
}
