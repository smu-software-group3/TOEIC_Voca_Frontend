import React, { useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Form } from "../components/Form";

const mockTestQuestions = [
  { id: 1, question: "사과", answer: "apple" },
  { id: 2, question: "능력", answer: "ability" },
  { id: 3, question: "균형", answer: "balance" },
  { id: 4, question: "도전", answer: "challenge" },
  { id: 5, question: "발견하다", answer: "discover" },
];

function WordTest() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState("");

  const currentQuestion = mockTestQuestions[currentIndex];

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedAnswer = userAnswer.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();

    if (trimmedAnswer === correctAnswer) {
      setScore(score + 1);
      setFeedback("정답입니다!");
    } else {
      setFeedback(`틀렸습니다. 정답은 "${currentQuestion.answer}"입니다.`);
    }

    setTimeout(() => {
      if (currentIndex < mockTestQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserAnswer("");
        setFeedback("");
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setScore(0);
    setIsFinished(false);
    setFeedback("");
  };

  if (isFinished) {
    return (
      <div>
        <h1>테스트 완료</h1>
        <p>
          총 {mockTestQuestions.length}문제 중 {score}개를 맞혔습니다.
        </p>
        <p>정답률: {Math.round((score / mockTestQuestions.length) * 100)}%</p>
        <Button buttonText="다시 풀기" onClick={handleRetry} type="button" />
      </div>
    );
  }

  return (
    <div>
      <h1>단어 테스트</h1>
      <p>
        {currentIndex + 1} / {mockTestQuestions.length}
      </p>

      <Form onSubmit={handleSubmit}>
        <div>
          <h2>다음 단어의 영어 표현을 입력하세요.</h2>
          <p>{currentQuestion.question}</p>
        </div>

        <label htmlFor="test-answer-input">답</label>
        <Input
          id="test-answer-input"
          placeholder="Enter English word"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={!!feedback}
          autoComplete="off"
        />

        {feedback && <p>{feedback}</p>}

        <Button buttonText="제출" disabled={!userAnswer.trim() || !!feedback} />
      </Form>
    </div>
  );
}

export default WordTest;
