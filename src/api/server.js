import axios from "axios";

// 환경 변수에서 서버 주소를 읽고, 없으면 오류를 발생시킨다.
const getServerUrl = () => {
  const baseUrl = process.env.REACT_APP_SERVER_URL || "";

  if (!baseUrl) {
    throw new Error("REACT_APP_SERVER_URL is not defined");
  }

  return baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
};

// 로그인 요청을 보내고 응답 데이터를 반환한다.
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

// 회원가입 정보를 서버에 전달한다.
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

// 이메일 인증 코드를 서버에 전송한다.
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

// 현재 비밀번호와 새 비밀번호를 서버에 전달해 변경한다.
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

// 이메일로 임시 비밀번호 발급을 요청한다.
export async function findPassword(email) {
  const url = `${getServerUrl()}/api/password/find`;

  try {
    const response = await axios.post(
      url,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "비밀번호 찾기 요청에 실패했습니다.";
    throw new Error(message);
  }
}

// 단어장 조회 조건을 쿼리 파라미터로 전달해 단어 목록을 가져온다.
export async function getWords({ keyword = "", difficulty = "", page = 1, size = 20, sort = "spelling,asc" }) {
  const url = `${getServerUrl()}/api/words`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      params: {
        keyword,
        difficulty,
        page,
        size,
        sort,
      },
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || "단어장 조회 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 랜덤 단어를 요청해 단어 테스트의 출제 후보를 가져온다.
export async function getRandomWords(count) {
  const url = `${getServerUrl()}/api/words/random`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      params: { count },
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || "랜덤 단어 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 객관식 문제와 선택지를 단어 ID 기준으로 요청한다.
export async function getWordTestQuestion(wordId) {
  const url = `${getServerUrl()}/api/word-tests/questions`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      url,
      { wordId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || "객관식 문제 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 사용자가 제출한 답안을 서버로 보내 정답 여부를 확인한다.
export async function checkWordAnswer(wordId, submittedMeaning) {
  const url = `${getServerUrl()}/api/word-tests/answers`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      url,
      { wordId, submittedMeaning },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || "정답 확인에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}
