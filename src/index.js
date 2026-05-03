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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "word",
        element: <Word />,
      },
      {
        path: "wtest",
        element: <WordTest />,
      },
      {
        path: "profile",
        element: <Profile />,
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
  <RouterProvider router={router} />,
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
