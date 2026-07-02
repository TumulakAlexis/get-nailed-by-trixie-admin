import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * 1. FETCH ALL SERVICES
 * Includes the image URL generated from the storageId
 */
export const getServices = query({
  handler: async (ctx) => {
    const services = await ctx.db.query("services").collect();
    
    return Promise.all(
      services.map(async (service) => ({
        ...service,
        imageUrl: service.imageStorageId
          ? await ctx.storage.getUrl(service.imageStorageId)
          : null,
      }))
    );
  },
});

/**
 * 2. GENERATE UPLOAD URL
 * Used by the frontend to get a secure destination for the image file
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * 3. ADD NEW SERVICE
 */
export const addService = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const serviceId = await ctx.db.insert("services", {
      name: args.name,
      description: args.description,
      price: args.price,
      imageStorageId: args.imageStorageId,
    });
    return serviceId;
  },
});

/**
 * 4. DELETE A SERVICE
 */
export const removeService = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    // Optional: Delete the image from storage as well to save space
    const service = await ctx.db.get(args.id);
    if (service?.imageStorageId) {
      await ctx.storage.delete(service.imageStorageId);
    }
    await ctx.db.delete(args.id);
  },
  
}

); 

export const updateService = mutation({
  args: {
    id: v.id("services"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});