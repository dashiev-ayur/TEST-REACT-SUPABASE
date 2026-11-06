
import { Typography, Paper, Box } from '@mui/material'
import { TaskForm, type TaskFormValues } from '../components/TaskForm'
import { useCreateTask } from '../hooks/useTasks'
import { useNavigate } from '@tanstack/react-router'

export function CreateTaskPage() {
  const { objectId } = {objectId: ""}; //useParams({ from: '/_auth/objects/$id' })
  const navigate = useNavigate()
  const createMutation = useCreateTask()

  async function handleSubmit(values: TaskFormValues) {
    if (!objectId) return
    const task = await createMutation.mutateAsync({
      title: values.title,
      description: values.description || null,
      object_id: objectId,
      assignee_id: values.assignee_id,
    })
    navigate({ to: `/tasks/${task.id}` })
  }

  return (
    <Box>
      <Typography variant="h5">Новая задача</Typography>
      <Paper sx={{ p: 3 }}>
        <TaskForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          errorMessage={createMutation.isError ? (createMutation.error as Error).message : null}
          submitLabel="Создать"
        />
      </Paper>
    </Box>
  )
}