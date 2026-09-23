import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { decodeDownloadCode } from "@/lib/download-token";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const { token, orderNumber } = decodeDownloadCode(params.code);

  const download = await prisma.download.findUnique({
    where: { token },
    include: {
      order: true,
      product: { include: { files: true } },
    },
  });

  if (!download) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>Download Link Invalid</h2>
        <p style="color: #666;">This download link is invalid or has expired.</p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Return Home</a>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Order payment verified?
  if (!download.order || download.order.status !== "PAID" || download.order.paymentStatus !== "SUCCESS") {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>Order Not Paid</h2>
        <p style="color: #666;">This order has not been completed yet.</p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Return Home</a>
      </body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Authorization check
  if (download.userId) {
    const currentUser = await getCurrentUser();
    const isOwner = currentUser && (currentUser as { id: string }).id === download.userId;
    const isAdmin = currentUser && (currentUser as { role?: string }).role === "ADMIN";
    const isOrderAuthorized = orderNumber && download.order.orderNumber === orderNumber;

    if (!isOwner && !isAdmin && !isOrderAuthorized) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
          <h2>Access Denied</h2>
          <p style="color: #666;">You do not have permission to access this download.</p>
          <a href="/login" style="display: inline-block; margin-top: 16px; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Log In</a>
        </body></html>`,
        { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  }

  // Link expired?
  if (download.expiresAt < new Date()) {
    await prisma.download.update({ where: { id: download.id }, data: { status: "EXPIRED" } });
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>Download Expired</h2>
        <p style="color: #666;">This download link has expired.</p>
      </body></html>`,
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Limit reached?
  if (download.downloadCount >= download.maxDownloads) {
    await prisma.download.update({ where: { id: download.id }, data: { status: "LIMIT_EXCEEDED" } });
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>Download Limit Reached</h2>
        <p style="color: #666;">You have reached the maximum number of downloads (${download.maxDownloads}) for this file.</p>
      </body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // File check
  const file = download.product.files[0];
  if (!file) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>File Unavailable</h2>
        <p style="color: #666;">No file is attached to this product currently. Please contact support.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(file.storageKey);
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>File Not Found</h2>
        <p style="color: #666;">The requested file could not be read. Please contact support.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Increment download count
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
