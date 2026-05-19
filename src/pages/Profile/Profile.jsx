import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clearAuthTokens,
  deleteMyAccount,
  getDashboard,
  getMemberInfo,
  uploadProfileImage,
  updateMyProfile,
} from "../../api/server";
import DefaultProfile from "../../components/DefaultProfile";
import "./Profile.css";

const USER_TYPE_OPTIONS = [
  { value: "HIGH_SCHOOL_STUDENT", label: "고등학생" },
  { value: "UNIVERSITY_STUDENT", label: "대학생" },
  { value: "EMPLOYEE", label: "직장인" },
  { value: "JOB_SEEKER", label: "취준생" },
  { value: "SELF_EMPLOYED", label: "자영업자" },
  { value: "OTHER", label: "기타" },
];

const DAILY_RANGE_OPTIONS = [
  { value: "7", label: "7일" },
  { value: "30", label: "30일" },
];

const CHART_COLORS = {
  weak: "#dc2626",
  wrong: "#d97706",
  correct: "#0f766e",
  daily: "#5b21b6",
};

function getUserTypeLabel(userType) {
  const option = USER_TYPE_OPTIONS.find((item) => item.value === userType);
  return option?.label || "미설정";
}

function mapProfileToEditForm(profile) {
  return {
    username: profile?.username || profile?.nickname || "",
    birthDate: profile?.birthDate || profile?.birth || "",
    userType: profile?.userType || "",
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

function dispatchProfileChange(profile) {
  try {
    window.dispatchEvent(new CustomEvent("profilechange", { detail: profile }));
  } catch {
    try {
      window.dispatchEvent(new Event("profilechange"));
    } catch {}
  }
}

function formatNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : "0";
}

function normalizeRateValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return numericValue <= 1 ? numericValue * 100 : numericValue;
}

function formatRate(value) {
  const normalized = normalizeRateValue(value);
  return `${normalized.toFixed(1).replace(/\.0$/, "")} %`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(parsedDate);
}

function buildMeaningSummary(meanings) {
  if (!Array.isArray(meanings) || meanings.length === 0) {
    return "뜻 정보 없음";
  }

  return meanings
    .slice(0, 2)
    .map((item) => item?.meaning)
    .filter(Boolean)
    .join(" · ");
}

function buildChartWords(items, valueKey) {
  return (Array.isArray(items) ? items : []).slice(0, 5).map((item) => ({
    label: item?.spelling || "-",
    value: Number(item?.[valueKey]) || 0,
    meanings: buildMeaningSummary(item?.meanings),
  }));
}

function buildDailyChart(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    label: formatDateLabel(item?.date),
    value: Number(item?.studiedWordCount) || 0,
    date: item?.date,
  }));
}

function getDashboardDailyItems(dashboard, range) {
  if (!dashboard?.dailyStats) {
    return [];
  }

  return range === "30"
    ? dashboard.dailyStats.last30Days || []
    : dashboard.dailyStats.last7Days || [];
}

function SummaryCard({ label, value, subtext, wide = false, accent }) {
  return (
    <article
      className={[
        "dashboard-summary-card",
        wide && "dashboard-summary-card--wide",
      ]
        .filter(Boolean)
        .join(" ")}
      style={accent ? { "--dashboard-accent": accent } : undefined}
    >
      <span className="dashboard-summary-label">{label}</span>
      <strong className="dashboard-summary-value">{value}</strong>
      {subtext && <p className="dashboard-summary-subtext">{subtext}</p>}
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  data,
  barColor,
  horizontal = false,
  valueFormatter,
  emptyText,
  isDaysChart = false,
}) {
  const chartData = Array.isArray(data) ? data : [];
  const style = isDaysChart ? { borderTopRightRadius: "0px" } : {};
  return (
    <article className="dashboard-chart-card" style={style}>
      <div className="dashboard-chart-header">
        <div>
          <p className="dashboard-chart-eyebrow">{subtitle}</p>
          <h3 className="dashboard-chart-title">{title}</h3>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="dashboard-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            {horizontal ? (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 20, bottom: 8, left: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <Tooltip
                  formatter={(value) => [
                    valueFormatter ? valueFormatter(value) : value,
                    title,
                  ]}
                />
                <Bar
                  dataKey="value"
                  name={title}
                  fill={barColor}
                  radius={[0, 10, 10, 0]}
                  barSize={20}
                />
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 28, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [
                    valueFormatter ? valueFormatter(value) : value,
                    title,
                  ]}
                />
                <Bar
                  dataKey="value"
                  name={title}
                  fill={barColor}
                  radius={[10, 10, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-empty-state">{emptyText}</div>
      )}
    </article>
  );
}

