import {format} from 'date-fns';

/**
 * TSK-005 — the ONE due-date formatting util app-wide
 * (design-system.md -> "Canonical due-date format", TSK-005 subsection).
 * Two deliberately different, RECONCILED variants (not one shared string):
 * `formatDueDateCompact` for the space-constrained `TaskListItem` row,
 * `formatDueDateFull` for the roomy single-record contexts (
 * `TaskDetailScreen`'s due-date row and `TaskForm`'s due-date trigger).
 * Consolidates what were three disagreeing per-file constants
 * (`TaskListItem.tsx`'s old `'MMM d'`, `TaskDetailScreen.tsx`'s old
 * `'MMM d, yyyy'`, both with no time — plus this task's new trigger, which
 * would otherwise have invented a fourth) into one shared, named source of
 * truth. Both variants now also carry the time (neither predecessor did) —
 * the picker is date+time per FR2, so hiding the time would make picking
 * one invisible.
 *
 * **Placement note (deliberate divergence from the design spec's literal
 * path):** the design spec names `features/tasks/lib/formatDueDate.ts`.
 * That path is unreachable from `TaskListItem` — `TaskListItem` lives in
 * `src/components/ui` (the `components` boundary element), and
 * `eslint-plugin-boundaries`' enforced layer direction only allows
 * `components -> core|components|theme|platform`, never `components ->
 * feature` (`.eslintrc.js`'s `boundaries/dependencies` policy; a hard
 * `--max-warnings=0` lint failure). Since this util must be reachable from
 * BOTH `components/ui/TaskListItem.tsx` and `features/tasks/**`, `core/lib`
 * (the one layer both sides may depend on) is the correct home under the
 * app's existing enforced architecture — same shape as `core/lib/id.ts`
 * (a cross-cutting util both layers reach for). Every other part of the
 * design spec's ruling (the two constants, the two function bodies, the
 * "one util, no scattered per-file format constant" outcome) is implemented
 * verbatim.
 */
export const DUE_DATE_FORMAT_COMPACT = 'MMM d, h:mm a'; // e.g. "Jul 15, 3:30 PM"
export const DUE_DATE_FORMAT_FULL = 'MMM d, yyyy · h:mm a'; // e.g. "Jul 15, 2026 · 3:30 PM"

/** List-row due-date caption (`TaskListItem`) — space-constrained, no year. */
export function formatDueDateCompact(iso: string): string {
  return format(new Date(iso), DUE_DATE_FORMAT_COMPACT);
}

/**
 * Full-record due-date display (`TaskDetailScreen`'s due-date row, and
 * `TaskForm`'s due-date trigger once a value is set) — unambiguous, with
 * year. Deliberately the same literal format string as
 * `TaskDetailScreen`'s existing `META_DATE_FORMAT` (one "full timestamp"
 * grammar app-wide) but kept a SEPARATE named constant — `META_DATE_FORMAT`
 * formats record metadata (created/updated), a different semantic concern,
 * and stays untouched by this task.
 */
export function formatDueDateFull(iso: string): string {
  return format(new Date(iso), DUE_DATE_FORMAT_FULL);
}
