import { Box, Typography, CircularProgress, Alert, Stack } from "@mui/material";
import { useMyTasks } from "../common/hooks/useTasks";
import { Layout } from "../layout/Layout";
import ObjectTasksList from "../components/ObjectTasksList";
import type { DbTask } from "../common/entities";
import { useNavigate } from "@tanstack/react-router";

export function MyTasksPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyTasks();

  const onTaskOpen = (task: DbTask) =>
    navigate({ to: `/objects/${task.object_id}/task/${task.id}` });

  if (isLoading)
    return (
      <Layout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  if (isError)
    return (
      <Layout>
        <Alert severity="error">Не удалось загрузить задачи</Alert>
      </Layout>
    );

  return (
    <Layout>
      <Stack direction="column" spacing={2}>
        <Typography variant="h5">Мои задачи</Typography>

        <ObjectTasksList list={data || []} onTaskOpen={onTaskOpen} />
        {/* // <TableContainer component={Paper}>
      //   <Table>
      //     <TableHead>
      //       <TableRow>
      //         <TableCell>Название</TableCell>
      //         <TableCell>Статус</TableCell>
      //         <TableCell>Создана</TableCell>
      //       </TableRow>
      //     </TableHead>
      //     <TableBody>
      //       {data?.length === 0 && (
      //         <TableRow>
      //           <TableCell colSpan={3} align="center">
      //             Задач нет
      //           </TableCell>
      //         </TableRow>
      //       )}
      //       {data?.map((task) => (
      //         <TableRow
      //           key={task.id}
      //           hover
      //           sx={{ cursor: "pointer" }}
      //           onClick={() => navigate({ to: `/tasks/${task.id}` })}
      //         >
      //           <TableCell>{task.title}</TableCell>
      //           <TableCell>
      //             <Chip
      //               size="small"
      //               label={STATUS_LABEL[task.status]}
      //               color={STATUS_COLOR[task.status]}
      //             />
      //           </TableCell>
      //           <TableCell>
      //             {new Date(task.created_at).toLocaleDateString("ru-RU")}
      //           </TableCell>
      //         </TableRow>
      //       ))}
      //     </TableBody>
      //   </Table>
      // </TableContainer> */}
      </Stack>
    </Layout>
  );
}
