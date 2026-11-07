import type { TaskStatus } from "../entities";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  on_review: "На проверке",
  accepted: "Принята",
  needs_rework: "На доработке",
};
export const STATUS_COLOR: Record<
  TaskStatus,
  "default" | "info" | "warning" | "success" | "error"
> = {
  new: "default",
  in_progress: "info",
  on_review: "warning",
  accepted: "success",
  needs_rework: "error",
};
