import React, { useEffect, useState } from "react";
import "./Retest.css";

const MOCK_WEAK_WORDS = [
  { word: "apple", meaning: "사과" },
  { word: "book", meaning: "책" },
  { word: "computer", meaning: "컴퓨터" },
  { word: "dog", meaning: "개" },
  { word: "elephant", meaning: "코끼리" },
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

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="retest-page">
      <div className="retest-card">
        <section className="retest-header">
          <span className="eyebrow">임시 컴포넌트</span>
          <h1>취약 단어 재학습</h1>
          <p>
            아래에 표시된 취약 단어를 다시 확인하고, 오늘 재학습 여부와 추천
            문제 상태를 팝업으로 확인하세요.
          </p>
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
          <h2>취약 단어 목록</h2>
          <ul>
            {MOCK_WEAK_WORDS.map(({ word, meaning }) => (
              <li key={word}>
                {word} — {meaning}
              </li>
            ))}
          </ul>
        </section>

        <button
          className="retest-button"
          type="button"
          onClick={handleStartRetest}
        >
          재학습 시작
        </button>
      </div>
    </div>
  );
}

export default Retest;
