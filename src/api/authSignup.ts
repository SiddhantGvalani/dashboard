import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

const ADMIN_EMAIL = 'sohailbuwaji31@gmail.com';

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}

export default createEndpoint({
  description: 'Register a new user account',
  inputSchema: z.object({
    email: z.string().email(),
    fullName: z.string(),
    mobile: z.string(),
    password: z.string().min(6),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      fullName: z.string(),
      mobile: z.string(),
      role: z.string(),
    }).optional(),
  }),
  execute: async ({ input }) => {
    const emailLower = input.email.toLowerCase();

    const existing = await Users.findOne({ filters: { email: emailLower } });
    if (existing) return { success: false, error: 'An account with this email already exists.' };

    const existingMobile = await Users.findOne({ filters: { mobile: input.mobile } });
    if (existingMobile) return { success: false, error: 'An account with this mobile number already exists.' };

    const role = emailLower === ADMIN_EMAIL ? 'Admin' : 'User';
    const created = await Users.create({
      record: {
        email: emailLower,
        fullName: input.fullName,
        mobile: input.mobile,
        passwordHash: hashPassword(input.password),
        role,
        status: 'Active',
        createdAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      user: {
        id: created.id,
        email: created.email ?? '',
        fullName: created.fullName ?? '',
        mobile: created.mobile ?? '',
        role: (created.role ?? 'User').toLowerCase(),
      },
    };
  },
});
