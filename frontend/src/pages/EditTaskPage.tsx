import { Typography, Paper, Box, CircularProgress, Alert } from "@mui/material";
import { TaskForm, type TaskFormValues } from "../components/TaskForm";
import { useTask, useUpdateTask } from "../hooks/useTasks";
import { useNavigate, useParams } from "@tanstack/react-router";

export function EditTaskPage() {
  const { id } = useParams({ from: "/_auth/tasks/$id" });
  const navigate = useNavigate();
  const { data: task, isLoading, isError } = useTask(id);
  const updateMutation = useUpdateTask();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError || !task) {
    return <Alert severity="error">Задача не найдена или недоступна</Alert>;
  }

  async function handleSubmit(values: TaskFormValues) {
    if (!task) return;
    await updateMutation.mutateAsync({
      id: task.id,
      title: values.title,
      description: values.description || null,
      assignee_id: values.assignee_id,
    });
    navigate({ to: `/tasks/${task.id}` });
  }

  return (
    <Box>
      <Typography variant="h5">Редактирование задачи</Typography>
      <Paper sx={{ p: 3 }}>
        <TaskForm
          defaultValues={{
            title: task.title,
            description: task.description ?? "",
            assignee_id: task.assignee_id,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          errorMessage={
            updateMutation.isError
              ? (updateMutation.error as Error).message
              : null
          }
          submitLabel="Сохранить"
        />
      </Paper>
    </Box>
  );
}
