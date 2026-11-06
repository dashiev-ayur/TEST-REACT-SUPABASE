import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { DbObject } from "../hooks/useObjects";
import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../stores/authStore";

interface Props {
  list: DbObject[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (obj: DbObject) => void;
  disableDelete: boolean;
}

const ObjectsList: React.FC<Props> = ({ list, onOpen, onEdit, onDelete, disableDelete }) => {
  const isManager = useSelector(authStore, selectIsManager);
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell>Создан</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Пока нет объектов
              </TableCell>
            </TableRow>
          )}
          {list?.map((obj) => (
            <TableRow key={obj.id} hover>
              <TableCell>
                <Button
                  variant="text"
                  onClick={() => onOpen(obj.id)}
                  sx={{
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {obj.name}
                </Button>
              </TableCell>
              <TableCell>{obj.address ?? "—"}</TableCell>
              <TableCell>
                {new Date(obj.created_at).toLocaleDateString("ru-RU")}
              </TableCell>
              <TableCell align="right">
                {isManager && (
                  <>
                    <Tooltip title="Редактировать">
                      <IconButton
                        onClick={() => onEdit(obj.id)}
                        size="small"
                        aria-label="Редактировать объект"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Удалить объект"
                          disabled={disableDelete}
                          onClick={()=>onDelete(obj)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
                <Tooltip title="Открыть">
                  <Button
                    size="small"
                    onClick={() => onOpen(obj.id)}
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

export default ObjectsList;
