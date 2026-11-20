import { useSyncExternalStore } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthSnapshot, subscribeAuth } from "../api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  return token
    ? children
    : <Navigate to="/login" replace state={{ from: location, authRequired: true }} />;
}
