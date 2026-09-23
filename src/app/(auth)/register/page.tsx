"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, User, Mail, Globe, Lock, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COUNTRIES } from "@/constants/countries";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: "IN", acceptTerms: true },
  });

  const passwordVal = watch("password") || "";
  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  async function onSubmit(values: RegisterInput) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to create account.");
        return;
      }
      toast.success("Verification code sent! Please check your email.");
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl -z-10 pointer-events-none" />

      <Card className="border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 pb-6 text-center border-b bg-muted/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1 border border-primary/20 shadow-xs">
            <UserPlus className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">Create Account</CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            Join MotionFly to unlock premium templates, video LUTs, and masterclasses.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Full Name</span>
              </Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                autoComplete="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                className={errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                className={errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Country Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Country &amp; Currency</span>
              </Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[11px] text-muted-foreground">
                Determines billing currency (India &rarr; INR ₹, international &rarr; USD $).
              </p>
              {errors.country && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.country.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Password</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password requirement chips */}
              {passwordVal.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className={`inline-flex items-center gap-1 ${hasMinLength ? "text-emerald-500" : "text-muted-foreground"}`}>
                    <span>{hasMinLength ? "✓" : "○"}</span> 8+ characters
                  </span>
                  <span className={`inline-flex items-center gap-1 ${hasUppercase ? "text-emerald-500" : "text-muted-foreground"}`}>
                    <span>{hasUppercase ? "✓" : "○"}</span> 1 uppercase
                  </span>
                  <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-emerald-500" : "text-muted-foreground"}`}>
                    <span>{hasNumber ? "✓" : "○"}</span> 1 number
                  </span>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Terms and Conditions Acceptance */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2.5 rounded-lg border p-3 bg-muted/20">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="acceptTerms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-foreground underline hover:text-primary font-medium">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-foreground underline hover:text-primary font-medium">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.acceptTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 font-semibold shadow-md shadow-primary/20 gap-1.5"
              isLoading={isLoading}
              loadingText="Creating account..."
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline ml-1">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
