import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Container,
} from "@mui/material";
import { useSelector } from "@tanstack/react-store";
import { authStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "@tanstack/react-router";
import './globals.scss';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const profile = useSelector(authStore, (s) => s.profile);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <main>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/objects"
            sx={{ color: "inherit", textDecoration: "none", flexGrow: 1 }}
          >
            CRM стройка - demo
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

          {profile?.role === "executor" && (
            <Button color="inherit" component={Link} to="/my-tasks">
              Мои задачи
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </main>
  );
}
