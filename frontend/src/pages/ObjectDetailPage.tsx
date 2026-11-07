import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../common/stores/authStore";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import ObjectTasksList from "../components/ObjectTasksList";
import { useObject } from "../common/hooks/useObjects";
import { useTasksByObject } from "../common/hooks/useTasks";
import type { DbTask } from "../common/entities";

export function ObjectDetailPage() {
  const navigate = useNavigate();
  const { id: objectId } = useParams({ from: "/_auth/objects_/$id" });
  const isManager = useSelector(authStore, selectIsManager);
  const { data: object, isLoading, isError } = useObject(objectId);
  const { data: tasks, isLoading: tasksLoading } = useTasksByObject(objectId);

  const onBack = () => navigate({ to: `/objects` });
  const onCreate = () => navigate({ to: `/objects/${objectId}/tasks/new` });
  const onTaskOpen = (task: DbTask) =>
    navigate({ to: `/objects/${task.object_id}/task/${task.id}` });

  return (
    <Layout>
      <Stack direction="column" spacing={2}>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {isError && !isLoading ||
          (!object && (
            <Alert severity="error">Объект не найден или недоступен</Alert>
          ))}

        {!isLoading && !isError && object && (
          <>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {object.name} / {object.address ?? "Адрес не указан"}
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 200 }}>
              Задачи на объекте
            </Typography>

            {tasksLoading ? (
              <CircularProgress size={24} />
            ) : (
              <ObjectTasksList list={tasks || []} onTaskOpen={onTaskOpen} />
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
          </>
        )}
      </Stack>
    </Layout>
  );
}
