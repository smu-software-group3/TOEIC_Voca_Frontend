import React, { useState } from "react";

const mockUserProfile = {
  username: "johndoe",
  birthDate: "1995-03-15",
  category: "Standard",
  email: "johndoe@example.com",
};

function Profile() {
  // 서버 응답을 대체하는 mock 프로필 데이터를 현재 화면에 연결한다.
  const [userProfile] = useState(mockUserProfile);

  return (
    <div>
      <h1>프로필</h1>
      <h2>사용자 정보</h2>
      <ul>
        <li>사용자명: {userProfile.username}</li>
        <li>생년월일: {userProfile.birthDate}</li>
        <li>사용자분류: {userProfile.category}</li>
        <li>이메일: {userProfile.email}</li>
      </ul>
    </div>
  );
}

export default Profile;
