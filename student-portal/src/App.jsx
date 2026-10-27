import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

import LandingPage from "./pages/Public/LandingPage";
import AdmissionForm from "./pages/Public/AdmissionForm";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StudentProfile from "./pages/Profile/StudentProfile";
import StudentDashboard from "./pages/Student/StudentDashboard";
import Notices from "./pages/NoticeBoard/Notices";
import MyCourses from "./pages/Student/MyCourses";
import CourseDetails from "./pages/Student/CourseDetails";
import Record from "./pages/Attendance/Record";
import AcademicAssignments from "./pages/Academic/Assignments";
import StudentAssignments from "./pages/Student/Assignments";
import StudentNotes from "./pages/Student/Notes";
import OnlineQuiz from "./pages/Academic/OnlineQuiz";
import AudioLectures from "./pages/Lectures/AudioLectures";
import Transcripts from "./pages/Records/Transcripts";
import Remarks from "./pages/Records/Remarks";
import Certificates from "./pages/Records/Certificates";
import Grades from "./pages/Records/Grades";
import AcademicRecord from "./pages/Student/AcademicRecord";
import ComplaintBox from "./pages/HelpDesk/ComplaintBox";
import SubmitReview from "./pages/Student/SubmitReview";
import PayFees from "./pages/Student/PayFees";
import Login from "./pages/Login/Login";
import ManageStudents from "./pages/Admin/ManageStudents";
import ManageCourses from "./pages/Admin/ManageCourses";
import AdminComplaints from "./pages/Admin/AdminComplaints";
import ManageCertificates from "./pages/Admin/ManageCertificates";
import ManageTranscripts from "./pages/Admin/ManageTranscripts";
import ManageTeachers from "./pages/Admin/ManageTeachers";
import ManageReviews from "./pages/Admin/ManageReviews";
import AdminManageAttendance from "./pages/Admin/ManageAttendance";
import ManageNotices from "./pages/Admin/ManageNotices";
import ManageFees from "./pages/Admin/ManageFees"; // We will create this next
import RecycleBin from "./pages/Admin/RecycleBin";
import CentralFileHub from "./pages/Admin/CentralFileHub";

import TeacherProtectedRoute from "./components/TeacherProtectedRoute";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherProfile from "./pages/Teacher/TeacherProfile";
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import TeacherLectures from "./pages/Teacher/ManageLectures";
import TeacherQuizzes from "./pages/Teacher/ManageQuizzes";
import TeacherAttendance from "./pages/Teacher/ManageAttendance";
import TeacherGrades from "./pages/Teacher/ManageGrades";
import TeacherNotes from "./pages/Teacher/Notes";
import TeacherAssignments from "./pages/Teacher/Assignments";
import ManageOutlines from "./pages/Admin/ManageOutlines";
import TeacherCourseOutlines from "./pages/Teacher/CourseOutlines";
// [LIVE_QUESTIONS_DISABLED] import TeacherLiveQuestions from "./pages/Teacher/LiveQuestions";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admission" element={<AdmissionForm />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/courses" element={<MyCourses />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/quizzes" element={<OnlineQuiz />} />
            <Route path="/pay-fees" element={<PayFees />} />
            <Route path="/transcripts" element={<Transcripts />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/complaints" element={<ComplaintBox />} />
            <Route path="/submit-review" element={<SubmitReview />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="outlines" element={<ManageOutlines />} />
            <Route path="certificates" element={<ManageCertificates />} />
            <Route path="transcripts" element={<ManageTranscripts />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="teachers" element={<ManageTeachers />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="attendance" element={<AdminManageAttendance />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="notices" element={<ManageNotices />} />
            <Route path="fees" element={<ManageFees />} />
            <Route path="recycle-bin" element={<RecycleBin />} />
            <Route path="file-hub" element={<CentralFileHub />} />
          </Route>

          {/* Protected Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <TeacherProtectedRoute>
                <TeacherLayout />
              </TeacherProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="outlines" element={<TeacherCourseOutlines />} />
            <Route path="lectures" element={<TeacherLectures />} />
            <Route path="quizzes" element={<TeacherQuizzes />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="grades" element={<TeacherGrades />} />
            <Route path="notes" element={<TeacherNotes />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            {/* [LIVE_QUESTIONS_DISABLED] <Route path="live-questions" element={<TeacherLiveQuestions />} /> */}
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
