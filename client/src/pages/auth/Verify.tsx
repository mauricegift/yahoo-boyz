import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition, ScaleIn } from "@/components/ui/page-transition";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

export default function Verify() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const email = new URLSearchParams(search).get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Already logged in, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (inputRefs.current[0] && !isAuthenticated) {
      inputRefs.current[0].focus();
    }
  }, [isAuthenticated]);

  const verifyMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const response = await apiRequest("POST", "/api/auth/verify", {
        email,
        code: verificationCode,
      });
      return response;
    },
    onSuccess: () => {
      setIsVerified(true);
      toast.success("Account verified successfully!", { closeButton: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Verification failed", { closeButton: true });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-code", { email });
      return response;
    },
    onSuccess: () => {
      toast.success("Verification code resent! Check your phone/email.", { closeButton: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resend code", { closeButton: true });
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      verifyMutation.mutate(fullCode);
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

    if (pastedData.length === 6) {
      verifyMutation.mutate(pastedData);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  if (isVerified) {
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
                    Verified!
                  </h2>
                  <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "200ms" }}>
                    Your account has been successfully verified. You can now log in.
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
                <CardTitle className="text-2xl">Verify Your Account</CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent to your phone/email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold animate-in fade-in zoom-in duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                      disabled={verifyMutation.isPending}
                      data-testid={`input-otp-${index}`}
                    />
                  ))}
                </div>

                {verifyMutation.isPending && (
                  <p className="text-center text-sm text-muted-foreground mb-4 animate-pulse">
                    Verifying...
                  </p>
                )}

                <div className="text-center animate-in fade-in duration-500" style={{ animationDelay: "300ms" }}>
                  <p className="text-sm text-muted-foreground mb-2">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => resendMutation.mutate()}
                    disabled={resendMutation.isPending}
                    data-testid="button-resend-code"
                  >
                    {resendMutation.isPending ? "Sending..." : "Resend Code"}
                  </Button>
                </div>
                
                <div className="mt-6 text-center animate-in fade-in duration-500" style={{ animationDelay: "400ms" }}>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">
                    Back to Signup
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
