import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Check if a user exists by email or mobile',
  inputSchema: z.object({ identifier: z.string() }),
  outputSchema: z.object({ found: z.boolean() }),
  execute: async ({ input }) => {
    let user = await Users.findOne({ filters: { email: input.identifier.toLowerCase() } });
    if (!user) user = await Users.findOne({ filters: { mobile: input.identifier } });
    return { found: !!user };
  },
});
