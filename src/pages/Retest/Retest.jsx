import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRelearningWords,
  getTodayWrongWords,
  getWeakWords,
} from "../../api/server";
import "./Retest.css";
import {
  partOfSpeechBadgeClass,
  partOfSpeechColor,
  partOfSpeechToKorean,
} from "../../utils/partOfSpeech";
import { difficultyBadgeClass } from "../../utils/difficulty";
import img from "../../img/retest_tr.png";

const LIST_META = {
  "today-wrong": {
    title: "오늘 틀린 단어",
    description: "오늘 틀린 단어들을 다시 확인하고 바로 테스트할 수 있습니다.",
    buttonText: "오늘 틀린 단어 보기",
  },
  weak: {
    title: "취약 단어",
    description:
      "오답률이 높은 취약 단어들을 다시 확인하고 바로 테스트할 수 있습니다.",
    buttonText: "취약 단어 보기",
  },
  "old-relearning": {
    title: "오래된 문제 재학습",
    description:
      "오래 전에 테스트한 단어들을 다시 확인하고 바로 테스트할 수 있습니다.",
    buttonText: "오래된 문제 보기",
  },
};

function icon(type) {
  const iconMap = {
    "today-wrong": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="3" />
        <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="3" />
        <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="3" />
      </svg>
    ),
    weak: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    "old-relearning": (
      <svg
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
    ),
  };
  return iconMap[type] || null;
}

function getPrimaryMeaning(word) {
  return word?.meanings?.[0]?.meaning || word?.meaning || "";
}

function getPrimaryPartOfSpeech(word) {
  return word?.meanings?.[0]?.partOfSpeech || word?.partOfSpeech || "";
}

function translateDifficulty(difficulty) {
  const difficultyMap = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return difficultyMap[difficulty] || difficulty;
}

