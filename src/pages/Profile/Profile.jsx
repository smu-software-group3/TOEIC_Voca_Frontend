import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthTokens,
  deleteMyAccount,
  getMemberInfo,
  getUserScore,
  uploadProfileImage,
  updateMyProfile,
} from "../../api/server";
import "./Profile.css";
import DefaultProfile from "../../components/DefaultProfile";

const USER_TYPE_OPTIONS = [
  { value: "HIGH_SCHOOL_STUDENT", label: "고등학생" },
  { value: "UNIVERSITY_STUDENT", label: "대학생" },
  { value: "EMPLOYEE", label: "직장인" },
  { value: "JOB_SEEKER", label: "취준생" },
  { value: "SELF_EMPLOYED", label: "자영업자" },
  { value: "OTHER", label: "기타" },
];

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

function Profile() {
  const navigate = useNavigate();
  const profileImageInputRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [scoreError, setScoreError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    birthDate: "",
    userType: "",
  });

  const fetchMemberInfo = async () => {
    setLoading(true);
    setError("");
    setProfileImageError("");
    try {
      const response = await getMemberInfo();

      if (!response?.success) {
        throw new Error(response?.message || "프로필 조회에 실패했습니다.");
      }

      const profile = response.data;
      setUserProfile(profile);
      setEditForm(mapProfileToEditForm(profile));

      try {
        const scoreResponse = await getUserScore();

        if (scoreResponse?.success) {
          setUserScore(scoreResponse.data);
        } else {
          setScoreError(
            scoreResponse?.message || "점수 정보를 불러오지 못했습니다.",
          );
        }
      } catch (scoreRequestError) {
        setScoreError(
          scoreRequestError.message || "점수 정보를 불러오지 못했습니다.",
        );
        // Notify other parts of the app (e.g., navbar) that profile data changed
        try {
          window.dispatchEvent(
            new CustomEvent("profilechange", { detail: profile }),
          );
        } catch (e) {
          // ignore environments that disallow CustomEvent
          try {
            window.dispatchEvent(new Event("profilechange"));
          } catch {}
        }
      }
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        setError("인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        setError(requestError.message || "프로필 조회에 실패했습니다.");
      }
    } finally {
      setLoading(false);
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

      await fetchMemberInfo();
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
      await fetchMemberInfo();
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
    fetchMemberInfo();
  }, []);

  if (loading) {
    return (
      <div className="profile-shell">
        <p>프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-shell">
        <p role="alert">{error}</p>
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

  // 표시 이름과 아바타 첫 글자를 계산한다.
  const displayName = userProfile.username || userProfile.nickname || "사용자";

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
            <div className="profile-avatar-wrap">
              <DefaultProfile
                src={userProfile.profileImage || ""}
                alt={`${displayName} 프로필 사진`}
              />
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
            {userScore && (
              <>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">누적 점수</span>
                  <span className="profile-detail-value">
                    {userScore.score?.toLocaleString()}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">평균 정답률</span>
                  <span className="profile-detail-value">
                    {Math.round((userScore.averageCorrectRate || 0) * 10000) /
                      100}
                    %
                  </span>
                </div>
                <div className="profile-detail-row profile-detail-row--tight">
                  <span className="profile-detail-label">최근 학습</span>
                  <span className="profile-detail-value">
                    {userScore.lastStudiedAt
                      ? new Date(userScore.lastStudiedAt).toLocaleString()
                      : "정보 없음"}
                  </span>
                </div>
              </>
            )}
            {scoreError && (
              <div role="alert" className="profile-action-error">
                {scoreError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
