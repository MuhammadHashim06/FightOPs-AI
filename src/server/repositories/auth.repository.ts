import type {
  AuthSession,
  AuthUser,
  EmailVerificationToken,
  PasswordResetToken,
} from "@/types/auth";
import { connectToDatabase } from "@/server/db/mongoose";
import {
  EmailVerificationTokenMongoModel,
  PasswordResetTokenMongoModel,
  SessionMongoModel,
  UserMongoModel,
} from "@/server/models/auth.model";

export interface AuthRepository {
  findUserById(userId: string): Promise<AuthUser | null>;
  findUserByEmail(email: string): Promise<AuthUser | null>;
  listUsersByRole(role: AuthUser["role"]): Promise<AuthUser[]>;
  listAllUsers(): Promise<AuthUser[]>;
  createUser(user: Omit<AuthUser, "id">): Promise<AuthUser>;
  updateUser(user: AuthUser): Promise<AuthUser>;
  createSession(session: Omit<AuthSession, "id">): Promise<AuthSession>;
  findActiveSessionByTokenHash(tokenHash: string): Promise<AuthSession | null>;
  revokeSession(sessionId: string): Promise<void>;
  createEmailVerificationToken(
    token: Omit<EmailVerificationToken, "id">,
  ): Promise<EmailVerificationToken>;
  findEmailVerificationToken(
    email: string,
    otpCode: string,
  ): Promise<EmailVerificationToken | null>;
  consumeEmailVerificationToken(tokenId: string): Promise<void>;
  createPasswordResetToken(
    token: Omit<PasswordResetToken, "id">,
  ): Promise<PasswordResetToken>;
  findPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null>;
  consumePasswordResetToken(tokenId: string): Promise<void>;
}

