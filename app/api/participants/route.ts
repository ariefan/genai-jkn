import { NextResponse } from "next/server";
import { getParticipantSummaries, readBillingData } from "@/lib/billing";

export async function GET() {
  try {
    const billingData = await readBillingData();
    const participants = getParticipantSummaries(billingData);
    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Failed to load participants:", error);
    return NextResponse.json(
      { error: "Tidak dapat mengambil data peserta." },
      { status: 500 }
    );
  }
}

