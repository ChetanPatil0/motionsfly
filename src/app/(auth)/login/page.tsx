"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        ...values,
        redirect: false,
      });
      if (res?.error) {
        try {
          const checkRes = await fetch("/api/auth/pending-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: values.email }),
          });
          const checkJson = await checkRes.json();
          if (checkJson?.data?.pending) {
            toast.error("Please verify your email to finish creating your account.");
            router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
            return;
          }
        } catch {
          // fall through
        }
        toast.error("Invalid email or password.");
        return;
      }
      toast.success("Welcome back!");
      try {
        await fetch("/api/cart/merge", { method: "POST" });
      } catch {
        // Non-blocking merge fallback
      }

      // Check callbackUrl from query parameter first
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const callbackUrl = searchParams?.get("callbackUrl");

      let targetUrl = callbackUrl && !callbackUrl.startsWith("/login") ? callbackUrl : "";

      if (!targetUrl) {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          targetUrl = sessionData?.user?.role === "ADMIN" ? "/admin/dashboard" : "/account";
        } catch {
          targetUrl = "/account";
        }
      }

      // Full navigation ensures newly set cookies are sent cleanly to Server Components
      window.location.href = targetUrl;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient background glow */}
      <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl -z-10 pointer-events-none" />

      <Card className="border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 pb-6 text-center border-b bg-muted/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1 border border-primary/20 shadow-xs">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">Sign In to MotionFly</CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            Enter your email and password to access your downloads and video masterclasses.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Password</span>
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <span>&bull;</span> {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 font-semibold shadow-md shadow-primary/20 gap-1.5"
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline ml-1">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
