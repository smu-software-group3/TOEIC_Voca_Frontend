import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberInfo } from "../../api/server";
import { useAuth } from "../../contexts/AuthContext";
import "./Home.css";

export default function Home() {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let mounted = true;

		async function fetch() {
			setLoading(true);
			setError("");
			// 로그인 여부 확인; 비로그인 시 API 호출 건너뜀
			if (!isAuthenticated) {
				if (mounted) {
					setLoading(false);
				}
				return;
			}
			try {
				const response = await getMemberInfo();
				if (!response?.success) {
					throw new Error(response?.message || "회원 정보 조회에 실패했습니다.");
				}

				if (mounted) setUserProfile(response.data);
			} catch (err) {
				if (!mounted) {
					return;
				}

				if (err.code === "UNAUTHORIZED") {
					setError("인증이 필요합니다. 로그인 후 이용해주세요.");
				} else {
					setError(err.message || "회원 정보 조회에 실패했습니다.");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		}

		fetch();

		return () => {
			mounted = false;
		};
	}, [isAuthenticated]);

	if (loading) {
		return (
			<div
				style={{
					background:
						"linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					boxSizing: "border-box",
					width: "100%",
				}}
			>
				<p>불러오는 중...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					background:
						"linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
					height: "100vh",
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

	const displayName = userProfile?.username || userProfile?.nickname || "사용자";

	return (
		<div
			style={{
				background:
					"linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
				minHeight: "100vh",
				boxSizing: "border-box",
				padding: "28px",
				display: "flex",
				justifyContent: "center",
			}}
		>
			<div style={{ width: "100%", maxWidth: "980px" }}>
				<div
					style={{
						background: "rgba(255,255,255,0.9)",
						borderRadius: "16px",
						padding: "28px",
						boxShadow: "0 8px 32px rgba(124, 58, 237, 0.08)",
						marginBottom: "18px",
					}}
				>
					{isAuthenticated ? (
						<h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
							{displayName}님, 환영합니다.
						</h1>
					) : (
						<h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
							VocaStats에 오신 것을 환영합니다.
						</h1>
					)}
					<p style={{ marginTop: "8px", color: "#6b7280" }}>
						VOCA STATS에 오신 것을 환영합니다. 오늘의 학습을 시작해보세요.
					</p>

					{/* 비로그인 사용자에게는 경고 배너를 노출 */}
					{!isAuthenticated && (
						<div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(253,230,230,0.9)", border: "1px solid rgba(220,38,38,0.12)", color: "#7f1d1d" }} role="alert">
							로그인이 필요합니다. 일부 기능은 로그인 후에 이용할 수 있습니다. 
							<button onClick={() => navigate('/login')} style={{ marginLeft: 12, padding: "6px 10px", borderRadius: 8, border: "none", background: "#6d28d9", color: "#fff", cursor: "pointer" }}>로그인</button>
							<button onClick={() => navigate('/register')} style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(92,63,164,0.12)", background: "transparent", color: "#4c1d95", cursor: "pointer" }}>회원가입</button>
						</div>
					)}

					<div style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
						<button
							onClick={() => navigate(isAuthenticated ? '/word' : '/login')}
							style={{ padding: "10px 14px", borderRadius: "10px", border: "none", background: "#6d28d9", color: "#fff", cursor: "pointer" }}
						>
							내 단어장
						</button>
						<button
							onClick={() => navigate(isAuthenticated ? '/wtest' : '/login')}
							style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(13,148,136,0.12)", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", cursor: "pointer" }}
						>
							오늘의 테스트 시작
						</button>
						<button
							onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
							style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(92,63,164,0.12)", background: "transparent", color: "#4c1d95", cursor: "pointer" }}
						>
							내 프로필 보기
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

