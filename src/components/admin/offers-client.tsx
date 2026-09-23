"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Percent, Trash2, Plus } from "lucide-react";
import { offerSchema, type OfferInput } from "@/schemas/offer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";

type Offer = {
  id: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: { product: { title: string } }[];
};

type SimpleProduct = { id: string; title: string };

async function fetchProducts(): Promise<{ data: { products: SimpleProduct[] } }> {
  const res = await fetch("/api/products?scope=admin&pageSize=100");
  return res.json();
}

export function OffersClient() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: productsData } = useQuery({ queryKey: ["products-for-offers"], queryFn: fetchProducts });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OfferInput>({
    resolver: zodResolver(offerSchema),
    defaultValues: { discountType: "PERCENTAGE", isActive: true, productIds: [] },
  });

  const createMutation = useMutation({
    mutationFn: async (values: OfferInput) => {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to create offer.");
        return;
      }
      toast.success("Offer created successfully.");
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Offer updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Offer deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });

  const products = productsData?.data?.products ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Add Offer
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">New Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Offer Name</Label>
                <Input id="name" placeholder="Summer Sale" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Products</Label>
                <Controller
                  name="productIds"
                  control={control}
                  render={({ field }) => (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                      {products.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">No products available.</p>
                      ) : (
                        products.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-muted">
                            <input
                              type="checkbox"
                              checked={field.value.includes(p.id)}
                              onChange={(e) => {
                                field.onChange(
                                  e.target.checked ? [...field.value, p.id] : field.value.filter((id) => id !== p.id)
                                );
                              }}
                            />
                            {p.title}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                />
                {errors.productIds && <p className="text-xs text-destructive">{errors.productIds.message}</p>}
              </div>
              <Button type="submit" isLoading={createMutation.isPending} loadingText="Creating...">
                Create Offer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <AdminDataTable<Offer>
        queryKey="admin-offers"
        fetchUrl={({ page, q }) => `/api/offers?page=${page}&q=${encodeURIComponent(q)}`}
        columns={offerColumns(toggleMutation, deleteMutation)}
        emptyIcon={Percent}
        emptyTitle="No Offers Yet"
        emptyDescription="Create your first offer above."
      />
    </div>
  );
}

function offerColumns(
  toggleMutation: { mutate: (v: { id: string; isActive: boolean }) => void },
  deleteMutation: { mutate: (id: string) => void }
): Column<Offer>[] {
  return [
    { key: "name", label: "Name", render: (o) => <span className="font-medium">{o.name}</span> },
    {
      key: "discount",
      label: "Discount",
      render: (o) => (o.discountType === "PERCENTAGE" ? `${o.discountValue}% off` : `${o.discountValue} off`),
    },
    { key: "products", label: "Products", render: (o) => `${o.products.length} product${o.products.length === 1 ? "" : "s"}` },
    {
      key: "valid",
      label: "Valid",
      render: (o) => (
        <span className="text-muted-foreground">
          {format(new Date(o.startDate), "MMM d")}–{format(new Date(o.endDate), "MMM d")}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (o) => (
        <Switch checked={o.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: o.id, isActive: v })} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (o) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(o.id)} aria-label="Delete offer">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];
}
