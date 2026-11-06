import { Typography, Paper, Stack } from "@mui/material";
import { TaskForm } from "../components/TaskForm";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useObject } from "../hooks/useObjects";
import { Layout } from "../layout/Layout";

export function CreateTaskPage() {
  const navigate = useNavigate();
  const { id: objectId } = useParams({
    from: "/_auth/_manager/objects_/$id/tasks/new",
  });
  
  const { data: object } = useObject(objectId);

  const onBack = () => navigate({to: `/objects/${objectId}`})

  return (
    <Layout>
      <Stack direction="column" spacing={2}>
        <Typography variant="h5">
          {object?.name} / {object?.address || "-"} / Новая задача
        </Typography>

        <Paper sx={{ p: 3 }}>
          <TaskForm
            objectId={objectId}
            onBack={onBack}
          />
        </Paper>

      </Stack>
    </Layout>
  );
}
