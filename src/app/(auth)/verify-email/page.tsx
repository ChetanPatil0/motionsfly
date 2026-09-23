"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const otpSchema = z.object({ code: z.string().trim().length(6, "Enter the 6-digit code") });
type OtpInput = z.infer<typeof otpSchema>;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({ resolver: zodResolver(otpSchema) });

  async function onSubmit(values: OtpInput) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: values.code }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Invalid code.");
        return;
      }
      toast.success("Email verified successfully.");
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function resend() {
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      toast.success(json.message ?? "A new code has been sent.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Verify your email</CardTitle>
        <CardDescription>Enter the 6-digit code we sent to {email || "your email"}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification Code</Label>
            <Input id="code" maxLength={6} inputMode="numeric" {...register("code")} aria-invalid={!!errors.code} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading} loadingText="Verifying...">
            Verify Email
          </Button>
        </form>
        <Button variant="ghost" size="sm" className="mt-4 w-full" isLoading={isResending} onClick={resend}>
          Resend Code
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
