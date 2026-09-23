"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreditCard, Trash2, Plus } from "lucide-react";
import { subscriptionPlanSchema, type SubscriptionPlanInput } from "@/schemas/subscription-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/utils";

type Plan = SubscriptionPlanInput & { id: string };

async function fetchPlans(): Promise<{ data: Plan[] }> {
  const res = await fetch("/api/subscription-plans?scope=admin");
  return res.json();
}

export function SubscriptionPlansClient() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["subscription-plans"], queryFn: fetchPlans });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubscriptionPlanInput>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: { billingInterval: "MONTHLY", isActive: true, priceINR: 0, priceUSD: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (values: SubscriptionPlanInput) => {
      const res = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to create plan.");
        return;
      }
      toast.success("Plan created successfully.");
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/subscription-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Plan updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscription-plans/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: (json) => {
      toast.success(json.message ?? "Plan removed.");
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">New Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((v) => createMutation.mutate(v))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              noValidate
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" placeholder="Premium Monthly" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>
              <div className="space-y-1.5">
                <Label>Billing Interval</Label>
                <Controller
                  name="billingInterval"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div />
              <div className="space-y-1.5">
                <Label htmlFor="priceINR">Price INR (paise)</Label>
                <Input id="priceINR" type="number" {...register("priceINR")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priceUSD">Price USD (cents)</Label>
                <Input id="priceUSD" type="number" {...register("priceUSD")} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={createMutation.isPending} loadingText="Creating...">
                  Create Plan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState icon={CreditCard} title="No Plans Yet" description="Create your first subscription plan above." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {data.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">
                    {p.name} <span className="text-xs text-muted-foreground">({p.billingInterval})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(p.priceINR, "INR")} / {formatMoney(p.priceUSD, "USD")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })} />
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} aria-label="Delete plan">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
