import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, message = "Success", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiError(message = "Something went wrong.", errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

/**
 * Wraps a route handler so unexpected errors never leak internals
 * (Prisma errors, stack traces, secrets) to the client — Section 79/71.
 */
export function withErrorHandling(
  handler: (req: Request, ctx?: any) => Promise<NextResponse>
) {
  return async (req: Request, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[api_error]", { route: req.url, err });
      return apiError("Something went wrong. Please try again.", [], 500);
    }
  };
}
