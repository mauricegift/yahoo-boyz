import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Already logged in, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setRequiresVerification(true);
        setVerificationEmail(form.getValues("email"));
        toast.info(
          "Please verify your account. Check your email/phone for the code.",
          { closeButton: true },
        );
      } else {
        login(data.user, data.token);
        toast.success("Welcome back!", { closeButton: true });
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed", { closeButton: true });
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  if (requiresVerification) {
    setLocation(`/verify?email=${encodeURIComponent(verificationEmail)}`);
    return null;
  }

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
                <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Sign in to your YAHOO-BOYZ account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 sm:space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "100ms" }}>
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
                      name="password"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "200ms" }}>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm sm:text-base">
                              Password
                            </FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs sm:text-sm text-primary hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
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
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-10 sm:h-11 text-sm sm:text-base animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: "300ms" }}
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center text-sm sm:text-base animate-in fade-in duration-500" style={{ animationDelay: "400ms" }}>
                  <span className="text-muted-foreground">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    href="/signup"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </Link>
                </div>

                <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground animate-in fade-in duration-500" style={{ animationDelay: "500ms" }}>
                  Join 1000+ members growing together
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
