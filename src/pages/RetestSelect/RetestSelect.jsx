import React from "react";
import { useNavigate } from "react-router-dom";
import "./RetestSelect.css";

function RetestSelect() {
  const navigate = useNavigate();

  const handleSelectWeakWords = () => {
    navigate("/retest/weak");
  };

  const handleSelectTodayWrong = () => {
    navigate("/retest/today");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="retest-select-page">
      <div className="retest-select-card">
        <section className="retest-select-header">
          <h1>재학습 유형 선택</h1>
          <p>어떤 단어를 재학습하시겠어요?</p>
        </section>

        <div className="retest-select-options">
          <button
            type="button"
            className="retest-option-button retest-option--weak"
            onClick={handleSelectWeakWords}
          >
            <span className="option-icon">🎯</span>
            <span className="option-title">취약 단어 재학습</span>
            <span className="option-description">
              반복적으로 틀린 취약 단어를 집중 학습합니다.
            </span>
          </button>

          <button
            type="button"
            className="retest-option-button retest-option--today"
            onClick={handleSelectTodayWrong}
          >
            <span className="option-icon">📅</span>
            <span className="option-title">오늘 틀린 단어 재학습</span>
            <span className="option-description">
              오늘 시험에서 틀린 단어를 다시 학습합니다.
            </span>
          </button>
        </div>

        <button
          type="button"
          className="retest-select-back-button"
          onClick={handleBack}
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}

export default RetestSelect;
