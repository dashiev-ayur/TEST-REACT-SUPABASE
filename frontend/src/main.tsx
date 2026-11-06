import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginForm } from "./components/LoginForm";
import { ObjectsPage } from "./pages/ObjectsPage";
import { CreateObjectPage } from "./pages/CreateObjectPage";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/objects"
              element={
                <ProtectedRoute>
                  <ObjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/objects/new"
              element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <CreateObjectPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/objects" replace />} />
            <Route path="*" element={<Navigate to="/objects" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
