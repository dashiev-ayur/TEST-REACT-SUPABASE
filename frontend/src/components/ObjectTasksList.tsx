import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { DbTask, TaskStatus } from "../hooks/useTasks";

interface Props {
  list: DbTask[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (obj: DbTask) => void;
}

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

const ObjectTasksList: React.FC<Props> = ({
  list, 
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Создана</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                Задач пока нет
              </TableCell>
            </TableRow>
          )}
          {list?.map((task) => (
            <TableRow
              key={task.id}
              hover
              // to={`/tasks/${task.id}`}
              sx={{ textDecoration: "none", cursor: "pointer" }}
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
              <TableCell>
                Открыть
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ObjectTasksList;
