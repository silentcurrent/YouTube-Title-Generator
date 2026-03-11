import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const text = formData.get("text") as string | null
    const audio = formData.get("audio") as File | null

    if (!text && !audio) {
      return NextResponse.json(
        { error: "Please provide either text or audio input" },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
      // Demo mode: return mock titles when no webhook is configured
      console.log("[v0] N8N_WEBHOOK_URL not configured, using demo mode")
      
      const topic = text || "your video idea"
      const mockTitles = [
        `10 Secrets About ${topic} Nobody Tells You`,
        `How I Mastered ${topic} in Just 30 Days`,
        `The Ultimate Guide to ${topic} in 2026`,
        `Why Most People Fail at ${topic} (And How to Succeed)`,
        `${topic}: Everything You Need to Know`,
      ]

      return NextResponse.json({ titles: mockTitles })
    }

    // Prepare data for n8n webhook
    let audioBase64: string | null = null
    if (audio) {
      const arrayBuffer = await audio.arrayBuffer()
      audioBase64 = Buffer.from(arrayBuffer).toString("base64")
    }

    const webhookPayload = {
      text: text || "",
      audio: audioBase64,
    }

    // Call n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook returned status ${webhookResponse.status}`)
    }

    const data = await webhookResponse.json()

    return NextResponse.json({ titles: data.titles || [] })
  } catch (error) {
    console.error("Error generating titles:", error)
    return NextResponse.json(
      { error: "Failed to generate titles. Please try again." },
      { status: 500 }
    )
  }
}
