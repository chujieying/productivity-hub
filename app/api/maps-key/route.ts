import { NextResponse } from "next/server"

export async function GET() {
  // Return the API key from the server
  return NextResponse.json({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })
}

