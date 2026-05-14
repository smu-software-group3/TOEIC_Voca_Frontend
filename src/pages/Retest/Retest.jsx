import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Retest.css";

const MOCK_WEAK_WORDS = [
  { word: "apple", meaning: "사과" },
  { word: "book", meaning: "책" },
  { word: "computer", meaning: "컴퓨터" },
  { word: "dog", meaning: "개" },
  { word: "elephant", meaning: "코끼리" },
];

const MOCK_TODAY_WRONG_WORDS = [
  { word: "beautiful", meaning: "아름다운" },
  { word: "dangerous", meaning: "위험한" },
  { word: "enormous", meaning: "거대한" },
];

const MOCK_TODAY_RETEST = {
  available: true,
  message: "오늘 재학습 할 문제가 있습니다.",
};

const MOCK_RECOMMENDED_RETEST = {
  available: false,
  message: "추천 재학습 문제가 없습니다.",
};

function Retest() {
  const [notices, setNotices] = useState([]);
  const [words, setWords] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { retestType } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (retestType === "weak") {
      setTitle("취약 단어 재학습");
      setDescription(
        "아래에 표시된 취약 단어를 다시 확인하고, 재학습을 진행하세요."
      );
      setWords(MOCK_WEAK_WORDS);
    } else if (retestType === "today") {
      setTitle("오늘 틀린 단어 재학습");
      setDescription(
        "오늘 시험에서 틀린 단어를 다시 학습합니다. 아래의 단어들을 확인하세요."
      );
      setWords(MOCK_TODAY_WRONG_WORDS);
    } else {
      navigate("/retest-select");
      return;
    }

    setNotices([
      {
        id: "today-retest",
        title: "오늘 재학습 문제",
        message: MOCK_TODAY_RETEST.message,
        tone: MOCK_TODAY_RETEST.available ? "available" : "unavailable",
      },
      {
        id: "recommended-retest",
        title: "추천 재학습 문제",
        message: MOCK_RECOMMENDED_RETEST.message,
        tone: MOCK_RECOMMENDED_RETEST.available ? "available" : "unavailable",
      },
    ]);
  }, [retestType, navigate]);

  const dismissNotice = (noticeId) => {
    setNotices((currentNotices) =>
      currentNotices.filter((notice) => notice.id !== noticeId),
    );
  };

  const handleStartRetest = () => {
    setNotices((currentNotices) => [
      ...currentNotices,
      {
        id: `start-${Date.now()}`,
        title: "재학습 시작",
        message: "재학습 시작 기능은 아직 구현되지 않았습니다.",
        tone: "unavailable",
      },
    ]);
  };

  const handleBack = () => {
    navigate("/retest-select");
  };

  return (
    <div className="retest-page">
      <div className="retest-card">
        <section className="retest-header">
          <span className="eyebrow">
            {retestType === "weak" ? "취약 단어" : "오늘 틀린 단어"}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        {notices.length > 0 && (
          <section className="retest-notices" aria-label="재학습 알림">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className={`retest-notice retest-notice--${notice.tone}`}
                role="status"
              >
                <div className="retest-notice-text">
                  <strong>{notice.title}</strong>
                  <p>{notice.message}</p>
                </div>
                <button
                  type="button"
                  className="retest-notice-close"
                  aria-label={`${notice.title} 닫기`}
                  onClick={() => dismissNotice(notice.id)}
                >
                  ×
                </button>
              </article>
            ))}
          </section>
        )}

        <div className="retest-status">
          <article className="status-card">
            <h2>오늘 재학습 문제</h2>
            <p>현재는 백엔드 연결이 없어 mock 데이터로 처리합니다.</p>
            <span
              className={`status-pill ${MOCK_TODAY_RETEST.available ? "available" : "unavailable"}`}
            >
              {MOCK_TODAY_RETEST.available ? "확인 가능" : "없음"}
            </span>
          </article>
          <article className="status-card">
            <h2>추천 재학습 문제</h2>
            <p>오늘의 추천 재학습 문제 여부를 임시로 보여줍니다.</p>
            <span
              className={`status-pill ${MOCK_RECOMMENDED_RETEST.available ? "available" : "unavailable"}`}
            >
              {MOCK_RECOMMENDED_RETEST.available ? "추천 있음" : "추천 없음"}
            </span>
          </article>
        </div>

        <section className="weak-list">
          <h2>
            {retestType === "weak" ? "취약 단어 목록" : "오늘 틀린 단어 목록"}
          </h2>
          <ul>
            {words.map(({ word, meaning }) => (
              <li key={word}>
                {word} — {meaning}
              </li>
            ))}
          </ul>
        </section>

        <div className="retest-button-group">
          <button
            className="retest-button"
            type="button"
            onClick={handleStartRetest}
          >
            재학습 시작
          </button>
          <button
            className="retest-button-back"
            type="button"
            onClick={handleBack}
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Retest;
