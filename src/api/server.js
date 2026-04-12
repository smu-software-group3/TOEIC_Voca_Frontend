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
    const response = await axios.post(url, null, {
      params: { email, password },
    });

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "로그인 요청에 실패했습니다.";
    throw new Error(message);
  }
}

export async function signup(email, username, password) {
  const url = `${getServerUrl()}/api/auth/signup`;

  console.log("Signup URL:", url);
  console.log("Signup Data:", { email, username, password });

  try {
    const response = await axios.post(
      url,
      { email, username, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "회원가입 요청에 실패했습니다.";
    throw new Error(message);
  }
}
