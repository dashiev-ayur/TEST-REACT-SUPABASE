import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { supabase } from "../lib/supabase";
import { authStore } from "../stores/authStore";

export const loginFormSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export type FormLoginValues = z.infer<typeof loginFormSchema>;

export const useLogin = () => {
  return useMutation({
    mutationFn: async (values: FormLoginValues) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;

      // ждем пока стор обновиться
      // мутация не завершится (и onSuccess не вызовется), 
      // пока authStore не будет содержать и user, и loading: false. 
      if (authStore.state.loading || !authStore.state.user) {
        await new Promise<void>((resolve) => {
          // authStore.subscribe - подписка на любые изменения store
          const { unsubscribe } = authStore.subscribe(() => {
            if (!authStore.state.loading && authStore.state.user) {
              unsubscribe();
              resolve();
            }
          });
        });
      }

      return data;
    },
  });
};
