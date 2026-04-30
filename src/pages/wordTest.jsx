import React, { useEffect, useMemo, useState } from "react";
import {
  checkWordAnswer,
  getRandomWords,
  getWordTestQuestion,
} from "../api/server";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Form } from "../components/Form";
import { useNavigate } from "react-router-dom";

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
        setFeedback(`틀렸습니다. 정답은 \"${answerData.answer}\"입니다.`);
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
      <main style={styles.pageWrap}>
        <section style={styles.loadingCard}>
          <h1 style={styles.pageTitle}>단어 테스트</h1>
          <p style={styles.subText}>문제를 불러오는 중입니다...</p>
        </section>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main style={styles.pageWrap}>
        <section style={styles.loadingCard}>
          <h1 style={styles.pageTitle}>단어 테스트</h1>
          <p role="alert" style={styles.errorText}>
            {error}
          </p>
        </section>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main style={styles.pageWrap}>
        <section style={styles.finishCard}>
          <p style={styles.finishEyebrow}>테스트 완료</p>
          <h1 style={styles.finishTitle}>수고하셨습니다!</h1>
          <p style={styles.finishDesc}>
            총 {questions.length}문제 중 <strong>{score}문제</strong>를 맞혔습니다.
          </p>
          <p style={styles.finishRate}>
            정답률: {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
          </p>
          <div style={styles.finishActions}>
            <Button
              buttonText="다시 선택"
              onClick={handleRetry}
              type="button"
              style={styles.secondaryBtn}
            />
            <Button
              buttonText="홈으로"
              onClick={() => navigate("/")}
              type="button"
              style={styles.primaryBtn}
            />
          </div>
        </section>
      </main>
    );
  }

  if (selectedTestType && !currentQuestion) {
    return (
      <main style={styles.pageWrap}>
        <section style={styles.loadingCard}>
          <h1 style={styles.pageTitle}>단어 테스트</h1>
          <p style={styles.subText}>문제를 불러오는 중입니다...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.pageWrap}>
      {!selectedTestType ? (
        <section style={styles.selectSection}>
          <p style={styles.eyebrow}>테스트 시작</p>
          <h1 style={styles.pageTitle}>어떤 방식으로 학습할까요?</h1>
          <p style={styles.subText}>유형을 선택하면 바로 테스트가 시작됩니다</p>

          <div style={styles.cardGrid}>
            <button
              type="button"
              style={{ ...styles.typeCard, ...styles.objectiveCard }}
              onClick={() => handleSelectTestType("objective")}
            >
              <div style={styles.cardIconPurple}>A</div>
              <p style={styles.cardTitle}>객관식</p>
              <p style={styles.cardDesc}>4개의 보기 중에서 정답을 선택하세요</p>
              <div style={styles.previewWrap}>
                <div style={styles.previewActivePurple}>A 선택지 1</div>
                <div style={styles.previewInactive}>B 선택지 2</div>
              </div>
              <span style={styles.startBtnPurple}>객관식 시작 →</span>
            </button>

            <button
              type="button"
              style={{ ...styles.typeCard, ...styles.subjectiveCard }}
              onClick={() => handleSelectTestType("subjective")}
            >
              <div style={styles.cardIconTeal}>T</div>
              <p style={styles.cardTitle}>주관식</p>
              <p style={styles.cardDesc}>단어의 뜻을 직접 타이핑해서 입력하세요</p>
              <div style={styles.previewWrap}>
                <div style={styles.previewActiveTeal}>직접 입력...</div>
                <div style={styles.previewInactive}>정답 확인</div>
              </div>
              <span style={styles.startBtnTeal}>주관식 시작 →</span>
            </button>
          </div>

          <div style={styles.countRow}>
            <span style={styles.countLabel}>문항수 (1-50)</span>
            <div style={styles.countRight}>
              <div style={styles.countPills}>
                {[10, 20, 50].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuestionCount(value)}
                    style={
                      questionCount === value
                        ? styles.countPillSelected
                        : styles.countPill
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
                style={styles.countInput}
              />
            </div>
          </div>
        </section>
      ) : (
        <section style={styles.testSection}>
          <div style={styles.topRow}>
            <div style={styles.topLeft}>
              <span
                style={
                  selectedTestType === "objective"
                    ? styles.badgeModeObjective
                    : styles.badgeModeSubjective
                }
              >
                {translateQuestionType(selectedTestType)}
              </span>
              <span
                style={
                  selectedTestType === "objective"
                    ? styles.qInfoObjective
                    : styles.qInfoSubjective
                }
              >
                문제 {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <span style={styles.scoreText}>맞은 문제: {score}</span>
          </div>

          <div
            style={
              selectedTestType === "objective"
                ? styles.progressTrackObjective
                : styles.progressTrackSubjective
            }
          >
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>

          <Form onSubmit={handleSubmit} style={styles.formOverride}>
            <div
              style={
                selectedTestType === "objective"
                  ? styles.questionCardObjective
                  : styles.questionCardSubjective
              }
            >
              <p
                style={
                  selectedTestType === "objective"
                    ? styles.questionEyebrowObjective
                    : styles.questionEyebrowSubjective
                }
              >
                {selectedTestType === "objective"
                  ? "다음 단어의 올바른 뜻을 선택하세요"
                  : "다음 단어의 뜻을 직접 입력하세요"}
              </p>

              {selectedTestType === "objective" ? (
                <>
                  <p style={styles.wordLabel}>영단어</p>
                  <p style={styles.wordMain}>{currentQuestion.spelling}</p>
                  <p style={styles.difficultyBadge}>
                    난이도: {translateDifficulty(currentQuestion.difficulty)}
                  </p>
                </>
              ) : (
                <>
                  <p style={styles.wordMainSubjective}>{currentQuestion.spelling}</p>
                  <p style={styles.wordHintSubjective}>
                    난이도: {translateDifficulty(currentQuestion.difficulty)}
                  </p>
                </>
              )}
            </div>

            {selectedTestType === "objective" ? (
              <div style={styles.optionGrid}>
                {currentQuestion.choices.map((choice, index) => {
                  const active =
                    String(selectedChoiceId) === String(choice.choiceId);

                  return (
                    <button
                      key={choice.choiceId}
                      type="button"
                      onClick={() => setSelectedChoiceId(String(choice.choiceId))}
                      disabled={!!feedback}
                      style={{
                        ...styles.optionBtn,
                        ...(active ? styles.optionBtnActive : {}),
                        ...(feedback ? styles.optionBtnDisabled : {}),
                      }}
                    >
                      <span style={active ? styles.optionLetterActive : styles.optionLetter}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {choice.meaning}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={styles.inputWrap}>
                <Input
                  id="test-answer-input"
                  placeholder="한국어 뜻을 입력하세요..."
                  value={userAnswer}
                  onChange={handleAnswerChange}
                  disabled={!!feedback}
                  autoComplete="off"
                  style={styles.subjectiveInput}
                />
              </div>
            )}

            {feedback && (
              <p
                style={
                  feedback.includes("정답")
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong
                }
              >
                {feedback}
              </p>
            )}

            {error && (
              <p role="alert" style={styles.errorTextInline}>
                {error}
              </p>
            )}

            <div style={styles.bottomRow}>
              <Button
                buttonText="← 나가기"
                type="button"
                onClick={() => setSelectedTestType("")}
                style={styles.exitBtn}
              />
              <Button
                buttonText="제출"
                disabled={!answerValue.trim() || !!feedback || loading}
                style={
                  selectedTestType === "objective"
                    ? styles.submitBtnObjective
                    : styles.submitBtnSubjective
                }
              />
            </div>
          </Form>
        </section>
      )}
    </main>
  );
}

const styles = {
  pageWrap: {
    minHeight: "100vh",
    padding: "28px 24px",
    background:
      "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 65%, #e4e0ff 100%)",
  },
  selectSection: {
    maxWidth: 980,
    margin: "0 auto",
    textAlign: "center",
    paddingTop: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#7c3aed",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1e1b4b",
    marginBottom: 10,
    letterSpacing: "-0.02em",
  },
  subText: {
    fontSize: 15,
    color: "#7c6fad",
    marginBottom: 34,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 24,
  },
  typeCard: {
    border: "none",
    borderRadius: 20,
    padding: "28px 22px",
    width: "100%",
    minWidth: 0,
    textAlign: "left",
    cursor: "pointer",
    background: "rgba(255,255,255,0.78)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  objectiveCard: {
    border: "1.5px solid rgba(139,92,246,0.3)",
  },
  subjectiveCard: {
    border: "1.5px solid rgba(13,148,136,0.3)",
  },
  cardIconPurple: {
    width: 50,
    height: 50,
    borderRadius: 14,
    background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    color: "#e9d5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    marginBottom: 16,
  },
  cardIconTeal: {
    width: 50,
    height: 50,
    borderRadius: 14,
    background: "linear-gradient(135deg, #0d9488, #0f766e)",
    color: "#ccfbf1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e1b4b",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: "#7c6fad",
    lineHeight: 1.5,
    marginBottom: 16,
  },
  previewWrap: {
    display: "grid",
    gap: 6,
    marginBottom: 16,
  },
  previewActivePurple: {
    borderRadius: 8,
    fontSize: 12,
    padding: "7px 10px",
    background: "rgba(139,92,246,0.12)",
    color: "#5b21b6",
  },
  previewActiveTeal: {
    borderRadius: 8,
    fontSize: 12,
    padding: "7px 10px",
    background: "rgba(204,251,241,0.45)",
    color: "#0f766e",
  },
  previewInactive: {
    borderRadius: 8,
    fontSize: 12,
    padding: "7px 10px",
    background: "rgba(255,255,255,0.6)",
    border: "0.5px solid rgba(139,92,246,0.12)",
    color: "#94a3b8",
  },
  startBtnPurple: {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    padding: "10px 12px",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
  },
  startBtnTeal: {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    padding: "10px 12px",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    background: "linear-gradient(135deg, #0d9488, #0f766e)",
  },
  countRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    maxWidth: 980,
    margin: "0 auto",
    padding: "0 4px",
  },
  countLabel: {
    fontSize: 14,
    color: "#7c6fad",
    fontWeight: 600,
  },
  countRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  countPills: {
    display: "flex",
    gap: 8,
  },
  countPill: {
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 12,
    border: "0.5px solid rgba(139,92,246,0.15)",
    background: "rgba(255,255,255,0.55)",
    color: "#94a3b8",
    cursor: "pointer",
  },
  countPillSelected: {
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 12,
    border: "0.5px solid rgba(139,92,246,0.32)",
    background:
      "linear-gradient(90deg,rgba(139,92,246,0.2),rgba(109,40,217,0.12))",
    color: "#4c1d95",
    fontWeight: 700,
    cursor: "pointer",
  },
  countInput: {
    width: 110,
    borderRadius: 20,
    padding: "8px 12px",
    textAlign: "center",
  },
  testSection: {
    maxWidth: 980,
    margin: "0 auto",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
    flexWrap: "wrap",
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badgeModeObjective: {
    background:
      "linear-gradient(90deg,rgba(139,92,246,0.2),rgba(109,40,217,0.12))",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    color: "#4c1d95",
    fontWeight: 700,
    border: "0.5px solid rgba(139,92,246,0.28)",
  },
  badgeModeSubjective: {
    background:
      "linear-gradient(90deg,rgba(45,212,191,0.2),rgba(13,148,136,0.12))",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    color: "#134e4a",
    fontWeight: 700,
    border: "0.5px solid rgba(13,148,136,0.28)",
  },
  qInfoObjective: {
    fontSize: 13,
    color: "#5b21b6",
    fontWeight: 600,
  },
  qInfoSubjective: {
    fontSize: 13,
    color: "#0f766e",
    fontWeight: 600,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0d9488",
  },
  progressTrackObjective: {
    background: "rgba(139,92,246,0.15)",
    borderRadius: 20,
    height: 8,
    marginBottom: 24,
    border: "0.5px solid rgba(139,92,246,0.2)",
    overflow: "hidden",
  },
  progressTrackSubjective: {
    background: "rgba(45,212,191,0.15)",
    borderRadius: 20,
    height: 8,
    marginBottom: 24,
    border: "0.5px solid rgba(13,148,136,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    background: "linear-gradient(90deg, #7c3aed, #2dd4bf)",
    height: 8,
    borderRadius: 20,
    transition: "width 0.4s",
  },
  formOverride: {
    width: "100%",
    maxWidth: "none",
    background: "transparent",
    boxShadow: "none",
    borderRadius: 0,
    padding: 0,
    gap: 14,
  },
  questionCardObjective: {
    background: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    border: "0.5px solid rgba(139,92,246,0.18)",
    padding: "30px 28px",
    textAlign: "center",
  },
  questionCardSubjective: {
    background: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    border: "0.5px solid rgba(13,148,136,0.18)",
    padding: "30px 28px",
    textAlign: "center",
  },
  questionEyebrowObjective: {
    fontSize: 11,
    fontWeight: 700,
    color: "#7c3aed",
    letterSpacing: "0.09em",
    marginBottom: 12,
  },
  questionEyebrowSubjective: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0d9488",
    letterSpacing: "0.09em",
    marginBottom: 12,
  },
  wordLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: 8,
  },
  wordMain: {
    fontSize: 34,
    fontWeight: 800,
    color: "#1e1b4b",
    letterSpacing: "-0.02em",
    marginBottom: 10,
  },
  difficultyBadge: {
    display: "inline-block",
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 20,
    background: "rgba(139,92,246,0.14)",
    color: "#4c1d95",
    border: "0.5px solid rgba(139,92,246,0.22)",
  },
  wordMainSubjective: {
    fontSize: 36,
    fontWeight: 800,
    color: "#1e1b4b",
    letterSpacing: "-0.03em",
    marginBottom: 6,
  },
  wordHintSubjective: {
    fontSize: 14,
    color: "#94a3b8",
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 10,
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1.5px solid rgba(139,92,246,0.2)",
    borderRadius: 13,
    padding: "13px 16px",
    background: "rgba(255,255,255,0.62)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#3730a3",
    textAlign: "left",
  },
  optionBtnActive: {
    borderColor: "rgba(109,40,217,0.7)",
    background: "rgba(237,233,254,0.62)",
    boxShadow: "0 4px 14px rgba(109,40,217,0.15)",
  },
  optionBtnDisabled: {
    opacity: 0.7,
    cursor: "default",
  },
  optionLetter: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(139,92,246,0.12)",
    color: "#7c3aed",
    flexShrink: 0,
  },
  optionLetterActive: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(109,40,217,0.2)",
    color: "#5b21b6",
    flexShrink: 0,
  },
  inputWrap: {
    marginBottom: 8,
  },
  subjectiveInput: {
    background: "rgba(255,255,255,0.8)",
    border: "2px solid #0d9488",
    borderRadius: 13,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 500,
    color: "#0f766e",
    boxShadow: "0 0 14px rgba(13,148,136,0.14)",
  },
  feedbackCorrect: {
    borderRadius: 12,
    border: "0.5px solid rgba(13,148,136,0.25)",
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0d9488",
    background:
      "linear-gradient(90deg,rgba(204,251,241,0.6),rgba(240,253,250,0.5))",
  },
  feedbackWrong: {
    borderRadius: 12,
    border: "0.5px solid rgba(220,38,38,0.25)",
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#991b1b",
    background:
      "linear-gradient(90deg,rgba(254,226,226,0.6),rgba(255,255,255,0.5))",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: 700,
  },
  errorTextInline: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: 700,
  },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  exitBtn: {
    width: "auto",
    padding: "10px 16px",
    fontSize: 13,
    color: "#7c6fad",
    background: "rgba(255,255,255,0.65)",
    border: "0.5px solid rgba(139,92,246,0.2)",
  },
  submitBtnObjective: {
    width: "auto",
    minWidth: 140,
    padding: "11px 24px",
    fontSize: 13,
    background: "linear-gradient(135deg,#6d28d9,#0d9488)",
  },
  submitBtnSubjective: {
    width: "auto",
    minWidth: 140,
    padding: "11px 24px",
    fontSize: 13,
    background: "linear-gradient(135deg,#0d9488,#7c3aed)",
  },
  loadingCard: {
    maxWidth: 640,
    margin: "120px auto 0",
    background: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: "36px 28px",
    textAlign: "center",
  },
  finishCard: {
    maxWidth: 700,
    margin: "90px auto 0",
    background: "rgba(255,255,255,0.78)",
    borderRadius: 20,
    padding: "40px 30px",
    textAlign: "center",
    boxShadow: "0 16px 45px rgba(15, 23, 42, 0.1)",
  },
  finishEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#0d9488",
    marginBottom: 8,
  },
  finishTitle: {
    fontSize: 34,
    fontWeight: 800,
    color: "#1e1b4b",
    marginBottom: 8,
  },
  finishDesc: {
    fontSize: 17,
    color: "#7c6fad",
    marginBottom: 8,
  },
  finishRate: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0d9488",
    marginBottom: 22,
  },
  finishActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  secondaryBtn: {
    width: "auto",
    padding: "11px 20px",
    fontSize: 13,
    color: "#7c6fad",
    background: "rgba(255,255,255,0.7)",
    border: "0.5px solid rgba(13,148,136,0.2)",
  },
  primaryBtn: {
    width: "auto",
    padding: "11px 20px",
    fontSize: 13,
    background: "linear-gradient(135deg,#0d9488,#7c3aed)",
  },
};

export default WordTest;
