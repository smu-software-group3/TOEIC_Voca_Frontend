import React, { useEffect, useMemo, useState } from "react";
import {
  checkWordAnswer,
  getRandomWords,
  getWordTestQuestion,
} from "../../api/server";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Form } from "../../components/Form";
import {
  difficultyBadgeClass,
  translateDifficulty,
} from "../../utils/difficulty";
import {
  partOfSpeechBadgeClass,
  partOfSpeechToKorean,
} from "../../utils/partOfSpeech";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./WordTest.css";

function getPrimaryMeaning(word) {
  return word?.meanings?.[0]?.meaning || word?.meaning || "";
}

function getPrimaryPartOfSpeech(word) {
  return word?.meanings?.[0]?.partOfSpeech || word?.partOfSpeech || "";
}

function shuffle(list) {
  const result = [...list];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function buildObjectiveChoices(allWords, currentWord, objectiveQuestion) {
  const existingChoices = Array.isArray(objectiveQuestion?.choices)
    ? objectiveQuestion.choices
    : [];
  const choiceMap = new Map(
    existingChoices.map((choice) => [choice.spelling, choice]),
  );

  // 객관식은 5개 선택지를 보여주도록 정답을 먼저 넣고 나머지를 채운다.
  choiceMap.set(currentWord.spelling, {
    choiceId: `${currentWord.wordId}-answer`,
    spelling: currentWord.spelling,
    meaning:
      objectiveQuestion?.meaning ||
      currentWord.meaning ||
      getPrimaryMeaning(currentWord),
  });

  const fallbackChoices = shuffle(
    Array.from(
      new Set(
        allWords
          .map((word) => word.spelling)
          .filter((spelling) => spelling && spelling !== currentWord.spelling),
      ),
    ),
  );

  fallbackChoices.forEach((spelling) => {
    if (choiceMap.size >= 5 || choiceMap.has(spelling)) {
      return;
    }

    choiceMap.set(spelling, {
      choiceId: `${currentWord.wordId}-fallback-${choiceMap.size}-${spelling}`,
      spelling,
      meaning:
        allWords.find((word) => word.spelling === spelling)?.meaning ||
        allWords.find((word) => word.spelling === spelling)?.meanings?.[0]
          ?.meaning ||
        spelling,
    });
  });

  const shuffledChoices = shuffle(Array.from(choiceMap.values())).slice(0, 5);

  if (
    !shuffledChoices.some((choice) => choice.spelling === currentWord.spelling)
  ) {
    shuffledChoices[shuffledChoices.length - 1] = {
      choiceId: `${currentWord.wordId}-answer`,
      spelling: currentWord.spelling,
      meaning:
        objectiveQuestion?.meaning ||
        currentWord.meaning ||
        getPrimaryMeaning(currentWord),
    };
  }

  return shuffledChoices;
}

function buildQuestionList(randomWords, testType, objectiveQuestions) {
  return randomWords.map((word) => {
    const isObjective = testType === "objective";
    const partOfSpeech = getPrimaryPartOfSpeech(word);
    const meaning = getPrimaryMeaning(word);

    if (isObjective) {
      const objectiveQuestion = objectiveQuestions.find(
        (question) => question.wordId === word.wordId,
      );

      return {
        wordId: word.wordId,
        type: "objective",
        spelling: word.spelling,
        meaning: objectiveQuestion?.meaning || meaning,
        partOfSpeech,
        difficulty: word.difficulty,
        choices: buildObjectiveChoices(randomWords, word, objectiveQuestion),
      };
    }

    return {
      wordId: word.wordId,
      type: "subjective",
      spelling: word.spelling,
      meaning,
      partOfSpeech,
      difficulty: word.difficulty,
    };
  });
}

function WordTest() {
  const [questionCount, setQuestionCount] = useState(6);
  const [isQuestionSettingsOpen, setIsQuestionSettingsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [wrongWords, setWrongWords] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { testType } = useParams();
  const selectedTestType =
    testType === "objective" || testType === "subjective" ? testType : "";
  const customWords = useMemo(
    () =>
      Array.isArray(location.state?.customWords)
        ? location.state.customWords
        : [],
    [location.state?.customWords],
  );
  const customReturnPath = location.state?.customReturnPath || "";
  const customSourceTitle = location.state?.customTitle || "";
  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answerStatusItems = useMemo(
    () =>
      questions.map((question, index) => {
        const result = testResults[index];

        return {
          label: String(index + 1).padStart(2, "0"),
          status: result
            ? result.isCorrect
              ? "correct"
              : "wrong"
            : index === currentIndex
              ? "current"
              : "pending",
        };
      }),
    [currentIndex, questions, testResults],
  );

  const isObjectiveTest = selectedTestType === "objective";
  const isSubjectiveTest = selectedTestType === "subjective";

  useEffect(() => {
    if (!selectedTestType) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedChoiceId("");
      setUserAnswer("");
      setScore(0);
      setIsFinished(false);
      setFeedback("");
      setError("");
      setTestResults([]);
      setWrongWords([]);
      setIsQuestionSettingsOpen(false);
      return;
    }

    setQuestions([]);
    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
    setError("");
    setTestResults([]);
    setWrongWords([]);
    setIsQuestionSettingsOpen(false);

    const loadQuestions = async () => {
      setLoading(true);
      setError("");

      try {
        if (customWords.length > 0) {
          if (selectedTestType === "objective") {
            const objectiveResults = await Promise.all(
              customWords.map(async (word) => {
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
              buildQuestionList(
                customWords,
                selectedTestType,
                objectiveResults,
              ),
            );
            return;
          }

          setQuestions(buildQuestionList(customWords, selectedTestType, []));
          return;
        }

        const randomWordsResponse = await getRandomWords(questionCount, "");

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
  }, [selectedTestType, questionCount, customWords]);

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

    const submittedSpelling =
      currentQuestion.type === "objective"
        ? currentQuestion.choices.find(
            (choice) => String(choice.choiceId) === String(selectedChoiceId),
          )?.spelling || ""
        : userAnswer.trim();

    if (!submittedSpelling) {
      setFeedback("답안을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await checkWordAnswer(
        currentQuestion.wordId,
        submittedSpelling,
      );

      if (!response?.success) {
        throw new Error(response?.message || "정답 확인에 실패했습니다.");
      }

      const answerData = response.data || {};
      const isCorrect = Boolean(answerData.correct);
      const correctAnswer = answerData.answer || currentQuestion.spelling || "";

      if (!isCorrect) {
        setWrongWords((currentWrongWords) => {
          const alreadyIncluded = currentWrongWords.some(
            (word) => word.wordId === currentQuestion.wordId,
          );

          if (alreadyIncluded) {
            return currentWrongWords;
          }

          return [...currentWrongWords, currentQuestion];
        });
      }

      setTestResults((currentResults) => [
        ...currentResults,
        {
          wordId: currentQuestion.wordId,
          spelling: currentQuestion.spelling || currentQuestion.meaning,
          meaning: currentQuestion.meaning,
          submittedAnswer: submittedSpelling,
          correctAnswer,
          isCorrect,
        },
      ]);

      if (isCorrect) {
        setScore((prevScore) => prevScore + 1);
        setFeedback("정답입니다!");
      } else {
        setFeedback(`틀렸습니다. 정답은 "${correctAnswer}"입니다.`);
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
    if (wrongWords.length === 0) {
      navigate(customReturnPath || "/wtest");
      return;
    }

    setQuestions(wrongWords);
    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
    setError("");
    setTestResults([]);
    setWrongWords([]);
  };

  const handleSelectTestType = (type) => {
    navigate(`/wtest/${type}`);
  };

  // 선택 화면의 문항 수 설정 패널을 토글한다.
  const toggleQuestionSettings = () => {
    setIsQuestionSettingsOpen((prevValue) => !prevValue);
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
          <h1 className="wordtest-finish-title">
            {customSourceTitle
              ? `${customSourceTitle} 테스트 완료`
              : "수고하셨습니다!"}
          </h1>
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
          <div className="wordtest-result-list">
            <h2 className="wordtest-result-title">문제별 결과</h2>
            <ul className="wordtest-result-items">
              {testResults.map((result, index) => (
                <li
                  key={`${result.wordId}-${index}`}
                  className={
                    result.isCorrect
                      ? "wordtest-result-item wordtest-result-item--correct"
                      : "wordtest-result-item wordtest-result-item--wrong"
                  }
                >
                  <div className="wordtest-result-head">
                    <span className="wordtest-result-word">
                      {result.spelling}
                    </span>
                    <span
                      className={
                        result.isCorrect
                          ? "wordtest-result-badge wordtest-result-badge--correct"
                          : "wordtest-result-badge wordtest-result-badge--wrong"
                      }
                    >
                      {result.isCorrect ? "정답" : "오답"}
                    </span>
                  </div>
                  <p className="wordtest-result-meaning">
                    뜻: {result.meaning}
                  </p>
                  <p className="wordtest-result-answer">
                    내 답: {result.submittedAnswer || "미입력"}
                  </p>
                  <p className="wordtest-result-answer wordtest-result-answer--correct">
                    정답: {result.correctAnswer}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="wordtest-finish-actions">
            {wrongWords.length > 0 && (
              <Button
                buttonText="재학습"
                onClick={handleRetry}
                type="button"
                className="wordtest-btn-secondary"
              />
            )}
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
          <h1 className="wordtest-page-title">
            어떤 방식으로
            <br />
            <span>테스트</span>를 진행할까요?
          </h1>
          <p className="wordtest-subtext">
            원하는 방식을 선택하고 단어 실력을 확인해 보세요!
          </p>

          <div className="wordtest-card-grid">
            <article className="wordtest-type-card wordtest-type-card--objective">
              <div className="wordtest-card-header">
                <div className="wordtest-card-icon-purple" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="6" height="4" rx="1" />
                    <line x1="13" y1="7" x2="21" y2="7" />
                    <rect x="3" y="13" width="6" height="4" rx="1" />
                    <line x1="13" y1="15" x2="21" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="wordtest-card-title wordtest-card-title--purple">
                    객관식 테스트
                  </p>
                  <p className="wordtest-card-desc">
                    보기 중 정답을 선택하는
                    <br />
                    객관식 테스트입니다.
                  </p>
                </div>
              </div>
              <div className="wordtest-card-footer">
                <ul className="wordtest-feature-list">
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--purple">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </span>
                    4지선다형 문제
                  </li>
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--purple">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15 15" />
                      </svg>
                    </span>
                    빠르게 실력 측정
                  </li>
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--purple">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </span>
                    난이도별 자동 출제
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleSelectTestType("objective")}
                  className="wordtest-start-purple"
                >
                  객관식 테스트 시작
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </article>

            <article className="wordtest-type-card wordtest-type-card--subjective">
              <div className="wordtest-card-header">
                <div className="wordtest-card-icon-teal" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <p className="wordtest-card-title wordtest-card-title--green">
                    주관식 테스트
                  </p>
                  <p className="wordtest-card-desc">
                    단어의 뜻을 직접 입력하는
                    <br />
                    주관식 테스트입니다.
                  </p>
                </div>
              </div>
              <div className="wordtest-card-footer">
                <ul className="wordtest-feature-list">
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--green">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    직접 입력하여 학습 효과 UP
                  </li>
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--green">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    기억력과 스펠링 강화
                  </li>
                  <li>
                    <span className="wordtest-feature-icon wordtest-feature-icon--green">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    난이도별 자동 출제
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleSelectTestType("subjective")}
                  className="wordtest-start-teal"
                >
                  주관식 테스트 시작
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </article>
          </div>

          <div className="wordtest-settings-banner">
            <div className="wordtest-settings-note">
              <strong>
                테스트는 선택한 단어장과 난이도에 따라 출제됩니다.
              </strong>
              <span>
                테스트 설정 변경을 누르면 문항 수를 조절할 수 있습니다.
              </span>
            </div>
            <button
              type="button"
              onClick={toggleQuestionSettings}
              className="wordtest-settings-button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              테스트 설정 변경
            </button>
          </div>

          {isQuestionSettingsOpen && (
            <section className="wordtest-settings-card">
              <div className="wordtest-settings-card-header">
                <div>
                  <p className="wordtest-settings-eyebrow">테스트 설정</p>
                  <h2>문항 수 조절</h2>
                </div>
                <p className="wordtest-settings-helper">
                  필요한 만큼만 문제를 풀 수 있게 설정해보세요.
                </p>
              </div>

              <div className="wordtest-settings-pills">
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

              <div className="wordtest-settings-input-row">
                <label
                  htmlFor="question-count"
                  className="wordtest-settings-label"
                >
                  직접 입력
                </label>
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
            </section>
          )}
        </section>
      ) : (
        <section className="wordtest-test-shell">
          <div className="wordtest-test-layout">
            <div className="wordtest-test-main">
              <div className="wordtest-top-row">
                <div className="wordtest-top-left">
                  <button
                    type="button"
                    className="wordtest-back-btn"
                    onClick={() => navigate("/wtest")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    {isObjectiveTest ? "객관식 테스트" : "주관식 테스트"}
                  </button>
                  <div className="wordtest-progress-center">
                    <span className="wordtest-progress-label">
                      문제 {currentIndex + 1} / {questions.length}
                    </span>
                    <div className="wordtest-progress-track">
                      <div
                        className="wordtest-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="wordtest-end-btn"
                  onClick={() => setIsFinished(true)}
                >
                  테스트 종료
                </button>
              </div>

              <Form onSubmit={handleSubmit} className="wordtest-form">
                <div
                  className={
                    isObjectiveTest
                      ? "wordtest-question-card-objective"
                      : "wordtest-question-card-subjective"
                  }
                >
                  <p
                    className={
                      isObjectiveTest
                        ? "wordtest-qeyebrow-objective"
                        : "wordtest-qeyebrow-subjective"
                    }
                  >
                    {isObjectiveTest
                      ? "다음 단어의 뜻으로 가장 알맞은 것을 고르세요."
                      : "다음 단어의 뜻을 영어로 입력하세요."}
                  </p>

                  {isObjectiveTest ? (
                    <>
                      <div className="wordtest-objective-meta">
                        <span
                          className={partOfSpeechBadgeClass(
                            currentQuestion.partOfSpeech,
                          )}
                        >
                          품사:{" "}
                          {partOfSpeechToKorean(currentQuestion.partOfSpeech)}
                        </span>
                        <span
                          className={difficultyBadgeClass(
                            currentQuestion.difficulty,
                          )}
                        >
                          난이도:{" "}
                          {translateDifficulty(currentQuestion.difficulty)}
                        </span>
                      </div>
                      <p className="wordtest-word-main-selective">
                        {currentQuestion.meaning}
                      </p>
                      <div className="wordtest-option-grid">
                        {(currentQuestion.choices || []).map(
                          (choice, index) => {
                            const active =
                              String(selectedChoiceId) ===
                              String(choice.choiceId);
                            const displayText = choice.spelling;

                            return (
                              <label
                                key={choice.choiceId}
                                className={[
                                  "wordtest-option-btn",
                                  active && "wordtest-option-btn--active",
                                  feedback && "wordtest-option-btn--disabled",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <input
                                  type="radio"
                                  name="objective-answer"
                                  value={choice.choiceId}
                                  checked={active}
                                  onChange={() =>
                                    setSelectedChoiceId(String(choice.choiceId))
                                  }
                                  disabled={!!feedback}
                                />
                                <span
                                  className="wordtest-radio-circle"
                                  aria-hidden="true"
                                >
                                  <span className="wordtest-radio-dot" />
                                </span>
                                <span className="wordtest-option-text">
                                  {displayText}
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="wordtest-subjective-meta wordtest-objective-meta">
                        <span
                          className={partOfSpeechBadgeClass(
                            currentQuestion.partOfSpeech,
                          )}
                        >
                          품사:{" "}
                          {partOfSpeechToKorean(currentQuestion.partOfSpeech)}
                        </span>
                        <span
                          className={difficultyBadgeClass(
                            currentQuestion.difficulty,
                          )}
                        >
                          난이도:{" "}
                          {translateDifficulty(currentQuestion.difficulty)}
                        </span>
                      </div>
                      <p className="wordtest-word-main-subjective">
                        {currentQuestion.meaning}
                      </p>
                      <div className="wordtest-answer-box">
                        <Input
                          id="test-answer-input"
                          placeholder="영어 단어를 입력하세요"
                          value={userAnswer}
                          onChange={handleAnswerChange}
                          disabled={!!feedback}
                          autoComplete="off"
                          className="wordtest-subjective-input"
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "0",
                            fontSize: "18px",
                            color: "#1a1560",
                            background: "transparent",
                            boxShadow: "none",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                        <div className="wordtest-char-count">
                          {currentIndex + 1} / {questions.length}
                        </div>
                      </div>

                      <div className="wordtest-hint-box">
                        <div className="wordtest-hint-title">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          힌트
                        </div>
                        <div className="wordtest-hint-text">
                          모범적이고 태도로 꾸준히 노력하는 모습
                        </div>
                      </div>
                    </>
                  )}
                </div>

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
                    buttonText="이전 문제"
                    type="button"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.max(0, prev - 1))
                    }
                    className="wordtest-btn-exit"
                  />
                  <Button
                    buttonText={isSubjectiveTest ? "정답 제출" : "다음 문제"}
                    disabled={
                      isSubjectiveTest
                        ? !answerValue.trim() || !!feedback || loading
                        : !!feedback || loading
                    }
                    className={
                      isObjectiveTest
                        ? "wordtest-btn-submit-objective"
                        : "wordtest-btn-submit-subjective"
                    }
                  />
                </div>
              </Form>
            </div>

            <aside className="wordtest-test-sidebar" aria-label="답안 현황">
              <section className="wordtest-side-card">
                <div className="wordtest-side-title-row">
                  <div>
                    <p className="wordtest-side-eyebrow">답안 현황</p>
                    <h2>현재 진행 상황</h2>
                  </div>
                  <span className="wordtest-side-count">
                    {currentIndex + 1}/{questions.length}
                  </span>
                </div>

                <div className="wordtest-side-legend">
                  <span>
                    <i className="wordtest-legend-dot wordtest-legend-dot--correct" />
                    정답
                  </span>
                  <span>
                    <i className="wordtest-legend-dot wordtest-legend-dot--wrong" />
                    오답
                  </span>
                  <span>
                    <i className="wordtest-legend-dot wordtest-legend-dot--current" />
                    현재
                  </span>
                </div>

                <div className="wordtest-answer-grid">
                  {answerStatusItems.map((item) => (
                    <button
                      key={`${item.label}-${item.status}`}
                      type="button"
                      className={[
                        "wordtest-answer-cell",
                        `wordtest-answer-cell--${item.status}`,
                      ].join(" ")}
                      aria-disabled="true"
                      tabIndex={-1}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

export default WordTest;
