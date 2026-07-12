import {useCallback, useState} from 'react';

import type {Task} from '@/core/types/task';

import {useTaskStore} from '../store/taskStore';

export interface UseTaskActionsResult {
  /** The task the "..." actions menu is currently open for, or `null` when closed. */
  menuTask: Task | null;
  /** Opens the actions menu for `task` (also closes any open delete-confirm — never two sheets stacked). */
  openMenu: (task: Task) => void;
  /** Closes the actions menu without taking any action — wire to `ActionSheet.onClose` (backdrop tap / built-in Cancel). */
  closeMenu: () => void;
  /** The task pending deletion, or `null` when the confirm sheet is closed. */
  deleteTarget: Task | null;
  /** Opens the delete-confirm sheet for `task` (closes the actions menu first). */
  requestDelete: (task: Task) => void;
  /** Closes the confirm sheet without deleting — wire to `ActionSheet.onClose` (F-012's "Cancel -> no-op"). */
  cancelDelete: () => void;
  /**
   * Confirms: removes `deleteTarget` via the single `taskStore`, closes the
   * sheet, then (when supplied) calls `onDeleteConfirmed` with the removed
   * task. A harmless no-op if nothing is pending deletion.
   */
  confirmDelete: () => void;
}

/**
 * useTaskActions (TSK-004, F-011-F-015) — the one row/detail lifecycle-action
 * state machine, shared verbatim by `HomeScreen` and `TaskDetailScreen`
 * (design-system.md -> "TSK-004 - Task lifecycle actions": "one coherent
 * affordance model ... reused identically" on both screens). Each screen
 * calls this hook once and composes its OWN `ActionSheet` options array
 * around the shared `menuTask`/`deleteTarget` state below — Home's row menu
 * has 4 options (toggle/Edit/Duplicate/Delete), Detail's menu has only 2
 * (Duplicate/Delete — Toggle and Edit already have dedicated controls
 * there), per the design spec's "same mechanism, different content" note.
 *
 * Only `removeTask` is wrapped here — `toggleStatus`/`duplicateTask` stay
 * one-line calls at each call site (`useTaskStore(state => state.xyz)`,
 * called directly, never duplicated into this hook) because they need no
 * shared UI state, only delete does: F-012 requires delete to ALWAYS pass
 * through the confirm sheet first, so this hook is the one place that can
 * enforce "no `removeTask` call without first landing on `deleteTarget`".
 *
 * Coherence: reads/writes only the single `useTaskStore` (check 3); never
 * recomputes `updatedAt` (check 2 — that stays inside `taskRepository`,
 * untouched here).
 */
export function useTaskActions(onDeleteConfirmed?: (task: Task) => void): UseTaskActionsResult {
  const removeTask = useTaskStore(state => state.removeTask);

  const [menuTask, setMenuTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const openMenu = useCallback((task: Task) => {
    setDeleteTarget(null);
    setMenuTask(task);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuTask(null);
  }, []);

  const requestDelete = useCallback((task: Task) => {
    setMenuTask(null);
    setDeleteTarget(task);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) {
      return;
    }
    const task = deleteTarget;
    removeTask(task.id);
    setDeleteTarget(null);
    onDeleteConfirmed?.(task);
  }, [deleteTarget, onDeleteConfirmed, removeTask]);

  return {menuTask, openMenu, closeMenu, deleteTarget, requestDelete, cancelDelete, confirmDelete};
}
