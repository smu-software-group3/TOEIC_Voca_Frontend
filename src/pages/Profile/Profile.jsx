import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthTokens,
  deleteMyAccount,
  getMemberInfo,
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

function Profile() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    birthDate: "",
    userType: "",
  });

  const fetchMemberInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMemberInfo();

      if (!response?.success) {
        throw new Error(response?.message || "프로필 조회에 실패했습니다.");
      }

      const profile = response.data;
      setUserProfile(profile);
      setEditForm(mapProfileToEditForm(profile));
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
  const firstChar = displayName.charAt(0) || "사";

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
              <div className="profile-avatar">
                <DefaultProfile className="profile-avatar-default" />
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
      </div>
    </div>
  );
}

export default Profile;
