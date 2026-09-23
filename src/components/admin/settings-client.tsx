"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Database, RefreshCw, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_INVOICE_TEMPLATE, renderInvoiceHtml, SAMPLE_INVOICE_DATA } from "@/lib/invoice-template";
import { parseLogo } from "@/lib/logo-helper";
import { cn } from "@/lib/utils";

type StoreSettings = {
  storeName: string;
  storeLogo: string | null;
  favicon: string | null;
  storeEmail: string | null;
  supportEmail: string | null;
  defaultCountry: string;
  timezone: string;
  storeActive: boolean;
  isMaintenance: boolean;
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  subscriptionsEnabled: boolean;
  pointsPerCurrencyUnit: number;
  invoiceTemplateHtml: string | null;
  downloadExpiryMinutes: number;
  maxDownloads: number;
  emailSenderName: string;
  emailSenderAddress: string | null;
  orderEmailsEnabled: boolean;
  invoiceEmailsEnabled: boolean;
  downloadEmailsEnabled: boolean;
  subscriptionEmailsEnabled: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  footerText: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/i;

function validateSettingField(key: string, val: any): string | null {
  if (key === "storeName") {
    if (!val || !String(val).trim()) return "Store name cannot be empty.";
  }
  if (key === "defaultCountry") {
    if (!val || String(val).trim().length !== 2) return "Default country must be a 2-letter ISO code (e.g. IN, US).";
  }
  if (key === "storeEmail" && val && String(val).trim()) {
    if (!EMAIL_REGEX.test(String(val).trim())) return "Please enter a valid email address (e.g. name@domain.com).";
  }
  if (key === "supportEmail" && val && String(val).trim()) {
    if (!EMAIL_REGEX.test(String(val).trim())) return "Please enter a valid email address (e.g. support@domain.com).";
  }
  if (key === "emailSenderName") {
    if (!val || !String(val).trim()) return "Sender name cannot be empty.";
  }
  if (key === "emailSenderAddress" && val && String(val).trim()) {
    if (!EMAIL_REGEX.test(String(val).trim())) return "Please enter a valid sender email address.";
  }
  if (key === "downloadExpiryMinutes") {
    const num = Number(val);
    if (isNaN(num) || num < 1) return "Expiry minutes must be at least 1.";
  }
  if (key === "maxDownloads") {
    const num = Number(val);
    if (isNaN(num) || num < 1) return "Maximum downloads must be at least 1.";
  }
  if (key === "pointsPerCurrencyUnit") {
    const num = Number(val);
    if (isNaN(num) || num < 0) return "Points cannot be negative.";
  }
  if (
    ["instagramUrl", "twitterUrl", "youtubeUrl", "facebookUrl", "linkedinUrl"].includes(key) &&
    val &&
    String(val).trim()
  ) {
    if (!URL_REGEX.test(String(val).trim())) {
      return "URL must start with http:// or https://";
    }
  }
  return null;
}

async function fetchSettings(): Promise<{ success: boolean; data: StoreSettings }> {
  const res = await fetch("/api/settings/store");
  return res.json();
}

export function SettingsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["store-settings"], queryFn: fetchSettings });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isReseeding, setIsReseeding] = useState(false);

  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<StoreSettings>) => {
      const res = await fetch("/api/settings/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to save settings.");
        return;
      }
      toast.success("Settings saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4 w-full">
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Unable to load settings.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["store-settings"] })}>Try Again</Button>
      </div>
    );
  }

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    const err = validateSettingField(key as string, value);
    setErrors((prev) => ({ ...prev, [key]: err }));
  }

  function handleFocus(key: keyof StoreSettings) {
    if (form) {
      const err = validateSettingField(key as string, form[key]);
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  }

  function handleSave() {
    if (!form) return;
    // Validate all fields before saving
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    (Object.keys(form) as (keyof StoreSettings)[]).forEach((key) => {
      const err = validateSettingField(key, form[key]);
      if (err) {
        newErrors[key] = err;
        hasError = true;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));

    if (hasError) {
      toast.error("Please resolve the red validation errors before saving.");
      return;
    }

    saveMutation.mutate(form);
  }

  async function handleReseed() {
    if (
      !confirm(
        "Are you sure you want to completely wipe all existing database records and reseed fresh demo data for a single user showcase?"
      )
    ) {
      return;
    }
    setIsReseeding(true);
    try {
      const res = await fetch("/api/admin/reseed", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || "Reseed failed.");
        return;
      }
      toast.success("Database wiped and reseeded with demo data successfully!");
      queryClient.invalidateQueries();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger reseed.");
    } finally {
      setIsReseeding(false);
    }
  }

  const logoConfig = parseLogo(form.storeLogo);

  return (
    <Tabs defaultValue="general" className="w-full space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 bg-muted/60">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="downloads">Downloads</TabsTrigger>
        <TabsTrigger value="invoice">Invoice Template</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="website">Website</TabsTrigger>
        <TabsTrigger value="demo" className="text-amber-600 dark:text-amber-400 font-semibold">
          Demo Data &amp; Reseed
        </TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base text-foreground">General Settings</CardTitle>
            <CardDescription>
              Configure your store branding for both Light and Dark themes, as well as direct contact emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Field label="Store Name *" error={errors.storeName}>
                  <Input
                    value={form.storeName}
                    className={cn(errors.storeName && "border-red-500 focus-visible:ring-red-500/30")}
                    onFocus={() => handleFocus("storeName")}
                    onChange={(e) => set("storeName", e.target.value)}
                  />
                </Field>
              </div>
              <div>
                <Field label="Default Country (ISO) *" error={errors.defaultCountry}>
                  <Input
                    maxLength={2}
                    value={form.defaultCountry}
                    className={cn(errors.defaultCountry && "border-red-500 focus-visible:ring-red-500/30 font-mono")}
                    onFocus={() => handleFocus("defaultCountry")}
                    onChange={(e) => set("defaultCountry", e.target.value.toUpperCase())}
                  />
                </Field>
              </div>
            </div>

            {/* Dual Theme Logos */}
            <div className="space-y-3 rounded-xl border p-4 bg-muted/15">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Store Branding &amp; Logos</Label>
                <p className="text-xs text-muted-foreground">
                  Upload tailored logos for Light and Dark themes. MotionFly automatically switches logos depending on user theme mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <LogoField
                  label="Light Theme Logo"
                  description="Used on white/light backgrounds (store header &amp; invoices)."
                  value={logoConfig.light}
                  endpoint="/api/settings/store/logo"
                  variant="light"
                  previewBg="light"
                  onUploaded={(path) => set("storeLogo", path)}
                />
                <LogoField
                  label="Dark Theme Logo"
                  description="Used on dark backgrounds (dark mode header &amp; sidebar)."
                  value={logoConfig.dark}
                  endpoint="/api/settings/store/logo"
                  variant="dark"
                  previewBg="dark"
                  onUploaded={(path) => set("storeLogo", path)}
                />
              </div>
            </div>

            <LogoField
              label="Favicon"
              description="Browser tab icon (.png, .ico, or .webp)"
              value={form.favicon}
              endpoint="/api/settings/store/favicon"
              previewBg="light"
              onUploaded={(path) => set("favicon", path)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Store Email" error={errors.storeEmail}>
                <Input
                  value={form.storeEmail ?? ""}
                  placeholder="store@motionfly.dev"
                  className={cn(errors.storeEmail && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("storeEmail")}
                  onChange={(e) => set("storeEmail", e.target.value)}
                />
              </Field>
              <Field label="Support Email" error={errors.supportEmail}>
                <Input
                  value={form.supportEmail ?? ""}
                  placeholder="support@motionfly.dev"
                  className={cn(errors.supportEmail && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("supportEmail")}
                  onChange={(e) => set("supportEmail", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4 bg-muted/15">
              <ToggleField label="Store Active" checked={form.storeActive} onChange={(v) => set("storeActive", v)} />
              <ToggleField label="Maintenance Mode" checked={form.isMaintenance} onChange={(v) => set("isMaintenance", v)} />
            </div>

            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payments Settings */}
      <TabsContent value="payments" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">Payment Methods</CardTitle>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  process.env.NODE_ENV === "production" ? "bg-success/15 text-success" : "bg-signal/15 text-signal"
                }`}
              >
                {process.env.NODE_ENV === "production" ? "Live Mode" : "Sandbox Mode"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleField label="Cards, UPI & Netbanking (via Razorpay) — India & Global" checked={form.razorpayEnabled} onChange={(v) => set("razorpayEnabled", v)} />
            <ToggleField label="Credit / Debit Cards (via Stripe) — Visa, Mastercard, Amex (India & Global)" checked={form.stripeEnabled} onChange={(v) => set("stripeEnabled", v)} />
            <ToggleField label="PayPal — International payments & USD balance" checked={form.paypalEnabled} onChange={(v) => set("paypalEnabled", v)} />
            <p className="text-xs text-muted-foreground">
              Payment method credentials (API keys, webhook secrets) are configured via server environment variables and are
              never exposed to the browser. The environment your keys belong to (test/sandbox vs live) determines
              whether real money moves — set <code>NODE_ENV=production</code> with live keys when you deploy for real
              customers; anything else runs in sandbox mode automatically.
            </p>
            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Subscription Settings */}
      <TabsContent value="subscription" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Subscription Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleField label="Enable Subscriptions" checked={form.subscriptionsEnabled} onChange={(v) => set("subscriptionsEnabled", v)} />
            <Field label="Loyalty points per currency unit (cancellation credit)" error={errors.pointsPerCurrencyUnit}>
              <Input
                type="number"
                min={0}
                value={form.pointsPerCurrencyUnit}
                className={cn(errors.pointsPerCurrencyUnit && "border-red-500 focus-visible:ring-red-500/30")}
                onFocus={() => handleFocus("pointsPerCurrencyUnit")}
                onChange={(e) => set("pointsPerCurrencyUnit", Number(e.target.value))}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              When a customer cancels mid-period, they're credited this many points per whole currency unit of unused
              subscription time. Manage individual plan pricing under Subscriptions &rarr; Plans.
            </p>
            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Download Settings */}
      <TabsContent value="downloads" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Download Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Link Expiry (minutes)" error={errors.downloadExpiryMinutes}>
                <Input
                  type="number"
                  min={1}
                  value={form.downloadExpiryMinutes}
                  className={cn(errors.downloadExpiryMinutes && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("downloadExpiryMinutes")}
                  onChange={(e) => set("downloadExpiryMinutes", Number(e.target.value))}
                />
              </Field>
              <Field label="Maximum Downloads" error={errors.maxDownloads}>
                <Input
                  type="number"
                  min={1}
                  value={form.maxDownloads}
                  className={cn(errors.maxDownloads && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("maxDownloads")}
                  onChange={(e) => set("maxDownloads", Number(e.target.value))}
                />
              </Field>
            </div>
            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Invoice Template Settings */}
      <TabsContent value="invoice" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1 max-w-4xl">
                <CardTitle className="text-base text-foreground">Invoice Template &amp; Customization</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Edit the HTML used to generate customer invoices. Available placeholders:{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{storeLogo}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{storeName}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{storeEmail}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{supportEmail}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{invoiceNumber}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{orderNumber}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{date}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{billingName}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{billingEmail}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{subtotal}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{discount}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{total}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{paymentMethod}}"}</code>,{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">{"{{itemsTable}}"}</code>.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  set("invoiceTemplateHtml", DEFAULT_INVOICE_TEMPLATE);
                  toast.success("Reset invoice to default professional template.");
                }}
              >
                Reset to Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Template HTML</Label>
                <Textarea
                  rows={24}
                  className="font-mono text-xs w-full min-h-[500px]"
                  value={form.invoiceTemplateHtml ?? DEFAULT_INVOICE_TEMPLATE}
                  onChange={(e) => set("invoiceTemplateHtml", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Live Preview</Label>
                <iframe
                  title="Invoice preview"
                  className="h-[500px] w-full rounded-md border bg-white shadow-inner"
                  srcDoc={renderInvoiceHtml(form.invoiceTemplateHtml ?? DEFAULT_INVOICE_TEMPLATE, {
                    ...SAMPLE_INVOICE_DATA,
                    storeName: form.storeName || "MotionFly",
                    storeLogo: logoConfig.light || logoConfig.dark || "",
                    storeEmail: form.storeEmail || "store@motionfly.dev",
                    supportEmail: form.supportEmail || "support@motionfly.dev",
                  })}
                />
              </div>
            </div>
            <div className="pt-2">
              <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Settings */}
      <TabsContent value="email" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Email Settings</CardTitle>
            <CardDescription>
              Configure transactional email sender details and toggle notifications. Outgoing delivery uses Nodemailer SMTP configured in your server environment (.env).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sender Name *" error={errors.emailSenderName}>
                <Input
                  value={form.emailSenderName}
                  className={cn(errors.emailSenderName && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("emailSenderName")}
                  onChange={(e) => set("emailSenderName", e.target.value)}
                />
              </Field>
              <Field label="Sender Email" error={errors.emailSenderAddress}>
                <Input
                  value={form.emailSenderAddress ?? ""}
                  placeholder="notifications@motionfly.dev"
                  className={cn(errors.emailSenderAddress && "border-red-500 focus-visible:ring-red-500/30")}
                  onFocus={() => handleFocus("emailSenderAddress")}
                  onChange={(e) => set("emailSenderAddress", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4 bg-muted/15">
              <ToggleField label="Order Emails" checked={form.orderEmailsEnabled} onChange={(v) => set("orderEmailsEnabled", v)} />
              <ToggleField label="Invoice Emails" checked={form.invoiceEmailsEnabled} onChange={(v) => set("invoiceEmailsEnabled", v)} />
              <ToggleField label="Download Emails" checked={form.downloadEmailsEnabled} onChange={(v) => set("downloadEmailsEnabled", v)} />
              <ToggleField
                label="Subscription Emails"
                checked={form.subscriptionEmailsEnabled}
                onChange={(v) => set("subscriptionEmailsEnabled", v)}
              />
            </div>
            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Website Settings */}
      <TabsContent value="website" className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Website Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Hero Title">
                <Input value={form.heroTitle ?? ""} onChange={(e) => set("heroTitle", e.target.value)} />
              </Field>
              <Field label="Hero Subtitle">
                <Input value={form.heroSubtitle ?? ""} onChange={(e) => set("heroSubtitle", e.target.value)} />
              </Field>
            </div>
            <Field label="Footer Text">
              <Input value={form.footerText ?? ""} onChange={(e) => set("footerText", e.target.value)} />
            </Field>
            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium">Social Media Links</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Instagram" error={errors.instagramUrl}>
                  <Input
                    placeholder="https://instagram.com/yourhandle"
                    value={form.instagramUrl ?? ""}
                    className={cn(errors.instagramUrl && "border-red-500 focus-visible:ring-red-500/30")}
                    onFocus={() => handleFocus("instagramUrl")}
                    onChange={(e) => set("instagramUrl", e.target.value)}
                  />
                </Field>
                <Field label="Twitter / X" error={errors.twitterUrl}>
                  <Input
                    placeholder="https://x.com/yourhandle"
                    value={form.twitterUrl ?? ""}
                    className={cn(errors.twitterUrl && "border-red-500 focus-visible:ring-red-500/30")}
                    onFocus={() => handleFocus("twitterUrl")}
                    onChange={(e) => set("twitterUrl", e.target.value)}
                  />
                </Field>
                <Field label="YouTube" error={errors.youtubeUrl}>
                  <Input
                    placeholder="https://youtube.com/@yourchannel"
                    value={form.youtubeUrl ?? ""}
                    className={cn(errors.youtubeUrl && "border-red-500 focus-visible:ring-red-500/30")}
                    onFocus={() => handleFocus("youtubeUrl")}
                    onChange={(e) => set("youtubeUrl", e.target.value)}
                  />
                </Field>
                <Field label="Facebook" error={errors.facebookUrl}>
                  <Input
                    placeholder="https://facebook.com/yourpage"
                    value={form.facebookUrl ?? ""}
                    className={cn(errors.facebookUrl && "border-red-500 focus-visible:ring-red-500/30")}
                    onFocus={() => handleFocus("facebookUrl")}
                    onChange={(e) => set("facebookUrl", e.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="LinkedIn" error={errors.linkedinUrl}>
                    <Input
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={form.linkedinUrl ?? ""}
                      className={cn(errors.linkedinUrl && "border-red-500 focus-visible:ring-red-500/30")}
                      onFocus={() => handleFocus("linkedinUrl")}
                      onChange={(e) => set("linkedinUrl", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
            <SaveButton onClick={handleSave} isLoading={saveMutation.isPending} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Demo Data & Reseed */}
      <TabsContent value="demo" className="w-full">
        <Card className="w-full border-amber-500/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base text-foreground">Database Reset &amp; Single Demo User Reseed</CardTitle>
            </div>
            <CardDescription>
              Wipe all old/test data and populate fresh cinema-grade assets and full history for a single user presentation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <User className="h-4 w-4 text-primary" /> Single Demo User Account Details
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reseeding populates this single customer account with everything needed for a complete showcase:
                an active PRO membership (with an 8-day expiring soon banner and notification), multiple paid and pending orders,
                downloadable assets, cart &amp; wishlist items, and verified reviews.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="font-semibold text-muted-foreground">Demo Customer Login</span>
                  <div className="font-mono text-foreground font-semibold text-sm">demo@motionfly.dev</div>
                  <div className="text-muted-foreground">
                    Password: <span className="font-mono text-foreground font-semibold">Demo@12345</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="font-semibold text-muted-foreground">Admin Account Login</span>
                  <div className="font-mono text-foreground font-semibold text-sm">admin@motionfly.dev</div>
                  <div className="text-muted-foreground">
                    Password: <span className="font-mono text-foreground font-semibold">Admin@12345</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">Wipe Database &amp; Reseed All Data</p>
                <p className="text-xs text-muted-foreground">
                  Removes all existing test records, orders, and users, then recreates pristine demo assets with the single user showcase data.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isReseeding}
                onClick={handleReseed}
                className="gap-2 shrink-0 font-bold"
              >
                <RefreshCw className={cn("h-4 w-4", isReseeding && "animate-spin")} />
                {isReseeding ? "Reseeding Database..." : "Reset & Reseed Demo Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={error ? "text-red-500 dark:text-red-400 font-semibold" : ""}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-200">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SaveButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <Button onClick={onClick} isLoading={isLoading} loadingText="Saving...">
      Save Changes
    </Button>
  );
}

function LogoField({
  label,
  value,
  endpoint,
  variant,
  previewBg = "light",
  description,
  onUploaded,
}: {
  label: string;
  value: string | null;
  endpoint: string;
  variant?: "light" | "dark";
  previewBg?: "light" | "dark";
  description?: string;
  field?: string;
  onUploaded: (path: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (variant) formData.append("variant", variant);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      onUploaded(json.data.storeLogo ?? json.data.favicon);
      toast.success("Image updated successfully.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-3 pt-1">
        <div
          className={`flex h-14 w-28 items-center justify-center rounded-lg border p-1.5 transition-colors ${
            previewBg === "dark" ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[10px] text-zinc-400 font-medium">No Logo</span>
          )}
        </div>
        <label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleUpload}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" isLoading={isUploading} asChild>
            <span>{value ? "Replace" : "Upload"}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
