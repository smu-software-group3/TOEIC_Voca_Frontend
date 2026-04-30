import React from "react";

export function Form({ onSubmit, children, className, style, ...props }) {
  return (
    <form
      onSubmit={onSubmit}
      className={className}
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
        ...style,
      }}
    >
      {children}
    </form>
  );
}
