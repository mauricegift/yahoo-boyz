import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Phone,
  Calendar,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Users,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Loan, LoanRepayment } from "@shared/schema";

interface Guarantor {
  id: number;
  guarantorName: string;
  guarantorEmail: string;
  guarantorPhone: string;
  guarantorSavings: string;
  status: string;
}

function GuarantorsList({ loanId }: { loanId: number }) {
  const { data: guarantors, isLoading } = useQuery<Guarantor[]>({
    queryKey: [`/api/loans/${loanId}/guarantors`],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!guarantors || guarantors.length === 0) {
    return <p className="text-sm text-muted-foreground">No guarantors found</p>;
  }

  return (
    <div className="space-y-2">
      {guarantors.map((g, index) => (
        <div
          key={g.id}
          className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg text-sm"
        >
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              Guarantor {index + 1}: {g.guarantorName}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {g.guarantorEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {g.guarantorPhone}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Loans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [repayDialogOpen, setRepayDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: loans,
    isLoading: loansLoading,
    refetch: refetchLoans,
  } = useQuery<Loan[]>({
    queryKey: ["/api/loans/user"],
  });

  const repayMutation = useMutation({
    mutationFn: async (data: {
      loanId: number;
      amount: number;
      phone?: string;
    }) => {
      return apiRequest("POST", "/api/loans/repay", data);
    },
    onSuccess: (data) => {
      if (data.checkoutRequestId) {
        toast.info("Check your phone for M-Pesa prompt", { closeButton: true });
        setRepayDialogOpen(false);
        setSelectedLoan(null);
        setRepaymentAmount("");
        queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate repayment", {
        closeButton: true,
      });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchLoans();
      toast.success("Loans history refreshed", { closeButton: true });
    } catch (error) {
      toast.error("Failed to refresh loans", { closeButton: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeLoans = loans?.filter((l) => l.status === "approved") || [];
  const pendingLoans = loans?.filter((l) => l.status === "pending") || [];
  const completedLoans = loans?.filter((l) => l.status === "paid") || [];
  const rejectedLoans = loans?.filter((l) => l.status === "rejected") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-primary border-primary"
          >
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRepay = (loan: Loan) => {
    setSelectedLoan(loan);
    setRepaymentAmount(
      String(Number(loan.totalAmount) - Number(loan.amountPaid)),
    );
    setRepayDialogOpen(true);
  };

  // Function to format due date
  const formatDueDate = (dueDate: string | Date | null) => {
    if (!dueDate) return "Not set";
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return "Error formatting date";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Loans</h1>
              <p className="text-muted-foreground">
                Manage your loan applications and repayments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || loansLoading}
                className="h-10 w-10"
                title="Refresh loans history"
                data-testid="button-refresh-loans"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Link href="/loans/apply">
                <Button className="gap-2" data-testid="button-apply-loan">
                  <Plus className="h-4 w-4" />
                  Apply for Loan
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Active Loans</h2>
                <span className="text-sm text-muted-foreground">
                  {activeLoans.length} active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map((loan) => (
                  <Card key={loan.id} data-testid={`active-loan-${loan.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">
                            Loan #{loan.id}
                          </CardTitle>
                          <CardDescription>
                            Applied{" "}
                            {format(new Date(loan.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        {getStatusBadge(loan.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loan.loanUsage && (
                        <div className="bg-muted/30 rounded p-2 text-sm">
                          <p className="text-muted-foreground">Purpose:</p>
                          <p className="font-medium">{loan.loanUsage}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Principal</p>
                          <p className="font-mono font-semibold">
                            Ksh {Number(loan.amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Total (with 10%)
                          </p>
                          <p className="font-mono font-semibold">
                            Ksh {Number(loan.totalAmount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-mono font-semibold text-primary">
                            Ksh {Number(loan.amountPaid).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className="font-mono font-semibold text-destructive">
                            Ksh{" "}
                            {(
                              Number(loan.totalAmount) - Number(loan.amountPaid)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Repayment Progress
                          </span>
                          <span className="font-medium">
                            {Math.round(
                              (Number(loan.amountPaid) /
                                Number(loan.totalAmount)) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (Number(loan.amountPaid) /
                              Number(loan.totalAmount)) *
                            100
                          }
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDueDate(loan.dueDate)}
                        {loan.isOverdue && (
                          <span className="text-destructive font-medium">
                            (Overdue {loan.overdueDays} days)
                          </span>
                        )}
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value="guarantors" className="border-none">
                          <AccordionTrigger className="text-sm py-2">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              View Guarantors
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <GuarantorsList loanId={loan.id} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <Button
                        className="w-full"
                        onClick={() => handleRepay(loan)}
                        data-testid={`button-repay-${loan.id}`}
                      >
                        Make Repayment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Loans */}
          {pendingLoans.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Pending Applications</h2>
                <span className="text-sm text-muted-foreground">
                  {pendingLoans.length} pending
                </span>
              </div>
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <Card key={loan.id} data-testid={`pending-loan-${loan.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-chart-2/10">
                            <Clock className="h-6 w-6 text-chart-2" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              Loan Application #{loan.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Applied{" "}
                              {format(
                                new Date(loan.createdAt),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                            {loan.loanUsage && (
                              <p className="text-sm text-primary">
                                Purpose: {loan.loanUsage}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Requested Amount
                            </p>
                            <p className="font-mono font-bold text-lg">
                              Ksh {Number(loan.amount).toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                      <Accordion type="single" collapsible className="mt-4">
                        <AccordionItem value="guarantors" className="border-none">
                          <AccordionTrigger className="text-sm py-2">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              View Guarantors
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <GuarantorsList loanId={loan.id} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Loans */}
          {rejectedLoans.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Rejected Applications</h2>
                <span className="text-sm text-muted-foreground">
                  {rejectedLoans.length} rejected
                </span>
              </div>
              <div className="space-y-4">
                {rejectedLoans.map((loan) => (
                  <Card
                    key={loan.id}
                    className="border-destructive/30"
                    data-testid={`rejected-loan-${loan.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-destructive/10">
                              <XCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                Loan Application #{loan.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Applied{" "}
                                {format(
                                  new Date(loan.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Requested
                              </p>
                              <p className="font-mono font-bold">
                                Ksh {Number(loan.amount).toLocaleString()}
                              </p>
                            </div>
                            {getStatusBadge(loan.status)}
                          </div>
                        </div>
                        {loan.rejectionReason && (
                          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {loan.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Loans */}
          {completedLoans.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Completed Loans</h2>
                <span className="text-sm text-muted-foreground">
                  {completedLoans.length} completed
                </span>
              </div>
              <Accordion type="single" collapsible>
                {completedLoans.map((loan) => (
                  <AccordionItem key={loan.id} value={`loan-${loan.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Loan #{loan.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Ksh {Number(loan.amount).toLocaleString()} - Fully
                            Paid
                          </p>
                          {loan.loanUsage && (
                            <p className="text-xs text-muted-foreground">
                              Purpose: {loan.loanUsage}
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Principal
                          </p>
                          <p className="font-mono font-semibold">
                            Ksh {Number(loan.amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Interest (15%)
                          </p>
                          <p className="font-mono font-semibold">
                            Ksh{" "}
                            {(
                              Number(loan.totalAmount) - Number(loan.amount)
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Paid
                          </p>
                          <p className="font-mono font-semibold text-primary">
                            Ksh {Number(loan.totalAmount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Applied On
                          </p>
                          <p className="font-semibold">
                            {format(new Date(loan.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Empty State */}
          {loansLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            loans?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Loans Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Apply for a loan to access funds when you need them
                  </p>
                  <Link href="/loans/apply">
                    <Button
                      className="gap-2"
                      data-testid="button-apply-first-loan"
                    >
                      <Plus className="h-4 w-4" />
                      Apply for Your First Loan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          )}

          {/* Repayment Dialog */}
          <Dialog open={repayDialogOpen} onOpenChange={setRepayDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Loan Repayment</DialogTitle>
                <DialogDescription>
                  Repay your loan via M-Pesa
                </DialogDescription>
              </DialogHeader>
              {selectedLoan && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Outstanding Balance
                      </span>
                      <span className="font-mono font-semibold">
                        Ksh{" "}
                        {(
                          Number(selectedLoan.totalAmount) -
                          Number(selectedLoan.amountPaid)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Repayment Amount (Ksh)
                    </label>
                    <Input
                      type="number"
                      value={repaymentAmount}
                      onChange={(e) => setRepaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1.5"
                      data-testid="input-repayment-amount"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      M-Pesa Phone Number
                    </label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0712345678"
                        className="pl-10"
                        data-testid="input-repay-phone"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() =>
                      repayMutation.mutate({
                        loanId: selectedLoan.id,
                        amount: Number(repaymentAmount),
                        phone: phoneNumber,
                      })
                    }
                    disabled={
                      repayMutation.isPending ||
                      !repaymentAmount ||
                      Number(repaymentAmount) <= 0
                    }
                    data-testid="button-confirm-repayment"
                  >
                    {repayMutation.isPending
                      ? "Processing..."
                      : "Pay via M-Pesa"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
}