function Profile() {
  const navigate = useNavigate();
  const profileImageInputRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [actionError, setActionError] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [dashboardRange, setDashboardRange] = useState("7");
  const [editForm, setEditForm] = useState({
    username: "",
    birthDate: "",
    userType: "",
  });

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await getMemberInfo();

      if (!response?.success) {
        throw new Error(response?.message || "프로필 조회에 실패했습니다.");
      }

      const profile = response.data;
      setUserProfile(profile);
      setEditForm(mapProfileToEditForm(profile));
      dispatchProfileChange(profile);
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        setProfileError("인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        setProfileError(requestError.message || "프로필 조회에 실패했습니다.");
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const response = await getDashboard();

      if (!response?.success) {
        throw new Error(response?.message || "대시보드 조회에 실패했습니다.");
      }

      setDashboard(response.data || null);
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        setDashboardError("인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        setDashboardError(
          requestError.message || "대시보드 조회에 실패했습니다.",
        );
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleProfileImageButtonClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setProfileImageError("");
    setUploadingProfileImage(true);

    try {
      const profileImage = await readFileAsDataUrl(file);
      const response = await uploadProfileImage(profileImage);

      if (!response?.success) {
        throw new Error(
          response?.message || "프로필 이미지 업로드에 실패했습니다.",
        );
      }

      await loadProfile();
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        clearAuthTokens();
        alert("인증이 필요합니다. 다시 로그인해주세요.");
        navigate("/login");
        return;
      }

      setProfileImageError(
        requestError.message || "프로필 이미지 업로드에 실패했습니다.",
      );
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "정말 회원 탈퇴하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없습니다.",
    );

    if (!confirmed) {
      return;
    }

    setWithdrawing(true);
    setActionError("");

    try {
      const response = await deleteMyAccount();

      if (!response?.success) {
        throw new Error(response?.message || "회원 탈퇴에 실패했습니다.");
      }

      clearAuthTokens();
      alert("회원 탈퇴가 완료되었습니다.");
      navigate("/login");
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        clearAuthTokens();
        alert("인증이 필요합니다. 다시 로그인해주세요.");
        navigate("/login");
      } else {
        setActionError(requestError.message || "회원 탈퇴에 실패했습니다.");
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSaveProfile = async () => {
    const trimmedUsername = editForm.username.trim();

    if (!trimmedUsername) {
      setActionError("이름을 입력해주세요.");
      return;
    }

    if (!editForm.birthDate) {
      setActionError("생년월일을 입력해주세요.");
      return;
    }

    if (!editForm.userType) {
      setActionError("직업을 선택해주세요.");
      return;
    }

    setSavingProfile(true);
    setActionError("");

    try {
      const response = await updateMyProfile({
        username: trimmedUsername,
        birthDate: editForm.birthDate,
        userType: editForm.userType,
      });

      if (!response?.success) {
        throw new Error(response?.message || "회원 정보 수정에 실패했습니다.");
      }

      setIsEditing(false);
      await loadProfile();
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        clearAuthTokens();
        alert("인증이 필요합니다. 다시 로그인해주세요.");
        navigate("/login");
      } else {
        setActionError(
          requestError.message || "회원 정보 수정에 실패했습니다.",
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setActionError("");
    setEditForm(mapProfileToEditForm(userProfile));
  };

  useEffect(() => {
    loadProfile();
    loadDashboard();
  }, []);

  const displayName =
    userProfile?.username || userProfile?.nickname || "사용자";
  const dashboardSummary = dashboard || {};
  const todayStats = dashboardSummary.todayStats || {};
  const progress = dashboardSummary.progress || {};
  const streak = dashboardSummary.streak || {};
  const score = dashboardSummary.score || {};
  const dailyItems = getDashboardDailyItems(dashboardSummary, dashboardRange);
  const dailyChartData = useMemo(
    () => buildDailyChart(dailyItems),
    [dailyItems],
  );
  const weakWordChartData = useMemo(
    () => buildChartWords(dashboardSummary.weakWords, "wrongRate"),
    [dashboardSummary.weakWords],
  );
  const topWrongWordChartData = useMemo(
    () => buildChartWords(dashboardSummary.topWrongWords, "wrongCount"),
    [dashboardSummary.topWrongWords],
  );
  const topCorrectWordChartData = useMemo(
    () => buildChartWords(dashboardSummary.topCorrectWords, "correctCount"),
    [dashboardSummary.topCorrectWords],
  );
  const progressPercent =
    Number(progress.totalWordCount) > 0
      ? Math.min(
          100,
          (Number(progress.studiedWordCount) /
            Number(progress.totalWordCount)) *
            100,
        )
      : 0;

  if (profileLoading) {
    return (
      <div className="profile-shell">
        <p>프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="profile-shell">
        <p role="alert">{profileError}</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-shell">
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {(!userProfile?.userType || !userProfile?.birthDate) && (
        <div className="profile-complete-banner">
          프로필을 완성하기 위해 생년월일과 직업을 입력해주세요.
        </div>
      )}

      <div className="profile-card">
        <div className="profile-banner">
          <div className="profile-banner-overlay" />
        </div>

        <div className="profile-body">
          <div className="profile-header-row">
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrap profile-avatar-media">
                <DefaultProfile
                  src={userProfile.profileImage || ""}
                  alt={`${displayName} 프로필 사진`}
                  width={100}
                  height={100}
                />
                {isEditing && (
                  <div className="profile-avatar-edit-wrap">
                    <button
                      type="button"
                      className="profile-avatar-upload-btn"
                      onClick={handleProfileImageButtonClick}
                      disabled={uploadingProfileImage}
                    >
                      {uploadingProfileImage ? "업로드 중..." : "사진 변경"}
                    </button>
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      className="profile-avatar-file-input"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                )}
              </div>
              <div className="profile-name-row">
                <div className="profile-name-block">
                {isEditing ? (
                  <input
                    className="profile-input-name"
                    value={editForm.username}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        username: event.target.value,
                      }))
                    }
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <p className="profile-display-name">{displayName}</p>
                )}
              </div>
              <div className="profile-job-block">
                {isEditing ? (
                  <select
                    className="profile-select-job"
                    value={editForm.userType}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        userType: event.target.value,
                      }))
                    }
                  >
                    <option value="">선택하세요</option>
                    {USER_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="profile-job-badge">
                    {getUserTypeLabel(userProfile.userType)}
                  </span>
                )}
              </div>
              </div>
            </div>

            <div className="profile-actions-col">
              <div className="profile-actions-row">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      className="profile-btn-edit"
                      onClick={() => {
                        setActionError("");
                        setEditForm(mapProfileToEditForm(userProfile));
                        setIsEditing(true);
                      }}
                    >
                      프로필 수정
                    </button>
                    <button
                      type="button"
                      className="profile-btn-pwc"
                      onClick={() => navigate("/pwc")}
                    >
                      비밀번호 변경
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="profile-btn-cancel"
                      onClick={handleCancelEdit}
                      disabled={savingProfile}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="profile-btn-save"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "저장 중..." : "저장"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="profile-btn-withdraw"
                  onClick={handleDeleteAccount}
                  disabled={withdrawing || savingProfile}
                >
                  {withdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-details">
            {actionError && (
              <div role="alert" className="profile-action-error">
                {actionError}
              </div>
            )}
            {profileImageError && (
              <div role="alert" className="profile-action-error">
                {profileImageError}
              </div>
            )}
            <div className="profile-detail-row">
              <span className="profile-detail-label">생년월일</span>
              {isEditing ? (
                <input
                  className="profile-input-date"
                  type="date"
                  value={editForm.birthDate}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      birthDate: event.target.value,
                    }))
                  }
                />
              ) : (
                <span className="profile-detail-value">
                  {userProfile.birthDate || userProfile.birth || "미설정"}
                </span>
              )}
            </div>
            <div className="profile-detail-row profile-detail-row--tight">
              <span className="profile-detail-label">이메일</span>
              <span className="profile-detail-value">{userProfile.email}</span>
            </div>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">학습 대시보드</p>
              <h2 className="dashboard-title">오늘의 학습 현황</h2>
            </div>
          </div>

          {dashboardError ? (
            <div role="alert" className="dashboard-error">
              {dashboardError}
            </div>
          ) : dashboardLoading ? (
            <div className="dashboard-loading">
              대시보드를 불러오는 중입니다...
            </div>
          ) : (
            <>
              <div className="dashboard-summary-grid">
                <SummaryCard
                  label="오늘 학습한 단어 수"
                  value={formatNumber(todayStats.studiedWordCount)}
                  subtext=""
                  accent={CHART_COLORS.daily}
                />
                <SummaryCard
                  label="평균 정답률"
                  value={formatRate(todayStats.avgCorrectRate)}
                  subtext=""
                  accent={CHART_COLORS.correct}
                />
                <SummaryCard
                  label="연속 학습 일수"
                  value={formatNumber(streak.currentStreak)}
                  subtext=""
                  accent={CHART_COLORS.weak}
                />
                <SummaryCard
                  label="사용자 점수"
                  value={formatNumber(score.score)}
                  subtext=""
                  accent={CHART_COLORS.wrong}
                />
              </div>

              <article className="dashboard-progress-card">
                <div className="dashboard-progress-copy">
                  <span className="dashboard-summary-label">
                    전체 단어 수 대비 누적 학습 단어 수
                  </span>
                  <strong className="dashboard-progress-value">
                    {formatNumber(progress.studiedWordCount)} /{" "}
                    {formatNumber(progress.totalWordCount)}
                  </strong>
                </div>
                <div className="dashboard-progress-track" aria-hidden="true">
                  <span
                    className="dashboard-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </article>

              <div className="dashboard-chart-grid">
                <ChartCard
                  title="오답률 기준 취약 단어"
                  data={weakWordChartData}
                  barColor={CHART_COLORS.weak}
                  horizontal
                  valueFormatter={formatRate}
                  emptyText="취약 단어 데이터가 없습니다."
                />
                <ChartCard
                  title="틀린 횟수 기준 많이 틀린 단어"
                  data={topWrongWordChartData}
                  barColor={CHART_COLORS.wrong}
                  horizontal
                  valueFormatter={formatNumber}
                  emptyText="오답 단어 데이터가 없습니다."
                />
                <ChartCard
                  title="맞은 횟수 기준 많이 맞은 단어"
                  data={topCorrectWordChartData}
                  barColor={CHART_COLORS.correct}
                  horizontal
                  valueFormatter={formatNumber}
                  emptyText="정답 단어 데이터가 없습니다."
                />
              </div>
              <div className="dashboard-range-container">
                <div
                  className="dashboard-range-toggle"
                  role="tablist"
                  aria-label="학습량 기간 선택"
                >
                  {DAILY_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        "dashboard-range-button",
                        dashboardRange === option.value &&
                          "dashboard-range-button--active",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setDashboardRange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <ChartCard
                title="날짜별 학습량"
                data={dailyChartData}
                barColor={CHART_COLORS.daily}
                valueFormatter={formatNumber}
                emptyText="날짜별 학습 데이터가 없습니다."
                isDaysChart={true}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Profile;
