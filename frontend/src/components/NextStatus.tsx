import {
  Button,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  TextareaAutosize,
} from "@mui/material";
import type { DbTask, TaskStatus } from "../common/entities";
import { useNextStatus } from "../common/hooks/useNextStatus";
import { STATUS_COLOR, STATUS_LABEL } from "../common/types/status";

import { useState } from "react";
import { useChangeStatus } from "../common/hooks/useChangeStatus";

type AlertSeverity = "success" | "info" | "warning" | "error";

interface Props {
  task: DbTask;
}

const NextStatus: React.FC<Props> = ({ task }) => {
  const { data, isLoading } = useNextStatus(task);

  const [comment, setComment] = useState("");
  const { mutate: changeStatus } = useChangeStatus();
  const [message, setMessage] = useState<{
    msg: string;
    type?: AlertSeverity;
  }>({ msg: "" });

  if (isLoading) return <CircularProgress size={24} />;
  if (!data) return null;

  // stale: переходы посчитаны от актуального статуса в БД,
  // а клиент прислал устаревший p_from_status — кнопки рисовать нельзя
  if (data.stale) {
    return <Alert severity="warning">Данные устарели, обновите задачу</Alert>;
  }

  // Только реально доступные переходы, в стабильном порядке
  const allowed = (
    Object.entries(data.transitions) as [TaskStatus, "allow" | "disallow"][]
  )
    .filter(([, verdict]) => verdict === "allow")
    .map(([status]) => status);

  if (allowed.length === 0) return null;

  const handleChangeStatus = (toStatus: TaskStatus) => {
    if (toStatus === "needs_rework" && !comment.trim()) {
      setMessage({ msg: "Напишите комментарий, перед сменой статуса !" });
      return;
    }

    changeStatus(
      { task, toStatus, comment: comment.trim() || undefined },
      {
        onError: (err) => {
          console.log("Error>>>", err);
          switch (err.code) {
            case "40001":
              setMessage({
                msg: "Текущий статус задачи успел измениться, обнови экран F5",
                type: "warning",
              });
              break;
            case "42501":
              setMessage({
                msg: "Недостаточно прав для перехода",
                type: "error",
              });
              break;
            case "P0001":
              setMessage({
                msg: "Напишите комментарий, перед сменой статуса !",
                type: "error",
              });
              break;
            default:
              setMessage({ msg: err.message, type: "error" });
          }
        },
        onSuccess: () => {
          setComment("");
        },
      },
    );
  };
  if (allowed.length === 0) return null;
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={1}>
          {allowed.map((status) => (
            <Button
              key={status}
              sx={{ background: STATUS_COLOR[status], color: "#fff" }}
              onClick={() => handleChangeStatus(status)}
            >
              {STATUS_LABEL[status]}
            </Button>
          ))}
        </Stack>

        {message.msg && (
          <Alert variant="filled" severity={message.type || "info"}>
            {message.msg}
          </Alert>
        )}

        <Paper sx={{ p: 2 }}>
          <TextareaAutosize
            minRows={8}
            maxRows={25}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ваш комментарий перед сменой статуса..."
            style={{ width: "100%", padding: "10px" }}
          />
        </Paper>

        {/* <pre>{JSON.stringify(allowed, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(data.transitions, null, 2)}</pre> */}
      </Stack>
    </Paper>
  );
};

export default NextStatus;
