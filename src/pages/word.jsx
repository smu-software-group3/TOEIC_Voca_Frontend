import React, { useEffect, useState } from "react";
import { getWords } from "../api/server";
import { Input } from "../components/Input";
import {
  difficultyBadgeClass,
  difficultyColor,
  translateDifficulty,
} from "../utils/difficulty";
import "../styles/difficultyBadge.css";

function Word() {
  const [spelling, setSpelling] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("asc");
  const [words, setWords] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setWords([]);

    const timer = setTimeout(() => {
      const fetchWords = async () => {
        setError("");
        try {
          const response = await getWords({
            spelling: spelling.trim(),
            difficulty,
            sort,
          });

          if (!response?.success) {
            throw new Error(
              response?.message || "단어장 조회 요청에 실패했습니다.",
            );
          }

          const pageData = response.data || {};
          setWords(pageData || []);
          setTotalElements(pageData.totalElements || 0);
        } catch (requestError) {
          if (requestError.code === "UNAUTHORIZED") {
            setError("인증이 필요합니다. 다시 로그인해주세요.");
          } else {
            setError(
              requestError.message || "단어장 조회 요청에 실패했습니다.",
            );
          }

          setWords([]);
          setTotalPages(0);
          setTotalElements(0);
        } finally {
          setLoading(false);
        }
      };

      fetchWords();
    }, 500); // 500ms 딜레이로 디바운스 처리

    return () => clearTimeout(timer);
  }, [spelling, difficulty, sort]);

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <main
      style={{
        padding: 28,
        background: "linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 6, color: "#000" }}>단어장 조회</h1>
        <p style={{ marginBottom: 18, color: "#000" }}>
          키워드, 난이도, 정렬 방식으로 단어장을 조회할 수 있습니다.
        </p>

        <section
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Input
              placeholder="검색어를 입력하세요 (예: app)"
              value={spelling}
              onChange={handleFilterChange(setSpelling)}
              autoComplete="off"
              style={{ flex: 1 }}
            />

            <select
              value={difficulty}
              onChange={handleFilterChange(setDifficulty)}
              style={{ padding: "10px", borderRadius: 8 }}
            >
              <option value="">전체</option>
              <option value="EASY">쉬움</option>
              <option value="MEDIUM">중간</option>
              <option value="HARD">어려움</option>
            </select>

            <select
              value={sort}
              onChange={handleFilterChange(setSort)}
              style={{ padding: "10px", borderRadius: 8 }}
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </section>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, color: "#000" }}>조회 결과</h2>
            <div style={{ color: "#000" }}>
              총 {totalElements}개 · {totalPages}페이지
            </div>
          </div>
          {loading && <p>조회 중입니다...</p>}
          <ul
            style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}
          >
            {words.length > 0
              ? words.map((item) => (
                  <li
                    key={item.wordId}
                    style={{
                      background: "#fff",
                      padding: 14,
                      borderRadius: 10,
                      boxShadow: "0 4px 12px rgba(2,6,23,0.04)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: `3px solid ${difficultyColor(item.difficulty)}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#4c1d95",
                        }}
                      >
                        {item.spelling}
                      </div>
                      <div style={{ color: "#000", marginTop: 6 }}>
                        {item.meaning}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={difficultyBadgeClass(item.difficulty)}>
                        {translateDifficulty(item.difficulty)}
                      </span>
                    </div>
                  </li>
                ))
              : !loading && (
                  <li style={{ padding: 12, color: "#6b21a8" }}>
                    조회 결과가 없습니다.
                  </li>
                )}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default Word;
