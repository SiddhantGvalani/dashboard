import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}

export default createEndpoint({
  description: 'Login with email/mobile and password',
  inputSchema: z.object({
    identifier: z.string(),
    password: z.string(),
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
    let user = await Users.findOne({ filters: { email: input.identifier.toLowerCase() } });
    if (!user) {
      user = await Users.findOne({ filters: { mobile: input.identifier } });
    }

    if (!user) return { success: false, error: 'No account found with this email or mobile number.' };
    if (user.status === 'Disabled') return { success: false, error: 'Your account has been disabled. Please contact the admin.' };

    if (user.passwordHash !== hashPassword(input.password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email ?? '',
        fullName: user.fullName ?? '',
        mobile: user.mobile ?? '',
        role: (user.role ?? 'User').toLowerCase(),
      },
    };
  },
});
