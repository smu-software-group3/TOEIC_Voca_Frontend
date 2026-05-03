import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Login from "./pages/Login";
import Word from "./pages/word";
import WordTest from "./pages/wordTest";
import Profile from "./pages/profile";
import Admin from "./pages/Admin";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register";
import PasswordChange from "./pages/PasswordChange";
import PasswordFind from "./pages/PasswordFind";
import AuthLayout from "./components/AuthLayout";
import Home from "./pages/Home";
import { AuthProvider, RequireAuth } from "./contexts/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "admin",
        element: <Admin />,
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
        path: "profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
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
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
