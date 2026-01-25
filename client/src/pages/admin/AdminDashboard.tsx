import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  TrendingUp,
  Banknote,
  AlertCircle,
  Wallet,
  PiggyBank,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Phone,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface AdminStats {
  totalMembers: number;
  totalContributions: number;
  totalSavings: number;
  totalLoans: number;
  totalLoansCount: number;
  pendingLoans: number;
  overdueLoans: number;
  pendingMessages: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin" | "superadmin";
  isVerified: boolean;
  isDisabled: boolean;
  totalContributions: string;
  totalSavings: string;
  totalLoans: string;
  createdAt: string;
  daysCovered?: number;
  daysElapsed?: number;
  daysBehind?: number;
  daysAhead?: number;
  missedAmount?: number;
}

interface LoanGuarantor {
  guarantorId: number;
  guarantorName?: string;
  guarantorEmail?: string;
  guarantorPhone?: string;
  status: string;
}

interface Loan {
  id: number;
  userId: number;
  amount: string;
  interestRate: string;
  totalAmount: string;
  amountPaid: string;
  status: "pending" | "approved" | "rejected" | "paid" | "overdue";
  loanUsage: string;
  dueDate?: string;
  approvedAt?: string;
  approvedBy?: number;
  rejectionReason?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  guarantors?: LoanGuarantor[];
}

interface Contribution {
  id: number;
  userId: number;
  amount: string;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  createdAt: string;
}

interface Saving {
  id: number;
  userId: number;
  amount: string;
  description?: string;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  createdAt: string;
}

interface ContactMessage {
  id: number;
  userId: number;
  subject: string;
  message: string;
  adminReply?: string;
  repliedBy?: number;
  repliedAt?: string;
  isRead: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  repliedByName?: string;
  repliedByPhone?: string;
}

interface RecentContribution {
  id: number;
  userId: number;
  amount: string;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

interface RecentSaving {
  id: number;
  userId: number;
  amount: string;
  description?: string;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Redirect non-admin users
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin" && user.role !== "superadmin") {
      toast.error("Unauthorized access, redirecting...", { closeButton: true });
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);
  
