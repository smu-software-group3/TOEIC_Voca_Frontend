import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, verifyEmail } from "../api/server";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await signup(email.trim(), password, confirmPassword);
      setMessage(
        "회원가입이 완료되었습니다. 이메일로 받은 인증 코드를 입력해주세요.",
      );
      setRegistrationComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "회원가입 요청에 실패했습니다.");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await verifyEmail(email.trim(), verificationCode.trim());
      setMessage("이메일 인증이 완료되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "이메일 인증 요청에 실패했습니다.");
    }
  };

  return (
    <div className="register-page">
      <h1>회원가입</h1>
      {!registrationComplete ? (
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
          <div>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" buttonText = "회원가입" />
        </Form>
      ) : (
        <Form onSubmit={handleVerify}>
          <div>
            <label htmlFor="email">이메일</label>
            <Input id="email" type="email" value={email} disabled />
          </div>
          <div>
            <label htmlFor="verificationCode">인증 코드</label>
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </div>
          <Button type="submit" buttonText = "인증 완료" />
        </Form>
      )}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
