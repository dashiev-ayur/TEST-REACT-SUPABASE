import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { authStore } from "../common/stores/authStore";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    // Ждём, пока AuthProvider загрузит сессию (loading -> false)
    if (authStore.state.loading) {
      await new Promise<void>((resolve) => {
        const { unsubscribe } = authStore.subscribe(() => {
          if (!authStore.state.loading) {
            unsubscribe();
            resolve();
          }
        });
      });
    }

    // После ожидания проверяем пользователя
    if (!authStore.state.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
