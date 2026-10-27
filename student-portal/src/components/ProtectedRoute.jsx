import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user is an admin, they should not access student portal routes
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
