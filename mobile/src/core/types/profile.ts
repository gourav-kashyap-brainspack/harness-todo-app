import {z} from 'zod';

/**
 * Persisted Profile schema (STG-002, F-006). One profile per device, stored
 * under `StorageKeys.profile` (see `core/services/profileRepository.ts`).
 *
 * Both `name` and `email` are REQUIRED (OQ-2, resolved at `/module STG`) —
 * profile setup is not considered complete with either missing. `photo` is
 * an optional local file-uri string; STG only persists the string, PRO owns
 * the image-picker/permission flow that produces it (see spec "Platform
 * divergence").
 *
 * This schema is the SINGLE source of truth for the Profile shape (FR5) —
 * PRO imports `Profile`/`profileSchema` from here rather than re-declaring
 * the shape.
 */
export const profileSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.string().trim().email('a valid email is required'),
  photo: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
