import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hasTutorialAccess } from "@/lib/tutorial-access";
import { STORAGE_ROOT } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tutorial = await prisma.tutorial.findUnique({ where: { id: params.id } });
  if (!tutorial || !tutorial.isPublished || tutorial.deletedAt) {
    return NextResponse.json({ success: false, message: "Tutorial not found." }, { status: 404 });
  }
  if (tutorial.contentType !== "UPLOADED_VIDEO" || !tutorial.videoStorageKey) {
    return NextResponse.json({ success: false, message: "No uploaded video for this tutorial." }, { status: 404 });
  }

  const user = await getCurrentUser();
  const allowed = await hasTutorialAccess(user ? (user as { id: string }).id : null, tutorial);
  if (!allowed) {
    return NextResponse.json({ success: false, message: "You do not have access to this tutorial." }, { status: 403 });
  }

  const fullPath = path.join(STORAGE_ROOT, tutorial.videoStorageKey);
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return NextResponse.json({ success: false, message: "Video file not found." }, { status: 404 });
  }

  const range = req.headers.get("range");
  if (!range) {
    const stream = fs.createReadStream(fullPath);
    return new NextResponse(stream as any, {
      headers: { "Content-Type": "video/mp4", "Content-Length": String(stat.size), "Cache-Control": "no-store" },
    });
  }

  const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
  const start = startStr ? parseInt(startStr, 10) : 0;
  const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
  const chunkSize = end - start + 1;

  const stream = fs.createReadStream(fullPath, { start, end });
  return new NextResponse(stream as any, {
    status: 206,
    headers: {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(chunkSize),
      "Content-Type": "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}
