import React, { useEffect, useMemo, useState } from "react";
import {
  checkWordAnswer,
  getRandomWords,
  getWordTestQuestion,
} from "../../api/server";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Form } from "../../components/Form";
import { useNavigate } from "react-router-dom";
import "./WordTest.css";

function translateQuestionType(type) {
  return type === "objective" ? "객관식" : "주관식";
}

function translateDifficulty(difficulty) {
  const difficultyMap = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return difficultyMap[difficulty] || difficulty;
}

function buildQuestionList(randomWords, testType, objectiveQuestions) {
  return randomWords.map((word) => {
    const isObjective = testType === "objective";

    if (isObjective) {
      const objectiveQuestion = objectiveQuestions.find(
        (question) => question.wordId === word.wordId,
      );

      return {
        wordId: word.wordId,
        type: "objective",
        spelling: word.spelling,
        meaning: word.meaning,
        difficulty: word.difficulty,
        choices: objectiveQuestion?.choices || [],
      };
    }

    return {
      wordId: word.wordId,
      type: "subjective",
      spelling: word.spelling,
      meaning: word.meaning,
      difficulty: word.difficulty,
    };
  });
}

function WordTest() {
  const [selectedTestType, setSelectedTestType] = useState("");
  const [questionCount, setQuestionCount] = useState(6);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!selectedTestType) {
      return;
    }

    const loadQuestions = async () => {
      setLoading(true);
      setError("");
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedChoiceId("");
      setUserAnswer("");
      setScore(0);
      setIsFinished(false);
      setFeedback("");

      try {
        const randomWordsResponse = await getRandomWords(questionCount);

        if (!randomWordsResponse?.success) {
          throw new Error(
            randomWordsResponse?.message || "랜덤 단어 조회에 실패했습니다.",
          );
        }

        const randomWords = randomWordsResponse.data || [];

        if (selectedTestType === "objective") {
          const objectiveResults = await Promise.all(
            randomWords.map(async (word) => {
              const questionResponse = await getWordTestQuestion(word.wordId);

              if (!questionResponse?.success) {
                throw new Error(
                  questionResponse?.message ||
                    "객관식 문제 조회에 실패했습니다.",
                );
              }

              return questionResponse.data;
            }),
          );

          setQuestions(
            buildQuestionList(randomWords, selectedTestType, objectiveResults),
          );
          return;
        }

        setQuestions(buildQuestionList(randomWords, selectedTestType, []));
      } catch (requestError) {
        if (requestError.code === "UNAUTHORIZED") {
          setError("인증이 필요합니다. 다시 로그인해주세요.");
        } else {
          setError(
            requestError.message || "단어 테스트를 불러오지 못했습니다.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [selectedTestType, questionCount]);

  const answerValue = useMemo(() => {
    if (!currentQuestion) {
      return "";
    }

    return currentQuestion.type === "objective" ? selectedChoiceId : userAnswer;
  }, [currentQuestion, selectedChoiceId, userAnswer]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentQuestion) {
      return;
    }

    const submittedMeaning =
      currentQuestion.type === "objective"
        ? currentQuestion.choices.find(
            (choice) => String(choice.choiceId) === String(selectedChoiceId),
          )?.meaning || ""
        : userAnswer.trim();

    if (!submittedMeaning) {
      setFeedback("답안을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await checkWordAnswer(
        currentQuestion.wordId,
        submittedMeaning,
      );

      if (!response?.success) {
        throw new Error(response?.message || "정답 확인에 실패했습니다.");
      }

      const answerData = response.data || {};

      if (answerData.correct) {
        setScore((prevScore) => prevScore + 1);
        setFeedback("정답입니다!");
      } else {
        setFeedback(`틀렸습니다. 정답은 "${answerData.answer}"입니다.`);
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
      }, 1500);
    } catch (requestError) {
      if (requestError.code === "UNAUTHORIZED") {
        setError("인증이 필요합니다. 다시 로그인해주세요.");
      } else {
        setFeedback(requestError.message || "정답 확인에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
    setError("");
    setSelectedTestType("");
  };

  const handleSelectTestType = (testType) => {
    setSelectedTestType(testType);
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

  if (loading && questions.length === 0) {
    return (
      <main className="wordtest-page">
        <section className="wordtest-loading-card">
          <h1 className="wordtest-page-title">단어 테스트</h1>
          <p className="wordtest-subtext">문제를 불러오는 중입니다...</p>
        </section>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className="wordtest-page">
        <section className="wordtest-loading-card">
          <h1 className="wordtest-page-title">단어 테스트</h1>
          <p role="alert" className="wordtest-error-text">
            {error}
          </p>
        </section>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="wordtest-page">
        <section className="wordtest-finish-card">
          <p className="wordtest-finish-eyebrow">테스트 완료</p>
          <h1 className="wordtest-finish-title">수고하셨습니다!</h1>
          <p className="wordtest-finish-desc">
            총 {questions.length}문제 중 <strong>{score}문제</strong>를
            맞혔습니다.
          </p>
          <p className="wordtest-finish-rate">
            정답률:{" "}
            {questions.length > 0
              ? Math.round((score / questions.length) * 100)
              : 0}
            %
          </p>
          <div className="wordtest-finish-actions">
            <Button
              buttonText="다시 선택"
              onClick={handleRetry}
              type="button"
              className="wordtest-btn-secondary"
            />
            <Button
              buttonText="홈으로"
              onClick={() => navigate("/")}
              type="button"
              className="wordtest-btn-primary"
            />
          </div>
        </section>
      </main>
    );
  }

  if (selectedTestType && !currentQuestion) {
    return (
      <main className="wordtest-page">
        <section className="wordtest-loading-card">
          <h1 className="wordtest-page-title">단어 테스트</h1>
          <p className="wordtest-subtext">문제를 불러오는 중입니다...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="wordtest-page">
      {!selectedTestType ? (
        <section className="wordtest-select-section">
          <p className="wordtest-eyebrow">테스트 시작</p>
          <h1 className="wordtest-page-title">어떤 방식으로 학습할까요?</h1>
          <p className="wordtest-subtext">
            유형을 선택하면 바로 테스트가 시작됩니다
          </p>

          <div className="wordtest-card-grid">
            <button
              type="button"
              className="wordtest-type-card wordtest-type-card--objective"
              onClick={() => handleSelectTestType("objective")}
            >
              <div className="wordtest-card-icon-purple">A</div>
              <p className="wordtest-card-title">객관식</p>
              <p className="wordtest-card-desc">
                4개의 보기 중에서 정답을 선택하세요
              </p>
              <div className="wordtest-preview-wrap">
                <div className="wordtest-preview-active-purple">A 선택지 1</div>
                <div className="wordtest-preview-inactive">B 선택지 2</div>
              </div>
              <span className="wordtest-start-purple">객관식 시작 →</span>
            </button>

            <button
              type="button"
              className="wordtest-type-card wordtest-type-card--subjective"
              onClick={() => handleSelectTestType("subjective")}
            >
              <div className="wordtest-card-icon-teal">T</div>
              <p className="wordtest-card-title">주관식</p>
              <p className="wordtest-card-desc">
                단어의 뜻을 직접 타이핑해서 입력하세요
              </p>
              <div className="wordtest-preview-wrap">
                <div className="wordtest-preview-active-teal">직접 입력...</div>
                <div className="wordtest-preview-inactive">정답 확인</div>
              </div>
              <span className="wordtest-start-teal">주관식 시작 →</span>
            </button>
          </div>

          <div className="wordtest-count-row">
            <span className="wordtest-count-label">문항수 (1-50)</span>
            <div className="wordtest-count-right">
              <div className="wordtest-count-pills">
                {[10, 20, 50].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuestionCount(value)}
                    className={
                      questionCount === value
                        ? "wordtest-count-pill wordtest-count-pill--selected"
                        : "wordtest-count-pill"
                    }
                  >
                    {value === 50 ? "전체" : `${value}문제`}
                  </button>
                ))}
              </div>
              <Input
                id="question-count"
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  const clamped = Number.isNaN(v)
                    ? 1
                    : Math.max(1, Math.min(50, v));
                  setQuestionCount(clamped);
                }}
                className="wordtest-count-input"
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="wordtest-test-section">
          <div className="wordtest-top-row">
            <div className="wordtest-top-left">
              <span
                className={
                  selectedTestType === "objective"
                    ? "wordtest-badge-objective"
                    : "wordtest-badge-subjective"
                }
              >
                {translateQuestionType(selectedTestType)}
              </span>
              <span
                className={
                  selectedTestType === "objective"
                    ? "wordtest-qinfo-objective"
                    : "wordtest-qinfo-subjective"
                }
              >
                문제 {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <span className="wordtest-score-text">맞은 문제: {score}</span>
          </div>

          <div
            className={
              selectedTestType === "objective"
                ? "wordtest-progress-track-objective"
                : "wordtest-progress-track-subjective"
            }
          >
            <div
              className="wordtest-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <Form onSubmit={handleSubmit} className="wordtest-form">
            <div
              className={
                selectedTestType === "objective"
                  ? "wordtest-question-card-objective"
                  : "wordtest-question-card-subjective"
              }
            >
              <p
                className={
                  selectedTestType === "objective"
                    ? "wordtest-qeyebrow-objective"
                    : "wordtest-qeyebrow-subjective"
                }
              >
                {selectedTestType === "objective"
                  ? "다음 단어의 올바른 뜻을 선택하세요"
                  : "다음 단어의 뜻을 직접 입력하세요"}
              </p>

              {selectedTestType === "objective" ? (
                <>
                  <p className="wordtest-word-label">영단어</p>
                  <p className="wordtest-word-main">
                    {currentQuestion.spelling}
                  </p>
                  <p className="wordtest-difficulty-badge">
                    난이도: {translateDifficulty(currentQuestion.difficulty)}
                  </p>
                </>
              ) : (
                <>
                  <p className="wordtest-word-main-subjective">
                    {currentQuestion.spelling}
                  </p>
                  <p className="wordtest-word-hint-subjective">
                    난이도: {translateDifficulty(currentQuestion.difficulty)}
                  </p>
                </>
              )}
            </div>

            {selectedTestType === "objective" ? (
              <div className="wordtest-option-grid">
                {currentQuestion.choices.map((choice, index) => {
                  const active =
                    String(selectedChoiceId) === String(choice.choiceId);

                  return (
                    <div
                      key={choice.choiceId}
                      onClick={() => {
                        setSelectedChoiceId(String(choice.choiceId));
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
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
                      {choice.meaning}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="wordtest-input-wrap">
                <Input
                  id="test-answer-input"
                  placeholder="한국어 뜻을 입력하세요..."
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

            {error && (
              <p role="alert" className="wordtest-error-inline">
                {error}
              </p>
            )}

            <div className="wordtest-bottom-row">
              <Button
                buttonText="← 나가기"
                type="button"
                onClick={() => setSelectedTestType("")}
                className="wordtest-btn-exit"
              />
              <Button
                buttonText="제출"
                disabled={!answerValue.trim() || !!feedback || loading}
                className={
                  selectedTestType === "objective"
                    ? "wordtest-btn-submit-objective"
                    : "wordtest-btn-submit-subjective"
                }
              />
            </div>
          </Form>
        </section>
      )}
    </main>
  );
}

export default WordTest;
