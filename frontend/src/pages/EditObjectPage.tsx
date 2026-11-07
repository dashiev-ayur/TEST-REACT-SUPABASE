import { Typography, Paper, Box, CircularProgress, Alert } from "@mui/material";
import { ObjectForm, type ObjectFormValues } from "../components/ObjectForm";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";
import { useObject, useUpdateObject } from "../common/hooks/useObjects";

export function EditObjectPage() {
  const { id } = useParams({ from: "/_auth/_manager/objects/edit/$id" });
  const navigate = useNavigate();
  const { data: object, isLoading, isError } = useObject(id);
  const updateMutation = useUpdateObject();

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isError || !object)
    return <Alert severity="error">Объект не найден или недоступен</Alert>;

  async function handleSubmit(values: ObjectFormValues) {
    if (!object) return;
    await updateMutation.mutateAsync({
      id: object.id,
      name: values.name,
      address: values.address || null,
    });
    navigate({ to: "/objects" });
  }

  return (
    <Layout>
      <Typography variant="h5" sx={{ pb: 2 }}>
        Редактирование объекта
      </Typography>
      <Paper sx={{ p: 3 }}>
        <ObjectForm
          defaultValues={{ name: object.name, address: object.address ?? "" }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          errorMessage={
            updateMutation.isError
              ? (updateMutation.error as Error).message
              : null
          }
          submitLabel="Сохранить"
        />
      </Paper>
    </Layout>
  );
}
