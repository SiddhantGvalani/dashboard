import { z } from 'zod';
import { createEndpoint, Projects } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get all projects from the database',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      sheetId: z.string(),
      sheetName: z.string(),
      serviceAccountJson: z.string(),
      startRow: z.number(),
      createdAt: z.number(),
    })),
  }),
  execute: async () => {
    const { records } = await Projects.findAll({});
    return {
      projects: records
        .map(p => ({
          id: p.id,
          name: p.name ?? '',
          sheetId: p.sheetId ?? '',
          sheetName: p.sheetName ?? '',
          serviceAccountJson: p.serviceAccountJson ?? '',
          startRow: p.startRow ?? 2,
          createdAt: p.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
        }))
        .sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});
