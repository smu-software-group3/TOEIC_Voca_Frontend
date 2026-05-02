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
      error?.response?.status === 400
        ? "잘못된 입력값입니다. 이메일과 비밀번호를 확인해주세요."
        : error?.response?.status === 401
        ? "이메일 또는 비밀번호가 일치하지 않습니다."
        : error?.response?.status === 404
        ? "존재하지 않는 계정입니다. 회원가입을 먼저 해주세요."
        : "로그인 요청에 실패했습니다.";
    throw new Error(message);
  }
}

// 회원가입 정보를 서버에 전달한다.
export async function signup(email, username, password, passwordConfirm) {
  const url = `${getServerUrl()}/api/auth/register`;

  console.log("Signup URL:", url);
  console.log("Signup Data:", { email, username, password, passwordConfirm });

  try {
    const response = await axios.post(
      url,
      { email, username, password, passwordConfirm },
      { headers: { "Content-Type": "application/json" } },
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.status === 400
        ? "잘못된 입력값입니다. 정보를 확인해주세요."
        : error.response?.status === 409
        ? "이미 사용 중인 이메일입니다."
        : "회원가입 요청에 실패했습니다.";
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
      error.response?.status === 400
        ? "잘못된 입력값입니다. 인증 코드를 확인해주세요."
        : error.response?.status === 404
        ? "존재하지 않는 계정입니다. 회원가입을 먼저 해주세요."
        : "이메일 인증 요청에 실패했습니다.";
    throw new Error(message);
  }
}

// 로그아웃 요청을 서버에 전달한다.
export async function logout() {
  const url = `${getServerUrl()}/api/auth/logout`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      url,
      {},
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
    const message = error.response?.status === 401
      ? "인증이 필요합니다. 다시 로그인해주세요."
      : error.response?.status === 404
      ? "존재하지 않는 계정입니다."
      : "로그아웃 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 현재 로그인한 사용자의 회원 탈퇴를 요청한다.
export async function deleteMyAccount() {
  const url = `${getServerUrl()}/api/users/me`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.delete(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.status === 404
        ? "존재하지 않는 계정입니다."
        : error.response?.data?.message || "회원 탈퇴 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 현재 로그인한 사용자의 프로필 정보를 수정한다.
export async function updateMyProfile({ username, birthDate, userType }) {
  const url = `${getServerUrl()}/api/users/me/profile`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.patch(
      url,
      { username, birthDate, userType },
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.status === 404
        ? "존재하지 않는 계정입니다."
        : error.response?.status === 400
        ? "잘못된 입력값입니다. 정보를 확인해주세요."
        : error.response?.data?.message || "회원 정보 수정 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
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
      error.response?.status === 400
        ? "잘못된 입력값입니다. 비밀번호를 확인해주세요."
        : error.response?.status === 401
        ? "현재 비밀번호가 올바르지 않습니다."
        : error.response?.status === 404
        ? "존재하지 않는 계정입니다."
        : "비밀번호 변경 요청에 실패했습니다.";
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
      error.response?.status === 400
        ? "잘못된 입력값입니다. 이메일을 확인해주세요."
        : error.response?.status === 404
        ? "존재하지 않는 계정입니다."
        : error.response?.data?.message || "비밀번호 찾기 요청에 실패했습니다.";
    throw new Error(message);
  }
}

// 단어장 조회 조건을 쿼리 파라미터로 전달해 단어 목록을 가져온다.
export async function getWords({ spelling = "", difficulty = "", sort = "asc" }) {
  const url = `${getServerUrl()}/api/words`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      params: {
        spelling,
        difficulty,
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
    const message = error.response?.status === 400
      ? "잘못된 입력값입니다. 정보를 확인해주세요."
      : error.response?.data?.message || "단어장 조회 요청에 실패했습니다.";
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
    const message = error.response?.status === 400
      ? "잘못된 입력값입니다. 정보를 확인해주세요."
      : error.response?.data?.message || "랜덤 단어 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 객관식 문제와 선택지를 단어 ID 기준으로 요청한다.
export async function getWordTestQuestion(wordId) {
  const url = `${getServerUrl()}/api/words/questions`;
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
    const message = error.response?.status === 401
      ? "인증이 필요합니다. 다시 로그인해주세요."
      : error.response?.status === 404
      ? "단어를 찾을 수 없습니다."
      : error.response?.status === 422
      ? "오답 보기를 구성하기 위한 단어가 부족합니다."
      : error.response?.data?.message || "랜덤 단어 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 사용자가 제출한 답안을 서버로 보내 정답 여부를 확인한다.
export async function checkWordAnswer(wordId, submittedMeaning) {
  const url = `${getServerUrl()}/api/words/check-answer`;
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
    const message = error.response?.status === 400
      ? "잘못된 입력값입니다. 정보를 확인해주세요."
      : error.response?.status === 404
      ? "단어를 찾을 수 없습니다."
      : error.response?.data?.message || "정답 확인에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 현재 로그인한 사용자의 프로필 정보를 조회한다.
export async function getMemberInfo() {
  const url = `${getServerUrl()}/api/users/me`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message = error.response?.status === 401
      ? "인증이 필요합니다. 다시 로그인해주세요."
      : error.response?.status === 404
      ? "존재하지 않는 계정입니다."
      : error.response?.data?.message || "회원 정보 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}
