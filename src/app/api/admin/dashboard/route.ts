import { requireAdmin } from "@/lib/session";
import { getDashboardData, resolveDateRange, type DateRangeKey } from "@/lib/dashboard";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const rangeKey = (url.searchParams.get("range") as DateRangeKey) || "last30";
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const range = resolveDateRange(rangeKey, from, to);
  const data = await getDashboardData(range);

  return apiSuccess(data, "Dashboard data loaded.");
});
