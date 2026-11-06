import { useParams, useNavigate } from "react-router-dom";
import { Typography, Paper, Box, CircularProgress, Alert } from "@mui/material";
import { ObjectForm, type ObjectFormValues } from "../components/ObjectForm";
import { useObject, useUpdateObject } from "../hooks/useObjects";

export function EditObjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: object, isLoading, isError } = useObject(id);
  const updateMutation = useUpdateObject();

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

  async function handleSubmit(values: ObjectFormValues) {
    await updateMutation.mutateAsync({
      id: object!.id,
      name: values.name,
      address: values.address || null,
    });
    navigate("/objects");
  }

  return (
    <Box>
      <Typography
        variant="h5"
        //  mb={2}
      >
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
    </Box>
  );
}
