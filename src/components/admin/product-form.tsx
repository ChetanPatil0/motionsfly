"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productSchema, type ProductInput, PRODUCT_TYPES } from "@/schemas/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type Category = { id: string; name: string };

export function ProductForm({
  productId,
  defaultValues,
  categories,
}: {
  productId?: string;
  defaultValues?: Partial<ProductInput>;
  categories: Category[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!productId;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      type: "DIGITAL_RESOURCE",
      priceINR: 0,
      priceUSD: 0,
      isFree: false,
      isPremium: false,
      isPublished: false,
      isFeatured: false,
      ...defaultValues,
    },
  });

  async function onSubmit(values: ProductInput) {
    setIsLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/products/${productId}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to save product.");
        return;
      }
      toast.success(isEdit ? "Product updated successfully." : "Product created successfully.");
      router.push(`/admin/products/${json.data.id}`);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input id="shortDescription" {...register("shortDescription")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description &amp; What It Contains</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Detail what this plugin contains, bulleted lists of features, installation steps, compatibility..."
                />
              )}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="priceINR">Price INR (paise)</Label>
            <Input id="priceINR" type="number" {...register("priceINR")} />
            {errors.priceINR && <p className="text-xs text-destructive">{errors.priceINR.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priceUSD">Price USD (cents)</Label>
            <Input id="priceUSD" type="number" {...register("priceUSD")} />
            {errors.priceUSD && <p className="text-xs text-destructive">{errors.priceUSD.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow control={control} name="isFree" label="Free product" />
          <ToggleRow control={control} name="isPremium" label="Premium (subscription-gated)" />
          <ToggleRow control={control} name="isFeatured" label="Featured on homepage" />
          <ToggleRow control={control} name="isPublished" label="Published" />
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isLoading} loadingText={isEdit ? "Updating..." : "Creating..."}>
        {isEdit ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}

function ToggleRow({ control, name, label }: { control: any; name: keyof ProductInput; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}
