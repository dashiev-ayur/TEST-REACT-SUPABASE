import { useForm } from "@tanstack/react-form";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  loginFormSchema,
  useLogin,
  type FormLoginValues,
} from "../hooks/useLogin";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "../routes/login";

export function LoginForm() {
  const { redirect: redirectTo } = Route.useSearch()
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const form = useForm({
    defaultValues: { email: "", password: "" } as FormLoginValues,
    onSubmit: async ({ value }) => {
      await loginMutation.mutate(value, {
        onSuccess: () => navigate({ to: redirectTo ?? '/objects', replace: true }),
      });
    },
  });

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      sx={{ maxWidth: 420, mx: "auto", mt: 6, p: 4, background: "#fff" }}
    >
      <Typography variant="h5" gutterBottom sx={{ pb: 2 }}>
        Вход
      </Typography>

      {loginMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Не удалось войти. Проверьте email и пароль.
        </Alert>
      )}

      <Stack spacing={2}>
        <form.Field
          name="email"
          validators={{ onChange: loginFormSchema.shape.email }}
        >
          {(field) => (
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={
                field.state.meta.isTouched && !!field.state.meta.errors.length
              }
              helperText={
                field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined
              }
              disabled={loginMutation.isPending}
            />
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{ onChange: loginFormSchema.shape.password }}
        >
          {(field) => (
            <TextField
              label="Пароль"
              type="password"
              fullWidth
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={
                field.state.meta.isTouched && !!field.state.meta.errors.length
              }
              helperText={
                field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined
              }
              disabled={loginMutation.isPending}
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit || isSubmitting || loginMutation.isPending}
              startIcon={
                loginMutation.isPending ? (
                  <CircularProgress size={18} />
                ) : undefined
              }
            >
              {loginMutation.isPending ? "Вход..." : "Войти"}
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </Box>
  );
}
