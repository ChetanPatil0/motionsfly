import fs from "fs";
import path from "path";

const dataDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const NOTIF_FILE = path.join(dataDir, "subscription-notifications.json");

function getStore(): Record<string, string> {
  try {
    if (!fs.existsSync(NOTIF_FILE)) {
      const dir = path.dirname(NOTIF_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(NOTIF_FILE, JSON.stringify({}), "utf8");
      return {};
    }
    const raw = fs.readFileSync(NOTIF_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Checks if an email notification for a particular event and subscription cycle was already sent.
 * cycleKey is typically the currentPeriodEnd ISO date string (YYYY-MM-DD).
 */
export function isSubscriptionNotified(
  subscriptionId: string,
  event: "EXPIRING_10_DAYS" | "EXPIRED",
  cycleKey: string
): boolean {
  const store = getStore();
  const key = `${subscriptionId}_${event}_${cycleKey}`;
  return !!store[key];
}

/**
 * Records that a notification was sent for a particular event and subscription cycle.
 */
export function recordSubscriptionNotification(
  subscriptionId: string,
  event: "EXPIRING_10_DAYS" | "EXPIRED",
  cycleKey: string
) {
  try {
    const store = getStore();
    const key = `${subscriptionId}_${event}_${cycleKey}`;
    store[key] = new Date().toISOString();
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to record subscription notification in file store:", err);
  }
}
