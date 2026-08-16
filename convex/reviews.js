// convex/review.js
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all reviews and calculate analytics (Average rating + distribution graph)
export const getReviewsWithAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db.query("reviews").order("desc").collect();

    if (reviews.length === 0) {
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    let totalScore = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        totalScore += review.rating;
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;

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

    const averageRating = Number((totalScore / reviews.length).toFixed(1));

    return {
      reviews: reviewsWithImages,
      averageRating,
      totalReviews: reviews.length,
      distribution,
    };
  },
});

// Generate upload URL for review images
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Submit a new review
export const addReview = mutation({
  args: {
    clientName: v.string(),
    rating: v.number(),
    comment: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reviews", {
      clientName: args.clientName,
      rating: args.rating,
      comment: args.comment,
      imageStorageId: args.imageStorageId,
      createdAt: Date.now(),
    });
  },
});