import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Wallet,
  TrendingUp,
  Banknote,
  AlertCircle,
  Users,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  PiggyBank,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { format, isToday, addDays, differenceInMilliseconds } from "date-fns";
import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type {
  Contribution,
  Loan,
  MissedContribution,
  Saving,
} from "@shared/schema";

interface DashboardStats {
  userTotal: number;
  groupTotal: number;
  userTotalSavings: number;
  groupTotalSavings: number;
  activeLoans: number;
  pendingContributions: number;
  missedContributions: MissedContribution[];
  daysCovered: number;
  daysElapsed: number;
  daysBehind: number;
  canContribute: boolean;
  nextContributionTime: string | null;
}

interface ContributionsResponse {
  contributions: Contribution[];
  total: number;
  page: number;
  totalPages: number;
}

interface SavingsResponse {
  savings: Saving[];
  total: number;
  page: number;
  totalPages: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [savingsAmount, setSavingsAmount] = useState("");
  const [savingsDescription, setSavingsDescription] = useState("");
  const [timeUntilNextContribution, setTimeUntilNextContribution] =
    useState<string>("");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(
    null,
  );
  const [missedContributionDialogOpen, setMissedContributionDialogOpen] = useState(false);
  const [missedContributionPhone, setMissedContributionPhone] = useState(user?.phone || "");

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const {
    data: contributionsData,
    isLoading: contributionsLoading,
    refetch: refetchContributions,
  } = useQuery<ContributionsResponse>({
    queryKey: ["/api/contributions/user"],
  });

  const {
    data: savingsData,
    isLoading: savingsLoading,
    refetch: refetchSavings,
  } = useQuery<SavingsResponse>({
    queryKey: ["/api/savings/user"],
  });

  const {
    data: loans,
    isLoading: loansLoading,
    refetch: refetchLoans,
  } = useQuery<Loan[]>({
    queryKey: ["/api/loans/user"],
  });

  // Extract arrays from the response objects
  const contributions = contributionsData?.contributions || [];
  const savings = savingsData?.savings || [];

  // Use canContribute flag from backend for strict 24-hour enforcement
  const canContributeNow = stats?.canContribute ?? true;
  
  // If canContribute is false, the user has already contributed within last 24 hours
  const hasContributedRecently = !canContributeNow && contributions.length > 0;

  const pendingContribution = contributions?.find(
    (contribution) =>
      contribution.status === "pending",
  );

