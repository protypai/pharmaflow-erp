import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, signAdminToken, verifyRefreshToken } from '../utils/jwt';
import { logActivity } from './activityLog.service';

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
        isActive: false, // Requires Super Admin approval (manual on/off)
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

export const loginUser = async (email: string, password: string, ipAddress?: string) => {
  const user = await db.user.findUnique({ where: { email }, include: { company: true } });
  if (!user) {
    await logActivity({
      actorType: 'user', actorEmail: email, action: 'auth.login_failed',
      detail: 'Unknown email', ipAddress,
    });
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logActivity({
      companyId: user.companyId, actorType: 'user', actorId: user.id, actorEmail: email,
      action: 'auth.login_failed', detail: 'Incorrect password', ipAddress,
    });
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive || !user.company.isActive || user.company.subscriptionStatus === 'pending') {
    await logActivity({
      companyId: user.companyId, actorType: 'user', actorId: user.id, actorEmail: email,
      action: 'auth.login_failed',
      detail: `Login blocked — account ${user.company.isActive ? 'pending approval' : 'deactivated'}`,
      ipAddress,
    });
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

  await logActivity({
    companyId: user.companyId,
    actorType: 'user',
    actorId: user.id,
    actorEmail: user.email,
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
    detail: `${user.email} logged in to ${user.company.name}`,
    ipAddress,
  });

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

export const loginAdmin = async (email: string, password: string, ipAddress?: string) => {
  const admin = await db.superAdmin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    await logActivity({
      actorType: 'superadmin', actorEmail: email, action: 'admin.login_failed',
      detail: admin ? 'Super admin account inactive' : 'Unknown super admin email', ipAddress,
    });
    throw new AppError('Invalid credentials', 401);
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    await logActivity({
      actorType: 'superadmin', actorId: admin.id, actorEmail: email,
      action: 'admin.login_failed', detail: 'Incorrect password', ipAddress,
    });
    throw new AppError('Invalid credentials', 401);
  }
  await db.superAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const token = signAdminToken(admin.id);

  await logActivity({
    actorType: 'superadmin',
    actorId: admin.id,
    actorEmail: admin.email,
    action: 'admin.login',
    targetType: 'superadmin',
    targetId: admin.id,
    detail: `Super admin ${admin.email} signed in`,
    ipAddress,
  });

  return { token, admin: { id: admin.id, name: admin.name, email: admin.email } };
};

export const refreshUserToken = async (refreshToken: string) => {
  const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || !stored.isValid || stored.expiresAt < new Date()) {
    throw new AppError('Invalid refresh token', 401);
  }
  const payload = verifyRefreshToken(refreshToken);

  // Re-validate account state on refresh so a deactivated user/company
  // cannot keep minting access tokens.
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { company: true },
  });
  if (!user || !user.isActive || !user.company?.isActive) {
    throw new AppError('Your account has been deactivated. Contact administrator.', 403, 'ACCOUNT_DISABLED');
  }

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
