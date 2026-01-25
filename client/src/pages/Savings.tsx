import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PiggyBank,
  Plus,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
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
import type { Saving } from "@shared/schema";

interface SavingsStats {
  userTotal: number;
  groupTotal: number;
  recentSavings: Saving[];
  totalCount: number;
}

interface SavingsResponse {
  savings: Saving[];
  total: number;
  page: number;
  totalPages: number;
}

export default function Savings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<SavingsStats>({
    queryKey: ["/api/savings/stats"],
  });

  const {
    data: savingsData,
    isLoading: savingsLoading,
    refetch: refetchSavings,
  } = useQuery<SavingsResponse>({
    queryKey: ["/api/savings/user", page, limit],
    queryFn: async ({ queryKey }) => {
      const [, page, limit] = queryKey;
      const response = await apiRequest(
        "GET",
        `/api/savings/user?page=${page}&limit=${limit}`,
      );
      return response;
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
        setRetryDialogOpen(false);
        setSelectedSaving(null);
        setAmount("");
        setDescription("");
        queryClient.invalidateQueries({ queryKey: ["/api/savings/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/savings/user"] });
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

  const handleRefresh = () => {
    refetchStats();
    refetchSavings();
    toast.success("Refreshing savings data...");
  };

  const totalPages = savingsData?.totalPages || 1;
  const savings = savingsData?.savings || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Savings</h1>
              <p className="text-muted-foreground">
                Save any amount at any time
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={statsLoading || savingsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${statsLoading || savingsLoading ? "animate-spin" : ""}`}
                />
              </Button>

              <Dialog
                open={savingsDialogOpen}
                onOpenChange={setSavingsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Make Savings
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
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
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
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Emergency fund, Vacation"
                        className="mt-1.5"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() =>
                        saveMutation.mutate({
                          amount: parseFloat(amount),
                          description,
                          phone: phoneNumber,
                        })
                      }
                      disabled={
                        saveMutation.isPending ||
                        !amount ||
                        parseFloat(amount) <= 0
                      }
                    >
                      {saveMutation.isPending
                        ? "Processing..."
                        : "Save via M-Pesa"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                    <PiggyBank className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Group Total Savings
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold font-mono">
                        Ksh {stats?.groupTotal?.toLocaleString() || "0"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Savings History</CardTitle>
                <CardDescription>Your complete savings record</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={statsLoading || savingsLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${statsLoading || savingsLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Link href="/contributions">
                  <Button variant="outline" size="sm">
                    Go to Contributions
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {savingsLoading ? (
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
              ) : savings.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {savings.map((saving) => (
                      <div
                        key={saving.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
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
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : saving.status === "pending" ? (
                              <Clock className="h-5 w-5 text-chart-2" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div>
                              <p className="font-medium">
                                {saving.description || "Savings"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(saving.createdAt),
                                  "EEEE, MMMM d, yyyy 'at' h:mm a",
                                )}
                              </p>
                              {saving.mpesaReceiptNumber && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  Receipt: {saving.mpesaReceiptNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-12 sm:pl-0">
                          <span className="font-mono font-bold text-lg">
                            Ksh {Number(saving.amount).toLocaleString()}
                          </span>
                          <Badge
                            variant={
                              saving.status === "completed"
                                ? "default"
                                : saving.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {saving.status}
                          </Badge>
                          {saving.status === "failed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => {
                                setSelectedSaving(saving);
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
                        {Math.min(page * limit, savingsData?.total || 0)} of{" "}
                        {savingsData?.total || 0} savings
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
                  <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No savings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your savings with your first deposit
                  </p>
                  <Button onClick={() => setSavingsDialogOpen(true)}>
                    Make Your First Savings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Retry Savings Dialog */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Savings</DialogTitle>
            <DialogDescription>
              Retry your savings deposit via M-Pesa
            </DialogDescription>
          </DialogHeader>
          {selectedSaving && (
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
                    Ksh {Number(selectedSaving.amount).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() =>
                  saveMutation.mutate({
                    amount: Number(selectedSaving.amount),
                    description: selectedSaving.description || "Savings",
                    phone: phoneNumber,
                  })
                }
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                {saveMutation.isPending
                  ? "Sending M-Pesa request..."
                  : "Retry with M-Pesa"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
