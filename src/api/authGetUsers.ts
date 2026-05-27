import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get all users — admin only (role-based)',
  inputSchema: z.object({ requesterEmail: z.string() }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    users: z.array(z.object({
      id: z.string(),
      email: z.string(),
      fullName: z.string(),
      mobile: z.string(),
      role: z.string(),
      status: z.string(),
      createdAt: z.string(),
    })),
  }),
  execute: async ({ input }) => {
    // Role-based admin check (supports multiple admins)
    const requester = await Users.findOne({ filters: { email: input.requesterEmail.toLowerCase() } });
    if (!requester || requester.role !== 'Admin') {
      return { success: false, error: 'Unauthorized', users: [] };
    }

    const { records } = await Users.findAll({});
    return {
      success: true,
      users: records.map(u => ({
        id: u.id,
        email: u.email ?? '',
        fullName: u.fullName ?? '',
        mobile: u.mobile ?? '',
        role: (u.role ?? 'User').toLowerCase(),
        status: (u.status ?? 'Active').toLowerCase(),
        createdAt: u.createdAt ?? '',
      })),
    };
  },
});