export const authRepository: AuthRepository = {
  async findUserById(userId) {
    await connectToDatabase();

    const user = await UserMongoModel.findById(userId).lean();
    return user ? mapUser(user) : null;
  },
  async findUserByEmail(email) {
    await connectToDatabase();

    const user = await UserMongoModel.findOne({
      email: email.toLowerCase(),
    }).lean();

    return user ? mapUser(user) : null;
  },
  async listUsersByRole(role) {
    await connectToDatabase();

    const users = await UserMongoModel.find({ role, status: "active" }).lean();
    return users.map(mapUser);
  },
  async listAllUsers() {
    await connectToDatabase();

    const users = await UserMongoModel.find().sort({ createdAt: -1 }).lean();
    return users.map(mapUser);
  },
  async createUser(user) {
    await connectToDatabase();

    const createdUser = await UserMongoModel.create({
      ...user,
      emailVerifiedAt: toDate(user.emailVerifiedAt),
      lastLoginAt: toDate(user.lastLoginAt),
      createdAt: toDate(user.createdAt),
      updatedAt: toDate(user.updatedAt),
    });

    return mapUser(createdUser.toObject());
  },
  async updateUser(user) {
    await connectToDatabase();

    const updatedUser = await UserMongoModel.findByIdAndUpdate(
      user.id,
      {
        email: user.email,
        role: user.role,
        provider: user.provider,
        status: user.status,
        emailVerifiedAt: toDate(user.emailVerifiedAt),
        passwordHash: user.passwordHash,
        profile: user.profile,
        lastLoginAt: toDate(user.lastLoginAt),
        updatedAt: toDate(user.updatedAt),
      },
      { returnDocument: "after" },
    ).lean();

    if (!updatedUser) {
      throw new Error("User account was not found.");
    }

    return mapUser(updatedUser);
  },
  async createSession(session) {
    await connectToDatabase();

    const createdSession = await SessionMongoModel.create({
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: toDate(session.expiresAt),
      createdAt: toDate(session.createdAt),
      revokedAt: toDate(session.revokedAt),
    });

    return mapSession(createdSession.toObject());
  },
  async findActiveSessionByTokenHash(tokenHash) {
    await connectToDatabase();

    const session = await SessionMongoModel.findOne({
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();

    return session ? mapSession(session) : null;
  },
  async revokeSession(sessionId) {
    await connectToDatabase();
    await SessionMongoModel.findByIdAndUpdate(sessionId, {
      revokedAt: new Date(),
    });
  },
  async createEmailVerificationToken(token) {
    await connectToDatabase();

    const createdToken = await EmailVerificationTokenMongoModel.create({
      userId: token.userId,
      email: token.email,
      otpCode: token.otpCode,
      expiresAt: toDate(token.expiresAt),
      createdAt: toDate(token.createdAt),
      consumedAt: toDate(token.consumedAt),
    });

    return mapEmailVerificationToken(createdToken.toObject());
  },
  async findEmailVerificationToken(email, otpCode) {
    await connectToDatabase();

    const token = await EmailVerificationTokenMongoModel.findOne({
      email: email.toLowerCase(),
      otpCode,
    }).lean();

    return token ? mapEmailVerificationToken(token) : null;
  },
  async consumeEmailVerificationToken(tokenId) {
    await connectToDatabase();
    await EmailVerificationTokenMongoModel.findByIdAndUpdate(tokenId, {
      consumedAt: new Date(),
    });
  },
  async createPasswordResetToken(token) {
    await connectToDatabase();

    const createdToken = await PasswordResetTokenMongoModel.create({
      userId: token.userId,
      email: token.email,
      tokenHash: token.tokenHash,
      expiresAt: toDate(token.expiresAt),
      createdAt: toDate(token.createdAt),
      consumedAt: toDate(token.consumedAt),
    });

    return mapPasswordResetToken(createdToken.toObject());
  },
  async findPasswordResetToken(tokenHash) {
    await connectToDatabase();

    const token = await PasswordResetTokenMongoModel.findOne({
      tokenHash,
    }).lean();

    return token ? mapPasswordResetToken(token) : null;
  },
  async consumePasswordResetToken(tokenId) {
    await connectToDatabase();
    await PasswordResetTokenMongoModel.findByIdAndUpdate(tokenId, {
      consumedAt: new Date(),
    });
  },
};

function mapUser(user: {
  _id: { toString(): string };
  email: string;
  role: AuthUser["role"];
  provider: AuthUser["provider"];
  status: AuthUser["status"];
  emailVerifiedAt: Date | null;
  passwordHash: string;
  profile: AuthUser["profile"];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    provider: user.provider,
    status: user.status,
    emailVerifiedAt: toIso(user.emailVerifiedAt),
    passwordHash: user.passwordHash,
    profile: {
      ...user.profile,
      phone: user.profile.phone ?? null,
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: toIso(user.lastLoginAt),
  };
}

function mapSession(session: {
  _id: { toString(): string };
  userId: { toString(): string };
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: session._id.toString(),
    userId: session.userId.toString(),
    refreshTokenHash: session.refreshTokenHash,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    revokedAt: toIso(session.revokedAt),
  };
}

function mapEmailVerificationToken(token: {
  _id: { toString(): string };
  userId: { toString(): string };
  email: string;
  otpCode: string;
  expiresAt: Date;
  createdAt: Date;
  consumedAt: Date | null;
}) {
  return {
    id: token._id.toString(),
    userId: token.userId.toString(),
    email: token.email,
    otpCode: token.otpCode,
    expiresAt: token.expiresAt.toISOString(),
    createdAt: token.createdAt.toISOString(),
    consumedAt: toIso(token.consumedAt),
  };
}

function mapPasswordResetToken(token: {
  _id: { toString(): string };
  userId: { toString(): string };
  email: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  consumedAt: Date | null;
}) {
  return {
    id: token._id.toString(),
    userId: token.userId.toString(),
    email: token.email,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt.toISOString(),
    createdAt: token.createdAt.toISOString(),
    consumedAt: toIso(token.consumedAt),
  };
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}
