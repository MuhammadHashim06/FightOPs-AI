import { model, models, Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["promoter", "admin", "fighter"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["credentials"],
      default: "credentials",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_verification", "active", "suspended"],
      default: "pending_verification",
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    profile: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      displayName: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        default: null,
        trim: true,
        maxlength: 40,
      },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const emailVerificationTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpCode: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const passwordResetTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export type SessionDocument = InferSchemaType<typeof sessionSchema>;
export type EmailVerificationTokenDocument = InferSchemaType<
  typeof emailVerificationTokenSchema
>;
export type PasswordResetTokenDocument = InferSchemaType<
  typeof passwordResetTokenSchema
>;

export const UserMongoModel = models.User || model("User", userSchema);
export const SessionMongoModel = models.Session || model("Session", sessionSchema);
export const EmailVerificationTokenMongoModel =
  models.EmailVerificationToken ||
  model("EmailVerificationToken", emailVerificationTokenSchema);
export const PasswordResetTokenMongoModel =
  models.PasswordResetToken ||
  model("PasswordResetToken", passwordResetTokenSchema);
