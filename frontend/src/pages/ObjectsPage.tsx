import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import { useSelector } from "@tanstack/react-store";
import { authStore, selectIsManager } from "../common/stores/authStore";
import {
  useObjects,
  useDeleteObject,
  type DbObject,
} from "../common/hooks/useObjects";
import { useNavigate } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import ObjectsList from "../components/ObjectsList";

export function ObjectsPage() {
  const navigate = useNavigate();
  const isManager = useSelector(authStore, selectIsManager);

  const { data, isLoading, isError, error } = useObjects();

  const deleteMutation = useDeleteObject();

  const onCreate = () => navigate({ to: "/objects/new" });
  const onOpen = (id: string) => navigate({ to: `/objects/${id}` });
  const onEdit = (id: string) => navigate({ to: `/objects/edit/${id}` });
  const onDelete = (obj: DbObject) => {
    if (confirm(`Удалить «${obj.name}»?`)) {
      deleteMutation.mutate(obj.id);
    }
  };

  return (
    <Layout>
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Alert severity="error">
          Ошибка загрузки: {(error as Error).message}
        </Alert>
      )}

      {!isLoading && !isError && (
        <Stack direction="column" spacing={2}>
          <Typography variant="h5">Объекты</Typography>

          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Не удалось удалить объект:{" "}
              {(deleteMutation.error as Error).message}
            </Alert>
          )}

          <ObjectsList
            list={data || []}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            disableDelete={deleteMutation.isPending}
          />

          {isManager && (
            <Button
              variant="contained"
              onClick={onCreate}
              sx={{ width: "200px" }}
            >
              Создать объект
            </Button>
          )}
        </Stack>
      )}
    </Layout>
  );
}
