import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import type { DbTask } from "../common/entities";
import { STATUS_COLOR, STATUS_LABEL } from "../common/types/status";

interface Props {
  list: DbTask[];
  onTaskOpen: (task:DbTask) => void;
}

const ObjectTasksList: React.FC<Props> = ({
  list, 
  onTaskOpen,
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
                <Tooltip title="Открыть">
                  <Button
                    size="small"
                    onClick={() => onTaskOpen(task)}
                    sx={{ ml: 1 }}
                  >
                    Открыть
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ObjectTasksList;
