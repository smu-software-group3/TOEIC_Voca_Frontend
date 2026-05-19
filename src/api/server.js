import axios from "axios";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTO_LOGIN_ENABLED_KEY = "autoLoginEnabled";
const SILENT_REFRESH_DELAY_MS = 12 * 60 * 1000;
const SILENT_REFRESH_EXCLUDED_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/password/find",
];

const isLocal = true;

// 환경 변수에서 서버 주소를 읽고, 없으면 오류를 발생시킨다.
const getServerUrl = () => {
  const baseUrl = isLocal
    ? process.env.REACT_APP_LOCAL_SERVER_URL
    : process.env.REACT_APP_SERVER_URL;

  if (!baseUrl) {
    throw new Error("REACT_APP_SERVER_URL is not defined");
  }

  return baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
};

const getRequestPathname = (requestUrl = "") => {
  try {
    return new URL(requestUrl, getServerUrl()).pathname;
  } catch {
    return requestUrl;
  }
};

const isSilentRefreshExcluded = (requestUrl = "") => {
  const pathname = getRequestPathname(requestUrl);

  return SILENT_REFRESH_EXCLUDED_PATHS.some(
    (excludedPath) =>
      pathname === excludedPath || pathname.startsWith(`${excludedPath}/`),
  );
};

const normalizeBearerToken = (token) => {
  if (!token || typeof token !== "string") {
    return "";
  }

  return token.startsWith("Bearer ") ? token.slice(7) : token;
};

const extractAccessToken = (responseData, responseHeaders = {}) => {
  if (typeof responseData === "string") {
    return normalizeBearerToken(responseData);
  }

  if (responseData?.data && typeof responseData.data === "string") {
    return normalizeBearerToken(responseData.data);
  }

  return normalizeBearerToken(
    responseData?.data?.accessToken ||
      responseData?.accessToken ||
      responseHeaders?.authorization ||
      responseHeaders?.Authorization,
  );
};

let silentRefreshTimeoutId = null;

const clearSilentRefreshTimer = () => {
  if (silentRefreshTimeoutId) {
    clearTimeout(silentRefreshTimeoutId);
    silentRefreshTimeoutId = null;
  }
};

const scheduleSilentRefresh = () => {
  clearSilentRefreshTimer();

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (!accessToken || !refreshToken) {
    return;
  }

  silentRefreshTimeoutId = setTimeout(() => {
    triggerSilentRefresh();
  }, SILENT_REFRESH_DELAY_MS);
};

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAutoLoginEnabled() {
  return localStorage.getItem(AUTO_LOGIN_ENABLED_KEY) === "true";
}

export function setAutoLoginEnabled(enabled) {
  localStorage.setItem(AUTO_LOGIN_ENABLED_KEY, enabled ? "true" : "false");
}

export function clearAuthTokens() {
  clearSilentRefreshTimer();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  window.dispatchEvent(new Event("authchange"));
}

export function storeAuthTokens({
  accessToken,
  refreshToken,
  persistRefreshToken = isAutoLoginEnabled(),
} = {}) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (persistRefreshToken && refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else if (!persistRefreshToken) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  window.dispatchEvent(new Event("authchange"));

  return {
    accessToken: accessToken || "",
    refreshToken: refreshToken || "",
  };
}

export function storeAuthTokensFromResponse(
  responseData,
  responseHeaders = {},
  options = {},
) {
  const accessToken = extractAccessToken(responseData, responseHeaders);
  const refreshToken =
    responseData?.data?.refreshToken || responseData?.refreshToken || "";
  const persistRefreshToken =
    options.persistRefreshToken ?? isAutoLoginEnabled();

  const tokens = storeAuthTokens({
    accessToken,
    refreshToken,
    persistRefreshToken,
  });

  scheduleSilentRefresh();

  return tokens;
}

export async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    const requestError = new Error("저장된 토큰이 없습니다.");
    requestError.code = "UNAUTHORIZED";
    throw requestError;
  }

  const url = `${getServerUrl()}/api/auth/refresh`;

  try {
    const response = await axios.post(
      url,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    storeAuthTokensFromResponse(response.data, response.headers);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message =
      status === 400
        ? "잘못된 입력값입니다. refreshToken을 확인해주세요."
        : status === 401
          ? "유효하지 않은 refresh token입니다."
          : status === 404
            ? "저장된 토큰이 없습니다."
            : error.response?.data?.message ||
              "토큰 재발행 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = error.response?.data?.code || "UNAUTHORIZED";
    throw requestError;
  }
}

let refreshTokenPromise = null;

const getRefreshTokenPromise = () => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = refreshAccessToken().finally(() => {
      refreshTokenPromise = null;
    });
  }

  return refreshTokenPromise;
};

