"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Ticket, Trash2, Plus } from "lucide-react";
import { couponSchema, type CouponInput } from "@/schemas/coupon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";

type Coupon = CouponInput & { id: string; startDate: string; endDate: string; _count: { usages: number } };

export function CouponsClient() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: { discountType: "PERCENTAGE", isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CouponInput) => {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to create coupon.");
        return;
      }
      toast.success("Coupon created successfully.");
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Coupon updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Coupon deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">New Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((v) => createMutation.mutate(v))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="WELCOME10" {...register("code")} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input id="discountValue" type="number" {...register("discountValue")} />
                {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minOrderAmount">Min Order Amount (minor units)</Label>
                <Input id="minOrderAmount" type="number" {...register("minOrderAmount")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input id="usageLimit" type="number" {...register("usageLimit")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
              </div>
              <div className="col-span-full">
                <Button type="submit" isLoading={createMutation.isPending} loadingText="Creating...">
                  Create Coupon
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <AdminDataTable<Coupon>
        queryKey="admin-coupons"
        fetchUrl={({ page, q }) => `/api/coupons?page=${page}&q=${encodeURIComponent(q)}`}
        columns={couponColumns(toggleMutation, deleteMutation)}
        emptyIcon={Ticket}
        emptyTitle="No Coupons Yet"
        emptyDescription="Create your first coupon above."
      />
    </div>
  );
}

function couponColumns(
  toggleMutation: { mutate: (v: { id: string; isActive: boolean }) => void },
  deleteMutation: { mutate: (id: string) => void }
): Column<Coupon>[] {
  return [
    { key: "code", label: "Code", render: (c) => <span className="font-mono">{c.code}</span> },
    {
      key: "discount",
      label: "Discount",
      render: (c) => (c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : c.discountValue),
    },
    {
      key: "valid",
      label: "Valid",
      render: (c) => (
        <span className="text-muted-foreground">
          {format(new Date(c.startDate), "MMM d")} – {format(new Date(c.endDate), "MMM d")}
        </span>
      ),
    },
    {
      key: "uses",
      label: "Uses",
      render: (c) => (
        <span>
          {c._count.usages}
          {c.usageLimit ? ` / ${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (c) => (
        <Switch checked={c.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (c) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} aria-label="Delete coupon">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];
}
