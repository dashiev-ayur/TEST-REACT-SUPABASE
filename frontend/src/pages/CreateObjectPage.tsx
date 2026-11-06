import { Typography, Paper, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ObjectForm, type ObjectFormValues } from "../components/ObjectForm";
import { useCreateObject } from "../hooks/useObjects";

export function CreateObjectPage() {
  const navigate = useNavigate();
  const createMutation = useCreateObject();

  async function handleSubmit(values: ObjectFormValues) {
    await createMutation.mutateAsync({
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
        Новый объект
      </Typography>
      <Paper sx={{ p: 3 }}>
        <ObjectForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          errorMessage={
            createMutation.isError
              ? (createMutation.error as Error).message
              : null
          }
          submitLabel="Создать"
        />
      </Paper>
    </Box>
  );
}
