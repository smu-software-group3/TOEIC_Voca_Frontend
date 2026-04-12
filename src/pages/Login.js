import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/server";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      console.log("로그인 응답 데이터:", data);
      if (!data?.data) {
        throw new Error("로그인 토큰을 받지 못했습니다.");
      }
      localStorage.setItem("token", data.token);
      console.log("로그인 성공:", data);
      navigate("/");
      // TODO: 로그인 성공 후 리다이렉트 또는 사용자 상태 저장
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>로그인</h1>
      <Form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">이메일</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          buttonText={loading ? "로그인 중..." : "로그인"}
        />
      </Form>
    </div>
  );
}
