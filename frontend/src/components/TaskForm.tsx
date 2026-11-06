import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import {
  Box, TextField, Button, Stack, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
} from '@mui/material'
import { useExecutors } from '../hooks/useProfiles'

const taskSchema = z.object({
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional(),
  assignee_id: z.string().min(1, 'Выберите исполнителя'),
})

export type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  isSubmitting?: boolean
  errorMessage?: string | null
  submitLabel?: string
}

export function TaskForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel = 'Сохранить',
}: TaskFormProps) {
  const { data: executors, isLoading: executorsLoading } = useExecutors()

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      assignee_id: defaultValues?.assignee_id ?? '',
    } as TaskFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Box
      component="form"
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}
    >
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      <Stack spacing={2}>
        <form.Field name="title" validators={{ onChange: taskSchema.shape.title }}>
          {(field) => (
            <TextField
              label="Название"
              fullWidth
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched && !!field.state.meta.errors.length}
              helperText={field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined}
              disabled={isSubmitting}
            />
          )}
        </form.Field>

        <form.Field name="description" validators={{ onChange: taskSchema.shape.description }}>
          {(field) => (
            <TextField
              label="Описание"
              fullWidth
              multiline
              minRows={3}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
            />
          )}
        </form.Field>

        <form.Field name="assignee_id" validators={{ onChange: taskSchema.shape.assignee_id }}>
          {(field) => (
            <FormControl fullWidth error={field.state.meta.isTouched && !!field.state.meta.errors.length}>
              <InputLabel>Исполнитель</InputLabel>
              <Select
                label="Исполнитель"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isSubmitting || executorsLoading}
              >
                {executors?.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>{ex.full_name}</MenuItem>
                ))}
              </Select>
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FormHelperText>{field.state.meta.errors[0]?.message}</FormHelperText>
              )}
            </FormControl>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, formSubmitting]) => (
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit || formSubmitting || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
            >
              {submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </Box>
  )
}