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
  string
> = {
  new: "#5c5c5c",
  in_progress: "#1bb1de",
  on_review: "#e5f62f",
  accepted: "#2aa063",
  needs_rework: "#cf3737",
};
