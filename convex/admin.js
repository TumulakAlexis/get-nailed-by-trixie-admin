import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * UPDATES: Status changes now drive the dashboard stats.
 */
export const updateBookingStatus = mutation({
  args: { 
    id: v.id("bookings"), 
    status: v.string() // "completed" or "canceled"
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
 * STATS ENGINE: Fixed to match your Schema
 */
export const getStats = query({
  handler: async (ctx) => {
    // Fetch every single record in the table
    const all = await ctx.db.query("bookings").collect();
    
    // 1. Total Bookings: Sum of all _id in the table
    const total = all.filter(b => b.name !== "Occupied").length;

    // 2. Pending: Sum of all "active" status records
    // (Also including null/undefined as 'active' for safety)
    const pending = all.filter(b => 
      (b.status === "active" || !b.status) && b.name !== "Occupied"
    ).length;

    // 3. Completed: Sum of "completed"
    const completed = all.filter(b => b.status === "completed").length;

    // 4. Canceled: Sum of "canceled"
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
      // Find all manual blocks for this date
      const blocks = await ctx.db
        .query("bookings")
        .withIndex("by_date", (q) => q.eq("date", date))
        .filter((q) => q.eq(q.field("name"), "Occupied"))
        .collect();

      // Delete each manual block
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
          // Check if the date is in our selected list
          // Note: For many dates, we'll collect and filter in JS for better performance
          q.neq(q.field("name"), "Occupied"),
          q.neq(q.field("status"), "canceled")
        )
      )
      .collect();

    // Filter to only the dates we are interested in
    return conflicts.filter(b => args.dates.includes(b.date));
  },
});

export const deleteBooking = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Add this to your admin.ts
export const createTransaction = mutation({
  args: {
    bookingId: v.id("bookings"),
    name: v.string(),
    phone: v.string(),
    services: v.array(v.string()),
    additionalFee: v.number(),
    totalFee: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      name: args.name,
      phone: args.phone,
      services: args.services,
      additionalFee: args.additionalFee,
      totalFee: args.totalFee,
      createdAt: Date.now(),
    });

    // Automatically update the booking to completed
    await ctx.db.patch(args.bookingId, { status: "completed" });
    return transactionId;
  },
});

export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    // This fetches all records from your 'transactions' table 
    // and sorts them by the most recent first
    return await ctx.db
      .query("transactions")
      .order("desc")
      .collect();
  },
});