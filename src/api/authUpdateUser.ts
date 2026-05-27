import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Enable, disable, delete, or change role of a user — admin only (role-based)',
  inputSchema: z.object({
    requesterEmail: z.string(),
    userId: z.string(),
    action: z.enum(['enable', 'disable', 'delete', 'makeAdmin', 'removeAdmin']),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ input }) => {
    // Role-based admin check (supports multiple admins)
    const requester = await Users.findOne({ filters: { email: input.requesterEmail.toLowerCase() } });
    if (!requester || requester.role !== 'Admin') {
      return { success: false, error: 'Unauthorized' };
    }

    if (input.action === 'delete') {
      await Users.delete({ id: input.userId });
    } else if (input.action === 'makeAdmin') {
      await Users.update({ id: input.userId, record: { role: 'Admin' } });
    } else if (input.action === 'removeAdmin') {
      await Users.update({ id: input.userId, record: { role: 'User' } });
    } else {
      await Users.update({
        id: input.userId,
        record: { status: input.action === 'enable' ? 'Active' : 'Disabled' },
      });
    }

    return { success: true };
  },
});
