import React, { useEffect, useState } from "react";
import { getWords } from "../../api/server";
import { Input } from "../../components/Input";
import {
  difficultyBadgeClass,
  difficultyColor,
  translateDifficulty,
} from "../../utils/difficulty";
import "../../styles/difficultyBadge.css";
import "./Word.css";

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
    <main className="word-page">
      <div className="word-page-inner">
        <h1 className="word-page-title">단어장 조회</h1>
        <p className="word-page-lead">
          키워드, 난이도, 정렬 방식으로 단어장을 조회할 수 있습니다.
        </p>

        <section className="word-page-filter-card">
          <div className="word-page-filter-row">
            <Input
              placeholder="검색어를 입력하세요 (예: app)"
              value={spelling}
              onChange={handleFilterChange(setSpelling)}
              autoComplete="off"
              className="word-page-search-input"
            />

            <select
              value={difficulty}
              onChange={handleFilterChange(setDifficulty)}
              className="word-page-select"
            >
              <option value="">전체</option>
              <option value="EASY">쉬움</option>
              <option value="MEDIUM">중간</option>
              <option value="HARD">어려움</option>
            </select>

            <select
              value={sort}
              onChange={handleFilterChange(setSort)}
              className="word-page-select"
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </section>

        {error && (
          <p role="alert" className="word-page-error">
            {error}
          </p>
        )}

        <section>
          <div className="word-page-results-head">
            <h2 className="word-page-results-title">조회 결과</h2>
            <div className="word-page-results-meta">
              총 {totalElements}개 · {totalPages}페이지
            </div>
          </div>
          {loading && <p>조회 중입니다...</p>}
          <ul className="word-page-list">
            {words.length > 0
              ? words.map((item) => (
                  <li
                    key={item.wordId}
                    className="word-page-card"
                    style={{
                      "--word-accent": difficultyColor(item.difficulty),
                    }}
                  >
                    <div>
                      <div className="word-page-spelling">{item.spelling}</div>
                      <div className="word-page-meaning">{item.meaning}</div>
                    </div>
                    <div className="word-page-badge-wrap">
                      <span className={difficultyBadgeClass(item.difficulty)}>
                        {translateDifficulty(item.difficulty)}
                      </span>
                    </div>
                  </li>
                ))
              : !loading && (
                  <li className="word-page-empty">조회 결과가 없습니다.</li>
                )}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default Word;
