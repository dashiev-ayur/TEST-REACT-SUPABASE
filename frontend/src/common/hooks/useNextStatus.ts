import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { DbTask, TaskStatus } from "../entities";

// Форма ответа RPC get_task_available_transitions
export interface AvailableTransitions {
  expected_status: TaskStatus;
  current_status: TaskStatus;
  stale: boolean;
  transitions: Record<TaskStatus, "allow" | "disallow">;
}

export function useNextStatus(
  task: Pick<DbTask, "id" | "object_id" | "status">,
) {
  return useQuery({
    queryKey: ["nextStatus", task.object_id, task.id, task.status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_task_available_transitions",
        {
          p_object_id: task.object_id,
          p_task_id: task.id,
          p_from_status: task.status,
        },
      );

      if (error) throw error;

      // RPC возвращает jsonb — приводим к типу
      return data as unknown as AvailableTransitions;
    },
    // Полезно: если бэкенд сообщил stale, UI должен рефетчить задачу,
    // но кэш самого ответа можно не держать долго
    staleTime: 0,
  });
}
