import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bookings: defineTable({
    name: v.string(),
    facebookName: v.string(),
    phone: v.string(),
    email: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    slot: v.string(), // "9:00 AM"
    status: v.optional(v.string()),
    imageStorageId: v.union(v.id("_storage"), v.null()),
    createdAt: v.number(),
  }).index("by_date", ["date", "slot"]),

  transactions: defineTable({
    bookingId: v.id("bookings"), // <--- ADDED: The link to the booking
    name: v.string(),
    phone: v.string(),
    services: v.array(v.object({ 
    name: v.string(), 
    price: v.number() 
  })),
    additionalFee: v.number(),
    totalFee: v.number(),
    date: v.optional(v.string()), 
    createdAt: v.number(),
  }).index("by_bookingId", ["bookingId"]), // <--- ADDED: The missing index

  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(), 
    date: v.string(), 
    createdAt: v.number(),
  }),

  // Add this to your schema.ts
services: defineTable({
  name: v.string(),
  description: v.string(),
  price: v.number(),
  imageStorageId: v.optional(v.id("_storage")), // For the service photo
}),

adminConfig: defineTable({
    passwordHash: v.string(),
  }),
  
});