const triggerSilentRefresh = async () => {
  try {
    await getRefreshTokenPromise();
  } catch {
    clearAuthTokens();
  }
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      isSilentRefreshExcluded(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (originalRequest.__isRetryRequest) {
      return Promise.reject(error);
    }

    if (!getStoredRefreshToken()) {
      clearAuthTokens();

      const requestError = new Error("인증이 필요합니다.");
      requestError.code = "UNAUTHORIZED";
      return Promise.reject(requestError);
    }

    try {
      await getRefreshTokenPromise();

      const refreshedAccessToken = getStoredAccessToken();

      if (!refreshedAccessToken) {
        throw new Error("인증이 필요합니다.");
      }

      originalRequest.__isRetryRequest = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;

      return axios(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();

      const requestError = new Error(
        refreshError.message || "인증이 필요합니다.",
      );
      requestError.code = refreshError.code || "UNAUTHORIZED";
      return Promise.reject(requestError);
    }
  },
);

const bootstrapSilentRefresh = () => {
  if (getStoredAccessToken() && getStoredRefreshToken()) {
    scheduleSilentRefresh();
  }
};

bootstrapSilentRefresh();

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
    const message =
      error.response?.status === 401
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
            : error.response?.data?.message ||
              "회원 정보 수정 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

const PROFILE_IMAGE_REGEX =
  /^data:image\/(png|jpe?g|gif);base64,([a-z0-9+/=]+)$/i;
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

function createInvalidProfileImageError() {
  const requestError = new Error("입력값이 올바르지 않습니다.");
  requestError.code = "INVALID_INPUT";
  return requestError;
}

function validateProfileImage(profileImage) {
  if (!profileImage || typeof profileImage !== "string") {
    throw createInvalidProfileImageError();
  }

  const trimmedProfileImage = profileImage.trim();
  const matched = trimmedProfileImage.match(PROFILE_IMAGE_REGEX);

  if (!matched) {
    throw createInvalidProfileImageError();
  }

  const base64Data = matched[2] || "";
  const paddingLength = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
      ? 1
      : 0;
  const byteLength = Math.floor((base64Data.length * 3) / 4) - paddingLength;

  if (byteLength >= MAX_PROFILE_IMAGE_BYTES) {
    throw createInvalidProfileImageError();
  }

  return trimmedProfileImage;
}

// 현재 로그인한 사용자의 프로필 이미지를 업로드한다.
export async function uploadProfileImage(profileImage) {
  const url = `${getServerUrl()}/api/users/me/profile-image`;
  const token = localStorage.getItem("token");

  try {
    const validatedProfileImage = validateProfileImage(profileImage);
    const response = await axios.post(
      url,
      { profileImage: validatedProfileImage },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    if (error.code === "INVALID_INPUT") {
      throw error;
    }

    const status = error.response?.status;
    const code = error.response?.data?.code;
    const message =
      status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : status === 404
          ? "요청한 리소스를 찾을 수 없습니다."
          : status === 400
            ? "입력값이 올바르지 않습니다."
            : error.response?.data?.message ||
              "프로필 이미지 업로드 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code =
      code ||
      (status === 404
        ? "NOT_FOUND"
        : status === 401
          ? "UNAUTHORIZED"
          : "INVALID_INPUT");
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
          : error.response?.data?.message ||
            "비밀번호 찾기 요청에 실패했습니다.";
    throw new Error(message);
  }
}

// 단어장 조회 조건을 쿼리 파라미터로 전달해 단어 목록을 가져온다.
export async function getWords({
  spelling = "",
  difficulty = "",
  sort = "asc",
}) {
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
    const message =
      error.response?.status === 400
        ? "잘못된 입력값입니다. 정보를 확인해주세요."
        : error.response?.data?.message || "단어장 조회 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 사용자의 즐겨찾기 단어 목록을 가져온다.
export async function getBookmarks() {
  const url = `${getServerUrl()}/api/words/bookmarks`;
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.data?.message || "즐겨찾기 조회 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 단어 즐겨찾기 등록/삭제를 처리한다.
export async function toggleBookmark(wordId) {
  const url = `${getServerUrl()}/api/words/${encodeURIComponent(wordId)}/bookmark`;
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
    const status = error.response?.status;
    const message =
      status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : status === 404
          ? "요청한 리소스를 찾을 수 없습니다."
          : error.response?.data?.message || "즐겨찾기 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 품사별 단어 목록을 가져온다.
export async function getWordsByPartOfSpeech(partOfSpeech) {
  const url = `${getServerUrl()}/api/words/part-of-speech/${encodeURIComponent(partOfSpeech)}`;
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.data?.message ||
          "품사별 단어 조회 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 사용자의 취약 단어를 가져온다.
export async function getWeakWords({ difficulty = "", limit = 10 } = {}) {
  const url = `${getServerUrl()}/api/users/me/weak-words`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      params: { difficulty, limit },
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
        : error.response?.status === 400
          ? "잘못된 요청입니다."
          : error.response?.data?.message || "취약 단어 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 오래된 문제 재학습 단어를 가져온다.
export async function getRelearningWords() {
  const url = `${getServerUrl()}/api/users/me/relearning-words`;
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
    const status = error.response?.status;
    const message =
      status === 401
        ? "인증이 필요합니다."
        : status === 404
          ? "회원을 찾을 수 없습니다."
          : status === 400
            ? "유효하지 않은 요청입니다."
            : status >= 500
              ? "서버 오류가 발생했습니다."
              : error.response?.data?.message ||
                "오래된 문제 재학습 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 오늘 틀린 단어를 가져온다.
export async function getTodayWrongWords() {
  const url = `${getServerUrl()}/api/users/me/today-wrong`;
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.status === 404
          ? "요청한 리소스를 찾을 수 없습니다."
          : error.response?.status === 400
            ? "잘못된 요청입니다."
            : error.response?.data?.message ||
              "오늘 틀린 단어 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 랜덤 단어를 요청해 단어 테스트의 출제 후보를 가져온다.
export async function getRandomWords(count, partOfSpeech = "") {
  const url = `${getServerUrl()}/api/words/random`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(url, {
      params: { count, partOfSpeech },
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    const code = error.response?.data?.code;
    const message =
      error.response?.status === 400
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
    const message =
      error.response?.status === 401
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
export async function checkWordAnswer(answerOrWordId, submittedSpelling) {
  const url = `${getServerUrl()}/api/words/check-answer`;
  const token = localStorage.getItem("token");
  const answers = Array.isArray(answerOrWordId)
    ? answerOrWordId
    : [{ wordId: answerOrWordId, submittedSpelling }];

  try {
    const response = await axios.post(
      url,
      { answers },
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
      error.response?.status === 400
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.status === 404
          ? "존재하지 않는 계정입니다."
          : error.response?.data?.message || "회원 정보 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 현재 로그인한 사용자의 점수 정보를 조회한다.
export async function getUserScore() {
  const url = `${getServerUrl()}/api/users/me/score`;
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다. 다시 로그인해주세요."
        : error.response?.data?.message || "점수 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 현재 로그인한 사용자의 학습 대시보드를 조회한다.
export async function getDashboard() {
  const url = `${getServerUrl()}/api/users/me/dashboard`;
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
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
    const message =
      error.response?.status === 401
        ? "인증이 필요합니다."
        : error.response?.status === 404
          ? "요청한 리소스를 찾을 수 없습니다."
          : error.response?.status === 400
            ? "잘못된 요청입니다."
            : error.response?.data?.message || "대시보드 조회에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code || (error.response?.status === 401 ? "UNAUTHORIZED" : "INVALID_INPUT");
    throw requestError;
  }
}

function normalizeAdminWordMeanings({ meaning, partOfSpeech, meanings }) {
  if (Array.isArray(meanings) && meanings.length > 0) {
    return meanings
      .map((item) => ({
        meaning: String(item?.meaning || "").trim(),
        partOfSpeech: String(item?.partOfSpeech || "NOUN").trim(),
      }))
      .filter((item) => item.meaning);
  }

  const normalizedMeaning = String(meaning || "").trim();

  if (!normalizedMeaning) {
    return [];
  }

  return [
    {
      meaning: normalizedMeaning,
      partOfSpeech: String(partOfSpeech || "NOUN").trim(),
    },
  ];
}

function buildAdminWordRequestBody(payload) {
  const spelling = String(payload?.spelling || "").trim();
  const meanings = normalizeAdminWordMeanings(payload);

  return {
    spelling,
    meanings,
    difficulty: payload?.difficulty,
  };
}

// 관리자 단어 추가 요청을 보낸다.
export async function createAdminWord(payload) {
  const url = `${getServerUrl()}/api/admin/words`;
  const token = localStorage.getItem("token");

  const requestBody = buildAdminWordRequestBody(payload);

  try {
    const response = await axios.post(url, requestBody, {
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
        ? "인증이 필요합니다."
        : error.response?.status === 403
          ? "관리자 권한이 필요합니다."
          : error.response?.status === 400
            ? "유효하지 않은 난이도입니다. EASY, MEDIUM, HARD 중 하나여야 합니다."
            : error.response?.status === 409
              ? "같은 단어가 이미 존재합니다."
              : error.response?.data?.message ||
                "단어 추가 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 관리자 단어 수정 요청을 보낸다.
export async function updateAdminWord(wordId, payload) {
  const url = `${getServerUrl()}/api/admin/words/${wordId}`;
  const token = localStorage.getItem("token");

  const requestBody = buildAdminWordRequestBody(payload);

  try {
    const response = await axios.patch(url, requestBody, {
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
        ? "인증이 필요합니다."
        : error.response?.status === 403
          ? "관리자 권한이 필요합니다."
          : error.response?.status === 400
            ? "유효하지 않은 난이도입니다. EASY, MEDIUM, HARD 중 하나여야 합니다."
            : error.response?.status === 404
              ? "수정할 단어를 찾을 수 없습니다."
              : error.response?.data?.message ||
                "단어 수정 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}

// 관리자 단어 삭제 요청을 보낸다.
export async function deleteAdminWord(wordId) {
  const url = `${getServerUrl()}/api/admin/words/${wordId}`;
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
        ? "인증이 필요합니다."
        : error.response?.status === 403
          ? "관리자 권한이 필요합니다."
          : error.response?.status === 404
            ? "삭제할 단어를 찾을 수 없습니다."
            : error.response?.data?.message || "단어 삭제 요청에 실패했습니다.";
    const requestError = new Error(message);

    requestError.code = code;
    throw requestError;
  }
}
