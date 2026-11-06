import { Typography, Paper } from "@mui/material";

import { ObjectForm, type ObjectFormValues } from "../components/ObjectForm";
import { useCreateObject } from "../hooks/useObjects";
import { useNavigate } from "@tanstack/react-router";
import { Layout } from "../layout/Layout";

export function CreateObjectPage() {
  const navigate = useNavigate();
  const createMutation = useCreateObject();

  async function handleSubmit(values: ObjectFormValues) {
    await createMutation.mutateAsync({
      name: values.name,
      address: values.address || null,
    });
    navigate({ to: "/objects" });
  }

  return (
    <Layout>
      <Typography
        variant="h5"
        sx={{mb: 2}}
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
    </Layout>
  );
}
