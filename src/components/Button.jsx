import React from "react";

export function Button({
  buttonText,
  onClick,
  type = "submit",
  style,
  disabled,
  ...props
}) {
  // 버튼의 기본 시각 스타일과 비활성화 상태를 공통으로 처리한다.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
      style={{
        width: "100%",
        padding: "14px",
        backgroundColor: "#3d1a7a",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        opacity: disabled ? 0.65 : 1,
        ...style,
      }}
    >
      {buttonText}
    </button>
  );
}
