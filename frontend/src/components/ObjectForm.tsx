import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

const objectSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  address: z.string().optional(),
});

export type ObjectFormValues = z.infer<typeof objectSchema>;

interface ObjectFormProps {
  defaultValues?: Partial<ObjectFormValues>;
  onSubmit: (values: ObjectFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  submitLabel?: string;
}

export function ObjectForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel = "Сохранить",
}: ObjectFormProps) {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
    } as ObjectFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
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
    >
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack spacing={2}>
        <form.Field
          name="name"
          validators={{ onChange: objectSchema.shape.name }}
        >
          {(field) => (
            <TextField
              label="Название"
              fullWidth
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
              disabled={isSubmitting}
            />
          )}
        </form.Field>

        <form.Field
          name="address"
          validators={{ onChange: objectSchema.shape.address }}
        >
          {(field) => (
            <TextField
              label="Адрес"
              fullWidth
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
              disabled={isSubmitting}
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, formSubmitting]) => (
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit || formSubmitting || isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={18} /> : undefined
              }
              sx={{ width: "200px" }}
            >
              {submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </Box>
  );
}
