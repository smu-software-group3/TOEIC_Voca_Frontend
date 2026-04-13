import axios from "axios";

const getServerUrl = () => {
  const baseUrl = process.env.REACT_APP_SERVER_URL || "";

  if (!baseUrl) {
    throw new Error("REACT_APP_SERVER_URL is not defined");
  }

  return baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
};

export async function login(email, password) {
  const url = `${getServerUrl()}/api/auth/login`;

  try {
    const response = await axios.post(
      url,
      { email, password },
      { headers: { "Content-Type": "application/json" } },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "로그인 요청에 실패했습니다.";
    throw new Error(message);
  }
}

export async function signup(email, password, passwordConfirm) {
  const url = `${getServerUrl()}/api/auth/register`;

  console.log("Signup URL:", url);
  console.log("Signup Data:", { email, password, passwordConfirm });

  try {
    const response = await axios.post(
      url,
      { email, password, passwordConfirm },
      { headers: { "Content-Type": "application/json" } },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "회원가입 요청에 실패했습니다.";
    throw new Error(message);
  }
}

export async function verifyEmail(email, code) {
  const url = `${getServerUrl()}/api/auth/verify`;

  try {
    const response = await axios.post(
      url,
      { email, code },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "이메일 인증 요청에 실패했습니다.";
    throw new Error(message);
  }
}

export async function changePassword(
  currentPassword,
  newPassword,
  newPasswordConfirm,
) {
  const url = `${getServerUrl()}/api/users/password/change`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.put(
      url,
      { currentPassword, newPassword, newPasswordConfirm },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "비밀번호 변경 요청에 실패했습니다.";
    throw new Error(message);
  }
}
