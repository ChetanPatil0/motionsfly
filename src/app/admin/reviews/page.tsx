import { AdminReviewsClient } from "@/components/admin/admin-reviews-client";

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      <AdminReviewsClient />
    </div>
  );
}
