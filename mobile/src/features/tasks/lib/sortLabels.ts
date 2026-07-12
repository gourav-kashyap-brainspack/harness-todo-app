import type {TaskSortKey} from '../store/taskQueryStore';

/**
 * The single source for every `TaskSortKey`'s display string (ORG-003,
 * F-026–029, design-system.md → "ORG-003 — Sort control"). Consumed by BOTH
 * the sort trigger's dynamic `accessibilityLabel` ("Sort tasks, currently
 * <label>") and the sort `ActionSheet`'s own option labels, so the trigger
 * and the menu can never drift into two different names for the same key —
 * the same "one canonical string, two consumers" discipline
 * `core/lib/formatDueDate.ts` already established for date formatting.
 */
export const SORT_LABELS: Record<TaskSortKey, string> = {
  due: 'Due date',
  'created-desc': 'Creation date',
  alpha: 'Alphabetical',
  updated: 'Recently updated',
};