function Retest() {
  const navigate = useNavigate();
  const { listType, flowType } = useParams();

  const activeListType =
    listType === "weak" ||
    listType === "today-wrong" ||
    listType === "old-relearning"
      ? listType
      : "";
  const activeFlowType =
    flowType === "test" || flowType === "objective" || flowType === "subjective"
      ? flowType
      : "";

  const [todayWrongWords, setTodayWrongWords] = useState([]);
  const [weakWords, setWeakWords] = useState([]);
  const [oldRelearningWords, setOldRelearningWords] = useState([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState("");
  const [, setCurrentIndex] = useState(0);
  const [, setSelectedChoiceId] = useState("");
  const [, setUserAnswer] = useState("");
  const [, setScore] = useState(0);
  const [, setIsFinished] = useState(false);
  const [, setFeedback] = useState("");
  const [, setModePickerOpen] = useState(false);
  const [selectedWeakWordIds, setSelectedWeakWordIds] = useState([]);
  const [, setWeakSelectionOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const activeListWords =
    activeListType === "today-wrong"
      ? todayWrongWords
      : activeListType === "weak"
        ? weakWords
        : oldRelearningWords;
  const activeListMeta = activeListType ? LIST_META[activeListType] : null;

  const isSelectableList =
    activeListType === "today-wrong" ||
    activeListType === "weak" ||
    activeListType === "old-relearning";

  useEffect(() => {
    const loadRetestData = async () => {
      setLoading(true);
      setError("");

      try {
        const [todayResponse, weakResponse, relearningResponse] =
          await Promise.all([
            getTodayWrongWords(),
            getWeakWords({ limit: 10 }),
            getRelearningWords(),
          ]);

        if (!todayResponse?.success) {
          throw new Error(
            todayResponse?.message || "오늘 틀린 단어 조회에 실패했습니다.",
          );
        }

        if (!weakResponse?.success) {
          throw new Error(
            weakResponse?.message || "취약 단어 조회에 실패했습니다.",
          );
        }

        if (!relearningResponse?.success) {
          throw new Error(
            relearningResponse?.message ||
              "오래된 문제 재학습 조회에 실패했습니다.",
          );
        }

        const todayList = Array.isArray(todayResponse.data)
          ? todayResponse.data
          : [];
        const weakList = Array.isArray(weakResponse.data)
          ? weakResponse.data
          : [];
        const relearningList = Array.isArray(relearningResponse.data)
          ? relearningResponse.data
          : [];

        setTodayWrongWords(todayList);
        setWeakWords(weakList);
        setOldRelearningWords(relearningList);
      } catch (requestError) {
        if (requestError.code === "UNAUTHORIZED") {
          setError("인증이 필요합니다. 다시 로그인해주세요.");
        } else if (requestError.code === "NOT_FOUND") {
          setError("요청한 리소스를 찾을 수 없습니다.");
        } else if (requestError.code === "BAD_REQUEST") {
          setError("잘못된 요청입니다.");
        } else {
          setError(
            requestError.message || "재학습 페이지를 불러오지 못했습니다.",
          );
        }

        setTodayWrongWords([]);
        setWeakWords([]);
        setOldRelearningWords([]);
      } finally {
        setLoading(false);
      }
    };

    loadRetestData();
  }, []);

  const activeWords = useMemo(() => {
    if (activeListType === "today-wrong") {
      return todayWrongWords;
    }

    if (activeListType === "weak") {
      return weakWords;
    }

    if (activeListType === "old-relearning") {
      return oldRelearningWords;
    }

    return [];
  }, [activeListType, todayWrongWords, weakWords, oldRelearningWords]);

  const allIds = useMemo(() => {
    if (!isSelectableList) {
      return [];
    }

    return activeWords.map((word) => word.wordId);
  }, [activeWords, isSelectableList]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
    setModePickerOpen(false);
    setSelectedWeakWordIds([]);
    setWeakSelectionOpen(false);
  }, [activeListType, activeFlowType]);

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

  const goToList = (type) => {
    navigate(`/retest/${type}`);
  };

  const handleModePick = (type) => {
    setModePickerOpen(false);
    const wordsToTest =
      isSelectableList && selectedWeakWordIds.length > 0
        ? activeListWords.filter((word) =>
            selectedWeakWordIds.includes(word.wordId),
          )
        : activeListWords;
    if (wordsToTest.length === 0) {
      setError("테스트할 단어가 없습니다.");
      return;
    }
    navigate(`/wtest/${type}`, {
      state: {
        customWords: wordsToTest,
        customReturnPath: `/retest/${activeListType}`,
        customTitle: `${activeListMeta?.title || "재학습"} 테스트`,
      },
    });
  };

  const toggleSelectAll = () => {
    if (!isSelectableList) {
      return;
    }

    setSelectedWeakWordIds((currentIds) => {
      const hasAllSelected =
        allIds.length > 0 &&
        allIds.every((wordId) => currentIds.includes(wordId));

      return hasAllSelected ? [] : [...allIds];
    });
  };

  const toggleWeakWordSelection = (wordId) => {
    if (!isSelectableList) {
      return;
    }

    setSelectedWeakWordIds((currentIds) => {
      if (currentIds.includes(wordId)) {
        return currentIds.filter((currentWordId) => currentWordId !== wordId);
      }

      return [...currentIds, wordId];
    });
  };

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
      const fallbackPartOfSpeech = getPrimaryPartOfSpeech(word);

      if (fallbackPartOfSpeech) {
        uniquePartOfSpeech.push(fallbackPartOfSpeech);
      }
    }

    return uniquePartOfSpeech;
  }

  if (activeListType && !activeFlowType) {
    const listWords = activeListWords;
    const meta = activeListMeta;
    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <div className="page-title-area">
              <div className={`title-icon title-icon-${activeListType}`}>
                {icon(activeListType)}
              </div>
              <div className="title-text">
                <span className="eyebrow">목록 보기</span>
                <h1>{meta.title}</h1>
                <p>{meta.description}</p>
              </div>
            </div>
          </section>

          <div className="retest-toolbar">
            <span className="retest-toolbar-info">
              {activeListWords.length} 문제가 준비되어 있습니다.
            </span>
            <button
              type="button"
              className="retest-toolbar-button"
              onClick={() => navigate("/retest")}
            >
              뒤로
            </button>
          </div>

          <div className="retest-list-container">
            <div className="table-card">
              <table
                className={`retest-table ${isSelectableList ? "retest-table--selectable" : ""}`}
              >
                {!isMobileViewport && (
                  <colgroup>
                    {isSelectableList && <col style={{ width: "40px" }} />}
                    <col style={{ width: "40px" }} />
                    <col />
                    <col style={{ width: "240px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "130px" }} />
                  </colgroup>
                )}
                <thead>
                  <tr>
                    {isSelectableList && (
                      <th>
                        <input
                          type="checkbox"
                          id="allCheck"
                          checked={
                            selectedWeakWordIds.length === allIds.length &&
                            allIds.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th style={{ textAlign: "center" }}>번호</th>
                    <th>단어</th>
                    <th>뜻</th>
                    <th>품사</th>
                    <th style={{ textAlign: "center" }}>난이도</th>
                  </tr>
                </thead>
                <tbody className="retest-tbody">
                  {listWords.map((word, idx) => {
                    const partOfSpeechList = getUniquePartOfSpeechList(word);
                    return (
                      <tr
                        key={word.wordId}
                        className={
                          selectedWeakWordIds.includes(word.wordId)
                            ? "retest-row retest-row--selected"
                            : "retest-row"
                        }
                        role={isMobileViewport && isSelectableList ? "button" : undefined}
                        tabIndex={isMobileViewport && isSelectableList ? 0 : undefined}
                        onClick={
                          isMobileViewport && isSelectableList
                            ? () => toggleWeakWordSelection(word.wordId)
                            : undefined
                        }
                        onKeyDown={
                          isMobileViewport && isSelectableList
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleWeakWordSelection(word.wordId);
                                }
                              }
                            : undefined
                        }
                      >
                        {isSelectableList && (
                          <td>
                            <input
                              type="checkbox"
                              className="row-check"
                              checked={selectedWeakWordIds.includes(
                                word.wordId,
                              )}
                              onChange={() =>
                                toggleWeakWordSelection(word.wordId)
                              }
                            />
                          </td>
                        )}
                        <td>{idx + 1}</td>
                        <td>{word.spelling}</td>
                        <td>{getPrimaryMeaning(word)}</td>
                        <td>
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
                        <td
                          className="word-difficulty-cell"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            className={difficultyBadgeClass(word.difficulty)}
                          >
                            {translateDifficulty(word.difficulty)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {listWords.length === 0 && (
                    <tr>
                      <td
                        colSpan={isSelectableList ? 6 : 5}
                        className="weak-list-empty"
                      >
                        목록이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="action-bar">
                <div className="action-tip">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  선택한 단어에 집중적으로 복습하면 취약점을 빠르게 개선할 수
                  있어요!
                </div>
              </div>
            </div>

            <section
              className="retest-mode-picker"
              aria-label="테스트 방식 선택"
            >
              <div className="retest-mode-picker-header">
                <div>
                  <span className="eyebrow">문제 유형 선택</span>
                  <h2 className="retest-mode-picker-title">
                    객관식 또는 주관식을 선택하세요
                  </h2>
                </div>
              </div>

              <div className="retest-choice-wrapper">
                <button
                  type="button"
                  className="retest-choice-button"
                  onClick={() => handleModePick("objective")}
                >
                  객관식 시작
                </button>
                <button
                  type="button"
                  className="retest-choice-button"
                  onClick={() => handleModePick("subjective")}
                >
                  주관식 시작
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="retest-page">
      <div className="retest-card fade-slide-up">
        <section className="retest-header">
          <div className="retest-hero">
            <span className="eyebrow">재학습</span>
            <h1 className="retest-title">
              원하시는 단어를 선택하고
              <br /> <span>재학습</span>하세요.
            </h1>
            <p>
              오늘 틀린 단어와 취약 단어를 분리해 확인하고, 각 목록에서 바로
              테스트할 수 있습니다.
            </p>
          </div>
          <img src={img} alt="재학습" />
        </section>

        <section className="retest-choice-section">
          <div className="retest-choice-grid">
            {Object.entries(LIST_META).map(([key, meta]) => (
              <article key={key} className="retest-choice-card">
                <div>
                  <div className={`title-icon title-icon-${key}`}>
                    {icon(key)}
                  </div>
                  <h2>{meta.title}</h2>
                  <p>{meta.description}</p>
                </div>
                <div className="retest-choice-meta">
                  <button
                    type="button"
                    className="retest-choice-button"
                    onClick={() => goToList(key)}
                  >
                    {meta.buttonText}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Retest;
