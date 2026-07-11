import {z} from 'zod';

/**
 * Persisted Task schema (STG-002, F-036). Stored as a single `Task[]` blob
 * under `StorageKeys.tasks` (see `core/services/taskRepository.ts`).
 *
 * `id` is a `string` (uuid, generated via `core/lib/id.ts:newId`) — this is
 * load-bearing: it satisfies the FND coherence report's spec-gap (d), the
 * navigation `taskId: string` route-param contract already wired in
 * `src/app/navigation/types.ts`. Do NOT change this to a numeric id.
 *
 * This schema is the SINGLE source of truth for the Task shape (FR5) — TSK
 * imports `Task`/`taskSchema`/`taskListSchema` from here rather than
 * re-declaring the shape.
 */
export const taskStatusSchema = z.enum(['active', 'completed']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().optional(),
  status: taskStatusSchema,
  // "ISO date" in the spec is treated as the same full ISO-8601 timestamp
  // format `createdAt`/`updatedAt` use (`Date.prototype.toISOString()`
  // output, UTC `Z` suffix) rather than a bare `YYYY-MM-DD` — one date
  // format for the whole schema. A date-only picker in TSK's UI can
  // normalize to this by serializing via `.toISOString()`.
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof taskSchema>;

/** The persisted-collection schema — `taskRepository` reads/writes this. */
export const taskListSchema = z.array(taskSchema);
export type TaskList = z.infer<typeof taskListSchema>;
