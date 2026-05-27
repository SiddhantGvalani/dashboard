import { z } from 'zod';
import { createEndpoint, Projects } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Create or update a project',
  inputSchema: z.object({
    id: z.string().optional(),
    name: z.string(),
    sheetId: z.string(),
    sheetName: z.string(),
    serviceAccountJson: z.string(),
    startRow: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string(),
  }),
  execute: async ({ input }) => {
    if (input.id) {
      await Projects.update({
        id: input.id,
        record: {
          name: input.name,
          sheetId: input.sheetId,
          sheetName: input.sheetName,
          serviceAccountJson: input.serviceAccountJson,
          startRow: input.startRow ?? 2,
        },
      });
      return { success: true, id: input.id };
    } else {
      const created = await Projects.create({
        record: {
          name: input.name,
          sheetId: input.sheetId,
          sheetName: input.sheetName,
          serviceAccountJson: input.serviceAccountJson,
          startRow: input.startRow ?? 2,
          createdAt: new Date().toISOString(),
        },
      });
      return { success: true, id: created.id };
    }
  },
});
