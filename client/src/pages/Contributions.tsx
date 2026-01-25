import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Wallet,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  Phone,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { format, isToday, addDays, differenceInMilliseconds } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { Contribution, MissedContribution } from "@shared/schema";

interface ContributionStats {
  userTotal: number;
  groupTotal: number;
  thisMonth: number;
  missedCount: number;
  daysCovered: number;
  daysElapsed: number;
  daysAhead: number;
  daysBehind: number;
  missedAmount: number;
  nextContributionTime: string | null;
}

interface ContributionsResponse {
  contributions: Contribution[];
  total: number;
  page: number;
  totalPages: number;
}

export default function Contributions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [missedPaymentDialogOpen, setMissedPaymentDialogOpen] = useState(false);
  const [missedPaymentAmount, setMissedPaymentAmount] = useState("");
  const [selectedContributionId, setSelectedContributionId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [timeUntilNextContribution, setTimeUntilNextContribution] =
    useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<ContributionStats>({
    queryKey: ["/api/contributions/stats"],
  });

  const {
    data: contributionsData,
    isLoading: contributionsLoading,
    refetch: refetchContributions,
  } = useQuery<ContributionsResponse>({
    queryKey: ["/api/contributions/user", page, limit],
    queryFn: async ({ queryKey }) => {
      const [, page, limit] = queryKey;
      const response = await apiRequest(
        "GET",
        `/api/contributions/user?page=${page}&limit=${limit}`,
      );
      return response;
    },
  });

  const {
    data: missedContributions,
    isLoading: missedLoading,
    refetch: refetchMissed,
  } = useQuery<MissedContribution[]>({
    queryKey: ["/api/contributions/missed"],
  });

  // Check if user has contributed today
  const contributions = contributionsData?.contributions || [];
  const hasContributedToday = contributions?.some(
    (contribution) =>
      isToday(new Date(contribution.createdAt)) &&
      contribution.status === "completed",
  );

  const pendingContribution = contributions?.find(
    (contribution) =>
      isToday(new Date(contribution.createdAt)) &&
      contribution.status === "pending",
  );

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
        setPaymentDialogOpen(false);
        setRetryDialogOpen(false);
        setSelectedContributionId(null);
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/user"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/stats"],
        });
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

  const payPenaltyMutation = useMutation({
    mutationFn: async (data: { missedId: number; phone?: string }) => {
      return apiRequest("POST", "/api/contributions/pay-penalty", data);
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutRequestId) {
        toast.success(data.message || "Check your phone for M-Pesa prompt", {
          closeButton: true,
        });
        setPenaltyDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/missed"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/stats"],
        });
      } else {
        toast.error(data.message || "Failed to initiate penalty payment", {
          closeButton: true,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate penalty payment", {
        closeButton: true,
      });
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchContributions();
    refetchMissed();
    toast.success("Refreshing contributions data...");
  };

  const unpaidPenalties = missedContributions?.filter((m) => !m.isPaid) || [];
  const totalPenaltyAmount = unpaidPenalties.reduce(
    (sum, m) => sum + Number(m.penaltyAmount),
    0,
  );

  // Use daysBehind from stats (consistent with Dashboard calculation)
  const missedDaysCount = stats?.daysBehind || 0;
  const totalMissedAmount = stats?.missedAmount || (missedDaysCount * 20);

  // Mutation for paying missed contributions
  const payMissedContributionsMutation = useMutation({
    mutationFn: async (data: { amount: number; phone?: string }) => {
      return apiRequest("POST", "/api/contributions/pay-missed", data);
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutRequestId) {
        toast.success(data.message || "Check your phone for M-Pesa prompt", {
          closeButton: true,
        });
        setMissedPaymentDialogOpen(false);
        setMissedPaymentAmount("");
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/missed"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/contributions/stats"],
        });
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

  // Handle click on "Make Contribution" button
  const handleMakeContribution = () => {
    if (missedDaysCount > 0) {
      // Show missed payments dialog first
      setMissedPaymentDialogOpen(true);
    } else {
      // No missed days, show regular contribution dialog
      setPaymentDialogOpen(true);
    }
  };

  const totalPages = contributionsData?.totalPages || 1;
  const totalContributions = contributionsData?.total || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Contributions</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Track your daily savings</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={statsLoading || contributionsLoading || missedLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${statsLoading || contributionsLoading || missedLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Status Messages */}
            {hasContributedToday ? (
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">
                      Already Contributed Today
                    </p>
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                      Next contribution in:{" "}
                      <span className="font-bold">
                        {timeUntilNextContribution || "Loading..."}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : pendingContribution ? (
              <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm sm:text-base">
                      Payment Pending
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                      Checking payment status...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleMakeContribution}
                  data-testid="button-make-contribution"
                >
                  <Plus className="h-4 w-4" />
                  Make Contribution
                </Button>

                  {/* Missed Contributions Payment Dialog */}
                  <Dialog
                    open={missedPaymentDialogOpen}
                    onOpenChange={setMissedPaymentDialogOpen}
                  >
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          Pay Missed Contributions First
                        </DialogTitle>
                        <DialogDescription>
                          You have missed {missedDaysCount} day(s) of contributions. Please pay the outstanding amount before making today's contribution.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Missed Days</span>
                            <span className="font-bold">{missedDaysCount} days</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Rate per day</span>
                            <span className="font-mono">Ksh 20</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Amount Due</span>
                              <span className="text-2xl font-bold font-mono text-destructive">
                                Ksh {totalMissedAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Amount to Pay</label>
                          <div className="relative mt-1.5">
                            <Input
                              type="number"
                              value={missedPaymentAmount}
                              onChange={(e) => setMissedPaymentAmount(e.target.value)}
                              placeholder={`Enter amount (max ${totalMissedAmount})`}
                              min="20"
                              max={totalMissedAmount}
                              step="20"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            You can pay any amount (multiples of Ksh 20). Remaining balance will still accrue.
                          </p>
                        </div>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setMissedPaymentDialogOpen(false);
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Skip & Contribute
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => {
                              const amount = parseFloat(missedPaymentAmount) || totalMissedAmount;
                              payMissedContributionsMutation.mutate({
                                amount: Math.min(amount, totalMissedAmount),
                                phone: phoneNumber,
                              });
                            }}
                            disabled={payMissedContributionsMutation.isPending}
                          >
                            {payMissedContributionsMutation.isPending
                              ? "Processing..."
                              : `Pay Ksh ${parseFloat(missedPaymentAmount) || totalMissedAmount}`}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Regular Contribution Dialog */}
                  <Dialog
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                  >
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
              </div>
            )}
          </div>

          {/* Stats Grid - Modified layout (2 up, 1 below) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* First row - 2 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <p className="text-2xl font-bold font-mono">
                          Ksh {stats?.userTotal?.toLocaleString() || "0"}
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
                      <TrendingUp className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        This Month
                      </p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <p className="text-2xl font-bold font-mono">
                          Ksh {stats?.thisMonth?.toLocaleString() || "0"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second row - Missed Days card with Pay button */}
            <Card className={`md:col-span-2 ${missedDaysCount > 0 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-destructive/10">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Missed Days</p>
                      {missedLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <div>
                          <p className="text-2xl font-bold">
                            {missedDaysCount}
                          </p>
                          {missedDaysCount > 0 && (
                            <p className="text-sm text-destructive font-medium">
                              Owes: Ksh {totalMissedAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {missedDaysCount > 0 && (
                    <Dialog open={missedPaymentDialogOpen} onOpenChange={setMissedPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          Pay Missed Contributions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pay Missed Contributions</DialogTitle>
                          <DialogDescription>
                            You have {missedDaysCount} missed day(s). Each day costs Ksh 20.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Missed Days</span>
                              <span className="font-bold">{missedDaysCount} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rate</span>
                              <span className="font-bold">Ksh 20 / day</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-muted-foreground">Total Due</span>
                              <span className="font-bold text-destructive">
                                Ksh {totalMissedAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Amount to Pay</label>
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Enter amount (min Ksh 20, max Ksh {totalMissedAmount})
                            </p>
                            <Input
                              type="number"
                              value={missedPaymentAmount}
                              onChange={(e) => setMissedPaymentAmount(e.target.value)}
                              placeholder={`Enter amount (max ${totalMissedAmount})`}
                              min={20}
                              max={totalMissedAmount}
                            />
                          </div>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setMissedPaymentDialogOpen(false);
                                setMissedPaymentAmount("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="flex-1"
                              variant="destructive"
                              onClick={() => {
                                const amount = parseFloat(missedPaymentAmount) || totalMissedAmount;
                                payMissedContributionsMutation.mutate({
                                  amount: Math.min(amount, totalMissedAmount),
                                  phone: phoneNumber,
                                });
                              }}
                              disabled={payMissedContributionsMutation.isPending}
                            >
                              {payMissedContributionsMutation.isPending
                                ? "Processing..."
                                : `Pay Ksh ${parseFloat(missedPaymentAmount) || totalMissedAmount}`}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unpaid Penalties */}
          {unpaidPenalties.length > 0 && (
            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Unpaid Penalties
                </CardTitle>
                <CardDescription>
                  You have {unpaidPenalties.length} unpaid penalty(ies) totaling
                  Ksh {totalPenaltyAmount.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unpaidPenalties.map((penalty) => (
                    <div
                      key={penalty.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background rounded-lg"
                      data-testid={`penalty-item-${penalty.id}`}
                    >
                      <div>
                        <p className="font-medium">
                          Missed:{" "}
                          {format(new Date(penalty.missedDate), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Consecutive miss #{penalty.consecutiveMisses}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-destructive">
                          Ksh {Number(penalty.penaltyAmount).toLocaleString()}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`button-pay-penalty-${penalty.id}`}
                            >
                              Pay Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Pay Penalty</DialogTitle>
                              <DialogDescription>
                                Pay penalty for missed contribution on{" "}
                                {format(
                                  new Date(penalty.missedDate),
                                  "MMM d, yyyy",
                                )}
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
                                    onChange={(e) =>
                                      setPhoneNumber(e.target.value)
                                    }
                                    placeholder="0712345678"
                                    className="pl-10"
                                  />
                                </div>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    Penalty Amount
                                  </span>
                                  <span className="text-2xl font-bold font-mono text-destructive">
                                    Ksh{" "}
                                    {Number(
                                      penalty.penaltyAmount,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                variant="destructive"
                                onClick={() =>
                                  payPenaltyMutation.mutate({
                                    missedId: penalty.id,
                                    phone: phoneNumber,
                                  })
                                }
                                disabled={payPenaltyMutation.isPending}
                              >
                                {payPenaltyMutation.isPending
                                  ? "Processing..."
                                  : "Pay Penalty via M-Pesa"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contribution History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Contribution History</CardTitle>
                <CardDescription>
                  Your complete contribution record
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={statsLoading || contributionsLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${statsLoading || contributionsLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Link href="/savings">
                  <Button variant="outline" size="sm">
                    Go to Savings
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {contributionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <Skeleton className="h-12 w-40" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              ) : contributions.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {contributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0"
                        data-testid={`contribution-row-${contribution.id}`}
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
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : contribution.status === "pending" ? (
                              <Clock className="h-5 w-5 text-chart-2" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Daily Contribution</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(contribution.createdAt),
                                "EEEE, MMMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                            {contribution.mpesaReceiptNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Receipt: {contribution.mpesaReceiptNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-12 sm:pl-0">
                          <span className="font-mono font-bold text-lg">
                            Ksh {Number(contribution.amount).toLocaleString()}
                          </span>
                          <Badge
                            variant={
                              contribution.status === "completed"
                                ? "default"
                                : contribution.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {contribution.status}
                          </Badge>
                          {contribution.status === "failed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => {
                                setSelectedContributionId(contribution.id);
                                setRetryDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, totalContributions)} of{" "}
                        {totalContributions} contributions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No contributions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your savings with your first contribution
                  </p>
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                    data-testid="button-first-contribution"
                  >
                    Make Your First Contribution
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Retry Contribution Dialog */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Contribution</DialogTitle>
            <DialogDescription>
              Retry your Ksh 20 contribution via M-Pesa
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
              className="w-full gap-2"
              onClick={() =>
                contributeMutation.mutate({
                  amount: 20,
                  phone: phoneNumber,
                })
              }
              disabled={contributeMutation.isPending}
            >
              {contributeMutation.isPending && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              {contributeMutation.isPending
                ? "Sending M-Pesa request..."
                : "Retry with M-Pesa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
