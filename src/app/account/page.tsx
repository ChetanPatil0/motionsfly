"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  User, 
  ShieldCheck, 
  Palette, 
  Award, 
  Lock, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  KeyRound, 
  Mail, 
  Globe 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { COUNTRIES } from "@/constants/countries";
import { useThemeSync } from "@/hooks/use-theme-sync";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  name: string;
  email: string;
  country: string;
  pendingEmail: string | null;
  loyaltyPoints: number;
  createdAt: string;
};

async function fetchProfile(): Promise<{ data: Profile }> {
  const res = await fetch("/api/account/profile");
  return res.json();
}

export default function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { theme, setTheme } = useThemeSync();

  // Profile Tab state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("IN");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({});

  // Password / Security Tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (data?.data) {
      setName(data.data.name ?? "");
      setCountry(data.data.country ?? "IN");
      setEmail(data.data.email ?? "");
    }
  }, [data]);

  // Profile Validation
  function handleNameChange(val: string) {
    setName(val);
    if (!val.trim()) {
      setProfileErrors((prev) => ({ ...prev, name: "Name is required." }));
    } else if (val.trim().length < 2) {
      setProfileErrors((prev) => ({ ...prev, name: "Name must be at least 2 characters." }));
    } else {
      setProfileErrors((prev) => ({ ...prev, name: undefined }));
    }
  }

  function handleEmailChange(val: string) {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setProfileErrors((prev) => ({ ...prev, email: "Email is required." }));
    } else if (!emailRegex.test(val.trim())) {
      setProfileErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    } else {
      setProfileErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  async function saveProfile() {
    const errors: { name?: string; email?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsSavingProfile(true);
    try {
      const changes: Record<string, string> = {};
      if (name !== data?.data.name) changes.name = name.trim();
      if (country !== data?.data.country) changes.country = country;
      if (email.toLowerCase().trim() !== data?.data.email.toLowerCase().trim()) {
        changes.email = email.toLowerCase().trim();
      }

      if (Object.keys(changes).length === 0) {
        toast.info("No profile changes detected.");
        return;
      }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to update profile.");
        return;
      }
      toast.success(json.message ?? "Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("An unexpected error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function confirmEmailChange() {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/account/verify-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Invalid or expired code.");
        return;
      }
      toast.success("Email address successfully changed!");
      setOtpCode("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  // Password validation rules
  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  function handleCurrentPasswordChange(val: string) {
    setCurrentPassword(val);
    if (!val) {
      setPasswordErrors((prev) => ({ ...prev, currentPassword: "Enter your current password." }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
    }
  }

  function handleNewPasswordChange(val: string) {
    setNewPassword(val);
    if (!val) {
      setPasswordErrors((prev) => ({ ...prev, newPassword: "New password is required." }));
    } else if (val.length < 8) {
      setPasswordErrors((prev) => ({ ...prev, newPassword: "Must be at least 8 characters long." }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
    }

    if (confirmPassword && val !== confirmPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
    } else if (confirmPassword && val === confirmPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }

  function handleConfirmPasswordChange(val: string) {
    setConfirmPassword(val);
    if (!val) {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: "Confirm your new password." }));
    } else if (val !== newPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errors: typeof passwordErrors = {};

    if (!currentPassword) errors.currentPassword = "Enter your current password.";
    if (!newPassword) {
      errors.newPassword = "Enter a new password.";
    } else if (!isPasswordValid) {
      errors.newPassword = "Password must fulfill all complexity requirements.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Could not update password.");
        return;
      }

      toast.success(json.message ?? "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading || !data?.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="h-64 rounded-xl border border-border/50 bg-card/40 animate-pulse" />
      </div>
    );
  }

  const profile = data.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account profile, email address, security credentials, and interface appearance.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-10 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="profile" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFILE & EMAIL */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Personal Details
              </CardTitle>
              <CardDescription>
                Update your display name, email, and regional country preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={cn("pl-9 h-10", profileErrors.name && "border-destructive focus-visible:ring-destructive")}
                    placeholder="Your Full Name"
                  />
                </div>
                {profileErrors.name && (
                  <p className="text-xs text-destructive font-medium mt-1">{profileErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                  <span className="text-[11px] text-muted-foreground">Changes require verification</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={cn("pl-9 h-10", profileErrors.email && "border-destructive focus-visible:ring-destructive")}
                    placeholder="you@domain.com"
                  />
                </div>
                {profileErrors.email && (
                  <p className="text-xs text-destructive font-medium mt-1">{profileErrors.email}</p>
                )}
              </div>

              {/* Country Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Country / Region</Label>
                <div className="relative">
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-10">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground/60" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] text-muted-foreground">Used for localized invoicing and store currency preferences.</p>
              </div>

              <div className="pt-2">
                <Button 
                  isLoading={isSavingProfile} 
                  loadingText="Saving Changes..." 
                  onClick={saveProfile}
                  className="font-medium"
                >
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Email Verification */}
          {profile.pendingEmail && (
            <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-500" /> Verify New Email Address
                </CardTitle>
                <CardDescription>
                  A 6-digit confirmation code was sent to <strong className="text-foreground">{profile.pendingEmail}</strong>. Enter it to activate your new email.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Input 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  maxLength={6} 
                  placeholder="123456" 
                  className="max-w-xs font-mono tracking-widest text-center text-base h-10"
                />
                <Button 
                  isLoading={isVerifyingOtp} 
                  loadingText="Verifying..." 
                  onClick={confirmEmailChange}
                  className="h-10"
                >
                  Confirm Email Change
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loyalty & Account Overview */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Award className="h-4 w-4 text-amber-500" /> Loyalty & Store Credit
              </CardTitle>
              <CardDescription>
                Points accumulated via promotions or refunded credits applicable automatically at checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-foreground">{profile.loyaltyPoints}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Points Available</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SECURITY & PASSWORD */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Change Password
              </CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to remain secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="currentPassword" className="text-xs font-medium">Current Password</Label>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                      className={cn("pl-9 pr-10 h-10", passwordErrors.currentPassword && "border-destructive focus-visible:ring-destructive")}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive font-medium mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-medium">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => handleNewPasswordChange(e.target.value)}
                      className={cn("pl-9 pr-10 h-10", passwordErrors.newPassword && "border-destructive focus-visible:ring-destructive")}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive font-medium mt-1">{passwordErrors.newPassword}</p>
                  )}

                  {/* Password Requirements Checklist */}
                  {newPassword && (
                    <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 mt-2 border border-border/40">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Password Requirements:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        <div className={cn("flex items-center gap-1.5", passwordRules.length ? "text-emerald-500" : "text-muted-foreground")}>
                          <Check className={cn("h-3.5 w-3.5", passwordRules.length ? "opacity-100" : "opacity-30")} />
                          <span>8+ characters</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5", passwordRules.upper ? "text-emerald-500" : "text-muted-foreground")}>
                          <Check className={cn("h-3.5 w-3.5", passwordRules.upper ? "opacity-100" : "opacity-30")} />
                          <span>Uppercase letter (A-Z)</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5", passwordRules.lower ? "text-emerald-500" : "text-muted-foreground")}>
                          <Check className={cn("h-3.5 w-3.5", passwordRules.lower ? "opacity-100" : "opacity-30")} />
                          <span>Lowercase letter (a-z)</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5", passwordRules.number ? "text-emerald-500" : "text-muted-foreground")}>
                          <Check className={cn("h-3.5 w-3.5", passwordRules.number ? "opacity-100" : "opacity-30")} />
                          <span>Number (0-9)</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5 sm:col-span-2", passwordRules.special ? "text-emerald-500" : "text-muted-foreground")}>
                          <Check className={cn("h-3.5 w-3.5", passwordRules.special ? "opacity-100" : "opacity-30")} />
                          <span>Special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className={cn("pl-9 pr-10 h-10", passwordErrors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit"
                    isLoading={isChangingPassword} 
                    loadingText="Updating Password..." 
                    className="font-medium"
                    disabled={!currentPassword || !newPassword || !confirmPassword || !isPasswordValid || newPassword !== confirmPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: APPEARANCE & THEME */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Interface Appearance
              </CardTitle>
              <CardDescription>
                Customize how MotionFly looks on your device. Your preference automatically syncs across your signed-in sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Mode Option */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    theme === "light" 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : "border-border/60 bg-card hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Sun className="h-5 w-5" />
                    </div>
                    {theme === "light" && (
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">Light Theme</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clean, crisp interface optimized for daylight and high-contrast environments.
                  </p>
                </button>

                {/* Dark Mode Option */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    theme === "dark" 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : "border-border/60 bg-card hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Moon className="h-5 w-5" />
                    </div>
                    {theme === "dark" && (
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">Dark Theme</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deep charcoal palette engineered to minimize eye fatigue during editing sessions.
                  </p>
                </button>

                {/* System Option */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    theme === "system" 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : "border-border/60 bg-card hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Monitor className="h-5 w-5" />
                    </div>
                    {theme === "system" && (
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">System Default</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dynamically syncs with your operating system’s current dark/light preference.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

