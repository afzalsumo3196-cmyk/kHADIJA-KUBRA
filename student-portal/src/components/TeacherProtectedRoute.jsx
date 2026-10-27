import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const TeacherProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'teacher') {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
};

export default TeacherProtectedRoute;
