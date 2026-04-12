const getServerUrl = () => {
  const baseUrl = process.env.REACT_APP_SERVER_URL || "";

  if (!baseUrl) {
    throw new Error("REACT_APP_SERVER_URL is not defined");
  }

  return baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
};

export async function login(email, password) {
  const url = `${getServerUrl()}/api/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.message || "로그인 요청에 실패했습니다.";
    throw new Error(message);
  }

  return response.json();
}
