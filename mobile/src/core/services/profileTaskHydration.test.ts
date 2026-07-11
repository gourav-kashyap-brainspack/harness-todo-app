import {afterEach, describe, expect, it} from '@jest/globals';

import {createPersistedValue, StorageKeys} from '@/core/services/storage';
import {profileSchema, type Profile} from '@/core/types/profile';
import {taskListSchema, type Task} from '@/core/types/task';

/**
 * FR4 (hydration wiring, F-037) — proves the STG-001 `createPersistedValue`
 * recipe (documented on `storage.ts:createPersistedValue`) actually
 * composes end-to-end with the STG-002 Profile/Task schemas + the
 * `StorageKeys.profile`/`StorageKeys.tasks` entries this task adds.
 *
 * This is deliberately NOT a Zustand store — building one here would blur
 * the STG/PRO/TSK ownership boundary (spec FR4): STG proves the recipe
 * works with the real persisted shapes; PRO's `useProfileStore` and TSK's
 * `useTaskStore` each wire their own `create<State>(...)` around it
 * verbatim, the way the `storage.ts` doc comment shows for tasks.
 */
describe('hydration recipe (createPersistedValue) with the STG-002 domain schemas', () => {
  const profilePersistence = createPersistedValue(
    StorageKeys.profile,
    profileSchema.nullable(),
    null as Profile | null,
  );
  const tasksPersistence = createPersistedValue(StorageKeys.tasks, taskListSchema, [] as Task[]);

  afterEach(() => {
    profilePersistence.persist(null);
    tasksPersistence.persist([]);
  });

  it('profile: hydrate() falls back to null before any profile is persisted', () => {
    expect(profilePersistence.hydrate()).toBeNull();
  });

  it('profile: a value written via persist() is what a fresh hydrate() (a later "boot") sees', () => {
    const profile: Profile = {name: 'Ada Lovelace', email: 'ada@example.com'};

    profilePersistence.persist(profile);

    // A fresh handle over the same key models a new module-load ("boot").
    const rebooted = createPersistedValue(StorageKeys.profile, profileSchema.nullable(), null as Profile | null);
    expect(rebooted.hydrate()).toEqual(profile);
  });

  it('tasks: hydrate() falls back to [] before any task is persisted', () => {
    expect(tasksPersistence.hydrate()).toEqual([]);
  });

  it('tasks: a collection written via persist() is what a fresh hydrate() (a later "boot") sees', () => {
    const tasks: Task[] = [
      {
        id: '11edc52b-2918-4d71-9058-f7285e29d894',
        title: 'Buy milk',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    tasksPersistence.persist(tasks);

    const rebooted = createPersistedValue(StorageKeys.tasks, taskListSchema, [] as Task[]);
    expect(rebooted.hydrate()).toEqual(tasks);
  });
});
