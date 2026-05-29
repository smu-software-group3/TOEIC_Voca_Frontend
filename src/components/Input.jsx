import React from "react";

export function Input({ placeholder, value, onChange, type, style, ...props }) {
  // 공통 입력 스타일을 적용하고 필요하면 추가 props를 그대로 전달한다.
  return (
    <input
      type={type || "text"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
      style={{
        padding: "12px 16px",
        border: "1.5px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "15px",
        color: "#1f2937",
        outline: "none",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}