  // Poll for pending contribution status
  useEffect(() => {
    if (pendingContribution?.mpesaCheckoutId && !pollingInterval) {
      setPendingCheckoutId(pendingContribution.mpesaCheckoutId);

      const pollStatus = async () => {
        try {
          const response = await apiRequest(
            "POST",
            "/api/contributions/verify",
            {
              checkoutRequestId: pendingContribution.mpesaCheckoutId,
            },
          );

          if (response.status === "completed" || response.success === true) {
            // Payment completed, stop polling and refresh data
            queryClient.invalidateQueries({
              queryKey: ["/api/contributions/user"],
            });
            queryClient.invalidateQueries({
              queryKey: ["/api/dashboard/stats"],
            });
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      };

      // Start polling immediately
      pollStatus();

      // Then poll every 10 seconds
      const interval = setInterval(pollStatus, 10000);
      setPollingInterval(interval);

      // Clear interval after 5 minutes (300 seconds) if still pending
      const timeout = setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          setPollingInterval(null);
        }
      }, 300000);

      return () => {
        if (interval) clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (!pendingContribution && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPendingCheckoutId(null);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pendingContribution, queryClient]);

  // Calculate countdown until next contribution using exact 24-hour window from backend
  useEffect(() => {
    if (stats?.nextContributionTime) {
      const updateCountdown = () => {
        const now = new Date();
        const nextTime = new Date(stats.nextContributionTime!);

        const diffMs = nextTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          setTimeUntilNextContribution("Now available");
          return;
        }
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeUntilNextContribution(`${hours}h ${minutes}m ${seconds}s`);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [stats?.nextContributionTime]);

  const contributeMutation = useMutation({
    mutationFn: async (data: { amount: number; phone?: string }) => {
      return apiRequest("POST", "/api/contributions/initiate", data);
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutRequestId) {
        toast.success(data.message || "Check your phone for M-Pesa prompt", {
          closeButton: true,
        });
        setContributionDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/user"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setPendingCheckoutId(data.checkoutRequestId);
      } else {
        toast.error(data.message || "Failed to initiate payment", {
          closeButton: true,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate payment", {
        closeButton: true,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      description?: string;
      phone?: string;
    }) => {
      return apiRequest("POST", "/api/savings/make", data);
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutRequestId) {
        toast.success(data.message || "Check your phone for M-Pesa prompt", {
          closeButton: true,
        });
        setSavingsDialogOpen(false);
        setSavingsAmount("");
        setSavingsDescription("");
        queryClient.invalidateQueries({
          queryKey: ["/api/savings/user"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      } else {
        toast.error(data.message || "Failed to initiate savings", {
          closeButton: true,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate savings", {
        closeButton: true,
      });
    },
  });

  const payMissedContributionsMutation = useMutation({
    mutationFn: async (data: { amount: number; phone?: string }) => {
      return apiRequest("POST", "/api/contributions/pay-missed", data);
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutRequestId) {
        toast.success(data.message || "Check your phone for M-Pesa prompt", {
          closeButton: true,
        });
        setMissedContributionDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/contributions/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      } else {
        toast.error(data.message || "Failed to initiate payment", {
          closeButton: true,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate payment", {
        closeButton: true,
      });
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchContributions();
    refetchSavings();
    refetchLoans();
    toast.success("Refreshing dashboard data...");
  };

  const recentContributions = contributions?.slice(0, 5) || [];
  const recentSavings = savings?.slice(0, 5) || [];
  const activeLoan = loans?.find((l) => l.status === "approved");
  const pendingLoan = loans?.find((l) => l.status === "pending");

  const totalUserBalance =
    (stats?.userTotal || 0) + (stats?.userTotalSavings || 0);

  const outstandingLoanAmount = loans
    ?.filter((l) => l.status === "approved" || l.status === "overdue")
    .reduce((sum, loan) => sum + (Number(loan.totalAmount || 0) - Number(loan.amountPaid || 0)), 0) || 0;

  const failedContribution = contributions?.find(
    (contribution) =>
      isToday(new Date(contribution.createdAt)) &&
      contribution.status === "failed",
  );

  // Format numbers safely
  const formatNumber = (num: number | undefined) => {
    return (
      num?.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "0.00"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Welcome Section with Refresh Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                Here's your financial overview for today
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={
                statsLoading ||
                contributionsLoading ||
                savingsLoading ||
                loansLoading
              }
            >
              <RefreshCw
                className={`h-4 w-4 ${statsLoading || contributionsLoading || savingsLoading || loansLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Debug Section - Remove in production */}
          {process.env.NODE_ENV === "development" && statsError && (
            <Card className="mb-4 bg-destructive/10 border-destructive">
              <CardContent className="pt-6">
                <div className="text-sm">
                  <p className="font-semibold mb-2 text-destructive">
                    Error Loading Stats:
                  </p>
                  <p>{statsError.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <PiggyBank className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      My Total Savings
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p
                        className="text-2xl font-bold font-mono"
                        data-testid="text-user-savings"
                      >
                        Ksh {formatNumber(stats?.userTotalSavings)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <PiggyBank className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Group Total Savings
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p
                        className="text-2xl font-bold font-mono"
                        data-testid="text-group-savings"
                      >
                        Ksh {formatNumber(stats?.groupTotalSavings)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      My Total Contributions
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p
                        className="text-2xl font-bold font-mono"
                        data-testid="text-user-total"
                      >
                        Ksh {formatNumber(stats?.userTotal)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-chart-2/10">
                    <Users className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Group Total Contributions
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p
                        className="text-2xl font-bold font-mono"
                        data-testid="text-group-total"
                      >
                        Ksh {formatNumber(stats?.groupTotal)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={stats?.daysBehind && stats.daysBehind > 0 ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stats?.daysBehind && stats.daysBehind > 0 ? "bg-destructive/10" : "bg-green-500/10"}`}>
                    {stats?.daysBehind && stats.daysBehind > 0 ? (
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contribution Status
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p
                        className={`text-2xl font-bold ${stats?.daysBehind && stats.daysBehind > 0 ? "text-red-600" : "text-green-600"}`}
                        data-testid="text-contribution-status"
                      >
                        {stats?.daysBehind && stats.daysBehind > 0 
                          ? `${stats.daysBehind} days missed`
                          : "Up to date"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {outstandingLoanAmount > 0 && (
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-orange-500/10">
                      <Banknote className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        My Outstanding Loan
                      </p>
                      {loansLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <p
                          className="text-2xl font-bold font-mono text-orange-600"
                          data-testid="text-outstanding-loan"
                        >
                          Ksh {formatNumber(outstandingLoanAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Days Behind Alert with Pay Button */}
          {stats?.daysBehind && stats.daysBehind > 0 && (
            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive">
                        Missed Contributions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You have {stats.daysBehind} missed day(s) totaling{" "}
                        <span className="font-mono font-semibold">
                          Ksh {(stats.daysBehind * 20).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Dialog open={missedContributionDialogOpen} onOpenChange={setMissedContributionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid="button-pay-missed"
                      >
                        Pay Missed Contributions
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pay Missed Contributions</DialogTitle>
                        <DialogDescription>
                          You have {stats.daysBehind} missed day(s). Each day costs Ksh 20.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Missed Days</span>
                            <span className="font-bold">{stats.daysBehind} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount per Day</span>
                            <span className="font-mono">Ksh 20</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                            <span className="font-semibold">Total Amount</span>
                            <span className="font-mono font-bold text-destructive">
                              Ksh {(stats.daysBehind * 20).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">M-Pesa Phone Number</label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="254712345678"
                              value={missedContributionPhone}
                              onChange={(e) => setMissedContributionPhone(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          variant="destructive"
                          disabled={payMissedContributionsMutation.isPending}
                          onClick={() => {
                            const amount = stats.daysBehind * 20;
                            payMissedContributionsMutation.mutate({
                              amount,
                              phone: missedContributionPhone || undefined,
                            });
                          }}
                        >
                          {payMissedContributionsMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Pay Ksh ${(stats.daysBehind * 20).toLocaleString()}`
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Full Width at Top */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasContributedRecently ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        Contribution Complete
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Next contribution available in:{" "}
                        <span className="font-bold">
                          {timeUntilNextContribution}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : pendingContribution ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                        Payment Pending
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Checking payment status...
                        {pendingCheckoutId && (
                          <div className="text-xs mt-1">
                            ID: {pendingCheckoutId.substring(0, 8)}...
                          </div>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : failedContribution ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-300">
                          Contribution Due - Payment Failed
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Your daily contribution payment failed. Please retry.
                        </p>
                      </div>
                    </div>
                    <Dialog
                      open={contributionDialogOpen}
                      onOpenChange={setContributionDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Retry Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Retry Daily Contribution</DialogTitle>
                          <DialogDescription>
                            Retry your Ksh 20 daily contribution via M-Pesa
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                              />
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="text-2xl font-bold font-mono">
                                Ksh 20
                              </span>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() =>
                              contributeMutation.mutate({
                                amount: 20,
                                phone: phoneNumber,
                              })
                            }
                            disabled={contributeMutation.isPending}
                          >
                            {contributeMutation.isPending
                              ? "Processing..."
                              : "Retry with M-Pesa"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <Dialog
                  open={contributionDialogOpen}
                  onOpenChange={setContributionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full justify-between gap-2"
                      data-testid="button-daily-contribution"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Make Daily Contribution (Ksh 20)
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make Daily Contribution</DialogTitle>
                      <DialogDescription>
                        Contribute Ksh 20 to your savings via M-Pesa
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                            data-testid="input-mpesa-phone"
                          />
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="text-2xl font-bold font-mono">
                            Ksh 20
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() =>
                          contributeMutation.mutate({
                            amount: 20,
                            phone: phoneNumber,
                          })
                        }
                        disabled={contributeMutation.isPending}
                        data-testid="button-confirm-contribution"
                      >
                        {contributeMutation.isPending
                          ? "Processing..."
                          : "Pay with M-Pesa"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog
                open={savingsDialogOpen}
                onOpenChange={setSavingsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="w-full justify-between gap-2"
                    variant="outline"
                    data-testid="button-make-savings"
                  >
                    <span className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Make Savings
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make Savings</DialogTitle>
                    <DialogDescription>
                      Save any amount via M-Pesa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
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
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          Ksh
                        </span>
                        <Input
                          type="number"
                          min="1"
                          value={savingsAmount}
                          onChange={(e) => setSavingsAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="pl-12"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Description (Optional)
                      </label>
                      <Input
                        value={savingsDescription}
                        onChange={(e) => setSavingsDescription(e.target.value)}
                        placeholder="e.g., Emergency fund, Vacation"
                        className="mt-1.5"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() =>
                        saveMutation.mutate({
                          amount: parseFloat(savingsAmount),
                          description: savingsDescription,
                          phone: phoneNumber,
                        })
                      }
                      disabled={
                        saveMutation.isPending ||
                        !savingsAmount ||
                        parseFloat(savingsAmount) <= 0
                      }
                    >
                      {saveMutation.isPending
                        ? "Processing..."
                        : "Save via M-Pesa"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Link href="/loans/apply">
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                  data-testid="button-apply-loan"
                >
                  <span className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Apply for Loan
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/loans">
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-2"
                  data-testid="button-view-history"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    View Loans History
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/savings">
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-2"
                  data-testid="button-view-history"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    View Savings History
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contributions">
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-2"
                  data-testid="button-view-history"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    View Contribution History
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Contributions and Recent Savings Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Recent Contributions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Recent Contributions</CardTitle>
                  <CardDescription>Your latest contributions</CardDescription>
                </div>
                <Link href="/contributions">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="button-see-all-contributions"
                  >
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {contributionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentContributions.length > 0 ? (
                  <div className="space-y-1">
                    {recentContributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                        data-testid={`contribution-item-${contribution.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              contribution.status === "completed"
                                ? "bg-primary/10"
                                : contribution.status === "pending"
                                  ? "bg-chart-2/10"
                                  : "bg-destructive/10"
                            }`}
                          >
                            {contribution.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : contribution.status === "pending" ? (
                              <Clock className="h-4 w-4 text-chart-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Daily Contribution
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(contribution.createdAt),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                            {contribution.mpesaReceiptNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Receipt: {contribution.mpesaReceiptNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-mono font-semibold">
                            Ksh {Number(contribution.amount).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                contribution.status === "completed"
                                  ? "default"
                                  : contribution.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {contribution.status}
                            </Badge>
                            {contribution.status === "failed" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2">
                                    <RefreshCw className="h-3 w-3" />
                                    Retry
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Retry Contribution</DialogTitle>
                                    <DialogDescription>
                                      Retry your Ksh 20 contribution via M-Pesa
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <label className="text-sm font-medium">M-Pesa Phone Number</label>
                                      <div className="relative mt-1.5">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          value={phoneNumber}
                                          onChange={(e) => setPhoneNumber(e.target.value)}
                                          placeholder="0712345678"
                                          className="pl-10"
                                        />
                                      </div>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="text-2xl font-bold font-mono">Ksh 20</span>
                                      </div>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => contributeMutation.mutate({ amount: 20, phone: phoneNumber })}
                                      disabled={contributeMutation.isPending}
                                    >
                                      {contributeMutation.isPending ? "Processing..." : "Retry with M-Pesa"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No contributions yet
                    </p>
                    <Dialog
                      open={contributionDialogOpen}
                      onOpenChange={setContributionDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="mt-4"
                          size="sm"
                          data-testid="button-first-contribution"
                        >
                          Make Your First Contribution
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Make Daily Contribution</DialogTitle>
                          <DialogDescription>
                            Contribute Ksh 20 to your savings via M-Pesa
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                              />
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Amount
                              </span>
                              <span className="text-2xl font-bold font-mono">
                                Ksh 20
                              </span>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() =>
                              contributeMutation.mutate({
                                amount: 20,
                                phone: phoneNumber,
                              })
                            }
                            disabled={contributeMutation.isPending}
                          >
                            {contributeMutation.isPending
                              ? "Processing..."
                              : "Pay with M-Pesa"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Savings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Recent Savings</CardTitle>
                  <CardDescription>Your latest savings</CardDescription>
                </div>
                <Link href="/savings">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="button-see-all-savings"
                  >
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {savingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentSavings.length > 0 ? (
                  <div className="space-y-1">
                    {recentSavings.map((saving) => (
                      <div
                        key={saving.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                        data-testid={`savings-item-${saving.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              saving.status === "completed"
                                ? "bg-green-500/10"
                                : saving.status === "pending"
                                  ? "bg-chart-2/10"
                                  : "bg-destructive/10"
                            }`}
                          >
                            {saving.status === "completed" ? (
                              <PiggyBank className="h-4 w-4 text-green-500" />
                            ) : saving.status === "pending" ? (
                              <Clock className="h-4 w-4 text-chart-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {saving.description || "Savings"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(saving.createdAt),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                            {saving.mpesaReceiptNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Receipt: {saving.mpesaReceiptNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-mono font-semibold">
                            Ksh {Number(saving.amount).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                saving.status === "completed"
                                  ? "default"
                                  : saving.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {saving.status}
                            </Badge>
                            {saving.status === "failed" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2">
                                    <RefreshCw className="h-3 w-3" />
                                    Retry
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Retry Savings</DialogTitle>
                                    <DialogDescription>
                                      Retry your savings deposit via M-Pesa
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <label className="text-sm font-medium">M-Pesa Phone Number</label>
                                      <div className="relative mt-1.5">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          value={phoneNumber}
                                          onChange={(e) => setPhoneNumber(e.target.value)}
                                          placeholder="0712345678"
                                          className="pl-10"
                                        />
                                      </div>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="text-2xl font-bold font-mono">
                                          Ksh {Number(saving.amount).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => saveMutation.mutate({
                                        amount: Number(saving.amount),
                                        description: saving.description || "Savings",
                                        phone: phoneNumber,
                                      })}
                                      disabled={saveMutation.isPending}
                                    >
                                      {saveMutation.isPending ? "Processing..." : "Retry with M-Pesa"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No savings yet</p>
                    <Dialog
                      open={savingsDialogOpen}
                      onOpenChange={setSavingsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="mt-4"
                          size="sm"
                          data-testid="button-first-saving"
                        >
                          Make Your First Saving
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Loan Status - Full Width at Bottom */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Loan Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : activeLoan ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Loan Amount
                    </span>
                    <span className="font-mono font-bold">
                      Ksh {Number(activeLoan.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Amount Paid
                    </span>
                    <span className="font-mono font-semibold text-primary">
                      Ksh {Number(activeLoan.amountPaid).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        Repayment Progress
                      </span>
                      <span className="font-medium">
                        {Math.round(
                          (Number(activeLoan.amountPaid) /
                            Number(activeLoan.totalAmount)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (Number(activeLoan.amountPaid) /
                          Number(activeLoan.totalAmount)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <Link href="/loans">
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      data-testid="button-view-loan"
                    >
                      View Loan Details
                    </Button>
                  </Link>
                </div>
              ) : pendingLoan ? (
                <div className="text-center py-4 space-y-3">
                  <div className="p-3 rounded-full bg-chart-2/10 w-fit mx-auto">
                    <Clock className="h-8 w-8 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-semibold">Loan Application Pending</p>
                    <p className="text-sm text-muted-foreground">
                      Your request for Ksh{" "}
                      {Number(pendingLoan.amount).toLocaleString()} is under
                      review
                    </p>
                  </div>
                  <Link href="/loans">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-check-status"
                    >
                      Check Status
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="p-3 rounded-full bg-muted w-fit mx-auto">
                    <Banknote className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No active loans</p>
                  <Link href="/loans/apply">
                    <Button size="sm" data-testid="button-apply-now">
                      Apply for a Loan
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
