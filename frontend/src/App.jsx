import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import DashboardPage from "./pages/DashboardPage";
import DonorPage from "./pages/DonorPage";
import RecipientPage from "./pages/RecipientPage";
import OrganManagementPage from "./pages/OrganManagementPage";
import MatchingPage from "./pages/MatchingPage";
import TransportTrackingPage from "./pages/TransportTrackingPage";
import SurgeryPage from "./pages/SurgeryPage";
import LoginPage from "./pages/LoginPage";
import ApprovalWorkflowPage from "./pages/ApprovalWorkflowPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/donor"
                  element={
                    <RoleRoute roles={["admin"]}>
                      <DonorPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/recipient"
                  element={
                    <RoleRoute roles={["admin"]}>
                      <RecipientPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/organ-management"
                  element={
                    <RoleRoute roles={["admin"]}>
                      <OrganManagementPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/matching"
                  element={
                    <RoleRoute roles={["admin"]}>
                      <MatchingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/transport-tracking"
                  element={
                    <RoleRoute roles={["admin", "transport"]}>
                      <TransportTrackingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/surgery"
                  element={
                    <RoleRoute roles={["admin", "doctor"]}>
                      <SurgeryPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/approval-workflow"
                  element={
                    <RoleRoute roles={["admin", "doctor"]}>
                      <ApprovalWorkflowPage />
                    </RoleRoute>
                  }
                />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
