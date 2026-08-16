import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";

/**
 * AUTH: Verify the admin password
 * This uses an 'action' to allow bcrypt hashing.
 */
export const login = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    try {
      const admin = await ctx.runQuery(api.admin.getAdminConfig);
      
      if (!admin || !admin.passwordHash) {
        console.error("No admin config found in database.");
        return false;
      }

      const isMatch = await bcrypt.compare(args.password, admin.passwordHash);
      console.log("Password match result:", isMatch);
      return isMatch;
    } catch (error) {
      console.error("Bcrypt Error:", error.message);
      return false;
    }
  },
});

/**
 * SETTINGS: Change the password from the dashboard
 */
export const updateAdminPassword = action({
  args: { newPassword: v.string() },
  handler: async (ctx, args) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(args.newPassword, salt);
    await ctx.runMutation(api.admin.saveAdminPassword, { hash });
    return { success: true };
  },
});

/**
 * INTERNAL HELPERS: Admin Config access
 */
export const getAdminConfig = query({
  handler: async (ctx) => {
    return await ctx.db.query("adminConfig").first();
  },
});

export const saveAdminPassword = mutation({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { passwordHash: args.hash });
    } else {
      await ctx.db.insert("adminConfig", { passwordHash: args.hash });
    }
  },
});

/**
 * UPDATES: Status changes now drive the dashboard stats.
 */
export const updateBookingStatus = mutation({
  args: { 
    id: v.id("bookings"), 
    status: v.string() 
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

/**
 * BLOCKS: Manual slot occupation.
 */
export const manualOccupy = mutation({
  args: { date: v.string(), slot: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", {
      name: args.name,
      facebookName: "Occupied",
      phone: "Occupied",
      email: "Occupied",
      date: args.date,
      slot: args.slot,
      imageStorageId: null,
      createdAt: Date.now(),
      status: "active",
    });
  },
});

/**
 * STATS ENGINE
 */
export const getStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("bookings").collect();
    const total = all.filter(b => b.name !== "Occupied").length;
    const pending = all.filter(b => 
      (b.status === "active" || !b.status) && b.name !== "Occupied"
    ).length;
    const completed = all.filter(b => b.status === "completed").length;
    const canceled = all.filter(b => b.status === "canceled").length;
    return { total, pending, completed, canceled };
  },
});

/**
 * UNBLOCK: Removes manual "Occupied" blocks for a list of dates.
 */
export const massUnblock = mutation({
  args: { dates: v.array(v.string()) },
  handler: async (ctx, args) => {
    for (const date of args.dates) {
      const blocks = await ctx.db
        .query("bookings")
        .withIndex("by_date", (q) => q.eq("date", date))
        .filter((q) => q.eq(q.field("name"), "Occupied"))
        .collect();
      for (const block of blocks) {
        await ctx.db.delete(block._id);
      }
    }
  },
});

export const checkExistingBookings = query({
  args: { dates: v.array(v.string()) },
  handler: async (ctx, args) => {
    const conflicts = await ctx.db
      .query("bookings")
      .filter((q) => 
        q.and(
          q.neq(q.field("name"), "Occupied"),
          q.neq(q.field("status"), "canceled")
        )
      )
      .collect();
    return conflicts.filter(b => args.dates.includes(b.date));
  },
});

export const deleteBooking = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createTransaction = mutation({
  args: {
    bookingId: v.id("bookings"),
    name: v.string(),
    phone: v.string(),
    services: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
      })
    ),
    additionalFee: v.number(),
    totalFee: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      bookingId: args.bookingId,
      name: args.name,
      phone: args.phone,
      services: args.services,
      additionalFee: args.additionalFee,
      totalFee: args.totalFee,
      date: args.date,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.bookingId, { status: "completed" });
    return transactionId;
  },
});

export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("transactions")
      .order("desc")
      .collect();
  },
});

/** 
 * --- EXPENSE FUNCTIONS ---
 */
export const addExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getAllExpenses = query({
  handler: async (ctx) => {
    return await ctx.db.query("expenses").order("desc").collect();
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getTransactionByBookingId = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .unique();
  },
});

export const logout = mutation({
  args: {},
  handler: async (ctx) => {
    return { success: true };
  },
});

export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const passwordHash = "$2a$10$6p3m5X8j5.f0Q.eZ6q8OueC1V9vH9S.7m4N8r6p9X0z3v4b5c6d7e";
    const existing = await ctx.db.query("adminConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { passwordHash });
    } else {
      await ctx.db.insert("adminConfig", { passwordHash });
    }
    return "Database updated. Use password: admin123";
  },
});

/**
 * REVIEWS: Get all reviews along with analytics
 */
export const getReviewsWithAnalytics = query({
  handler: async (ctx) => {
    const reviews = await ctx.db.query("reviews").order("desc").collect();
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const review of reviews) {
      sum += review.rating;
      const roundedRating = Math.round(review.rating);
      if (distribution[roundedRating] !== undefined) {
        distribution[roundedRating]++;
      }
    }

    const averageRating = (sum / totalReviews).toFixed(1);

    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        let imageUrl = null;
        if (review.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(review.imageStorageId);
        }
        return {
          ...review,
          imageUrl,
        };
      })
    );

    return {
      reviews: reviewsWithImages,
      averageRating: Number(averageRating),
      totalReviews,
      distribution,
    };
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.imageStorageId) {
      await ctx.storage.delete(review.imageStorageId);
    }

    await ctx.db.delete(args.id);
  },
});