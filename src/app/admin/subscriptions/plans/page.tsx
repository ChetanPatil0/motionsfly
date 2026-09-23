import { SubscriptionsSubNav } from "@/components/admin/subscriptions-sub-nav";
import { SubscriptionPlansClient } from "@/components/admin/subscription-plans-client";

export default function AdminSubscriptionPlansPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <SubscriptionsSubNav />
      <SubscriptionPlansClient />
    </div>
  );
}
