import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type ProfileItem = Database["public"]["Tables"]["profiles"]["Row"];

// export interface ProfileItem {
//   id: string
//   email: string
//   full_name: string
//   role: 'manager' | 'executor'
// }

export function useExecutors() {
  return useQuery({
    queryKey: ["profiles", "executors"],
    queryFn: async (): Promise<ProfileItem[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "executor")
        .order("full_name");
      if (error) throw error;
      return data as ProfileItem[];
    },
  });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async (): Promise<ProfileItem | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      return data; // data: ProfileItem | null — без каста
    },
  });
}
