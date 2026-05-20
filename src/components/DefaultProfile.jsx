import React from "react";

export default function DefaultProfile({ src, alt, width = 60, height = 60, borderWidth = 4, className }) {
  if (src) {
    const imgStyle = {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover",
    };

    return (
      <span
        className={className}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: "50%",
          border: `${borderWidth}px solid #fff`,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
          flexShrink: 0,
          aspectRatio: "1 / 1",
        }}
        aria-hidden="true"
      >
        <img style={{ ...imgStyle }} src={src} alt={alt || "프로필 사진"} />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "50%",
        border: `${borderWidth}px solid #fff` ,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
        backgroundColor: "#e5e7eb",
        flexShrink: 0,
        aspectRatio: "1 / 1",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </span>
  );
}
