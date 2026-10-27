import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user is a student, they should not access admin routes
  if (role === 'student') {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
};

export default AdminProtectedRoute;
