import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberInfo } from "../api/server";

function Profile() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 서버에서 사용자 프로필 정보를 조회한다.
  useEffect(() => {
    const fetchMemberInfo = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getMemberInfo();

        if (!response?.success) {
          throw new Error(response?.message || "프로필 조회에 실패했습니다.");
        }

        setUserProfile(response.data);
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

    fetchMemberInfo();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>프로필</h1>
        <p>프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>프로필</h1>
        <p role="alert">{error}</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div>
        <h1>프로필</h1>
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>프로필</h1>
      <h2>사용자 정보</h2>
      <ul>
        <li>닉네임: {userProfile.nickname}</li>
        <li>생년월일: {userProfile.birth}</li>
        <li>직업: {userProfile.job}</li>
        <li>이메일: {userProfile.email}</li>
        <li>이메일 인증: {userProfile.emailVerified ? "완료" : "미완료"}</li>
      </ul>
      <button onClick={() => navigate("/pwc")}>비밀번호 변경</button>
    </div>
  );
}

export default Profile;
