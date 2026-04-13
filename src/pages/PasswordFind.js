import React, { useState } from "react";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { findPassword } from "../api/server";

export default function PasswordFind() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await findPassword(email.trim());

      if (response?.success === true) {
        setMessage("입력한 이메일로 임시 비밀번호가 발송되었습니다.");
        setEmail("");
      } else {
        setError(response?.message || "비밀번호 찾기 요청에 실패했습니다.");
      }
    } catch (err) {
      setError(err.message || "비밀번호 찾기 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <Form onSubmit={handleSubmit}>
        <h2 style={{ margin: 0, textAlign: "center", color: "#111827" }}>
          비밀번호 찾기
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.5,
          }}
        >
          가입한 이메일을 입력하면 임시 비밀번호를 이메일로 발송합니다.
        </p>

        <Input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && (
          <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
            {message}
          </p>
        )}

        <Button buttonText={loading ? "전송 중..." : "임시 비밀번호 발급"} />
      </Form>
    </div>
  );
}
