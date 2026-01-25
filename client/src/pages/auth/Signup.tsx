import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition, ScaleIn } from "@/components/ui/page-transition";
import { PasswordStrength, validatePasswordStrength } from "@/components/ui/password-strength";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const strongPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
    .refine((val) => /\d/.test(val), "Password must contain a number")
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), "Password must contain a special character"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  otpPreference: z.enum(["sms", "email", "both"]).default("both"),
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Already logged in, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof strongPasswordSchema>>({
    resolver: zodResolver(strongPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      otpPreference: "both",
    },
  });

  const password = form.watch("password");

  const signupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof strongPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response;
    },
    onSuccess: () => {
      const email = form.getValues("email");
      toast.success("Account created! Check your phone/email for the verification code.", {
        closeButton: true,
      });
      setLocation(`/verify?email=${encodeURIComponent(email)}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Signup failed", { closeButton: true });
    },
  });

  const onSubmit = (data: z.infer<typeof strongPasswordSchema>) => {
    const { isValid, errors } = validatePasswordStrength(data.password);
    if (!isValid) {
      errors.forEach((error) => toast.error(error, { closeButton: true }));
      return;
    }
    signupMutation.mutate(data);
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4 sm:p-6">
        <PageTransition className="w-full max-w-md mx-auto">
          <ScaleIn>
            <Card className="w-full">
              <CardHeader className="text-center px-4 sm:px-6">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg sm:text-xl animate-in zoom-in duration-500">
                    YB
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl">
                  Join YAHOO-BOYZ
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Create your account and start growing with us
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 sm:space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "100ms" }}>
                          <FormLabel className="text-sm sm:text-base">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="John Doe"
                                className="pl-10 pr-3 sm:pl-10 sm:pr-4 h-10 sm:h-11"
                                {...field}
                                data-testid="input-name"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "150ms" }}>
                          <FormLabel className="text-sm sm:text-base">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 pr-3 sm:pl-10 sm:pr-4 h-10 sm:h-11"
                                {...field}
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "200ms" }}>
                          <FormLabel className="text-sm sm:text-base">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="0712345678"
                                className="pl-10 pr-3 sm:pl-10 sm:pr-4 h-10 sm:h-11"
                                {...field}
                                data-testid="input-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "250ms" }}>
                          <FormLabel className="text-sm sm:text-base">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                className="pl-10 pr-10 h-10 sm:h-11"
                                {...field}
                                data-testid="input-password"
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
                      className="w-full h-10 sm:h-11 text-sm sm:text-base animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: "300ms" }}
                      disabled={signupMutation.isPending}
                      data-testid="button-signup"
                    >
                      {signupMutation.isPending
                        ? "Creating account..."
                        : "Create Account"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center text-sm sm:text-base animate-in fade-in duration-500" style={{ animationDelay: "400ms" }}>
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </div>

                <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground animate-in fade-in duration-500" style={{ animationDelay: "500ms" }}>
                  By signing up, you agree to contribute Ksh 20 daily
                </p>
              </CardContent>
            </Card>
          </ScaleIn>
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
