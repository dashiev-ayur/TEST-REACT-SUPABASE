import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DbTask, TaskStatus } from "../entities";
import { supabase } from "../lib/supabase";

interface ChangeStatusVars {
  task: DbTask;
  toStatus: TaskStatus;
  comment?: string;
}

/** Ошибка RPC с кодом Postgres — удобно для UI-развилок. */
export class StatusChangeError extends Error {
  readonly code: string | null;
  readonly hint: string | null;

  constructor(
    message: string,
    code: string | null,
    hint: string | null = null,
  ) {
    super(message);
    this.name = "StatusChangeError";
    this.code = code;
    this.hint = hint;
  }
}

export function useChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation<void, StatusChangeError, ChangeStatusVars>({
    mutationFn: async ({ task, toStatus, comment }) => {
      const { error } = await supabase.rpc("change_task_status", {
        p_object_id: task.object_id,
        p_task_id: task.id,
        p_from_status: task.status, // optimistic lock
        p_to_status: toStatus,
        p_comment: comment,
      });

      if (error) {
        throw new StatusChangeError(error.message, error.code, error.hint);
      }
    },

    onSuccess: async (_void, { task }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["nextStatus", task.object_id, task.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ['task-history', task.id],
        }),

        
      ]);
    },

    onError: async (err, { task }) => {
      // 40001 — статус уже сменился, локальный кэш устарел.
      // Рефетчим, чтобы UI перерисовал актуальные кнопки.
      if (err.code === "40001") {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["task", task.object_id, task.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["nextStatus", task.object_id, task.id],
          }),
        ]);
      }
    },
  });
}
