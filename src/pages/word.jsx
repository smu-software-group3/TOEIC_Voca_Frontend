import React, { useEffect, useState } from "react";
import { getWords } from "../api/server";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

// map difficulty to a color for visual display
function difficultyColor(difficulty) {
  switch (difficulty) {
    case "HARD":
      return "#ef4444"; // red
    case "MEDIUM":
      return "#f59e0b"; // yellow
    case "EASY":
      return "#10b981"; // green
    default:
      return "#94a3b8"; // gray
  }
}

// 정렬 문자열을 서버 형식(spelling,asc)으로 조합한다.
function makeSortValue(sortField, sortOrder) {
  return `${sortField},${sortOrder}`;
}

// difficulty 값을 한국어로 변환해 반환한다.
function translateDifficulty(difficulty) {
  const difficultyMap = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return difficultyMap[difficulty] || difficulty;
}

function Word() {
  const [keyword, setKeyword] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sortField, setSortField] = useState("spelling");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [words, setWords] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getWords({
          keyword: keyword.trim(),
          difficulty,
          page,
          size,
          sort: makeSortValue(sortField, sortOrder),
        });

        if (!response?.success) {
          throw new Error(
            response?.message || "단어장 조회 요청에 실패했습니다.",
          );
        }

        const pageData = response.data || {};
        setWords(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
      } catch (requestError) {
        if (requestError.code === "UNAUTHORIZED") {
          setError("인증이 필요합니다. 다시 로그인해주세요.");
        } else {
          setError(requestError.message || "단어장 조회 요청에 실패했습니다.");
        }

        setWords([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [keyword, difficulty, sortField, sortOrder, page, size]);

  const handlePrevPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () =>
    setPage((prev) =>
      totalPages === 0 ? prev : Math.min(totalPages, prev + 1),
    );

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
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
              value={keyword}
              onChange={handleFilterChange(setKeyword)}
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
              value={sortField}
              onChange={handleFilterChange(setSortField)}
              style={{ padding: "10px", borderRadius: 8 }}
            >
              <option value="spelling">철자</option>
              <option value="difficulty">난이도</option>
            </select>

            <select
              value={sortOrder}
              onChange={handleFilterChange(setSortOrder)}
              style={{ padding: "10px", borderRadius: 8 }}
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>

            <Button
              type="button"
              buttonText="검색"
              onClick={() => setPage(1)}
              disabled={loading}
              style={{ width: 92 }}
            />
          </div>
        </section>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}
        {loading && <p>조회 중입니다...</p>}

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
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 18,
                          background: difficultyColor(item.difficulty),
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
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

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button
              type="button"
              buttonText="이전"
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
            />
            <Button
              type="button"
              buttonText="다음"
              onClick={handleNextPage}
              disabled={loading || totalPages === 0 || page >= totalPages}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default Word;
