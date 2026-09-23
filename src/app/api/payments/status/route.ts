import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber");

  if (!orderNumber) {
    return NextResponse.json({ success: false, message: "Order number is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      currency: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
    },
  });
}
