import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Problem from "./pages/Problem";
import Contest from "./pages/Contest";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import Progress from "./pages/Progress";
import ProtectedRoute from "./components/ProtectedRoute";
import PracticeRoute from "./components/PracticeRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PracticeRoute requireAuth><Dashboard /></PracticeRoute>} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/assessment" element={<PracticeRoute requireAuth><Assessment /></PracticeRoute>} />
        <Route path="/progress" element={<PracticeRoute requireAuth><Progress /></PracticeRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/problems" element={<PracticeRoute><Problems /></PracticeRoute>} />
        <Route path="/problem/:id" element={<PracticeRoute requireAuth><Problem /></PracticeRoute>} />
        <Route path="/contest" element={<Contest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
