import {describe, expect, it} from '@jest/globals';
import {format} from 'date-fns';

import {
  DUE_DATE_FORMAT_COMPACT,
  DUE_DATE_FORMAT_FULL,
  formatDueDateCompact,
  formatDueDateFull,
} from '@/core/lib/formatDueDate';

// A non-noon instant so the time segment is exercised too (not just the
// date), while still landing on the same calendar day across any real-world
// UTC offset (-11:00..+13:00) — same "stays deterministic on a developer
// machine and CI alike" rationale `TaskListItem.test.tsx`'s own fixture
// comment documents.
const ISO = '2026-07-15T15:30:00.000Z';

describe('formatDueDate (TSK-005 — the one due-date formatting util app-wide)', () => {
  it('formatDueDateCompact formats via date-fns using the canonical compact format string (no year)', () => {
    expect(DUE_DATE_FORMAT_COMPACT).toBe('MMM d, h:mm a');
    expect(formatDueDateCompact(ISO)).toBe(format(new Date(ISO), 'MMM d, h:mm a'));
  });

  it('formatDueDateFull formats via date-fns using the canonical full format string (with year)', () => {
    expect(DUE_DATE_FORMAT_FULL).toBe('MMM d, yyyy · h:mm a');
    expect(formatDueDateFull(ISO)).toBe(format(new Date(ISO), 'MMM d, yyyy · h:mm a'));
  });

  it('both variants carry the time (neither predecessor constant did)', () => {
    // A bare "h:mm a" pattern always contains a colon; assert one is present
    // in both outputs rather than a locale-specific literal.
    expect(formatDueDateCompact(ISO)).toMatch(/\d{1,2}:\d{2}\s?[AP]M/i);
    expect(formatDueDateFull(ISO)).toMatch(/\d{1,2}:\d{2}\s?[AP]M/i);
  });

  it('only the full variant includes the 4-digit year — the deliberate compact/full distinction', () => {
    expect(formatDueDateFull(ISO)).toContain('2026');
    expect(formatDueDateCompact(ISO)).not.toContain('2026');
  });

  it('formatDueDateFull is the same literal grammar as TaskDetailScreen\'s META_DATE_FORMAT ("MMM d, yyyy · h:mm a") — verified by format-string equality, not by importing the untouched constant', () => {
    expect(DUE_DATE_FORMAT_FULL).toBe('MMM d, yyyy · h:mm a');
  });
});
