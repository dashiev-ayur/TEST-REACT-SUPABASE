import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../stores/authStore";
import { useObject } from "../hooks/useObjects";
import { useTasksByObject } from "../hooks/useTasks";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import ObjectTasksList from "../components/ObjectTasksList";

export function ObjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/_auth/objects_/$id" });
  const isManager = useSelector(authStore, selectIsManager);
  const { data: object, isLoading, isError } = useObject(id);
  const { data: tasks, isLoading: tasksLoading } = useTasksByObject(id);

  const onBack = () => navigate({ to: `/objects` });
  const onCreate = () => navigate({ to: `/objects/${id}/tasks/new` });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError || !object) {
    return <Alert severity="error">Объект не найден или недоступен</Alert>;
  }

  return (
    <Layout>
      <Stack direction="column" spacing={2}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {object.name} / {object.address ?? "Адрес не указан"}
        </Typography>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 200 }}>
          Задачи на объекте
        </Typography>

        {tasksLoading ? (
          <CircularProgress size={24} />
        ) : (
          <ObjectTasksList
            list={tasks || []}
            onOpen={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        )}

        <Stack direction="row" spacing={2}>
          {isManager && (
            <Button onClick={onCreate} variant="contained">
              Создать задачу
            </Button>
          )}
          <Button onClick={onBack} variant="outlined">
            К объектам
          </Button>
        </Stack>
      </Stack>
    </Layout>
  );
}
