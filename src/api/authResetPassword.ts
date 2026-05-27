import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}

export default createEndpoint({
  description: 'Reset user password by identifier',
  inputSchema: z.object({
    identifier: z.string(),
    newPassword: z.string().min(6),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ input }) => {
    let user = await Users.findOne({ filters: { email: input.identifier.toLowerCase() } });
    if (!user) user = await Users.findOne({ filters: { mobile: input.identifier } });
    if (!user) return { success: false, error: 'No account found.' };

    await Users.update({ id: user.id, record: { passwordHash: hashPassword(input.newPassword) } });
    return { success: true };
  },
});
