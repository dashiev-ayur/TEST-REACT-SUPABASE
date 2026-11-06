import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { supabase } from "../lib/supabase";

// Zod 4: используем z.email() вместо z.string().email()
const loginSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => navigate("/objects", { replace: true }),
  });

  const form = useForm({
    defaultValues: { email: "", password: "" } as LoginValues,
    // Больше никакого validatorAdapter: zodValidator()
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value);
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
      sx={{ maxWidth: 420, mx: "auto", mt: 8, p: 3 }}
    >
      <Typography variant="h5" gutterBottom>
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
          validators={{ onChange: loginSchema.shape.email }}
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
          validators={{ onChange: loginSchema.shape.password }}
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
