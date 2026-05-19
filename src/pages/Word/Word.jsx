import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getWords, getBookmarks, toggleBookmark } from "../../api/server";
import { Input } from "../../components/Input";
import {
  difficultyBadgeClass,
  difficultyColor,
  translateDifficulty,
} from "../../utils/difficulty";
import "../../styles/difficultyBadge.css";
import "./Word.css";
import {
  partOfSpeechBadgeClass,
  partOfSpeechColor,
  partOfSpeechToKorean,
} from "../../utils/partOfSpeech";
import img from "../../img/word_tr.png";

const PAGE_SIZE = 8;

function getUniquePartOfSpeechList(word) {
  const meanings = Array.isArray(word?.meanings) ? word.meanings : [];
  const uniquePartOfSpeech = [];

  meanings.forEach((meaning) => {
    const partOfSpeech = meaning?.partOfSpeech;

    if (partOfSpeech && !uniquePartOfSpeech.includes(partOfSpeech)) {
      uniquePartOfSpeech.push(partOfSpeech);
    }
  });

  if (!uniquePartOfSpeech.length) {
    const fallbackPartOfSpeech = word?.partOfSpeech;

    if (fallbackPartOfSpeech) {
      uniquePartOfSpeech.push(fallbackPartOfSpeech);
    }
  }

  return uniquePartOfSpeech;
}

function getDetailedMeanings(word) {
  if (Array.isArray(word?.meanings) && word.meanings.length > 0) {
    return word.meanings;
  }

  if (word?.meaning || word?.partOfSpeech) {
    return [
      {
        meaning: word.meaning || "",
        partOfSpeech: word.partOfSpeech || "",
      },
    ];
  }

  return [];
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) {
    items.push("left-ellipsis");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("right-ellipsis");
  }

  items.push(totalPages);

  return items;
}

