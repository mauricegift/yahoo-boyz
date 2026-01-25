import {
  users,
  otpCodes,
  contributions,
  missedContributions,
  loans,
  loanRepayments,
  loanGuarantors,
  contactMessages,
  savings,
  type User,
  type InsertUser,
  type OtpCode,
  type InsertOtpCode,
  type Contribution,
  type InsertContribution,
  type MissedContribution,
  type InsertMissedContribution,
  type Loan,
  type InsertLoan,
  type LoanRepayment,
  type InsertLoanRepayment,
  type LoanGuarantor,
  type InsertLoanGuarantor,
  type ContactMessage,
  type InsertContactMessage,
  type Saving,
  type InsertSaving,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, asc, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  deleteUser(id: number): Promise<void>;

  // OTP Codes
  createOtpCode(otpCode: InsertOtpCode): Promise<OtpCode>;
  getOtpCode(
    email: string,
    code: string,
    type: string,
  ): Promise<OtpCode | undefined>;
  deleteOtpCodes(email: string, type: string): Promise<void>;

  // Contributions
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<Contribution[]>;
  getContributionById(id: number): Promise<Contribution | undefined>;
  getAllContributions(): Promise<Contribution[]>;
  updateContribution(
    id: number,
    data: Partial<Contribution>,
  ): Promise<Contribution>;
  getTotalContributions(): Promise<number>;
  getUserTotalContributions(userId: number): Promise<number>;
  getContributionByCheckoutId(
    checkoutId: string,
  ): Promise<Contribution | undefined>;
  getTotalContributionsCount(userId: number): Promise<number>;
  getLastContribution(userId: number): Promise<Contribution | undefined>;

  // Savings
  createSaving(data: InsertSaving): Promise<Saving>;
  getSavingById(id: number): Promise<Saving | undefined>;
  getSavingsByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<Saving[]>;
  getRecentSavings(userId: number, limit: number): Promise<Saving[]>;
  getTotalSavingsCount(userId: number): Promise<number>;
  getUserTotalSavings(userId: number): Promise<number>;
  getTotalSavings(): Promise<number>;
  getAllSavings(): Promise<Saving[]>;
  updateSaving(id: number, data: Partial<Saving>): Promise<Saving>;
  deleteSaving(id: number): Promise<void>;
  getSavingByCheckoutId(checkoutId: string): Promise<Saving | undefined>;

  // Missed Contributions
  createMissedContribution(
    missed: InsertMissedContribution,
  ): Promise<MissedContribution>;
  getMissedContributionsByUserId(userId: number): Promise<MissedContribution[]>;
  getUnpaidMissedContributions(userId: number): Promise<MissedContribution[]>;
  updateMissedContribution(
    id: number,
    data: Partial<MissedContribution>,
  ): Promise<MissedContribution>;
  getConsecutiveMisses(userId: number): Promise<number>;

  // Loans
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoanById(id: number): Promise<Loan | undefined>;
  getLoansByUserId(userId: number): Promise<Loan[]>;
  getAllLoans(): Promise<Loan[]>;
  getPendingLoans(): Promise<Loan[]>;
  updateLoan(id: number, data: Partial<Loan>): Promise<Loan>;
  getOverdueLoans(): Promise<Loan[]>;
  updateLoanAmountPaid(loanId: number, amount: number): Promise<Loan>;
  getUserLoansWithRepayments(userId: number): Promise<any[]>;
  getTotalLoansAmount(): Promise<number>;
  getUserTotalLoans(userId: number): Promise<number>;

  // Loan Repayments
  createLoanRepayment(repayment: InsertLoanRepayment): Promise<LoanRepayment>;
  getLoanRepaymentsByLoanId(loanId: number): Promise<LoanRepayment[]>;
  getLoanRepaymentsByUserId(userId: number): Promise<LoanRepayment[]>;
  updateLoanRepayment(
    id: number,
    data: Partial<LoanRepayment>,
  ): Promise<LoanRepayment>;
  getLoanRepaymentByCheckoutId(
    checkoutId: string,
  ): Promise<LoanRepayment | undefined>;
  getTotalLoanRepaymentsAmount(loanId: number): Promise<number>;

  // Loan Guarantors
  createLoanGuarantor(guarantor: InsertLoanGuarantor): Promise<LoanGuarantor>;
  getLoanGuarantorsByLoanId(loanId: number): Promise<LoanGuarantor[]>;
  getLoanGuarantorsWithUsersByLoanId(loanId: number): Promise<any[]>;
  updateLoanGuarantor(id: number, data: Partial<LoanGuarantor>): Promise<LoanGuarantor>;
  deductGuarantorSavings(loanId: number, amount: number): Promise<void>;

  // User lookup
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;

  // Admin Dashboard
  getRecentContributionsWithUsers(limit: number): Promise<any[]>;
  getRecentSavingsWithUsers(limit: number): Promise<any[]>;

  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessagesByUserId(userId: number): Promise<ContactMessage[]>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  updateContactMessage(
    id: number,
    data: Partial<ContactMessage>,
  ): Promise<ContactMessage>;
  getContactMessageById(id: number): Promise<ContactMessage | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return Number(result[0]?.count || 0);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // OTP Codes
  async createOtpCode(otpCode: InsertOtpCode): Promise<OtpCode> {
    const [code] = await db.insert(otpCodes).values(otpCode).returning();
    return code;
  }

  async getOtpCode(
    email: string,
    code: string,
    type: string,
  ): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.type, type),
        ),
      );
    return otp || undefined;
  }

  async deleteOtpCodes(email: string, type: string): Promise<void> {
    await db
      .delete(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.type, type)));
  }

  // Contributions
  async createContribution(
    contribution: InsertContribution,
  ): Promise<Contribution> {
    const [cont] = await db
      .insert(contributions)
      .values(contribution)
      .returning();
    return cont;
  }

  async getContributionsByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<Contribution[]> {
    let query = db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getContributionById(id: number): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.id, id));
    return contribution;
  }

  async getAllContributions(): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .orderBy(desc(contributions.createdAt));
  }

  async updateContribution(
    id: number,
    data: Partial<Contribution>,
  ): Promise<Contribution> {
    const [cont] = await db
      .update(contributions)
      .set(data)
      .where(eq(contributions.id, id))
      .returning();
    return cont;
  }

  async getTotalContributions(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(contributions)
      .where(eq(contributions.status, "completed"));
    return Number(result[0]?.total || 0);
  }

  async getUserTotalContributions(userId: number): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(contributions)
      .where(
        and(
          eq(contributions.userId, userId),
          eq(contributions.status, "completed"),
        ),
      );
    return Number(result[0]?.total || 0);
  }

  async getContributionByCheckoutId(
    checkoutId: string,
  ): Promise<Contribution | undefined> {
    const [cont] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.mpesaCheckoutId, checkoutId));
    return cont || undefined;
  }

  async getTotalContributionsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributions)
      .where(eq(contributions.userId, userId));
    return Number(result[0]?.count || 0);
  }

  async getLastContribution(userId: number): Promise<Contribution | undefined> {
    const [cont] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt))
      .limit(1);
    return cont || undefined;
  }

  // Savings
  async createSaving(data: InsertSaving): Promise<Saving> {
    const [saving] = await db.insert(savings).values(data).returning();
    return saving;
  }

  async getSavingById(id: number): Promise<Saving | undefined> {
    const [saving] = await db.select().from(savings).where(eq(savings.id, id));
    return saving || undefined;
  }

  async getSavingsByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<Saving[]> {
    let query = db
      .select()
      .from(savings)
      .where(eq(savings.userId, userId))
      .orderBy(desc(savings.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getRecentSavings(userId: number, limit: number): Promise<Saving[]> {
    return await db
      .select()
      .from(savings)
      .where(eq(savings.userId, userId))
      .orderBy(desc(savings.createdAt))
      .limit(limit);
  }

  async getTotalSavingsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(savings)
      .where(eq(savings.userId, userId));
    return Number(result[0]?.count || 0);
  }

  async getUserTotalSavings(userId: number): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(savings)
      .where(and(eq(savings.userId, userId), eq(savings.status, "completed")));
    return Number(result[0]?.total || 0);
  }

  async getTotalSavings(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(savings)
      .where(eq(savings.status, "completed"));
    return Number(result[0]?.total || 0);
  }

  async getAllSavings(): Promise<Saving[]> {
    return await db.select().from(savings).orderBy(desc(savings.createdAt));
  }

  async updateSaving(id: number, data: Partial<Saving>): Promise<Saving> {
    const [saving] = await db
      .update(savings)
      .set(data)
      .where(eq(savings.id, id))
      .returning();
    return saving;
  }

  async deleteSaving(id: number): Promise<void> {
    await db.delete(savings).where(eq(savings.id, id));
  }

  async getSavingByCheckoutId(checkoutId: string): Promise<Saving | undefined> {
    const [saving] = await db
      .select()
      .from(savings)
      .where(eq(savings.mpesaCheckoutId, checkoutId));
    return saving || undefined;
  }

  // Missed Contributions
  async createMissedContribution(
    missed: InsertMissedContribution,
  ): Promise<MissedContribution> {
    const [mc] = await db
      .insert(missedContributions)
      .values(missed)
      .returning();
    return mc;
  }

  async getMissedContributionsByUserId(
    userId: number,
  ): Promise<MissedContribution[]> {
    return await db
      .select()
      .from(missedContributions)
      .where(eq(missedContributions.userId, userId))
      .orderBy(desc(missedContributions.createdAt));
  }

  async getUnpaidMissedContributions(
    userId: number,
  ): Promise<MissedContribution[]> {
    return await db
      .select()
      .from(missedContributions)
      .where(
        and(
          eq(missedContributions.userId, userId),
          eq(missedContributions.isPaid, false),
        ),
      )
      .orderBy(desc(missedContributions.createdAt));
  }

  async updateMissedContribution(
    id: number,
    data: Partial<MissedContribution>,
  ): Promise<MissedContribution> {
    const [mc] = await db
      .update(missedContributions)
      .set(data)
      .where(eq(missedContributions.id, id))
      .returning();
    return mc;
  }

  async getConsecutiveMisses(userId: number): Promise<number> {
    const unpaid = await this.getUnpaidMissedContributions(userId);
    return unpaid.length;
  }

  // Loans
  async createLoan(loan: InsertLoan): Promise<Loan> {
    // Set due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const loanData = {
      ...loan,
      dueDate,
    };

    const [l] = await db.insert(loans).values(loanData).returning();
    return l;
  }

  async getLoanById(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan || undefined;
  }

  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  async getAllLoans(): Promise<Loan[]> {
    return await db.select().from(loans).orderBy(desc(loans.createdAt));
  }

  async getPendingLoans(): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.status, "pending"))
      .orderBy(desc(loans.createdAt));
  }

  async updateLoan(id: number, data: Partial<Loan>): Promise<Loan> {
    const [loan] = await db
      .update(loans)
      .set(data)
      .where(eq(loans.id, id))
      .returning();
    return loan;
  }

  async getOverdueLoans(): Promise<Loan[]> {
    const now = new Date();
    return await db
      .select()
      .from(loans)
      .where(and(eq(loans.status, "approved"), lte(loans.dueDate, now)))
      .orderBy(desc(loans.createdAt));
  }

  async updateLoanAmountPaid(loanId: number, amount: number): Promise<Loan> {
    const loan = await this.getLoanById(loanId);
    if (!loan) {
      throw new Error("Loan not found");
    }

    const newAmountPaid = Number(loan.amountPaid) + amount;
    let status = loan.status;

    // Check if loan is fully paid
    if (newAmountPaid >= Number(loan.totalAmount)) {
      status = "paid";
    }

    return await this.updateLoan(loanId, {
      amountPaid: String(newAmountPaid),
      status,
      updatedAt: new Date(),
    });
  }

  async getUserLoansWithRepayments(userId: number): Promise<any[]> {
    const userLoans = await this.getLoansByUserId(userId);
    const loansWithRepayments = [];

    for (const loan of userLoans) {
      const repayments = await this.getLoanRepaymentsByLoanId(loan.id);
      loansWithRepayments.push({
        ...loan,
        repayments,
      });
    }

    return loansWithRepayments;
  }

  async getTotalLoansAmount(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(loans)
      .where(eq(loans.status, "approved"));
    return Number(result[0]?.total || 0);
  }

  async getUserTotalLoans(userId: number): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.status, "approved")));
    return Number(result[0]?.total || 0);
  }

  // Loan Repayments
  async createLoanRepayment(
    repayment: InsertLoanRepayment,
  ): Promise<LoanRepayment> {
    const [r] = await db.insert(loanRepayments).values(repayment).returning();
    return r;
  }

  async getLoanRepaymentsByLoanId(loanId: number): Promise<LoanRepayment[]> {
    return await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.loanId, loanId))
      .orderBy(desc(loanRepayments.createdAt));
  }

  async getLoanRepaymentsByUserId(userId: number): Promise<LoanRepayment[]> {
    return await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.userId, userId))
      .orderBy(desc(loanRepayments.createdAt));
  }

  async updateLoanRepayment(
    id: number,
    data: Partial<LoanRepayment>,
  ): Promise<LoanRepayment> {
    const [r] = await db
      .update(loanRepayments)
      .set(data)
      .where(eq(loanRepayments.id, id))
      .returning();
    return r;
  }

  async getLoanRepaymentByCheckoutId(
    checkoutId: string,
  ): Promise<LoanRepayment | undefined> {
    const [r] = await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.mpesaCheckoutId, checkoutId));
    return r || undefined;
  }

  async getTotalLoanRepaymentsAmount(loanId: number): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(loanRepayments)
      .where(
        and(
          eq(loanRepayments.loanId, loanId),
          eq(loanRepayments.status, "completed"),
        ),
      );
    return Number(result[0]?.total || 0);
  }

  // Admin Dashboard
  async getRecentContributionsWithUsers(limit: number): Promise<any[]> {
    return await db
      .select({
        id: contributions.id,
        userId: contributions.userId,
        amount: contributions.amount,
        status: contributions.status,
        mpesaReceiptNumber: contributions.mpesaReceiptNumber,
        createdAt: contributions.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(contributions)
      .innerJoin(users, eq(contributions.userId, users.id))
      .orderBy(desc(contributions.createdAt))
      .limit(limit);
  }

  async getRecentSavingsWithUsers(limit: number): Promise<any[]> {
    return await db
      .select({
        id: savings.id,
        userId: savings.userId,
        amount: savings.amount,
        description: savings.description,
        status: savings.status,
        mpesaReceiptNumber: savings.mpesaReceiptNumber,
        createdAt: savings.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(savings)
      .innerJoin(users, eq(savings.userId, users.id))
      .orderBy(desc(savings.createdAt))
      .limit(limit);
  }

  // Contact Messages
  async createContactMessage(
    message: InsertContactMessage,
  ): Promise<ContactMessage> {
    const [m] = await db.insert(contactMessages).values(message).returning();
    return m;
  }

  async getContactMessagesByUserId(userId: number): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.userId, userId))
      .orderBy(desc(contactMessages.createdAt));
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessage(
    id: number,
    data: Partial<ContactMessage>,
  ): Promise<ContactMessage> {
    const [m] = await db
      .update(contactMessages)
      .set(data)
      .where(eq(contactMessages.id, id))
      .returning();
    return m;
  }

  async getContactMessageById(id: number): Promise<ContactMessage | undefined> {
    const [m] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id));
    return m || undefined;
  }

  // Loan Guarantors
  async createLoanGuarantor(guarantor: InsertLoanGuarantor): Promise<LoanGuarantor> {
    const [g] = await db.insert(loanGuarantors).values(guarantor).returning();
    return g;
  }

  async getLoanGuarantorsByLoanId(loanId: number): Promise<LoanGuarantor[]> {
    return await db
      .select()
      .from(loanGuarantors)
      .where(eq(loanGuarantors.loanId, loanId));
  }

  async getLoanGuarantorsWithUsersByLoanId(loanId: number): Promise<any[]> {
    return await db
      .select({
        id: loanGuarantors.id,
        loanId: loanGuarantors.loanId,
        guarantorId: loanGuarantors.guarantorId,
        status: loanGuarantors.status,
        createdAt: loanGuarantors.createdAt,
        guarantorName: users.name,
        guarantorEmail: users.email,
        guarantorPhone: users.phone,
        guarantorSavings: users.totalSavings,
      })
      .from(loanGuarantors)
      .innerJoin(users, eq(loanGuarantors.guarantorId, users.id))
      .where(eq(loanGuarantors.loanId, loanId));
  }

  async updateLoanGuarantor(id: number, data: Partial<LoanGuarantor>): Promise<LoanGuarantor> {
    const [g] = await db
      .update(loanGuarantors)
      .set(data)
      .where(eq(loanGuarantors.id, id))
      .returning();
    return g;
  }

  async deductGuarantorSavings(loanId: number, amount: number): Promise<void> {
    const guarantors = await this.getLoanGuarantorsWithUsersByLoanId(loanId);
    if (guarantors.length < 2) {
      throw new Error("Loan does not have enough guarantors");
    }

    const amountPerGuarantor = amount / guarantors.length;

    for (const guarantor of guarantors) {
      const currentSavings = Number(guarantor.guarantorSavings || 0);
      const deductAmount = Math.min(amountPerGuarantor, currentSavings);
      
      if (deductAmount > 0) {
        await db
          .update(users)
          .set({ totalSavings: String(currentSavings - deductAmount) })
          .where(eq(users.id, guarantor.guarantorId));
      }
    }
  }

  // User lookup by email or phone
  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, emailOrPhone), eq(users.phone, emailOrPhone)));
    return user || undefined;
  }
}

export const storage = new DatabaseStorage();
