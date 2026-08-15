import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";

const ProtectedRoute = ({ children, fallbackRoute = "/login" }) => {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full"
          style={{ animation: "spin 0.8s linear infinite" }}
          role="status"
          aria-label="Checking authentication"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
