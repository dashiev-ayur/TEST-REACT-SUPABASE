import {
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../common/stores/authStore";
import {
  useTask,
  useTaskHistory,
  useDeleteTask,
} from "../common/hooks/useTasks";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import { useObject } from "../common/hooks/useObjects";
import { STATUS_COLOR, STATUS_LABEL } from "../common/types/status";
import NextStatus from "../components/NextStatus";
import { useProfile } from "../common/hooks/useProfiles";

export function TaskDetailPage() {
  const { objectId, taskId } = useParams({
    from: "/_auth/objects_/$objectId/task/$taskId",
  });
  const navigate = useNavigate();
  const isManager = useSelector(authStore, selectIsManager);

  const { data: object } = useObject(objectId);
  const { data: task, isLoading, isError } = useTask(taskId);

  const {data: manager } = useProfile(task?.author_id);
  const {data: executor } = useProfile(task?.assignee_id);

  const { data: history } = useTaskHistory(taskId);
  const deleteMutation = useDeleteTask();

  const toObject = () => navigate({ to: `/objects/${objectId}` });
  const toEdit = () =>
    navigate({ to: `/objects/${objectId}/task/${taskId}/edit` });

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

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;
    await deleteMutation.mutateAsync({
      id: task.id,
      object_id: task.object_id,
    });
    navigate({ to: `/objects/${task.object_id}` });
  }

  return (
    <Layout>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={2}>
          <Typography variant="h5">
            {object?.name} / {object?.address}
          </Typography>
          <Chip
            size="medium"
            label={STATUS_LABEL[task.status]}
            sx={{ background: STATUS_COLOR[task.status], color: "#fff" }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Создана {new Date(task.created_at).toLocaleDateString("ru-RU")}<br/>
          Менеджер: {manager?.full_name} [{manager?.email}]<br/>
          Ответственный исполнитель: {executor?.full_name} [{executor?.email}]
        </Typography>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {task.title}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {task.description || "—"}
          </Typography>
        </Paper>


        <NextStatus task={task} />

        {/* Здесь вы добавите кнопки смены статуса через RPC change_task_status */}

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">История статусов</Typography>
          <List dense>
            {history?.length === 0 && (
              <ListItem>
                <ListItemText primary="История пуста" />
              </ListItem>
            )}
            {history?.map((h) => (
              <ListItem key={h.id} divider>
                <ListItemText
                  primary={`${h.from_status ? STATUS_LABEL[h.from_status] : "—"} → ${STATUS_LABEL[h.to_status]}`}
                  secondary={
                    <>
                      {new Date(h.created_at).toLocaleString("ru-RU")}
                      {h.comment && <> · {h.comment}</>}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Stack direction="row" spacing={2}>
          <Button onClick={toObject} variant="outlined">
            К объекту
          </Button>

          {isManager && (
            <>
              <Button onClick={toEdit} variant="outlined">
                Редактировать
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                Удалить
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Layout>
  );
}
