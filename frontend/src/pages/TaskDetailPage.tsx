import {
  Box,
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
import { authStore, selectIsManager } from "../stores/authStore";
import {
  useTask,
  useTaskHistory,
  useDeleteTask,
  type TaskStatus,
} from "../hooks/useTasks";
import { Link, useNavigate, useParams } from "@tanstack/react-router";

const STATUS_LABEL: Record<TaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  on_review: "На проверке",
  accepted: "Принята",
  needs_rework: "На доработке",
};

const STATUS_COLOR: Record<
  TaskStatus,
  "default" | "info" | "warning" | "success" | "error"
> = {
  new: "default",
  in_progress: "info",
  on_review: "warning",
  accepted: "success",
  needs_rework: "error",
};

export function TaskDetailPage() {
  const { id } = useParams({ from: "/_auth/tasks/$id" });
  const navigate = useNavigate();
  const isManager = useSelector(authStore, selectIsManager);
  const { data: task, isLoading, isError } = useTask(id);
  const { data: history } = useTaskHistory(id);
  const deleteMutation = useDeleteTask();

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
    <Box>
      <Stack direction="row">
        <Box>
          <Typography variant="h5">{task.title}</Typography>
          <Stack direction="row">
            <Chip
              size="small"
              label={STATUS_LABEL[task.status]}
              color={STATUS_COLOR[task.status]}
            />
            <Typography variant="body2" color="text.secondary">
              Создана {new Date(task.created_at).toLocaleDateString("ru-RU")}
            </Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to={`/objects/${task.object_id}`}
            variant="outlined"
          >
            К объекту
          </Button>
          {isManager && (
            <>
              <Button
                component={Link}
                to={`/tasks/${task.id}/edit`}
                variant="outlined"
              >
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Описание
        </Typography>
        <Typography sx={{ whiteSpace: "pre-wrap" }}>
          {task.description || "—"}
        </Typography>
      </Paper>

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
    </Box>
  );
}
