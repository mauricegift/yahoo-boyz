import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Calculator,
  Info,
  CheckCircle,
  Calendar,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const loanApplySchema = z.object({
  amount: z
    .number()
    .min(500, { message: "Minimum loan amount is Ksh 500" })
    .max(10000, { message: "Maximum loan amount is Ksh 10,000" }),
  duration: z
    .number()
    .min(1, { message: "Minimum duration is 1 day" })
    .max(10, { message: "Maximum duration is 10 days" }),
  loanUsage: z
    .string()
    .min(10, { message: "Please provide a reason (at least 10 characters)" })
    .max(500, { message: "Reason is too long (maximum 500 characters)" }),
  guarantor1: z
    .string()
    .min(1, { message: "Guarantor 1 email or phone is required" }),
  guarantor2: z
    .string()
    .min(1, { message: "Guarantor 2 email or phone is required" }),
});

export default function LoanApply() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof loanApplySchema>>({
    resolver: zodResolver(loanApplySchema),
    defaultValues: {
      amount: 500,
      duration: 7,
      loanUsage: "",
      guarantor1: "",
      guarantor2: "",
    },
  });

  const amount = form.watch("amount");
  const duration = form.watch("duration");
  const interest = amount * 0.15;
  const totalAmount = amount + interest;

  const calculateDueDate = () => {
    const now = new Date();
    const dueDate = addDays(now, duration);
    return format(dueDate, "MMMM d, yyyy");
  };

  const applyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loanApplySchema>) => {
      return apiRequest("POST", "/api/loans/apply", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Loan application submitted successfully!", {
        closeButton: true,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit loan application", {
        closeButton: true,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof loanApplySchema>) => {
    // Check if guarantor is the user's own phone or email
    const userPhone = user?.phone?.trim().toLowerCase();
    const userEmail = user?.email?.trim().toLowerCase();
    const g1 = data.guarantor1.trim().toLowerCase();
    const g2 = data.guarantor2.trim().toLowerCase();

    if (g1 === userPhone || g1 === userEmail) {
      toast.error("You cannot use your own phone number or email as a guarantor", {
        closeButton: true,
      });
      return;
    }
    if (g2 === userPhone || g2 === userEmail) {
      toast.error("You cannot use your own phone number or email as a guarantor", {
        closeButton: true,
      });
      return;
    }
    if (g1 === g2) {
      toast.error("Guarantor 1 and Guarantor 2 must be different people", {
        closeButton: true,
      });
      return;
    }

    applyMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Application Submitted!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your loan application for Ksh {amount.toLocaleString()} has
                  been submitted. Our admin team will review it and notify you
                  of the decision.
                </p>
                <div className="space-y-3">
                  <Link href="/loans">
                    <Button className="w-full" data-testid="button-view-loans">
                      View My Loans
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-back-dashboard"
                    >
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            href="/loans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Loans
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Apply for Loan
                </CardTitle>
                <CardDescription>
                  Choose your loan amount and provide 2 guarantors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount (Ksh)</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input
                                type="number"
                                min={500}
                                max={10000}
                                step={100}
                                {...field}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  if (value < 500) {
                                    field.onChange(500);
                                  } else if (value > 10000) {
                                    field.onChange(10000);
                                  } else {
                                    field.onChange(value);
                                  }
                                }}
                                data-testid="input-loan-amount"
                              />
                              <Slider
                                min={500}
                                max={10000}
                                step={100}
                                value={[field.value]}
                                onValueChange={([value]) =>
                                  field.onChange(value)
                                }
                                className="py-4"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Ksh 500</span>
                                <span>Ksh 10,000</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Enter amount between Ksh 500 and Ksh 10,000
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Duration (Days): {field.value} {field.value === 1 ? 'day' : 'days'}</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) =>
                                  field.onChange(value)
                                }
                                className="py-4"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1 day</span>
                                <span>10 days</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Select repayment period (1-10 days)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loanUsage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What will you use the loan for?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please describe what you plan to use the loan for..."
                              className="resize-none min-h-[80px]"
                              {...field}
                              data-testid="textarea-loan-usage"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear reason for your loan application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-primary" />
                        Guarantors (Required)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Provide 2 registered members who will guarantee your loan.
                        Their combined savings must be at least equal to your loan amount.
                      </p>

                      <FormField
                        control={form.control}
                        name="guarantor1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor 1 (Email or Phone)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="email@example.com or 0712345678"
                                  className="pl-10"
                                  {...field}
                                  data-testid="input-guarantor1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guarantor2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor 2 (Email or Phone)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="email@example.com or 0712345678"
                                  className="pl-10"
                                  {...field}
                                  data-testid="input-guarantor2"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due Date:
                        </span>
                        <span className="font-medium">
                          {calculateDueDate()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Loan Amount
                        </span>
                        <span className="font-mono font-semibold">
                          Ksh {amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Interest (15%)
                        </span>
                        <span className="font-mono font-semibold text-chart-2">
                          Ksh {interest.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium pt-2 border-t">
                        <span>Total Repayment</span>
                        <span className="font-mono text-primary">
                          Ksh {totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={applyMutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {applyMutation.isPending
                        ? "Submitting..."
                        : "Submit Application"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Loan Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Principal Amount
                    </span>
                    <span className="font-mono font-semibold">
                      Ksh {amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Interest Rate</span>
                    <span className="font-semibold">10%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Interest Amount
                    </span>
                    <span className="font-mono font-semibold text-chart-2">
                      Ksh {interest.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Repayment Period
                    </span>
                    <span className="font-semibold">
                      {duration} {duration === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Due Date
                    </span>
                    <span className="font-semibold">{calculateDueDate()}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3 -mx-3">
                    <span className="font-semibold">Total Repayment</span>
                    <span className="font-mono font-bold text-lg text-primary">
                      Ksh {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4 text-primary" />
                    Loan Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        <strong>Minimum savings:</strong> Ksh 1,000 required
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        <strong>No missed contributions</strong> allowed
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        <strong>2 guarantors required</strong> - registered members
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        Guarantors' combined savings must equal loan amount
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        <strong>Loan amount:</strong> Ksh 500 - Ksh 10,000
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>
                        <strong>Duration:</strong> 1 - 10 days
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Fixed 15% interest rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-2" />
                      <span className="text-destructive">
                        <strong>Default:</strong> Guarantors' savings will be deducted
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                      <Info className="h-3 w-3" />
                      Important Notice
                    </div>
                    <p className="text-sm">
                      If you fail to repay your loan, the admin may use the
                      <strong> auto-pay </strong> feature to deduct the remaining
                      amount from your guarantors' savings equally.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