function Word() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [allWords, setAllWords] = useState([]);
  const [spelling, setSpelling] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [sort, setSort] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedWord, setSelectedWord] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    const updateViewportFlag = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewportFlag();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewportFlag);

      return () => {
        mediaQuery.removeEventListener("change", updateViewportFlag);
      };
    }

    mediaQuery.addListener(updateViewportFlag);

    return () => {
      mediaQuery.removeListener(updateViewportFlag);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadWords = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getWords({
          spelling: "",
          difficulty: "",
          sort: "asc",
        });

        if (!response?.success) {
          throw new Error(
            response?.message || "단어장 조회 요청에 실패했습니다.",
          );
        }

        if (mounted) {
          setAllWords(Array.isArray(response.data) ? response.data : []);
        }
      } catch (requestError) {
        if (mounted) {
          if (requestError.code === "UNAUTHORIZED") {
            setError("인증이 필요합니다. 다시 로그인해주세요.");
          } else {
            setError(
              requestError.message || "단어장 조회 요청에 실패했습니다.",
            );
          }

          setAllWords([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWords();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadBookmarks = async () => {
      try {
        const response = await getBookmarks();

        if (mounted && response?.success) {
          setBookmarkedIds(
            Array.isArray(response.data)
              ? response.data.map((item) => item.wordId)
              : [],
          );
        }
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        if (requestError.code === "UNAUTHORIZED") {
          setError("인증이 필요합니다. 다시 로그인해주세요.");
        } else {
          setError(
            requestError.message || "즐겨찾기 조회 요청에 실패했습니다.",
          );
        }
      }
    };

    loadBookmarks();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [spelling, difficulty, partOfSpeech, sort, showBookmarksOnly]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // 또는 "smooth"
    });
  }, [currentPage]);

  const filteredWords = useMemo(() => {
    const normalizedSearch = spelling.trim().toLowerCase();

    let result = [...allWords];

    if (normalizedSearch) {
      result = result.filter((word) => {
        const spelled = String(word.spelling || "").toLowerCase();
        const meaningText = Array.isArray(word.meanings)
          ? word.meanings
              .map((item) => item?.meaning || "")
              .join(" ")
              .toLowerCase()
          : String(word.meaning || "").toLowerCase();

        return (
          spelled.includes(normalizedSearch) ||
          meaningText.includes(normalizedSearch)
        );
      });
    }

    if (difficulty) {
      result = result.filter((word) => word.difficulty === difficulty);
    }

    if (partOfSpeech) {
      result = result.filter((word) => {
        const meanings = Array.isArray(word.meanings) ? word.meanings : [];

        return meanings.some(
          (meaning) => meaning.partOfSpeech === partOfSpeech,
        );
      });
    }

    result.sort((a, b) => {
      const compareResult = String(a.spelling || "").localeCompare(
        String(b.spelling || ""),
      );
      return sort === "asc" ? compareResult : -compareResult;
    });

    return result;
  }, [allWords, spelling, difficulty, partOfSpeech, sort]);

  const displayWords = useMemo(() => {
    return showBookmarksOnly
      ? filteredWords.filter((word) => bookmarkedIds.includes(word.wordId))
      : filteredWords;
  }, [filteredWords, showBookmarksOnly, bookmarkedIds]);

  const totalElements = displayWords.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageWords = displayWords.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedWord(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );

  const filteredCount = displayWords.length;
  const hardCount = allWords.filter(
    (word) => word.difficulty === "HARD",
  ).length;
  const selectedWordMeanings = getDetailedMeanings(selectedWord);
  const wordModal = selectedWord
    ? createPortal(
        <div
          className="word-modal-overlay"
          role="presentation"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="word-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="word-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="word-modal-header">
              <div className="word-modal-header-content">
                <p className="word-modal-eyebrow">단어 상세 정보</p>
                <div className="word-modal-wrapper">
                  <h3 id="word-modal-title" className="word-modal-title">
                    {selectedWord.spelling}
                  </h3>
                  <span
                    className={difficultyBadgeClass(selectedWord.difficulty)}
                  >
                    {translateDifficulty(selectedWord.difficulty)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="word-modal-close"
                onClick={() => setSelectedWord(null)}
                aria-label="팝업 닫기"
              >
                ×
              </button>
            </div>

            <div className="word-modal-section">
              <div className="word-modal-label">뜻</div>
              <div className="word-modal-meanings">
                {selectedWordMeanings.map((meaningItem, index) => {
                  const meaningText = meaningItem?.meaning || "-";
                  const meaningPartOfSpeech = meaningItem?.partOfSpeech || "";

                  return (
                    <div
                      key={`${meaningText}-${index}`}
                      className="word-modal-meaning-item"
                    >
                      <div className="word-modal-meaning-index">
                        {index + 1}
                      </div>
                      <div className="word-modal-meaning-body">
                        <div className="word-modal-meaning-text">
                          {meaningText}
                        </div>
                        {meaningPartOfSpeech && (
                          <span
                            className={partOfSpeechBadgeClass(
                              meaningPartOfSpeech,
                            )}
                            style={{
                              "--pos-accent":
                                partOfSpeechColor(meaningPartOfSpeech),
                            }}
                          >
                            {partOfSpeechToKorean(meaningPartOfSpeech)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const handleToggleBookmark = async (wordId) => {
    if (bookmarkLoadingIds.includes(wordId)) {
      return;
    }

    setBookmarkLoadingIds((current) => [...current, wordId]);
    setError("");

    try {
      const response = await toggleBookmark(wordId);
      const nextIds = response.code === "FAVORITE_ADDED"
        ? Array.from(new Set([...bookmarkedIds, wordId]))
        : bookmarkedIds.filter((id) => id !== wordId);

      setBookmarkedIds(nextIds);
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        setError("인증이 필요합니다. 다시 로그인해주세요.");
      } else if (requestError.code === "NOT_FOUND") {
        setError("존재하지 않는 단어입니다.");
      } else {
        setError(
          requestError.message || "즐겨찾기 요청에 실패했습니다.",
        );
      }
    } finally {
      setBookmarkLoadingIds((current) =>
        current.filter((id) => id !== wordId),
      );
    }
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <main className="word-page">
      <div className="word-page-inner fade-slide-up">
        <section className="word-hero-banner">
          <div className="word-hero-inner">
            <div className="word-hero-content">
              <p className="word-hero-eyebrow">VOCASTATS WORD LIST</p>
              <h1 className="word-hero-title">
                단어장을 조회하고
                <br />
                나에게 맞는 단어를 학습해보세요!
              </h1>
              <p className="word-hero-desc">
                단어의 뜻과 난이도를 확인하고 학습 계획을 세워보세요.
              </p>
            </div>

            <div className="word-hero-figure" aria-hidden="true">
              <img src={img} alt="Word Hero" className="word-hero-figure-img" />
            </div>
          </div>
        </section>

        <div className="word-main-layout">
          <section className="word-table-card">
            <div className="word-table-header">
              <div>
                <h2 className="word-table-title">
                  전체 단어 목록 <span>{totalElements.toLocaleString()}개</span>
                </h2>
                <p className="word-table-subtitle">
                  영단어를 클릭하면 상세 정보를 확인할 수 있습니다.
                </p>
              </div>

              <div className="word-filter-row">
                <button
                  type="button"
                  className={[
                    "word-bookmark-filter-btn",
                    showBookmarksOnly && "word-bookmark-filter-btn--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setShowBookmarksOnly((prev) => !prev)}
                >
                  {showBookmarksOnly ? "전체 단어 보기" : "즐겨찾기만 보기"}
                  {` (${bookmarkedIds.length})`}
                </button>

                <select
                  value={partOfSpeech}
                  onChange={handleFilterChange(setPartOfSpeech)}
                  className="word-select"
                >
                  <option value="">품사 전체</option>
                  <option value="NOUN">명사</option>
                  <option value="VERB">동사</option>
                  <option value="ADJECTIVE">형용사</option>
                </select>

                <select
                  value={difficulty}
                  onChange={handleFilterChange(setDifficulty)}
                  className="word-select"
                >
                  <option value="">난이도 전체</option>
                  <option value="EASY">쉬움</option>
                  <option value="MEDIUM">중간</option>
                  <option value="HARD">어려움</option>
                </select>

                <select
                  value={sort}
                  onChange={handleFilterChange(setSort)}
                  className="word-select"
                >
                  <option value="asc">오름차순</option>
                  <option value="desc">내림차순</option>
                </select>
              </div>
            </div>
            <div className="word-search-bar">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <Input
                placeholder="단어 또는 뜻을 검색하세요"
                value={spelling}
                onChange={handleFilterChange(setSpelling)}
                autoComplete="off"
                className="word-search-input"
                style={{
                  border: "none",
                  padding: 0,
                  background: "transparent",
                  boxShadow: "none",
                  borderRadius: 0,
                }}
              />
            </div>

            {error && (
              <p role="alert" className="word-error-text">
                {error}
              </p>
            )}

            <div className="word-table-wrap">
              <table className="word-table">
                {!isMobileViewport && (
                  <colgroup>
                    <col className="word-col-favorite" />
                    <col className="word-col-spelling" />
                    <col className="word-col-meaning" />
                    <col className="word-col-pos" />
                    <col className="word-col-difficulty" />
                  </colgroup>
                )}
                <thead>
                  <tr>
                    <th />
                    <th>단어</th>
                    <th>뜻</th>
                    <th>품사</th>
                    <th className="word-difficulty-header">난이도</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && pageWords.length === 0 ? (
                    <tr>
                      <td className="word-empty-row" colSpan={5}>
                        조회 중입니다...
                      </td>
                    </tr>
                  ) : pageWords.length > 0 ? (
                    pageWords.map((item) => {
                      const partOfSpeechList = getUniquePartOfSpeechList(item);
                      const meaningString = Array.isArray(item.meanings)
                        ? item.meanings
                            .map((m) => m?.meaning || "")
                            .join(", ")
                            .toLowerCase()
                        : String(item.meaning || "").toLowerCase();

                      return (
                        <tr
                          key={item.wordId}
                          className="word-table-row"
                          style={{
                            "--word-accent": difficultyColor(item.difficulty),
                          }}
                        >
                          <td className="word-favorite-cell">
                            <button
                              className={[
                                "word-star-btn",
                                bookmarkedIds.includes(item.wordId) &&
                                  "word-star-btn--active",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              aria-label={
                                bookmarkedIds.includes(item.wordId)
                                  ? "즐겨찾기 해제"
                                  : "즐겨찾기 추가"
                              }
                              type="button"
                              onClick={() => handleToggleBookmark(item.wordId)}
                              disabled={bookmarkLoadingIds.includes(item.wordId)}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={bookmarkedIds.includes(item.wordId) ? "#f59e0b" : "none"}
                                stroke={bookmarkedIds.includes(item.wordId) ? "#f59e0b" : "currentColor"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          </td>
                          <td className="word-spelling-cell">
                            <button
                              type="button"
                              className="word-spelling-button"
                              onClick={() => setSelectedWord(item)}
                            >
                              {item.spelling}
                            </button>
                          </td>
                          <td className="word-meaning-cell">
                            <div className="word-meaning-text">
                              {meaningString || "-"}
                            </div>
                          </td>
                          <td className="word-pos-cell">
                            <div className="word-pos-badges">
                              {partOfSpeechList.length > 0 ? (
                                partOfSpeechList.map((part) => (
                                  <span
                                    key={part}
                                    className={partOfSpeechBadgeClass(part)}
                                    style={{
                                      "--pos-accent": partOfSpeechColor(part),
                                    }}
                                  >
                                    {partOfSpeechToKorean(part)}
                                  </span>
                                ))
                              ) : (
                                <span className="word-pos-empty">-</span>
                              )}
                            </div>
                          </td>
                          <td className="word-difficulty-cell">
                            <span
                              className={difficultyBadgeClass(item.difficulty)}
                            >
                              {translateDifficulty(item.difficulty)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="word-empty-row" colSpan={5}>
                        조회 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredWords.length > 0 && (
              <div className="word-pagination" aria-label="페이지네이션">
                <button
                  type="button"
                  className="word-page-btn word-page-btn--arrow"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                >
                  &#8249;
                </button>

                {paginationItems.map((item) => {
                  if (item === "left-ellipsis" || item === "right-ellipsis") {
                    return (
                      <span key={item} className="word-page-dots">
                        ···
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item}
                      type="button"
                      className={[
                        "word-page-btn",
                        item === safeCurrentPage && "word-page-btn--active",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="word-page-btn word-page-btn--arrow"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                >
                  &#8250;
                </button>
              </div>
            )}
          </section>

          <aside className="word-sidebar">
            <section className="word-side-card">
              <div className="word-side-card-header">
                <div>
                  <p className="word-side-eyebrow">내 학습 현황</p>
                  <h2 className="word-side-title">학습 데이터 요약</h2>
                </div>
                <span className="word-side-count">
                  {filteredCount.toLocaleString()}개
                </span>
              </div>

              <div className="word-stats-row">
                <div className="word-stat-item">
                  <div className="word-stat-icon blue">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="word-stat-label">전체 단어</div>
                  <div className="word-stat-value">
                    {allWords.length.toLocaleString()}개
                  </div>
                </div>

                <div className="word-stat-item">
                  <div className="word-stat-icon green">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="word-stat-label">현재 조회 결과</div>
                  <div className="word-stat-value">
                    {filteredCount.toLocaleString()}개
                  </div>
                </div>

                <div className="word-stat-item">
                  <div className="word-stat-icon gold">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2l3 7h7l-5.5 4 2.1 7L12 16l-6.6 4 2.1-7L2 9h7z" />
                    </svg>
                  </div>
                  <div className="word-stat-label">난이도 참고</div>
                  <div className="word-stat-value">
                    고급 {hardCount.toLocaleString()}개
                  </div>
                </div>
              </div>

              <p className="word-side-note">
                이 영역은 학습 현황 표시용이며 별도의 동작은 추가하지
                않았습니다.
              </p>
            </section>
          </aside>
        </div>

        {wordModal}
      </div>
    </main>
  );
}

export default Word;