  // Don't render if not admin
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return null;
  }
  
  // Get initial tab from URL hash
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "");
    const validTabs = ["overview", "users", "loans", "contributions", "messages"];
    return validTabs.includes(hash) ? hash : "overview";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [overviewSubTab, setOverviewSubTab] = useState<"contributions" | "savings">("contributions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  
  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [loansPage, setLoansPage] = useState(1);
  const [contributionsPage, setContributionsPage] = useState(1);
  const [savingsPage, setSavingsPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Sync URL hash with active tab
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);
  
  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validTabs = ["overview", "users", "loans", "contributions", "messages"];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const [replyText, setReplyText] = useState("");
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editLoanDialogOpen, setEditLoanDialogOpen] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retryType, setRetryType] = useState<"contribution" | "saving">("contribution");
  const [retryItem, setRetryItem] = useState<any>(null);
  const [retryPhone, setRetryPhone] = useState("");

  // Admin stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  // Users list
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Loans list
  const {
    data: loans = [],
    isLoading: loansLoading,
    refetch: refetchLoans,
  } = useQuery<Loan[]>({
    queryKey: ["/api/admin/loans"],
  });

  // Pending loans
  const { data: pendingLoans = [], isLoading: pendingLoansLoading } = useQuery<
    Loan[]
  >({
    queryKey: ["/api/admin/loans/pending"],
  });

  // Recent contributions - with safe default
  const {
    data: recentContributions = [],
    isLoading: recentContributionsLoading,
  } = useQuery<RecentContribution[]>({
    queryKey: ["/api/admin/recent-contributions"],
  });

  // Recent savings - with safe default
  const { data: recentSavings = [], isLoading: recentSavingsLoading } =
    useQuery<RecentSaving[]>({
      queryKey: ["/api/admin/recent-savings"],
    });

  // All contributions for Transactions tab
  const { data: allContributions = [], isLoading: allContributionsLoading, refetch: refetchAllContributions } =
    useQuery<RecentContribution[]>({
      queryKey: ["/api/admin/contributions", transactionSearch],
      queryFn: async () => {
        const url = transactionSearch 
          ? `/api/admin/contributions?search=${encodeURIComponent(transactionSearch)}`
          : "/api/admin/contributions";
        return apiRequest("GET", url);
      },
    });

  // All savings for Transactions tab
  const { data: allSavings = [], isLoading: allSavingsLoading, refetch: refetchAllSavings } =
    useQuery<RecentSaving[]>({
      queryKey: ["/api/admin/savings", transactionSearch],
      queryFn: async () => {
        const url = transactionSearch 
          ? `/api/admin/savings?search=${encodeURIComponent(transactionSearch)}`
          : "/api/admin/savings";
        return apiRequest("GET", url);
      },
    });

  // Messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/messages"],
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: "user" | "admin";
    }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const updateLoanStatusMutation = useMutation({
    mutationFn: async ({
      loanId,
      status,
      rejectionReason,
    }: {
      loanId: number;
      status: string;
      rejectionReason?: string;
    }) => {
      return apiRequest("PATCH", `/api/admin/loans/${loanId}/status`, {
        status,
        rejectionReason,
      });
    },
    onSuccess: () => {
      toast.success("Loan status updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loans/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update loan status");
    },
  });

  const replyMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      reply,
    }: {
      messageId: number;
      reply: string;
    }) => {
      return apiRequest("POST", `/api/admin/messages/${messageId}/reply`, {
        reply,
      });
    },
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyDialogOpen(false);
      setReplyText("");
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reply");
    },
  });

  const recalculateTotalsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/recalculate-totals", {});
    },
    onSuccess: (data) => {
      toast.success("Totals recalculated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      console.log("Recalculation result:", data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to recalculate totals");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: Partial<User>;
    }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      // Invalidate all relevant queries for immediate updates
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/savings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-savings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const retryContributionMutation = useMutation({
    mutationFn: async (data: { contributionId: number; phone: string }) => {
      return apiRequest("POST", "/api/admin/contributions/retry", data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Retry initiated. Check phone for M-Pesa prompt");
        setRetryDialogOpen(false);
        setRetryItem(null);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-contributions"] });
      } else {
        toast.error(data.message || "Failed to retry contribution");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry contribution");
    },
  });

  const retrySavingMutation = useMutation({
    mutationFn: async (data: { savingId: number; phone: string }) => {
      return apiRequest("POST", "/api/admin/savings/retry", data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Retry initiated. Check phone for M-Pesa prompt");
        setRetryDialogOpen(false);
        setRetryItem(null);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/savings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-savings"] });
      } else {
        toast.error(data.message || "Failed to retry saving");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry saving");
    },
  });

  const handleRetryPayment = () => {
    if (!retryItem || !retryPhone) return;
    if (retryType === "contribution") {
      retryContributionMutation.mutate({ contributionId: retryItem.id, phone: retryPhone });
    } else {
      retrySavingMutation.mutate({ savingId: retryItem.id, phone: retryPhone });
    }
  };

  const openRetryDialog = (item: any, type: "contribution" | "saving") => {
    setRetryItem(item);
    setRetryType(type);
    setRetryPhone(item.userPhone || "");
    setRetryDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
    refetchLoans();
    refetchMessages();
    toast.success("Refreshing admin data...");
  };

  const handleReplyMessage = () => {
    if (!selectedMessage || !replyText.trim()) return;
    replyMessageMutation.mutate({
      messageId: selectedMessage.id,
      reply: replyText,
    });
  };

  const handleUpdateUserRole = (userId: number, role: "user" | "admin") => {
    if (confirm(`Change user role to ${role}?`)) {
      updateUserRoleMutation.mutate({ userId, role });
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleApproveLoan = (loanId: number) => {
    if (confirm("Approve this loan application?")) {
      updateLoanStatusMutation.mutate({ loanId, status: "approved" });
    }
  };

  const handleRejectLoan = (loanId: number, loanAmount: string) => {
    const reason = prompt(
      `Enter rejection reason for loan of Ksh ${loanAmount}:`,
      "Loan rejected by admin",
    );
    if (reason !== null) {
      updateLoanStatusMutation.mutate({
        loanId,
        status: "rejected",
        rejectionReason: reason,
      });
    }
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const formData = new FormData(
      document.getElementById("edit-user-form") as HTMLFormElement,
    );
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const role = formData.get("role") as string;
    const isVerified = formData.get("isVerified") === "true";
    const isDisabled = formData.get("isDisabled") === "true";
    const totalContributions =
      parseFloat(formData.get("totalContributions") as string) || 0;
    const totalSavings =
      parseFloat(formData.get("totalSavings") as string) || 0;
    const totalLoans = parseFloat(formData.get("totalLoans") as string) || 0;

    updateUserMutation.mutate({
      userId: selectedUser.id,
      data: {
        name,
        email,
        phone,
        role: role as "user" | "admin" | "superadmin" | undefined,
        isVerified,
        isDisabled,
        totalContributions: totalContributions.toString(),
        totalSavings: totalSavings.toString(),
        totalLoans: totalLoans.toString(),
      },
    });
  };

  // Format numbers
  const formatNumber = (num: number | undefined) => {
    return (
      num?.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "0.00"
    );
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  );

  // Filter pending messages
  const pendingMessages = messages.filter((m) => !m.adminReply);

  // Safe getter for user name
  const getUserName = (
    userId: number,
    userData?: { name?: string; email?: string },
  ) => {
    if (userData?.name) return userData.name;
    if (userData?.email) return userData.email;
    return `User #${userId}`;
  };

  // Safe getter for user email
  const getUserEmail = (userId: number, userData?: { email?: string }) => {
    if (userData?.email) return userData.email;
    return `user-${userId}@example.com`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}. Manage all system activities here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => recalculateTotalsMutation.mutate()}
                disabled={recalculateTotalsMutation.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${recalculateTotalsMutation.isPending ? "animate-spin" : ""}`}
                />
                Recalculate Totals
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={
                  statsLoading ||
                  usersLoading ||
                  loansLoading ||
                  messagesLoading
                }
              >
                <RefreshCw
                  className={`h-4 w-4 ${statsLoading || usersLoading || loansLoading || messagesLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Members
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {stats?.totalMembers || 0}
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
                    <Wallet className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Contributions
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold font-mono">
                        Ksh {formatNumber(stats?.totalContributions)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <PiggyBank className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Savings
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold font-mono">
                        Ksh {formatNumber(stats?.totalSavings)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Banknote className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loans</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold font-mono">
                        Ksh {formatNumber(stats?.totalLoans)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-chart-2/10">
                    <Clock className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Loans
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {stats?.pendingLoans || 0}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setActiveTab("loans")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overdue Loans
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {stats?.overdueLoans || 0}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setActiveTab("loans")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <MessageSquare className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Messages
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {stats?.pendingMessages || 0}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setActiveTab("messages")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="contributions">Transactions</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Sub-tabs for Recent Contributions and Recent Savings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest 5 {overviewSubTab === "contributions" ? "contributions" : "savings"} from all users
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={overviewSubTab === "contributions" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOverviewSubTab("contributions")}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Contributions
                      </Button>
                      <Button
                        variant={overviewSubTab === "savings" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOverviewSubTab("savings")}
                      >
                        <PiggyBank className="h-4 w-4 mr-2" />
                        Savings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {overviewSubTab === "contributions" ? (
                    recentContributionsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : recentContributions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>M-Pesa Receipt</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentContributions.slice(0, 5).map((contribution) => (
                            <TableRow key={contribution.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {contribution.userName || `User #${contribution.userId}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {contribution.userEmail || "-"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {contribution.userPhone || "-"}
                              </TableCell>
                              <TableCell className="font-mono">
                                Ksh {Number(contribution.amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {contribution.mpesaReceiptNumber || "-"}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(contribution.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                {(contribution.status === "failed" || contribution.status === "pending") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRetryDialog(contribution, "contribution")}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          No contributions yet
                        </p>
                      </div>
                    )
                  ) : (
                    recentSavingsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : recentSavings.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>M-Pesa Receipt</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentSavings.slice(0, 5).map((saving) => (
                            <TableRow key={saving.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {saving.userName || `User #${saving.userId}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {saving.userEmail || "-"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {saving.userPhone || "-"}
                              </TableCell>
                              <TableCell className="font-mono">
                                Ksh {Number(saving.amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {saving.description || "Savings"}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {saving.mpesaReceiptNumber || "-"}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(saving.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                {(saving.status === "failed" || saving.status === "pending") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRetryDialog(saving, "saving")}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No savings yet</p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Users Management</CardTitle>
                      <CardDescription>Manage all system users</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          className="pl-9 w-[250px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Account Status</TableHead>
                          <TableHead>Contribution Status</TableHead>
                          <TableHead>Totals</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-medium">{user.name}</div>
                                {!user.isVerified && (
                                  <Badge variant="outline" className="text-xs">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.role === "superadmin"
                                    ? "default"
                                    : user.role === "admin"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={user.isDisabled ? "destructive" : "default"}
                                className={!user.isDisabled ? "bg-green-600" : ""}
                              >
                                {user.isDisabled ? "Inactive" : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                {user.daysBehind && user.daysBehind > 0 ? (
                                  <div className="text-destructive">
                                    <div className="font-medium">{user.daysBehind} days behind</div>
                                    <div>Owes: Ksh {(user.missedAmount || 0).toLocaleString()}</div>
                                  </div>
                                ) : user.daysAhead && user.daysAhead > 0 ? (
                                  <div className="text-green-600">
                                    <div className="font-medium">{user.daysAhead} days ahead</div>
                                    <div>{user.daysCovered || 0} days covered</div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">
                                    <div className="font-medium">Up to date</div>
                                    <div>{user.daysCovered || 0} days covered</div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>Contributions:</span>
                                  <span className="font-mono">
                                    Ksh{" "}
                                    {Number(
                                      user.totalContributions,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Savings:</span>
                                  <span className="font-mono">
                                    Ksh{" "}
                                    {Number(user.totalSavings).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Loans:</span>
                                  <span className="font-mono">
                                    Ksh{" "}
                                    {Number(user.totalLoans).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              {user.role === "superadmin" ? (
                                <span className="text-xs text-muted-foreground">Protected</span>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setEditUserDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.role === "user" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleUpdateUserRole(
                                            user.id,
                                            "admin",
                                          )
                                        }
                                      >
                                        Promote to Admin
                                      </DropdownMenuItem>
                                    )}
                                    {user.role === "admin" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleUpdateUserRole(
                                            user.id,
                                            "user",
                                          )
                                        }
                                      >
                                        Demote to User
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteUser(user.id, user.name)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Users Pagination */}
                    {filteredUsers.length > PAGE_SIZE && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Showing {((usersPage - 1) * PAGE_SIZE) + 1} to {Math.min(usersPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={usersPage === 1}
                            onClick={() => setUsersPage(usersPage - 1)}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm">
                            Page {usersPage} of {Math.ceil(filteredUsers.length / PAGE_SIZE)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={usersPage >= Math.ceil(filteredUsers.length / PAGE_SIZE)}
                            onClick={() => setUsersPage(usersPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loans Tab */}
            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Loans Management</CardTitle>
                      <CardDescription>
                        Approve, reject, or manage loans
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchLoans()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="pending">
                        Pending ({pendingLoans.length})
                      </TabsTrigger>
                      <TabsTrigger value="all">
                        All Loans ({loans.length})
                      </TabsTrigger>
                      <TabsTrigger value="overdue">
                        Overdue ({stats?.overdueLoans || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                      {pendingLoansLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : pendingLoans.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Applicant</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Total with Interest</TableHead>
                              <TableHead>Guarantors</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Applied On</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingLoans.map((loan: any) => (
                              <TableRow key={loan.id}>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{loan.userName || `User #${loan.userId}`}</div>
                                    <div className="text-muted-foreground text-xs">{loan.userPhone}</div>
                                    <div className="text-muted-foreground text-xs">{loan.userEmail}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  Ksh {Number(loan.amount).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono">
                                  Ksh{" "}
                                  {Number(loan.totalAmount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs space-y-2">
                                    {loan.guarantors?.map((g: any, idx: number) => (
                                      <div key={idx} className="border-b pb-1 last:border-0 last:pb-0">
                                        <div className="font-medium">{g.guarantorName || `User #${g.guarantorId}`}</div>
                                        <div className="text-muted-foreground">{g.guarantorPhone}</div>
                                        <div className="text-muted-foreground">{g.guarantorEmail}</div>
                                        <div className="text-green-600">Savings: Ksh {Number(g.guarantorSavings || 0).toLocaleString()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>{loan.loanUsage}</TableCell>
                                <TableCell>
                                  {format(
                                    new Date(loan.createdAt),
                                    "MMM d, yyyy",
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveLoan(loan.id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleRejectLoan(loan.id, loan.amount)
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            No pending loans
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="all">
                      {loansLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : loans.length > 0 ? (
                        <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Borrower</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Guarantors</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Paid</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loans.slice((loansPage - 1) * PAGE_SIZE, loansPage * PAGE_SIZE).map((loan: any) => (
                              <TableRow key={loan.id}>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{loan.userName || `User #${loan.userId}`}</div>
                                    <div className="text-muted-foreground text-xs">{loan.userPhone}</div>
                                    <div className="text-muted-foreground text-xs">{loan.userEmail}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  Ksh {Number(loan.amount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs space-y-2">
                                    {loan.guarantors?.map((g: any, idx: number) => (
                                      <div key={idx} className="border-b pb-1 last:border-0 last:pb-0">
                                        <div className="font-medium">{g.guarantorName || `User #${g.guarantorId}`}</div>
                                        <div className="text-muted-foreground">{g.guarantorPhone}</div>
                                        <div className="text-green-600">Savings: Ksh {Number(g.guarantorSavings || 0).toLocaleString()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      loan.status === "approved"
                                        ? "default"
                                        : loan.status === "pending"
                                          ? "secondary"
                                          : loan.status === "paid"
                                            ? "outline"
                                            : "destructive"
                                    }
                                  >
                                    {loan.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">
                                  Ksh {Number(loan.amountPaid).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={
                                        (Number(loan.amountPaid) /
                                          Number(loan.totalAmount)) *
                                        100
                                      }
                                      className="h-2"
                                    />
                                    <span className="text-xs">
                                      {Math.round(
                                        (Number(loan.amountPaid) /
                                          Number(loan.totalAmount)) *
                                          100,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {loan.dueDate
                                    ? format(
                                        new Date(loan.dueDate),
                                        "MMM d, yyyy",
                                      )
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {loans.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Showing {((loansPage - 1) * PAGE_SIZE) + 1} to {Math.min(loansPage * PAGE_SIZE, loans.length)} of {loans.length}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" disabled={loansPage === 1} onClick={() => setLoansPage(loansPage - 1)}>Previous</Button>
                              <span className="flex items-center px-3 text-sm">Page {loansPage} of {Math.ceil(loans.length / PAGE_SIZE)}</span>
                              <Button variant="outline" size="sm" disabled={loansPage >= Math.ceil(loans.length / PAGE_SIZE)} onClick={() => setLoansPage(loansPage + 1)}>Next</Button>
                            </div>
                          </div>
                        )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            No loans found
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contributions Tab */}
            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>
                    View all contributions and savings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Search by M-Pesa receipt, name, email, or phone..."
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          refetchAllContributions();
                          refetchAllSavings();
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                  <Tabs defaultValue="contributions" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="contributions">
                        Contributions ({allContributions.length})
                      </TabsTrigger>
                      <TabsTrigger value="savings">Savings ({allSavings.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="contributions">
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Receipt</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allContributionsLoading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  Loading contributions...
                                </TableCell>
                              </TableRow>
                            ) : allContributions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No contributions found
                                </TableCell>
                              </TableRow>
                            ) : (
                              allContributions.slice((contributionsPage - 1) * PAGE_SIZE, contributionsPage * PAGE_SIZE).map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium">{c.userName || "Unknown"}</div>
                                      <div className="text-muted-foreground text-xs">{c.userEmail}</div>
                                      <div className="text-muted-foreground text-xs">{c.userPhone}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono">Ksh {Number(c.amount).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge variant={c.status === "completed" ? "default" : c.status === "pending" ? "secondary" : "destructive"}>
                                      {c.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs font-mono">{c.mpesaReceiptNumber || "-"}</TableCell>
                                  <TableCell className="text-xs">{format(new Date(c.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                                  <TableCell>
                                    {(c.status === "failed" || c.status === "pending") && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openRetryDialog(c, "contribution")}
                                      >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Retry
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                        {allContributions.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Showing {((contributionsPage - 1) * PAGE_SIZE) + 1} to {Math.min(contributionsPage * PAGE_SIZE, allContributions.length)} of {allContributions.length}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" disabled={contributionsPage === 1} onClick={() => setContributionsPage(contributionsPage - 1)}>Previous</Button>
                              <span className="flex items-center px-3 text-sm">Page {contributionsPage} of {Math.ceil(allContributions.length / PAGE_SIZE)}</span>
                              <Button variant="outline" size="sm" disabled={contributionsPage >= Math.ceil(allContributions.length / PAGE_SIZE)} onClick={() => setContributionsPage(contributionsPage + 1)}>Next</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="savings">
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Receipt</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allSavingsLoading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  Loading savings...
                                </TableCell>
                              </TableRow>
                            ) : allSavings.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No savings found
                                </TableCell>
                              </TableRow>
                            ) : (
                              allSavings.slice((savingsPage - 1) * PAGE_SIZE, savingsPage * PAGE_SIZE).map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium">{s.userName || "Unknown"}</div>
                                      <div className="text-muted-foreground text-xs">{s.userEmail}</div>
                                      <div className="text-muted-foreground text-xs">{s.userPhone}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono">Ksh {Number(s.amount).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge variant={s.status === "completed" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>
                                      {s.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs font-mono">{s.mpesaReceiptNumber || "-"}</TableCell>
                                  <TableCell className="text-xs">{format(new Date(s.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                                  <TableCell>
                                    {(s.status === "failed" || s.status === "pending") && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openRetryDialog(s, "saving")}
                                      >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Retry
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                        {allSavings.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Showing {((savingsPage - 1) * PAGE_SIZE) + 1} to {Math.min(savingsPage * PAGE_SIZE, allSavings.length)} of {allSavings.length}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" disabled={savingsPage === 1} onClick={() => setSavingsPage(savingsPage - 1)}>Previous</Button>
                              <span className="flex items-center px-3 text-sm">Page {savingsPage} of {Math.ceil(allSavings.length / PAGE_SIZE)}</span>
                              <Button variant="outline" size="sm" disabled={savingsPage >= Math.ceil(allSavings.length / PAGE_SIZE)} onClick={() => setSavingsPage(savingsPage + 1)}>Next</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Contact Messages</CardTitle>
                      <CardDescription>Reply to user inquiries</CardDescription>
                    </div>
                    <Badge
                      variant={
                        pendingMessages.length > 0 ? "destructive" : "outline"
                      }
                    >
                      {pendingMessages.length} pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    <>
                    <div className="space-y-4">
                      {messages.slice((messagesPage - 1) * PAGE_SIZE, messagesPage * PAGE_SIZE).map((message: any) => (
                        <Card
                          key={message.id}
                          className={message.adminReply ? "opacity-75" : ""}
                        >
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold">
                                        {message.subject}
                                      </h4>
                                      {!message.adminReply && (
                                        <Badge variant="destructive">New</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                      <span className="font-medium text-foreground">{message.userName || `User #${message.userId}`}</span>
                                      <span className="mx-1">|</span>
                                      <span>{message.userPhone}</span>
                                      <span className="mx-1">|</span>
                                      <span>{message.userEmail}</span>
                                      <span className="mx-2">•</span>
                                      {format(
                                        new Date(message.createdAt),
                                        "MMM d, yyyy 'at' h:mm a",
                                      )}
                                    </div>
                                    <p className="mb-3">{message.message}</p>
                                    {message.adminReply && (
                                      <div className="mt-4 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                          <p className="text-sm font-medium">
                                            Reply from {message.repliedByName || 'Admin'}
                                          </p>
                                          <span className="text-xs text-muted-foreground">
                                            {message.repliedAt &&
                                              format(
                                                new Date(message.repliedAt),
                                                "MMM d, yyyy",
                                              )}
                                          </span>
                                        </div>
                                        <p className="text-sm">
                                          {message.adminReply}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {!message.adminReply && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyDialogOpen(true);
                                  }}
                                >
                                  Reply
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {messages.length > PAGE_SIZE && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Showing {((messagesPage - 1) * PAGE_SIZE) + 1} to {Math.min(messagesPage * PAGE_SIZE, messages.length)} of {messages.length}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={messagesPage === 1} onClick={() => setMessagesPage(messagesPage - 1)}>Previous</Button>
                          <span className="flex items-center px-3 text-sm">Page {messagesPage} of {Math.ceil(messages.length / PAGE_SIZE)}</span>
                          <Button variant="outline" size="sm" disabled={messagesPage >= Math.ceil(messages.length / PAGE_SIZE)} onClick={() => setMessagesPage(messagesPage + 1)}>Next</Button>
                        </div>
                      </div>
                    )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No messages yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              Send a reply to the user's inquiry
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Original Message:</p>
              <p className="text-sm text-muted-foreground">
                {selectedMessage?.message}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full mt-1.5 p-2 border rounded-md min-h-[120px]"
                  placeholder="Type your reply here..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReplyMessage}
              disabled={!replyText.trim() || replyMessageMutation.isPending}
            >
              {replyMessageMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information, status, and totals
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form id="edit-user-form">
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    name="name"
                    defaultValue={selectedUser.name}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    defaultValue={selectedUser.email}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    name="phone"
                    defaultValue={selectedUser.phone}
                    className="mt-1.5"
                  />
                </div>
                
                {/* Role field - admins can change to user/admin, superadmin can change to any */}
                {selectedUser.role !== "superadmin" && (
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <select
                      name="role"
                      defaultValue={selectedUser.role}
                      className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
                
                {/* Account status - only superadmin can disable/enable users */}
                {user?.role === "superadmin" && selectedUser.role !== "superadmin" && (
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <p className="text-xs text-muted-foreground">
                        Disabled users cannot login or access the platform
                      </p>
                    </div>
                    <select
                      name="isDisabled"
                      defaultValue={selectedUser.isDisabled ? "true" : "false"}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="false">Active</option>
                      <option value="true">Disabled</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Verification Status</p>
                    <p className="text-xs text-muted-foreground">
                      Verified users have confirmed their account
                    </p>
                  </div>
                  <select
                    name="isVerified"
                    defaultValue={selectedUser.isVerified ? "true" : "false"}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Contributions</label>
                    <Input
                      name="totalContributions"
                      type="number"
                      step="0.01"
                      defaultValue={parseFloat(selectedUser.totalContributions)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Savings</label>
                    <Input
                      name="totalSavings"
                      type="number"
                      step="0.01"
                      defaultValue={parseFloat(selectedUser.totalSavings)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Loans</label>
                    <Input
                      name="totalLoans"
                      type="number"
                      step="0.01"
                      defaultValue={parseFloat(selectedUser.totalLoans)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditUserDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Retry Payment Dialog */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retry Payment</DialogTitle>
            <DialogDescription>
              Retry the failed {retryType} payment for {retryItem?.userName || "this user"}.
            </DialogDescription>
          </DialogHeader>
          {retryItem && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{retryItem.userName || `User #${retryItem.userId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold">Ksh {Number(retryItem.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{retryType}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">M-Pesa Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="254712345678"
                    value={retryPhone}
                    onChange={(e) => setRetryPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={retryContributionMutation.isPending || retrySavingMutation.isPending || !retryPhone}
                onClick={handleRetryPayment}
              >
                {(retryContributionMutation.isPending || retrySavingMutation.isPending) ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
