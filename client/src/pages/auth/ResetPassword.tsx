import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition, ScaleIn } from "@/components/ui/page-transition";
import { PasswordStrength, validatePasswordStrength } from "@/components/ui/password-strength";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const strongPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
    .refine((val) => /\d/.test(val), "Password must contain a number")
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), "Password must contain a special character"),
});

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const email = new URLSearchParams(search).get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Already logged in, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<{ newPassword: string }>({
    resolver: zodResolver(strongPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const password = form.watch("newPassword");

  useEffect(() => {
    if (inputRefs.current[0] && !isAuthenticated) {
      inputRefs.current[0].focus();
    }
  }, [isAuthenticated]);

  const resetMutation = useMutation({
    mutationFn: async (data: { newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        code: code.join(""),
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      setIsReset(true);
      toast.success("Password reset successfully!", { closeButton: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password", { closeButton: true });
    },
  });

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
  };

  const onSubmit = (data: { newPassword: string }) => {
    if (code.join("").length !== 6) {
      toast.error("Please enter the complete verification code", { closeButton: true });
      return;
    }
    const { isValid, errors } = validatePasswordStrength(data.newPassword);
    if (!isValid) {
      errors.forEach((error) => toast.error(error, { closeButton: true }));
      return;
    }
    resetMutation.mutate(data);
  };

  if (isAuthenticated) {
    return null;
  }

  if (isReset) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
          <PageTransition className="w-full max-w-md">
            <ScaleIn>
              <Card>
                <CardContent className="pt-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-primary/10 animate-in zoom-in duration-500">
                      <CheckCircle className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "100ms" }}>
                    Password Reset!
                  </h2>
                  <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "200ms" }}>
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                  <Link href="/login">
                    <Button className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "300ms" }} data-testid="button-go-to-login">
                      Continue to Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </ScaleIn>
          </PageTransition>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
        <PageTransition className="w-full max-w-md">
          <ScaleIn>
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <img src="/favicon.jpg" alt="YAHOO-BOYZ" className="h-12 w-12 rounded-full object-cover animate-in zoom-in duration-500" />
                </div>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Enter the code sent to your phone/email and your new password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium mb-2">Verification Code</p>
                  <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-12 text-center text-lg font-bold animate-in fade-in zoom-in duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                        data-testid={`input-code-${index}`}
                      />
                    ))}
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "200ms" }}>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                className="pl-10 pr-10"
                                {...field}
                                data-testid="input-new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <PasswordStrength password={password} />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: "300ms" }}
                      disabled={resetMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {resetMutation.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center animate-in fade-in duration-500" style={{ animationDelay: "400ms" }}>
                  <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                    Back
                  </Link>
                </div>
              </CardContent>
            </Card>
          </ScaleIn>
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
