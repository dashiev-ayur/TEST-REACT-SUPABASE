import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        403 — Доступ запрещён
      </Typography>
      <Typography
        color="text.secondary"
        // mb={2}
      >
        У вас нет прав для просмотра этой страницы.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/objects">
        На главную
      </Button>
    </Box>
  );
}
