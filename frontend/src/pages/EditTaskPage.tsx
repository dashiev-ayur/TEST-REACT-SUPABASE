import { Typography, Paper, CircularProgress, Alert } from "@mui/material";
import { TaskForm } from "../components/TaskForm";

import { useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import { useTask } from "../common/hooks/useTasks";

export function EditTaskPage() {
  const { objectId, taskId } = useParams({
    from: "/_auth/_manager/objects_/$objectId/task/$taskId/edit",
  });
  const navigate = useNavigate();
  const { data: task, isLoading, isError } = useTask(taskId);
  const onBack = () => navigate({ to: `/objects/${objectId}/task/${taskId}` });

  if (isLoading) {
    return (
      <Layout>
        <CircularProgress />
      </Layout>
    );
  }

  if (isError || !task) {
    return (
      <Layout>
        <Alert severity="error">Задача не найдена или недоступна</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Редактирование задачи
      </Typography>

      <Paper sx={{ p: 3 }}>
        <TaskForm
          mode = 'edit'
          taskId={taskId}
          defaultValues={{
            title: task.title,
            description: task.description ?? "",
            assignee_id: task.assignee_id,
          }}
          objectId={objectId}
          onBack={onBack}
        />
      </Paper>
    </Layout>
  );
}
