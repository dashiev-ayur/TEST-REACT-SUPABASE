import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Container,
} from "@mui/material";
import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "@tanstack/react-store";
import { authStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";

export function Layout() {
  const navigate = useNavigate();
  const profile = useSelector(authStore, (s) => s.profile);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/objects"
            sx={{ color: "inherit", textDecoration: "none", flexGrow: 1 }}
          >
            Объекты
          </Typography>
          {profile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2">{profile.full_name}</Typography>
              <Chip
                label={profile.role === "manager" ? "Менеджер" : "Исполнитель"}
                size="small"
                color={profile.role === "manager" ? "primary" : "default"}
              />
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
