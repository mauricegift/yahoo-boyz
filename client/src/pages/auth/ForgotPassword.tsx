import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition, ScaleIn } from "@/components/ui/page-transition";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Already logged in, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response;
    },
    onSuccess: () => {
      setEmailSent(true);
      setSentEmail(form.getValues("email"));
      toast.success("Reset code sent! Check your phone/email.", { closeButton: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reset code", { closeButton: true });
    },
  });

  const onSubmit = (data: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isAuthenticated) {
    return null;
  }

  if (emailSent) {
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
                    Check Your Phone/Email
                  </h2>
                  <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "200ms" }}>
                    We've sent a reset code to your phone and email
                  </p>
                  <Link href={`/reset-password?email=${encodeURIComponent(sentEmail)}`}>
                    <Button className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "300ms" }} data-testid="button-continue-reset">
                      Continue to Reset Password
                    </Button>
                  </Link>
                  <div className="mt-4 animate-in fade-in duration-500" style={{ animationDelay: "400ms" }}>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                      Back to Login
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
                <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a reset code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: "100ms" }}>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10"
                                {...field}
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: "200ms" }}
                      disabled={forgotPasswordMutation.isPending}
                      data-testid="button-send-reset"
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center animate-in fade-in duration-500" style={{ animationDelay: "300ms" }}>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                    Back to Login
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
