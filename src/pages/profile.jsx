import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthTokens,
  deleteMyAccount,
  getMemberInfo,
  updateMyProfile,
} from "../api/server";

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
      <div
        style={{
          background:
            "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <p>프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background:
            "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <p role="alert">{error}</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div
        style={{
          background:
            "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 표시 이름과 아바타 첫 글자를 계산한다.
  const displayName = userProfile.username || userProfile.nickname || "사용자";
  const firstChar = displayName.charAt(0) || "사";

  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden",
        padding: "28px 0",
        position: "relative",
      }}
    >
      {/* 성운 블롭 (밝은 버전) */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(94, 234, 212, 0.15) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "5%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(45, 212, 191, 0.25) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: "5%",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(196, 181, 253, 0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      ></div>

      {/* 별들 */}
      {[
        {
          top: "8%",
          left: "18%",
          size: "2px",
          opacity: 0.4,
          color: "#6d28d9",
        },
        {
          top: "14%",
          left: "55%",
          size: "3px",
          opacity: 0.35,
          color: "#7c3aed",
          glow: true,
        },
        {
          top: "22%",
          left: "80%",
          size: "2px",
          opacity: 0.3,
          color: "#0d9488",
        },
        {
          top: "60%",
          left: "12%",
          size: "2px",
          opacity: 0.3,
          color: "#6d28d9",
        },
        {
          top: "70%",
          left: "88%",
          size: "3px",
          opacity: 0.4,
          color: "#0d9488",
          glow: true,
        },
        {
          top: "85%",
          left: "50%",
          size: "2px",
          opacity: 0.3,
          color: "#7c3aed",
        },
        {
          top: "45%",
          left: "95%",
          size: "2px",
          opacity: 0.35,
          color: "#4c1d95",
        },
      ].map((star, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: star.color,
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            boxShadow: star.glow ? `0 0 4px ${star.color}` : "none",
          }}
        ></div>
      ))}

      {/* 추가 정보 입력 메시지 */}
      {(!userProfile?.userType || !userProfile?.birthDate) && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "12px",
            color: "#6b21a8",
            fontSize: "14px",
            fontWeight: "600",
            textAlign: "center",
            maxWidth: "620px",
          }}
        >
          프로필을 완성하기 위해 생년월일과 직업을 입력해주세요.
        </div>
      )}

      {/* 프로필 카드 */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          borderRadius: "20px",
          border: "0.5px solid rgba(139, 92, 246, 0.2)",
          overflow: "hidden",
          maxWidth: "620px",
          width: "100%",
          position: "relative",
          boxShadow: "0 8px 32px rgba(124, 58, 237, 0.15)",
        }}
      >
        {/* 배너 */}
        <div
          style={{
            height: "90px",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(120deg, #312e81 0%, #5b21b6 35%, #0f766e 75%, #1e3a5f 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(167, 139, 250, 0.4) 0%, rgba(45, 212, 191, 0.25) 60%, transparent 100%)",
            }}
          ></div>
          {/* 행성 링 */}
          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "50px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "1.5px solid rgba(196, 181, 253, 0.4)",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              top: "-15px",
              right: "60px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "1px solid rgba(94, 234, 212, 0.3)",
            }}
          ></div>
        </div>

        {/* 프로필 정보 */}
        <div style={{ padding: "0 24px 26px", position: "relative" }}>
          {/* 아바타 + 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginTop: "-30px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #0d9488)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #fff",
                  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
                }}
              >
                <span
                  style={{
                    fontSize: "21px",
                    fontWeight: "700",
                    color: "#fff",
                  }}
                >
                  {firstChar}
                </span>
              </div>
            </div>
            <div style={{ paddingTop: "10px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setActionError("");
                        setEditForm(mapProfileToEditForm(userProfile));
                        setIsEditing(true);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
                        borderRadius: "9px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(124, 58, 237, 0.2)",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      프로필 수정
                    </button>
                    <button
                      onClick={() => navigate("/pwc")}
                      style={{
                        background: "linear-gradient(135deg, #4c1d95, #0f766e)",
                        borderRadius: "9px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(124, 58, 237, 0.2)",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      비밀번호 변경
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingProfile}
                      style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "9px",
                        padding: "8px 14px",
                        cursor: savingProfile ? "default" : "pointer",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#5b21b6",
                        opacity: savingProfile ? 0.7 : 1,
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      style={{
                        background: "linear-gradient(135deg, #0d9488, #0f766e)",
                        borderRadius: "9px",
                        padding: "8px 14px",
                        cursor: savingProfile ? "default" : "pointer",
                        boxShadow: "0 2px 10px rgba(13, 148, 136, 0.2)",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#fff",
                        opacity: savingProfile ? 0.7 : 1,
                      }}
                    >
                      {savingProfile ? "저장 중..." : "저장"}
                    </button>
                  </>
                )}
                <button
                  onClick={handleDeleteAccount}
                  disabled={withdrawing || savingProfile}
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    borderRadius: "9px",
                    padding: "8px 14px",
                    cursor:
                      withdrawing || savingProfile ? "default" : "pointer",
                    boxShadow: "0 2px 10px rgba(220, 38, 38, 0.2)",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#fff",
                    transition: "all 0.2s ease",
                    opacity: withdrawing || savingProfile ? 0.7 : 1,
                  }}
                >
                  {withdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
                </button>
              </div>
            </div>
          </div>

          {/* 이름 */}
          <div style={{ marginBottom: "3px" }}>
            {isEditing ? (
              <input
                value={editForm.username}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                placeholder="이름을 입력하세요"
                style={{
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e1b4b",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.85)",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <p
                style={{
                  fontSize: "19px",
                  fontWeight: "700",
                  color: "#1e1b4b",
                }}
              >
                {displayName}
              </p>
            )}
          </div>

          {/* 직업 */}
          <div style={{ marginBottom: "16px" }}>
            {isEditing ? (
              <select
                value={editForm.userType}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    userType: event.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  fontSize: "13px",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.85)",
                  color: "#1e1b4b",
                  boxSizing: "border-box",
                }}
              >
                <option value="">선택하세요</option>
                {USER_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(90deg, rgba(124, 58, 237, 0.15), rgba(13, 148, 136, 0.1))",
                  color: "#6b21a8",
                }}
              >
                {getUserTypeLabel(userProfile.userType)}
              </span>
            )}
          </div>

          {/* 사용자 정보 */}
          <div
            style={{
              borderTop: "0.5px solid rgba(139, 92, 246, 0.1)",
              paddingTop: "16px",
            }}
          >
            {actionError && (
              <div
                role="alert"
                style={{
                  marginBottom: "12px",
                  fontSize: "13px",
                  color: "#b91c1c",
                  fontWeight: "600",
                }}
              >
                {actionError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "11px",
                borderBottom: "0.5px solid rgba(139, 92, 246, 0.1)",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                생년월일
              </span>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      birthDate: event.target.value,
                    }))
                  }
                  style={{
                    fontSize: "13px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    color: "#1e1b4b",
                    background: "rgba(255,255,255,0.85)",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1e1b4b",
                  }}
                >
                  {userProfile.birthDate || userProfile.birth || "미설정"}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "11px",
                paddingTop: "11px",
                borderBottom: "0.5px solid rgba(139, 92, 246, 0.1)",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748b" }}>이메일</span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e1b4b",
                }}
              >
                {userProfile.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
