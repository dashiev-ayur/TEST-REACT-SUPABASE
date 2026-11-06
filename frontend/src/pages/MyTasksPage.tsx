import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useMyTasks, type TaskStatus } from "../hooks/useTasks";
import { useNavigate } from "@tanstack/react-router";

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

export function MyTasksPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyTasks();

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isError)
    return <Alert severity="error">Не удалось загрузить задачи</Alert>;

  return (
    <Box>
      <Typography variant="h5">Мои задачи</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Создана</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Задач нет
                </TableCell>
              </TableRow>
            )}
            {data?.map((task) => (
              <TableRow
                key={task.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate({ to: `/tasks/${task.id}` })}
              >
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={STATUS_LABEL[task.status]}
                    color={STATUS_COLOR[task.status]}
                  />
                </TableCell>
                <TableCell>
                  {new Date(task.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
