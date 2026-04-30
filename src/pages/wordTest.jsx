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

// 문제 유형을 한국어로 표시한다.
function translateQuestionType(type) {
  return type === "objective" ? "객관식" : "주관식";
}

// 난이도 값을 한국어로 표시한다.
function translateDifficulty(difficulty) {
  const difficultyMap = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return difficultyMap[difficulty] || difficulty;
}

// 랜덤 단어를 섞어 객관식과 주관식 문제 목록으로 만든다.
function buildQuestionList(randomWords, testType, objectiveQuestions) {
  return randomWords.map((word, index) => {
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

  // 문제 형식이 선택되면 해당 형식을 유지한 채 테스트 목록을 불러온다.
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
        console.log("랜덤 단어 조회 응답:", randomWordsResponse);

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

  const currentQuestion = questions[currentIndex];
  const answerValue = useMemo(() => {
    if (!currentQuestion) {
      return "";
    }

    return currentQuestion.type === "objective" ? selectedChoiceId : userAnswer;
  }, [currentQuestion, selectedChoiceId, userAnswer]);

  // 현재 문제의 답안을 서버로 보내 정답 여부를 확인한다.
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

  // 테스트 상태를 초기화해 처음부터 다시 풀 수 있게 한다.
  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedChoiceId("");
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
    setError("");
  };

  // 선택한 문제 형식을 고정한 채 테스트를 시작한다.
  const handleSelectTestType = (testType) => {
    setSelectedTestType(testType);
  };

  const navigate = useNavigate();

  // 객관식과 주관식 입력값을 함께 관리한다.
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
      <div>
        <h1>단어 테스트</h1>
        <p>문제를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div>
        <h1>단어 테스트</h1>
        <p role="alert">{error}</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div>
        <h1>테스트 완료</h1>
        <p>
          총 {questions.length}문제 중 {score}개를 맞혔습니다.
        </p>
        <p>
          정답률:{" "}
          {questions.length > 0
            ? Math.round((score / questions.length) * 100)
            : 0}
          %
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button buttonText="다시 풀기" onClick={handleRetry} type="button" />
          <Button
            buttonText="홈으로"
            onClick={() => navigate("/")}
            type="button"
          />
        </div>
      </div>
    );
  }

  if (selectedTestType && !currentQuestion) {
    return (
      <div>
        <h1>단어 테스트</h1>
        <p>문제를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>단어 테스트</h1>

      {!selectedTestType ? (
        <div>
          <p>문제 형식을 먼저 선택하세요.</p>
          <div style={{ margin: "8px 0" }}>
            <label htmlFor="question-count">문항수 (1-50)</label>
            <Input
              id="question-count"
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                const clamped = Number.isNaN(v) ? 1 : Math.max(1, Math.min(50, v));
                setQuestionCount(clamped);
              }}
              style={{ marginTop: 6 }}
            />
          </div>
          <Button
            type="button"
            buttonText="객관식으로 풀기"
            onClick={() => handleSelectTestType("objective")}
          />
          <Button
            type="button"
            buttonText="주관식으로 풀기"
            onClick={() => handleSelectTestType("subjective")}
          />
        </div>
      ) : (
        <>
          <p>선택한 문제 형식: {translateQuestionType(selectedTestType)}</p>
          <p>
            {currentIndex + 1} / {questions.length}
          </p>
          <p>
            문제 유형: {translateQuestionType(currentQuestion.type)} / 난이도:{" "}
            {translateDifficulty(currentQuestion.difficulty)}
          </p>

          <Form onSubmit={handleSubmit}>
            <div>
              <h2>
                {selectedTestType === "objective"
                  ? "다음 단어의 올바른 뜻을 선택하세요."
                  : "다음 단어의 뜻을 직접 입력하세요."}
              </h2>
              <p>영단어: {currentQuestion.spelling}</p>
            </div>

            {selectedTestType === "objective" ? (
              <div>
                <label htmlFor="test-answer-select">답</label>
                <select
                  id="test-answer-select"
                  value={selectedChoiceId}
                  onChange={handleAnswerChange}
                  disabled={!!feedback}
                >
                  <option value="">선택하세요</option>
                  {currentQuestion.choices.map((choice) => (
                    <option key={choice.choiceId} value={choice.choiceId}>
                      {choice.meaning}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="test-answer-input">답</label>
                <Input
                  id="test-answer-input"
                  placeholder="뜻을 입력하세요"
                  value={userAnswer}
                  onChange={handleAnswerChange}
                  disabled={!!feedback}
                  autoComplete="off"
                />
              </div>
            )}

            {feedback && <p>{feedback}</p>}
            {error && <p role="alert">{error}</p>}

            <Button
              buttonText="제출"
              disabled={!answerValue.trim() || !!feedback || loading}
            />
          </Form>
        </>
      )}
    </div>
  );
}

export default WordTest;
