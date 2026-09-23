import { NextResponse } from "next/server";
import { resetAndSeedDatabase } from "@/lib/seed-data";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

async function handleReseed() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, message: "Database reseed is strictly disabled in production environments." },
      { status: 403 }
    );
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Admin privileges are required to perform database reseed." },
      { status: 401 }
    );
  }

  try {
    const result = await resetAndSeedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database wiped and reseeded with demo data successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error reseeding database:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to reset and seed database.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleReseed();
}

export async function POST() {
  return handleReseed();
}
