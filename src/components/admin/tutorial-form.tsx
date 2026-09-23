"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { tutorialSchema, type TutorialInput } from "@/schemas/tutorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = { id: string; name: string };

export function TutorialForm({
  tutorialId,
  defaultValues,
  categories,
}: {
  tutorialId?: string;
  defaultValues?: Partial<TutorialInput>;
  categories: Category[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!tutorialId;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TutorialInput>({
    resolver: zodResolver(tutorialSchema),
    defaultValues: {
      title: "",
      description: "",
      contentUrl: "",
      accessType: "FREE",
      priceINR: 0,
      priceUSD: 0,
      isPublished: false,
      isFeatured: false,
      ...defaultValues,
    },
  });

  async function onSubmit(values: TutorialInput) {
    setIsLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/tutorials/${tutorialId}` : "/api/tutorials", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to save tutorial.");
        return;
      }
      toast.success(isEdit ? "Tutorial updated successfully." : "Tutorial created successfully.");
      router.push(`/admin/tutorials/${json.data.id}`);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Tutorial Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...register("description")} aria-invalid={!!errors.description} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contentUrl">Video / Content URL</Label>
            <Input id="contentUrl" placeholder="https://www.youtube.com/watch?v=... or Vimeo / CDN link" {...register("contentUrl")} />
            <p className="text-[11px] text-muted-foreground">
              External video link (YouTube, Vimeo, or CDN). Streams directly to save server storage and bandwidth.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Access Type</Label>
              <Controller
                name="accessType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PREMIUM">Premium (Subscription)</SelectItem>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="priceINR">Price INR (paise)</Label>
              <Input id="priceINR" type="number" {...register("priceINR")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceUSD">Price USD (cents)</Label>
              <Input id="priceUSD" type="number" {...register("priceUSD")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow control={control} name="isFeatured" label="Featured on homepage" />
          <ToggleRow control={control} name="isPublished" label="Published" />
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isLoading} loadingText={isEdit ? "Updating..." : "Creating..."}>
        {isEdit ? "Update Tutorial" : "Create Tutorial"}
      </Button>
    </form>
  );
}

function ToggleRow({ control, name, label }: { control: any; name: keyof TutorialInput; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={name}>{label}</Label>
      <Controller name={name} control={control} render={({ field }) => <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />} />
    </div>
  );
}
