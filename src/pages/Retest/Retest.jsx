import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTodayWrongWords, getWeakWords } from "../../api/server";
import "./Retest.css";

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
};

function getPrimaryMeaning(word) {
  return word?.meanings?.[0]?.meaning || word?.meaning || "";
}

function getPrimaryPartOfSpeech(word) {
  return word?.meanings?.[0]?.partOfSpeech || word?.partOfSpeech || "";
}

function translatePartOfSpeech(partOfSpeech) {
  const partOfSpeechMap = {
    NOUN: "명사",
    VERB: "동사",
    ADJECTIVE: "형용사",
    ADVERB: "부사",
    PRONOUN: "대명사",
    PREPOSITION: "전치사",
    CONJUNCTION: "접속사",
    INTERJECTION: "감탄사",
    ARTICLE: "관사",
  };

  return partOfSpeechMap[partOfSpeech] || partOfSpeech;
}

function translateDifficulty(difficulty) {
  const difficultyMap = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return difficultyMap[difficulty] || difficulty;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function shuffle(list) {
  const result = [...list];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function buildObjectiveChoices(allWords, currentWord) {
  const currentSpelling = currentWord.spelling;
  const distractors = shuffle(
    Array.from(
      new Set(
        allWords
          .map((word) => word.spelling)
          .filter((spelling) => spelling && spelling !== currentSpelling),
      ),
    ),
  );

  const choices = shuffle([currentSpelling, ...distractors.slice(0, 3)]);

  return choices.map((spelling, index) => ({
    choiceId: `${currentWord.wordId}-${index}-${spelling}`,
    spelling,
  }));
}

function buildQuestions(words, testType) {
  return words.map((word) => ({
    wordId: word.wordId,
    type: testType,
    spelling: word.spelling,
    meaning: getPrimaryMeaning(word),
    partOfSpeech: getPrimaryPartOfSpeech(word),
    difficulty: word.difficulty,
    correctCount: word.correctCount ?? 0,
    wrongCount: word.wrongCount ?? 0,
    wrongRate: word.wrongRate ?? 0,
    choices: testType === "objective" ? buildObjectiveChoices(words, word) : [],
  }));
}

function Retest() {
  const navigate = useNavigate();
  const { listType, flowType } = useParams();

  const activeListType =
    listType === "weak" || listType === "today-wrong" ? listType : "";
  const activeFlowType =
    flowType === "test" || flowType === "objective" || flowType === "subjective"
      ? flowType
      : "";

  const isListPage = Boolean(activeListType) && !activeFlowType;
  const isModeSelectPage = activeFlowType === "test";
  const isTestPage =
    activeFlowType === "objective" || activeFlowType === "subjective";

  const [todayWrongWords, setTodayWrongWords] = useState([]);
  const [weakWords, setWeakWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [selectedWeakWordIds, setSelectedWeakWordIds] = useState([]);
  const [weakSelectionOpen, setWeakSelectionOpen] = useState(false);

  const activeListWords =
    activeListType === "today-wrong" ? todayWrongWords : weakWords;
  const activeListMeta = activeListType ? LIST_META[activeListType] : null;

  const isWeakList = activeListType === "weak";

  useEffect(() => {
    const loadRetestData = async () => {
      setLoading(true);
      setError("");

      try {
        const [todayResponse, weakResponse] = await Promise.all([
          getTodayWrongWords(),
          getWeakWords({ limit: 10 }),
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

        const todayList = Array.isArray(todayResponse.data)
          ? todayResponse.data
          : [];
        const weakList = Array.isArray(weakResponse.data)
          ? weakResponse.data
          : [];

        setTodayWrongWords(todayList);
        setWeakWords(weakList);
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

    return [];
  }, [activeListType, todayWrongWords, weakWords]);

  const questions = useMemo(() => {
    if (!isTestPage) {
      return [];
    }

    return buildQuestions(activeWords, activeFlowType);
  }, [activeWords, activeFlowType, isTestPage]);

  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

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
    if (!isTestPage) {
      return;
    }

    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
  }, [isTestPage, questions.length]);

  const goToList = (type) => {
    navigate(`/retest/${type}`);
  };

  const openModePicker = () => {
    if (!activeListType) {
      return;
    }

    setModePickerOpen(true);
  };

  const openWeakSelection = () => {
    if (!isWeakList) {
      return;
    }

    setWeakSelectionOpen(true);
  };

  const closeWeakSelection = () => {
    setWeakSelectionOpen(false);
    setSelectedWeakWordIds([]);
  };

  const closeModePicker = () => {
    setModePickerOpen(false);
  };

  const handleModePick = (type) => {
    setModePickerOpen(false);
    const wordsToTest =
      activeListType === "weak" && selectedWeakWordIds.length > 0
        ? activeListWords.filter((word) =>
            selectedWeakWordIds.includes(word.wordId),
          )
        : activeListWords;

    navigate(`/wtest/${type}`, {
      state: {
        customWords: wordsToTest,
        customReturnPath: `/retest/${activeListType}`,
        customTitle: `${activeListMeta?.title || "재학습"} 테스트`,
      },
    });
  };
  
  const handleStartRetest = () => {
    navigate("/retest/today-wrong");
  };

  const toggleWeakWordSelection = (wordId) => {
    setSelectedWeakWordIds((currentIds) => {
      if (currentIds.includes(wordId)) {
        return currentIds.filter((currentWordId) => currentWordId !== wordId);
      }

      return [...currentIds, wordId];
    });
  };

  const handleAnswerChange = (event) => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestion.type === "objective") {
      setSelectedChoiceId(event.target.value);
    } else {
      setUserAnswer(event.target.value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentQuestion) {
      return;
    }

    const submittedAnswer =
      currentQuestion.type === "objective"
        ? currentQuestion.choices.find(
            (choice) => String(choice.choiceId) === String(selectedChoiceId),
          )?.spelling || ""
        : userAnswer.trim();

    if (!submittedAnswer) {
      setFeedback("답안을 입력해주세요.");
      return;
    }

    const normalizedSubmittedAnswer = normalizeText(submittedAnswer);
    const normalizedCorrectAnswer = normalizeText(currentQuestion.spelling);
    const isCorrect = normalizedSubmittedAnswer === normalizedCorrectAnswer;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      setFeedback("정답입니다!");
    } else {
      setFeedback(`틀렸습니다. 정답은 "${currentQuestion.spelling}"입니다.`);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prevIndex) => prevIndex + 1);
        setSelectedChoiceId("");
        setUserAnswer("");
        setFeedback("");
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  const handleRetry = () => {
    if (activeListType && activeFlowType === "objective") {
      navigate(`/retest/${activeListType}/test/objective`);
      return;
    }

    if (activeListType && activeFlowType === "subjective") {
      navigate(`/retest/${activeListType}/test/subjective`);
      return;
    }

    if (activeListType) {
      navigate(`/retest/${activeListType}`);
      return;
    }

    navigate("/retest");
  };

  if (loading && !todayWrongWords.length && !weakWords.length) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <div className="retest-loading">
            재학습 데이터를 불러오는 중입니다...
          </div>
        </div>
      </main>
    );
  }

  if (error && !todayWrongWords.length && !weakWords.length) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">재학습</span>
            <h1>취약 단어 재학습</h1>
            <p>재학습 데이터를 불러오지 못했습니다.</p>
          </section>
          <section className="retest-notices" aria-label="재학습 오류">
            <article
              className="retest-notice retest-notice--unavailable"
              role="alert"
            >
              <div className="retest-notice-text">
                <strong>오류</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="retest-notice-close"
                aria-label="오류 닫기"
                onClick={() => setError("")}
              >
                ×
              </button>
            </article>
          </section>
          <button
            className="retest-button"
            type="button"
            onClick={() => navigate("/retest")}
          >
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">재학습 완료</span>
            <h1>수고하셨습니다!</h1>
            <p>
              총 {questions.length}문제 중 <strong>{score}문제</strong>를
              맞혔습니다.
            </p>
          </section>

          <section className="retest-notices">
            <article
              className="retest-notice retest-notice--available"
              role="status"
            >
              <div className="retest-notice-text">
                <strong>결과</strong>
                <p>
                  정답률:{" "}
                  {questions.length > 0
                    ? Math.round((score / questions.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <button
                type="button"
                className="retest-notice-close"
                aria-label="결과 닫기"
                onClick={() => setIsFinished(false)}
              >
                ×
              </button>
            </article>
          </section>

          <div className="retest-finish-actions">
            <button
              className="retest-button"
              type="button"
              onClick={handleRetry}
            >
              다시 하기
            </button>
            <button
              className="retest-button retest-button--secondary"
              type="button"
              onClick={() => navigate("/retest")}
            >
              재학습 홈
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isTestPage && !currentQuestion) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <div className="retest-loading">
            테스트 문항을 불러오는 중입니다...
          </div>
        </div>
      </main>
    );
  }

  if (!activeListType) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">재학습</span>
            <h1>어떤 재학습을 할까요?</h1>
            <p>오늘 틀린 단어와 취약 단어 중에서 원하는 목록을 선택하세요.</p>
          </section>

          <section className="retest-choice-grid">
            {Object.entries(LIST_META).map(([key, meta]) => {
              return (
                <article key={key} className="retest-choice-card">
                  <div>
                    <span className="eyebrow">{meta.title}</span>
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
              );
            })}
          </section>
        </div>
      </main>
    );
  }

  if (isListPage) {
    const listWords = activeListWords;
    const meta = activeListMeta;

    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">목록 보기</span>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </section>

          <div className="retest-toolbar">
            <button
              type="button"
              className="retest-toolbar-button"
              onClick={() => navigate("/retest")}
            >
              뒤로
            </button>
            <button
              type="button"
              className="retest-toolbar-button retest-toolbar-button--primary"
              onClick={openModePicker}
            >
              이 목록으로 테스트하기
            </button>
            {isWeakList && (
              <button
                type="button"
                className="retest-toolbar-button"
                onClick={openWeakSelection}
              >
                취약 단어 선택하기
              </button>
            )}
          </div>

          {isWeakList && weakSelectionOpen && (
            <div className="retest-selection-row">
              <p className="retest-selection-help">
                체크한 단어만 테스트하고, 아무것도 고르지 않으면 전체 취약
                단어를 테스트합니다.
              </p>
              <button
                type="button"
                className="retest-toolbar-button"
                onClick={closeWeakSelection}
              >
                선택 닫기
              </button>
            </div>
          )}

          {modePickerOpen && (
            <section
              className="retest-mode-picker"
              aria-label="테스트 방식 선택"
            >
              <div className="retest-mode-picker-header">
                <div>
                  <span className="eyebrow">테스트 시작</span>
                  <h2>객관식 또는 주관식을 선택하세요</h2>
                </div>
                <button
                  type="button"
                  className="retest-toolbar-button"
                  onClick={closeModePicker}
                >
                  닫기
                </button>
              </div>

              {isWeakList && (
                <p className="retest-selection-help">
                  체크한 단어만 테스트하고, 아무것도 고르지 않으면 전체 취약
                  단어를 테스트합니다.
                </p>
              )}

              <div className="retest-choice-grid">
                <article className="retest-choice-card">
                  <div>
                    <span className="eyebrow">객관식</span>
                    <h2>보기에서 선택</h2>
                    <p>뜻을 보고 올바른 영단어를 고르세요.</p>
                  </div>
                  <div className="retest-choice-meta">
                    <button
                      type="button"
                      className="retest-choice-button"
                      onClick={() => handleModePick("objective")}
                    >
                      객관식 시작
                    </button>
                  </div>
                </article>

                <article className="retest-choice-card">
                  <div>
                    <span className="eyebrow">주관식</span>
                    <h2>직접 입력</h2>
                    <p>뜻을 보고 영단어를 직접 입력하세요.</p>
                  </div>
                  <div className="retest-choice-meta">
                    <button
                      type="button"
                      className="retest-choice-button"
                      onClick={() => handleModePick("subjective")}
                    >
                      주관식 시작
                    </button>
                  </div>
                </article>
              </div>
            </section>
          )}

          <section className="weak-list">
            <h2>{meta.title} 목록</h2>
            <ul>
              {listWords.map((word) => (
                <li
                  key={word.wordId}
                  className={
                    isWeakList && selectedWeakWordIds.includes(word.wordId)
                      ? "weak-list-item weak-list-item--selected"
                      : "weak-list-item"
                  }
                >
                  <div className="weak-list-main">
                    <strong>{word.spelling}</strong>
                    <span>
                      {getPrimaryMeaning(word)} ·{" "}
                      {translatePartOfSpeech(getPrimaryPartOfSpeech(word))}
                    </span>
                  </div>
                  {isWeakList && weakSelectionOpen && (
                    <label className="weak-list-checkbox-wrap">
                      <span className="weak-list-checkbox-label">선택</span>
                      <input
                        type="checkbox"
                        className="weak-list-checkbox"
                        checked={selectedWeakWordIds.includes(word.wordId)}
                        onChange={() => toggleWeakWordSelection(word.wordId)}
                      />
                    </label>
                  )}
                </li>
              ))}
              {listWords.length === 0 && (
                <li className="weak-list-empty">목록이 없습니다.</li>
              )}
            </ul>
          </section>
        </div>
      </main>
    );
  }

  if (isModeSelectPage) {
    const meta = activeListMeta;

    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">테스트 시작</span>
            <h1>{meta.title} 테스트</h1>
            <p>객관식 또는 주관식 중 원하는 방식으로 테스트를 시작하세요.</p>
          </section>

          <div className="retest-toolbar">
            <button
              type="button"
              className="retest-toolbar-button"
              onClick={() => navigate(`/retest/${activeListType}`)}
            >
              목록으로
            </button>
          </div>

          <section className="retest-choice-grid">
            <article className="retest-choice-card">
              <div>
                <span className="eyebrow">객관식</span>
                <h2>보기에서 선택</h2>
                <p>뜻을 보고 올바른 영단어를 고르세요.</p>
              </div>
              <div className="retest-choice-meta">
                <button
                  type="button"
                  className="retest-choice-button"
                  onClick={() => handleModePick("objective")}
                >
                  객관식 시작
                </button>
              </div>
            </article>

            <article className="retest-choice-card">
              <div>
                <span className="eyebrow">주관식</span>
                <h2>직접 입력</h2>
                <p>뜻을 보고 영단어를 직접 입력하세요.</p>
              </div>
              <div className="retest-choice-meta">
                <button
                  type="button"
                  className="retest-choice-button"
                  onClick={() => handleModePick("subjective")}
                >
                  주관식 시작
                </button>
              </div>
            </article>
          </section>
        </div>
      </main>
    );
  }

  if (isTestPage && currentQuestion) {
    return (
      <main className="retest-page">
        <div className="retest-card">
          <section className="retest-header">
            <span className="eyebrow">재학습 테스트</span>
            <h1>{LIST_META[activeListType]?.title || "재학습"}</h1>
            <p>
              {activeFlowType === "objective"
                ? "다음 뜻에 맞는 영단어를 선택하세요."
                : "다음 뜻에 맞는 영단어를 직접 입력하세요."}
            </p>
          </section>

          <div className="wordtest-top-row">
            <div className="wordtest-top-left">
              <span
                className={
                  activeFlowType === "objective"
                    ? "wordtest-badge-objective"
                    : "wordtest-badge-subjective"
                }
              >
                {activeFlowType === "objective" ? "객관식" : "주관식"}
              </span>
              <span
                className={
                  activeFlowType === "objective"
                    ? "wordtest-qinfo-objective"
                    : "wordtest-qinfo-subjective"
                }
              >
                문제 {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <span className="wordtest-score-text">맞은 문제: {score}</span>
          </div>

          <div className="wordtest-progress-track-objective">
            <div
              className="wordtest-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <form className="wordtest-form" onSubmit={handleSubmit}>
            <div className="wordtest-question-card-objective">
              <p className="wordtest-qeyebrow-objective">
                다음 뜻에 맞는 영단어를 고르세요
              </p>
              <p className="wordtest-word-label">
                {translatePartOfSpeech(currentQuestion.partOfSpeech)}
              </p>
              <p className="wordtest-word-main">{currentQuestion.meaning}</p>
              <div className="wordtest-meta-stack">
                <p className="wordtest-difficulty-badge wordtest-part-of-speech-badge">
                  품사: {translatePartOfSpeech(currentQuestion.partOfSpeech)}
                </p>
                <p className="wordtest-difficulty-badge">
                  난이도: {translateDifficulty(currentQuestion.difficulty)}
                </p>
              </div>
            </div>

            {activeFlowType === "objective" ? (
              <div className="wordtest-option-grid">
                {(currentQuestion.choices || []).map((choice, index) => {
                  const active =
                    String(selectedChoiceId) === String(choice.choiceId);

                  return (
                    <div
                      key={choice.choiceId}
                      onClick={() =>
                        setSelectedChoiceId(String(choice.choiceId))
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedChoiceId(String(choice.choiceId));
                        }
                      }}
                      aria-pressed={active}
                      className={[
                        "wordtest-option-btn",
                        active && "wordtest-option-btn--active",
                        feedback && "wordtest-option-btn--disabled",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className={
                          active
                            ? "wordtest-option-letter wordtest-option-letter--active"
                            : "wordtest-option-letter"
                        }
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      {choice.spelling}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="wordtest-input-wrap">
                <input
                  id="test-answer-input"
                  placeholder="영단어를 입력하세요..."
                  value={userAnswer}
                  onChange={handleAnswerChange}
                  disabled={!!feedback}
                  autoComplete="off"
                  className="wordtest-subjective-input"
                />
              </div>
            )}

            {feedback && (
              <p
                className={
                  feedback.includes("정답")
                    ? "wordtest-feedback-correct"
                    : "wordtest-feedback-wrong"
                }
              >
                {feedback}
              </p>
            )}

            <div className="retest-toolbar">
              <button
                type="button"
                className="retest-toolbar-button"
                onClick={() => navigate(`/retest/${activeListType}/test`)}
              >
                모드 선택
              </button>
              <button
                type="button"
                className="retest-toolbar-button"
                onClick={() => navigate(`/retest/${activeListType}`)}
              >
                목록으로
              </button>
              <button
                type="submit"
                className="retest-toolbar-button retest-toolbar-button--primary"
                disabled={loading || (!selectedChoiceId && !userAnswer.trim())}
              >
                제출
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="retest-page">
      <div className="retest-card">
        <section className="retest-header">
          <span className="eyebrow">재학습</span>
          <h1>취약 단어 재학습</h1>
          <p>
            오늘 틀린 단어와 취약 단어를 분리해 확인하고, 각 목록에서 바로
            테스트할 수 있습니다.
          </p>
        </section>

        <section className="retest-choice-grid">
          {Object.entries(LIST_META).map(([key, meta]) => {
            return (
              <article key={key} className="retest-choice-card">
                <div>
                  <span className="eyebrow">{meta.title}</span>
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
            );
          })}
        </section>

        <button
          className="retest-button"
          type="button"
          onClick={handleStartRetest}
          disabled={loading}
        >
          {loading ? "불러오는 중..." : "재학습 시작"}
        </button>
      </div>
    </main>
  );
}

export default Retest;
