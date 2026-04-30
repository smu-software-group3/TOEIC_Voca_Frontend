import React, { useEffect, useState } from "react";
import { getWords } from "../api/server";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

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

  // 필터 값이 바뀌면 서버에 조회 요청을 보내 단어장 데이터를 갱신한다.
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
        console.log("단어장 조회 응답:", response);

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

  // 이전 페이지로 이동하며 첫 페이지에서는 이동을 막는다.
  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(1, prevPage - 1));
  };

  // 다음 페이지로 이동하며 마지막 페이지에서는 이동을 막는다.
  const handleNextPage = () => {
    setPage((prevPage) => {
      if (totalPages === 0) {
        return prevPage;
      }

      return Math.min(totalPages, prevPage + 1);
    });
  };

  // 조회 조건이 바뀌면 첫 페이지부터 다시 조회하도록 페이지를 초기화한다.
  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div>
      <h1>단어장 조회</h1>
      <p>키워드, 난이도, 정렬 방식으로 단어장을 조회할 수 있습니다.</p>

      <div style={{ display: "grid", gap: "12px", maxWidth: "420px" }}>
        <label htmlFor="word-keyword-input">검색어</label>
        <Input
          id="word-keyword-input"
          placeholder="예: app"
          value={keyword}
          onChange={handleFilterChange(setKeyword)}
          autoComplete="off"
        />

        <label htmlFor="word-difficulty-select">난이도</label>
        <select
          id="word-difficulty-select"
          value={difficulty}
          onChange={handleFilterChange(setDifficulty)}
        >
          <option value="">전체</option>
          <option value="EASY">쉬움</option>
          <option value="MEDIUM">중간</option>
          <option value="HARD">어려움</option>
        </select>

        <label htmlFor="word-sort-field-select">정렬 기준</label>
        <select
          id="word-sort-field-select"
          value={sortField}
          onChange={handleFilterChange(setSortField)}
        >
          <option value="spelling">철자</option>
          <option value="difficulty">난이도</option>
        </select>

        <label htmlFor="word-sort-order-select">정렬 방향</label>
        <select
          id="word-sort-order-select"
          value={sortOrder}
          onChange={handleFilterChange(setSortOrder)}
        >
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
      </div>

      {error && <p role="alert">{error}</p>}
      {loading && <p>조회 중입니다...</p>}

      <h2>조회 결과</h2>
      <p>
        총 {totalElements}개 / 현재 {page}페이지
      </p>

      <ul>
        {words.length > 0
          ? words.map((item) => (
              <li key={item.wordId}>
                {item.spelling} - {item.meaning} ({translateDifficulty(item.difficulty)})
              </li>
            ))
          : !loading && <li>조회 결과가 없습니다.</li>}
      </ul>

      <div style={{ display: "flex", gap: "8px", maxWidth: "420px" }}>
        <Button
          type="button"
          buttonText="이전 페이지"
          onClick={handlePrevPage}
          disabled={page <= 1 || loading}
        />
        <Button
          type="button"
          buttonText="다음 페이지"
          onClick={handleNextPage}
          disabled={loading || totalPages === 0 || page >= totalPages}
        />
      </div>
    </div>
  );
}

export default Word;
