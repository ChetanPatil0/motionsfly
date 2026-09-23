import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const download = await prisma.download.findUnique({
    where: { token: params.token },
    include: {
      order: true,
      product: { include: { files: true } },
    },
  });

  // Token valid?
  if (!download) {
    return NextResponse.json({ success: false, message: "This download link is invalid." }, { status: 404 });
  }

  // Order exists & payment successful?
  if (!download.order || download.order.status !== "PAID" || download.order.paymentStatus !== "SUCCESS") {
    return NextResponse.json({ success: false, message: "This order has not been paid for." }, { status: 403 });
  }

  // Ownership check: if the download is tied to a registered user, only
  // that user (or an admin) may use it. Guest downloads (userId null) rely
  // on the unguessable token itself, delivered privately via email/order page.
  if (download.userId) {
    const currentUser = await getCurrentUser();
    const isOwner = currentUser && (currentUser as { id: string }).id === download.userId;
    const isAdmin = currentUser && (currentUser as { role?: string }).role === "ADMIN";
    const url = new URL(req.url);
    const orderNumberParam = url.searchParams.get("orderNumber");
    const isOrderAuthorized = orderNumberParam && download.order.orderNumber === orderNumberParam;
    if (!isOwner && !isAdmin && !isOrderAuthorized) {
      return NextResponse.json({ success: false, message: "You do not have access to this download." }, { status: 403 });
    }
  }

  // Link expired?
  if (download.expiresAt < new Date()) {
    await prisma.download.update({ where: { id: download.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ success: false, message: "This download link has expired." }, { status: 410 });
  }

  // Download limit exceeded?
  if (download.downloadCount >= download.maxDownloads) {
    await prisma.download.update({ where: { id: download.id }, data: { status: "LIMIT_EXCEEDED" } });
    return NextResponse.json({ success: false, message: "You have reached the maximum number of downloads for this file." }, { status: 403 });
  }

  // Product still has a file attached?
  const file = download.product.files[0];
  if (!file) {
    return NextResponse.json({ success: false, message: "No file is currently available for this product." }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(file.storageKey);
  } catch {
    return NextResponse.json({ success: false, message: "The file could not be found. Please contact support." }, { status: 404 });
  }

  // Record the successful download — increments count, keeps status SUCCESS.
  await prisma.download.update({
    where: { id: download.id },
    data: { downloadCount: { increment: 1 }, status: "SUCCESS" },
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
