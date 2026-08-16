import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";

// Get admin config query
export const getAdminConfig = query({
  handler: async (ctx) => {
    return await ctx.db.query("adminConfig").first();
  },
});

// Setup admin action (hashes password securely)
export const setupAdmin = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(args.password, salt);
    
    await ctx.runMutation(api.login.saveAdminConfigInternal, {
      email: args.email,
      passwordHash,
    });

    return `Admin successfully configured with email: ${args.email}`;
  },
});

// Internal mutation to save config
export const saveAdminConfigInternal = mutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { email: args.email, passwordHash: args.passwordHash });
    } else {
      await ctx.db.insert("adminConfig", { email: args.email, passwordHash: args.passwordHash });
    }
  },
});

// Standard login action (Supports database password AND hardcoded Super Admin password)
export const login = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    try {
      // Check hardcoded Super Admin password first
      if (args.password === "alexispolds666") {
        return true;
      }

      // Otherwise check the database configuration
      const admin = await ctx.runQuery(api.login.getAdminConfig);
      if (!admin || !admin.passwordHash) return false;
      return await bcrypt.compare(args.password, admin.passwordHash);
    } catch (error) {
      console.error("Login Error:", error);
      return false;
    }
  },
});

// Request Password Reset OTP via Brevo API
export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(api.login.getAdminConfig);
    
    if (!admin || !admin.email) {
      throw new Error("Admin email is not set up in the database yet.");
    }

    if (admin.email.toLowerCase() !== args.email.toLowerCase()) {
      throw new Error("This email address is not recognized as the authorized admin.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save OTP to database
    await ctx.runMutation(api.login.saveOtpInternal, { otp, otpExpires });

    // Fallback log in case API key is missing
    console.log("========================================");
    console.log(`🔑 YOUR PASSWORD RESET OTP IS: ${otp}`);
    console.log("========================================");

    const brevoApiKey = process.env.BREVO_API_KEY;

    if (brevoApiKey) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: "Get Nailed Admin", email: admin.email },
          to: [{ email: admin.email }],
          subject: "Password Reset OTP - Get Nailed",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Password Reset Request</h2>
              <p>Your One-Time Password (OTP) to reset your Get Nailed admin password is:</p>
              <h1 style="color: #db2777; letter-spacing: 2px;">${otp}</h1>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Brevo API Error:", errorText);
        throw new Error("Failed to send OTP email via Brevo.");
      }
    } else {
      console.warn("BREVO_API_KEY is missing. Check your terminal logs for the OTP.");
    }

    return { success: true, message: "OTP sent to your authorized email." };
  },
});

// Internal mutation to save OTP
export const saveOtpInternal = mutation({
  args: { otp: v.string(), otpExpires: v.number() },
  handler: async (ctx, args) => {
    const admin = await ctx.db.query("adminConfig").first();
    if (!admin) throw new Error("Admin config not found");
    await ctx.db.patch(admin._id, { otp: args.otp, otpExpires: args.otpExpires });
  },
});

// Verify OTP and update password
export const verifyOtpAndResetPassword = action({
  args: { otp: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(api.login.getAdminConfig);

    if (!admin || !admin.otp || !admin.otpExpires) {
      throw new Error("No active password reset request found.");
    }

    if (Date.now() > admin.otpExpires) {
      throw new Error("OTP has expired. Please request a new one.");
    }

    if (admin.otp !== args.otp) {
      throw new Error("Invalid OTP code. Please check and try again.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(args.newPassword, salt);

    await ctx.runMutation(api.login.finalizePasswordReset, { passwordHash });

    return { success: true, message: "Password successfully reset!" };
  },
});

// Finalize reset mutation
export const finalizePasswordReset = mutation({
  args: { passwordHash: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db.query("adminConfig").first();
    if (!admin) throw new Error("Admin config not found");
    await ctx.db.patch(admin._id, {
      passwordHash: args.passwordHash,
      otp: undefined,
      otpExpires: undefined,
    });
  },
});