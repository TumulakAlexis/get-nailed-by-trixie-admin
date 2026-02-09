import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * 1. Fetch ALL bookings (Used by Admin Calendar)
 */
export const getAllBookings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bookings").order("desc").collect();
  },
});

/**
 * 2. Fetch Signed Image URL (Used by both to show nail art)
 */
export const getImageUrl = query({
  args: { storageId: v.union(v.id("_storage"), v.null()) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * 3. Fetch bookings for a specific month (Used for Calendar Dots)
 */
export const getMonthAvailability = query({
  args: { month: v.string() }, 
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) =>
        q.gte("date", `${args.month}-01`).lte("date", `${args.month}-31`)
      )
      .collect();

    const stats = {};
    for (const booking of bookings) {
      // Only count active/completed as dots
      if (booking.status !== "canceled") {
        stats[booking.date] = (stats[booking.date] || 0) + 1;
      }
    }
    return stats;
  },
});

/**
 * 4. Check specific time slots (Prevents double booking)
 */
export const getAvailableSlots = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const dayBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const takenSlots = dayBookings
      .filter(b => b.status === "active" || b.status === "completed" || !b.status)
      .map((b) => b.slot);
      
    const allSlots = ["9:00 AM", "1:00 PM", "4:00 PM"];

    return allSlots.map((slot) => ({
      time: slot,
      isAvailable: !takenSlots.includes(slot),
    }));
  },
});

/**
 * 5. Create a new booking
 */
export const createBooking = mutation({
  args: {
    name: v.string(),
    facebookName: v.string(),
    phone: v.string(),
    email: v.string(),
    date: v.string(),
    slot: v.string(),
    imageStorageId: v.union(v.id("_storage"), v.null()), 
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date).eq("slot", args.slot))
      .unique();

    if (existing && (existing.status === "active" || existing.status === "completed")) {
      throw new Error("This slot was just booked by someone else!");
    }

    return await ctx.db.insert("bookings", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

/**
 * 6. Generate URL for Nail Art upload
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});