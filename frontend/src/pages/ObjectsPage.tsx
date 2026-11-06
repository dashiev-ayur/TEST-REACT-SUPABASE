import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../stores/authStore";
import { useObjects, useDeleteObject } from "../hooks/useObjects";

export function ObjectsPage() {
  const isManager = useSelector(authStore, selectIsManager)
  const { data, isLoading, isError, error } = useObjects();
  const deleteMutation = useDeleteObject();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Ошибка загрузки: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        // justifyContent="space-between"
        // alignItems="center"
        // mb={2}
      >
        <Typography variant="h5">Объекты</Typography>
        {isManager && (
          <Button variant="contained" component={RouterLink} to="/objects/new">
            Создать объект
          </Button>
        )}
      </Stack>

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
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Пока нет объектов
                </TableCell>
              </TableRow>
            )}
            {data?.map((obj) => (
              <TableRow key={obj.id}>
                <TableCell>{obj.name}</TableCell>
                <TableCell>{obj.address ?? "—"}</TableCell>
                <TableCell>
                  {new Date(obj.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    component={RouterLink}
                    to={`/objects/${obj.id}/edit`}
                    size="small"
                  >
                    ✏️
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Удалить «${obj.name}»?`)) {
                        deleteMutation.mutate(obj.id);
                      }
                    }}
                  >
                    🗑️
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
