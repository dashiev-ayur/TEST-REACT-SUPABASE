import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { useExecutors } from "../common/hooks/useProfiles";
import { useCreateTask, useUpdateTask } from "../common/hooks/useTasks";

const taskSchema = z.object({
  title: z.string().min(1, "Укажите название"),
  description: z.string().optional(),
  assignee_id: z.string().min(1, "Выберите исполнителя"),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  mode: "add" | "edit";
  taskId?: string | null;
  defaultValues?: Partial<TaskFormValues>;
  objectId: string;
  onBack: () => void;
}

export function TaskForm({
  mode,
  taskId = null,
  defaultValues,
  objectId,
  onBack,
}: TaskFormProps) {
  const { data: executors, isLoading: executorsLoading } = useExecutors();

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      assignee_id: defaultValues?.assignee_id ?? "",
    } as TaskFormValues,
    onSubmit: async ({ value }) => {
      await handleSubmit(value);
    },
  });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  async function handleSubmit(values: TaskFormValues) {
    if (!objectId) return;
    if (mode === "add") {
      await createMutation.mutate(
        {
          title: values.title,
          description: values.description || null,
          object_id: objectId,
          assignee_id: values.assignee_id,
        },
        {
          onSuccess: () => onBack(),
        },
      );
    }
    if (mode === "edit" && taskId !== null) {
      await updateMutation.mutate(
        {
          id: taskId,
          title: values.title,
          description: values.description || null,
        },
        {
          onSuccess: () => onBack(),
        },
      );
    }
  }

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(createMutation.error as Error).message}
        </Alert>
      )}

      <Stack spacing={2}>
        <form.Field
          name="title"
          validators={{ onChange: taskSchema.shape.title }}
        >
          {(field) => (
            <TextField
              label="Название"
              fullWidth
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={
                field.state.meta.isTouched && !!field.state.meta.errors.length
              }
              helperText={
                field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined
              }
              disabled={createMutation.isPending}
            />
          )}
        </form.Field>

        <form.Field
          name="description"
          validators={{ onChange: taskSchema.shape.description }}
        >
          {(field) => (
            <TextField
              label="Описание"
              fullWidth
              multiline
              minRows={3}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={createMutation.isPending}
            />
          )}
        </form.Field>

        <form.Field
          name="assignee_id"
          validators={{ onChange: taskSchema.shape.assignee_id }}
        >
          {(field) => (
            <FormControl
              fullWidth
              error={
                field.state.meta.isTouched && !!field.state.meta.errors.length
              }
            >
              <InputLabel>Исполнитель</InputLabel>
              <Select
                label="Исполнитель"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={createMutation.isPending || executorsLoading}
              >
                {executors?.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.full_name}
                  </MenuItem>
                ))}
              </Select>
              {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 && (
                  <FormHelperText>
                    {field.state.meta.errors[0]?.message}
                  </FormHelperText>
                )}
            </FormControl>
          )}
        </form.Field>

        <Stack direction="row" spacing={2}>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, formSubmitting]) => (
              <Button
                type="submit"
                variant="contained"
                disabled={
                  !canSubmit || formSubmitting || createMutation.isPending
                }
                startIcon={
                  createMutation.isPending ? (
                    <CircularProgress size={18} />
                  ) : undefined
                }
              >
                {mode === "add" ? "Добавить задачу" : "Сохранить задачу"}
              </Button>
            )}
          </form.Subscribe>
          <Button onClick={onBack}>Назад</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
