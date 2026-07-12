import React, {useRef} from 'react';
import {View, type TextInput} from 'react-native';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';

import {Button, FormField} from '@/components/ui';
import {taskSchema} from '@/core/types/task';

import {DueDateField} from './DueDateField';

/**
 * Editable business-field schema for the shared task form (TSK-002, FR1) —
 * derived from `taskSchema` (the single source of truth for the `Task`
 * shape, patterns-registry.md -> "Persisted domain model") via `.pick`
 * rather than re-declared: `title` stays required + trimmed (F-034, and
 * reuses `taskSchema`'s own `'title is required'` message rather than a
 * second copy of it), `description` stays optional. `id`/`status`/
 * `createdAt`/`updatedAt` are deliberately NOT part of this form schema —
 * `taskRepository.upsertTask` mints/manages every one of those (FR5).
 *
 * **TSK-005:** `dueDate` joins the `.pick` set below — `taskSchema.dueDate`
 * is `z.string().datetime().optional()` already (STG), so this form now
 * boundary-validates it for free (FR4, gap f): a value only ever reaches
 * `onSubmit` as a full ISO datetime string or `undefined`, never a bare
 * date, because `DueDateField` (see its own doc comment) only ever produces
 * `.toISOString()` or `undefined` — a Zod failure here is structurally
 * unreachable, same "boundary validation" shape the RHF+Zod anchor
 * establishes for `title`.
 */
export const taskFormSchema = taskSchema.pick({title: true, description: true, dueDate: true});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface TaskFormProps {
  /** Empty for create (the default); TSK-003 seeds this from the record being edited. */
  defaultValues?: TaskFormValues;
  /** Invoked with schema-valid data only — see the boundary-validation note below. */
  onSubmit: (values: TaskFormValues) => void;
  /** Label for the form's own submit button (default: "Add task"). */
  submitLabel?: string;
}

const EMPTY_VALUES: TaskFormValues = {title: '', description: '', dueDate: undefined};
const DESCRIPTION_LINES = 4;

/**
 * TaskForm (TSK-002, FR1) — the shared, reusable task form: create
 * (`AddTaskScreen`, empty `defaultValues`) and edit (TSK-003's
 * `EditTaskScreen`, `defaultValues` seeded from the record) both render
 * this unchanged.
 *
 * Copies the PRO RHF + Zod anchor verbatim (patterns-registry.md -> "RHF +
 * Zod form pattern", reference: `ProfileSetupScreen`):
 * `useForm({resolver: zodResolver(schema), mode: 'onBlur'})` + one
 * `Controller` per RN `TextInput` + `handleSubmit(onValid)` so `onValid` —
 * and therefore the `onSubmit` prop — only ever receives schema-valid data
 * (STG coherence gap f: `taskRepository.upsertTask`'s throw-on-invalid
 * write path is structurally unreachable from this form). Inline errors
 * read from `formState.errors.<field>?.message` straight into `FormField`'s
 * `error` prop.
 *
 * **Duplicate-submit guard (F-035):** a local `hasSubmittedRef` (not just
 * RHF's `isSubmitting`) guards `onValid` against a same-JS-tick double-tap
 * racing ahead of the re-render that disables the submit `Button` — a
 * create/edit side-effect is not idempotent, so `isSubmitting` alone isn't
 * enough (same rationale as `ProfileSetupScreen`'s guard). It is never
 * reset back to `false` — correct here too, since a genuine submit always
 * leads the caller to navigate away (`AddTaskScreen`/`EditTaskScreen` both
 * `goBack()` on success), which unmounts this form.
 *
 * Renders its own submit `Button` (configurable via `submitLabel`) rather
 * than leaving it to each screen, so every consumer gets the boundary
 * validation + the double-submit guard for free instead of re-wiring them.
 */
export function TaskForm({
  defaultValues = EMPTY_VALUES,
  onSubmit,
  submitLabel = 'Add task',
}: TaskFormProps): React.JSX.Element {
  const descriptionInputRef = useRef<TextInput>(null);
  // See the doc comment above — guards a same-tick double-tap (F-035),
  // never reset after firing (the caller unmounts this form on success).
  const hasSubmittedRef = useRef(false);

  const {
    control,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  function onValid(values: TaskFormValues): void {
    if (hasSubmittedRef.current) {
      return;
    }
    hasSubmittedRef.current = true;
    onSubmit(values);
  }

  const handleFormSubmit = handleSubmit(onValid);

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="title"
        render={({field: {onChange, onBlur, value}}) => (
          <FormField
            label="Title"
            required
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message}
            placeholder="What needs doing?"
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => descriptionInputRef.current?.focus()}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({field: {onChange, onBlur, value}}) => (
          <FormField
            ref={descriptionInputRef}
            label="Description"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            placeholder="Add more detail (optional)"
            autoCapitalize="sentences"
            multiline
            numberOfLines={DESCRIPTION_LINES}
          />
        )}
      />

      {/* TSK-005 (FR2/FR3) — below Description, in the same gap-4 stack
          (design-system.md -> "TSK-005 — Due date field" -> "Where"). Not a
          `FormField`: a `Pressable` pair opening a native OS dialog has no
          text-input/error shape (that doc's own "Why not FormField" note).
          No `error` prop — FR4 makes an invalid value structurally
          unreachable (see this file's `taskFormSchema` doc comment). */}
      <Controller
        control={control}
        name="dueDate"
        render={({field: {onChange, value}}) => <DueDateField value={value} onChange={onChange} />}
      />

      <Button label={submitLabel} onPress={handleFormSubmit} loading={isSubmitting} />
    </View>
  );
}
