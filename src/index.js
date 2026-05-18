import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Login from "./pages/Login/Login";
import Word from "./pages/Word/Word";
import WordTest from "./pages/WordTest/WordTest";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register/Register";
import PasswordChange from "./pages/PasswordChange/PasswordChange";
import PasswordFind from "./pages/PasswordFind/PasswordFind";
import Retest from "./pages/Retest/Retest";
import { AuthProvider, RequireAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing/Landing";
import Main from "./pages/Main/Main";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "main",
        element: <RequireAuth><Main /></RequireAuth>,
      },
      {
        path: "admin",
        element: (
          <RequireAuth>
            <Admin />
          </RequireAuth>
        ),
      },
      {
        path: "word",
        element: (
          <RequireAuth>
            <Word />
          </RequireAuth>
        ),
      },
      {
        path: "wtest",
        element: (
          <RequireAuth>
            <WordTest />
          </RequireAuth>
        ),
      },
      {
        path: "wtest/:testType",
        element: (
          <RequireAuth>
            <WordTest />
          </RequireAuth>
        ),
      },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "retest",
        element: (
          <RequireAuth>
            <Retest />
          </RequireAuth>
        ),
      },
      {
        path: "retest/:listType",
        element: (
          <RequireAuth>
            <Retest />
          </RequireAuth>
        ),
      },
      {
        path: "retest/:listType/test",
        element: (
          <RequireAuth>
            <Retest />
          </RequireAuth>
        ),
      },
      {
        path: "retest/:listType/test/:testType",
        element: (
          <RequireAuth>
            <Retest />
          </RequireAuth>
        ),
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "pwc",
        element: <PasswordChange />,
      },
      {
        path: "pwf",
        element: <PasswordFind />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));

// 라우터를 루트 DOM에 연결해 앱 렌더링을 시작한다.
root.render(
  // <React.StrictMode>
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>,
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to reportWebVitals or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
