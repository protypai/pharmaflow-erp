import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, signAdminToken, verifyRefreshToken } from '../utils/jwt';

export interface RegisterPayload {
  companyName: string;
  shortName?: string;
  gstin?: string;
  phone?: string;
  city?: string;
  state?: string;
  name: string;
  email: string;
  password: string;
}

export const registerCompany = async (data: RegisterPayload) => {
  const existingUser = await db.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('Email address already registered', 400);
  }

  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 14); // 14-day trial after approval

  const passwordHash = await bcrypt.hash(data.password, 12);

  return db.$transaction(async (tx: any) => {
    const company = await tx.company.create({
      data: {
        name: data.companyName,
        shortName: data.shortName || data.companyName,
        gstin: data.gstin,
        phone: data.phone,
        city: data.city,
        state: data.state,
        subscriptionStatus: 'pending',
        subscriptionExpiry: trialExpiry,
        isActive: false, // Requires Super Admin approval
      },
    });

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'admin',
        isActive: false, // Requires Super Admin approval
      },
    });

    return {
      message: 'Registration successful. Account is pending Super Admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company,
      },
    };
  });
};

export const loginUser = async (email: string, password: string) => {
  const user = await db.user.findUnique({ where: { email }, include: { company: true } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  if (!user.isActive || !user.company.isActive || user.company.subscriptionStatus === 'pending') {
    throw new AppError('Your account is pending Super Admin approval. Please contact administrator.', 403);
  }

  const payload = { userId: user.id, companyId: user.companyId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    },
  };
};

export const loginAdmin = async (email: string, password: string) => {
  const admin = await db.superAdmin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) throw new AppError('Invalid credentials', 401);
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);
  await db.superAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const token = signAdminToken(admin.id);
  return { token, admin: { id: admin.id, name: admin.name, email: admin.email } };
};

export const refreshUserToken = async (refreshToken: string) => {
  const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || !stored.isValid || stored.expiresAt < new Date()) {
    throw new AppError('Invalid refresh token', 401);
  }
  const payload = verifyRefreshToken(refreshToken);
  const accessToken = signAccessToken({
    userId: payload.userId,
    companyId: payload.companyId,
    role: payload.role,
  });
  return { accessToken };
};

export const logoutUser = async (refreshToken: string) => {
  await db.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isValid: false },
  });
};
