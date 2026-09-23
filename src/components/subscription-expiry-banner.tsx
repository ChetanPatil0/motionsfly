import { AlertTriangle } from "lucide-react";

export function SubscriptionExpiryBanner({ daysLeft, cancelling }: { daysLeft: number; cancelling: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
      <p>
        {cancelling
          ? `Your subscription ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"} and will not renew.`
          : `Your subscription renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Make sure your payment method is up to date.`}
      </p>
    </div>
  );
}
