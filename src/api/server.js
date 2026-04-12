import axios from 'axios';

const getServerUrl = () => {
  const baseUrl = process.env.REACT_APP_SERVER_URL || "";

  if (!baseUrl) {
    throw new Error("REACT_APP_SERVER_URL is not defined");
  }

  return baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
};

export async function login(email, password) {
  const url = `${getServerUrl()}/api/auth/login`;

  console.log("로그인 요청 URL:", url);
  console.log("로그인 요청 데이터:", { email, password });

  try {
    const response = await axios.post(
      url,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "로그인 요청에 실패했습니다.";
    throw new Error(message);
  }
}
