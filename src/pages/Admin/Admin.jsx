import React, { useCallback, useEffect, useState } from "react";
import {
  createAdminWord,
  deleteAdminWord,
  getMemberInfo,
  getWords,
  updateAdminWord,
} from "../../api/server";
import {
  difficultyBadgeClass,
  translateDifficulty,
} from "../../utils/difficulty";
import {
  partOfSpeechBadgeClass,
  partOfSpeechColor,
  partOfSpeechToKorean,
} from "../../utils/partOfSpeech";
import adminMascot from "../../img/logo_with_character_tr.png";
import "./Admin.css";

function getMeaningSearchText(word) {
  const meanings = Array.isArray(word.meanings) ? word.meanings : [];

  if (meanings.length > 0) {
    return meanings
      .map((item) => item?.meaning || "")
      .join(" ")
      .toLowerCase();
  }

  return String(word.meaning || "").toLowerCase();
}

function getWordMeanings(word) {
  if (Array.isArray(word.meanings) && word.meanings.length > 0) {
    return word.meanings;
  }

  return [
    {
      meaning: word.meaning || "",
      partOfSpeech: word.partOfSpeech || "",
    },
  ];
}

function extractRole(memberInfo) {
  const payload = memberInfo?.data || memberInfo || {};

  if (typeof payload.role === "string") {
    return payload.role;
  }

  if (typeof payload.userRole === "string") {
    return payload.userRole;
  }

  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    const firstRole = payload.roles[0];
    return typeof firstRole === "string" ? firstRole : firstRole?.role || "";
  }

  return "";
}

function adminButtonStyle(variant, loading) {
  const base = {
    display: "inline-flex",
    width: "auto",
    flex: "0 0 auto",
    minWidth: "unset",
    padding: "10px 14px",
    borderRadius: "10px",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    boxSizing: "border-box",
    color: "#fff",
  };

  if (variant === "add") {
    return {
      ...base,
      background: "#5c45e0",
      boxShadow: "0 2px 12px rgba(92,69,224,0.25)",
    };
  }

  if (variant === "save") {
    return {
      ...base,
      background: "#4c1d95",
      boxShadow: "0 2px 12px rgba(76,29,149,0.22)",
    };
  }

  return {
    ...base,
    background: "#e0415a",
    boxShadow: "0 2px 12px rgba(224,65,90,0.22)",
  };
}

export default function Admin() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("asc");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [deletingWord, setDeletingWord] = useState(null);

  const [spelling, setSpelling] = useState("");
  const [meanings, setMeanings] = useState([
    { meaning: "", partOfSpeech: "NOUN" },
  ]);
  const [formDifficulty, setFormDifficulty] = useState("EASY");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

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

  const loadWords = useCallback(async () => {
    const wordsResponse = await getWords({
      spelling: "",
      difficulty: "",
      sort: "asc",
    });
    const payload = wordsResponse?.data;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : [];

    setWords(list);
    setFilteredWords(list);
  }, []);

  useEffect(() => {
    let filtered = [...words];

    if (difficulty) {
      filtered = filtered.filter((word) => word.difficulty === difficulty);
    }

    if (partOfSpeech) {
      filtered = filtered.filter((word) =>
        getWordMeanings(word)
          .map((item) => item?.partOfSpeech || "")
          .includes(partOfSpeech),
      );
    }

    if (searchTerm.trim()) {
      const searchValue = searchTerm.toLowerCase();

      filtered = filtered.filter(
        (word) =>
          String(word.spelling || "")
            .toLowerCase()
            .includes(searchValue) ||
          getMeaningSearchText(word).includes(searchValue),
      );
    }

    filtered.sort((a, b) => {
      if (sort === "asc") {
        return String(a.spelling || "").localeCompare(String(b.spelling || ""));
      }

      return String(b.spelling || "").localeCompare(String(a.spelling || ""));
    });

    setFilteredWords(filtered);
  }, [searchTerm, partOfSpeech, difficulty, sort, words]);

  useEffect(() => {
    const bootstrapAdmin = async () => {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const memberInfo = await getMemberInfo();
        const role = extractRole(memberInfo);

        if (role !== "ROLE_ADMIN") {
          setIsAdmin(false);
          setError("관리자(ROLE_ADMIN)만 접근할 수 있습니다.");
          return;
        }

        setIsAdmin(true);
        await loadWords();
      } catch (requestError) {
        setError(
          requestError.message || "관리자 페이지를 불러오지 못했습니다.",
        );
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    bootstrapAdmin();
  }, [loadWords]);

  const openAddModal = () => {
    setEditingWord(null);
    setSpelling("");
    setMeanings([{ meaning: "", partOfSpeech: "NOUN" }]);
    setFormDifficulty("EASY");
    setError("");
    setShowEditModal(true);
  };

  const openEditModal = (word) => {
    setEditingWord(word);
    setSpelling(word.spelling || "");

    if (Array.isArray(word.meanings) && word.meanings.length > 0) {
      setMeanings(
        word.meanings.map((item) => ({
          meaning: item.meaning || "",
          partOfSpeech: item.partOfSpeech || "NOUN",
        })),
      );
    } else {
      setMeanings([
        {
          meaning: word.meaning || "",
          partOfSpeech: word.partOfSpeech || "NOUN",
        },
      ]);
    }

    setFormDifficulty(word.difficulty || "EASY");
    setError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingWord(null);
    setSpelling("");
    setMeanings([{ meaning: "", partOfSpeech: "NOUN" }]);
    setFormDifficulty("EASY");
    setError("");
  };

  const openDeleteModal = (word) => {
    setDeletingWord(word);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingWord(null);
  };

  const updateMeaningEntry = (index, field, value) => {
    setMeanings((currentMeanings) =>
      currentMeanings.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addMeaningEntry = () => {
    setMeanings((currentMeanings) => [
      ...currentMeanings,
      { meaning: "", partOfSpeech: "NOUN" },
    ]);
  };

  const removeMeaningEntry = (index) => {
    setMeanings((currentMeanings) => {
      if (currentMeanings.length === 1) {
        return currentMeanings;
      }

      return currentMeanings.filter(
        (_, currentIndex) => currentIndex !== index,
      );
    });
  };

  const buildRequestBody = () => {
    const normalizedMeanings = meanings
      .map((item) => ({
        meaning: item.meaning.trim(),
        partOfSpeech: item.partOfSpeech,
      }))
      .filter((item) => item.meaning);

    return {
      spelling: spelling.trim(),
      meanings: normalizedMeanings,
      difficulty: formDifficulty,
    };
  };

  const handleSaveWord = async () => {
    const requestBody = buildRequestBody();

    if (!requestBody.spelling || requestBody.meanings.length === 0) {
      setError("단어와 뜻은 최소 1개 이상 입력해야 합니다.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (editingWord) {
        await updateAdminWord(editingWord.wordId, requestBody);
        setMessage("단어가 수정되었습니다.");
      } else {
        await createAdminWord(requestBody);
        setMessage("단어가 추가되었습니다.");
      }

      await loadWords();
      closeEditModal();
    } catch (requestError) {
      setError(requestError.message || "단어 저장 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async () => {
    if (!deletingWord) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await deleteAdminWord(deletingWord.wordId);
      setMessage("단어가 삭제되었습니다.");
      await loadWords();
      closeDeleteModal();
    } catch (requestError) {
      setError(requestError.message || "단어 삭제 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSpelling = (event) => {
    const regex = /^[a-zA-Z]*$/;

    if (regex.test(event.target.value)) {
      setSpelling(event.target.value);
      setError("");
      return;
    }

    setError("영단어는 알파벳 대소문자만 입력할 수 있습니다.");
  };

  if (!authChecked) {
    return (
      <div className="admin-page">
        <div className="admin-loading">관리자 권한을 확인 중입니다...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-state-card">
          <h1 className="admin-page-title">단어장 관리</h1>
          <p>{error || "관리자만 접근할 수 있습니다."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-inner fade-slide-up">
        <header className="admin-page-header">
          <div className="admin-page-header-left">
            <div className="admin-page-title-area">
              <div className="admin-page-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div>
                <h1 className="admin-page-title">단어장 관리</h1>
                <p className="admin-page-sub">
                  등록된 단어를 관리하고 추가, 수정, 삭제할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <aside className="admin-notice-box">
            <div className="admin-notice-content">
              <div className="admin-notice-title">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                관리 안내
              </div>
              <p className="admin-notice-text">
                단어를 추가, 수정, 삭제하여 학습자에게 제공할 단어를 관리해
                보세요.
              </p>
            </div>
            <img
              src={adminMascot}
              alt="VocaStats 관리자 안내 이미지"
              className="admin-notice-image"
            />
          </aside>
        </header>

        <section className="admin-table-card">
          <div className="admin-table-card-header">
            <div className="admin-table-card-title">단어 목록</div>
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <div className="admin-search-wrap">
                  <svg
                    className="admin-search-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    className="admin-search-input"
                    type="search"
                    placeholder="단어 또는 뜻 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="admin-filter-wrap">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="">난이도 전체</option>
                    <option value="EASY">쉬움</option>
                    <option value="MEDIUM">중간</option>
                    <option value="HARD">어려움</option>
                  </select>

                  <select
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="">품사 전체</option>
                    <option value="NOUN">명사</option>
                    <option value="VERB">동사</option>
                    <option value="ADJECTIVE">형용사</option>
                  </select>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="asc">오름차순</option>
                    <option value="desc">내림차순</option>
                  </select>
                  <button
                    className="admin-btn admin-btn--add"
                    onClick={openAddModal}
                    disabled={loading}
                    style={adminButtonStyle("add", loading)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    단어 추가
                  </button>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <p className="admin-banner admin-banner--success" role="status">
              {message}
            </p>
          )}

          <div className="admin-table-wrap">
            {!isMobileViewport ? (
              <table className="admin-word-table" role="table">
                <colgroup>
                  <col className="col-id" style={{ width: "70px" }} />
                  <col className="col-spelling" style={{ width: "160px" }} />
                  <col className="col-meanings" style={{ width: "auto" }} />
                  <col className="col-pos" style={{ width: "140px" }} />
                  <col className="col-diff" style={{ width: "100px" }} />
                  <col className="col-actions" style={{ width: "84px" }} />
                </colgroup>
                <thead className="admin-table-head">
                  <tr>
                    <th>번호</th>
                    <th>영어단어</th>
                    <th>뜻</th>
                    <th>품사</th>
                    <th>난이도</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.map((word) => {
                    const meaningsArr = getWordMeanings(word);
                    const meaningsText = meaningsArr
                      .map((m) => m.meaning)
                      .filter(Boolean)
                      .join(", ");

                    const uniquePos = Array.from(
                      new Set(meaningsArr.map((m) => m.partOfSpeech)),
                    ).filter(Boolean);

                    return (
                      <tr key={word.wordId} className="admin-table-row">
                        <td className="admin-word-id">{word.wordId}</td>
                        <td className="admin-word-en">{word.spelling}</td>
                        <td className="admin-word-ko-wrap">
                          <div className="admin-word-meanings">
                            <span className="admin-word-ko">
                              {meaningsText}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-word-pos-wrap">
                            {uniquePos.map((pos) => (
                              <span
                                key={`${word.wordId}-pos-${pos}`}
                                className={partOfSpeechBadgeClass(pos)}
                                style={{
                                  "--pos-accent": partOfSpeechColor(pos),
                                }}
                              >
                                {partOfSpeechToKorean(pos)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="admin-diff-wrap">
                          <span
                            className={difficultyBadgeClass(word.difficulty)}
                          >
                            {translateDifficulty(word.difficulty)}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="admin-ra-btn admin-ra-edit"
                              title="수정"
                              onClick={() => openEditModal(word)}
                              disabled={loading}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="admin-ra-btn admin-ra-delete"
                              title="삭제"
                              onClick={() => openDeleteModal(word)}
                              disabled={loading}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="admin-mobile-list">
                {filteredWords.map((word) => {
                  const meaningsArr = getWordMeanings(word);
                  const meaningsText = meaningsArr
                    .map((m) => m.meaning)
                    .filter(Boolean)
                    .join(" ");
                  const uniquePos = Array.from(
                    new Set(meaningsArr.map((m) => m.partOfSpeech)),
                  ).filter(Boolean);

                  return (
                    <article key={word.wordId} className="admin-mobile-card">
                      <div className="admin-mobile-card-top">
                        <div>
                          <div className="admin-mobile-id">#{word.wordId}</div>
                          <h3 className="admin-mobile-word">{word.spelling}</h3>
                        </div>
                        <span className={difficultyBadgeClass(word.difficulty)}>
                          {translateDifficulty(word.difficulty)}
                        </span>
                      </div>

                      <div className="admin-mobile-section">
                        <div className="admin-mobile-label">뜻</div>
                        <div className="admin-mobile-meaning">
                          {meaningsText || "-"}
                        </div>
                      </div>

                      <div className="admin-mobile-section">
                        <div className="admin-mobile-label">품사</div>
                        <div className="admin-mobile-pos-list">
                          {uniquePos.length > 0 ? (
                            uniquePos.map((pos) => (
                              <span
                                key={`${word.wordId}-mobile-pos-${pos}`}
                                className={partOfSpeechBadgeClass(pos)}
                                style={{
                                  "--pos-accent": partOfSpeechColor(pos),
                                }}
                              >
                                {partOfSpeechToKorean(pos)}
                              </span>
                            ))
                          ) : (
                            <span className="admin-mobile-empty">-</span>
                          )}
                        </div>
                      </div>

                      <div className="admin-mobile-actions">
                        <button
                          type="button"
                          className="admin-mobile-action admin-mobile-action--edit"
                          onClick={() => openEditModal(word)}
                          disabled={loading}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="admin-mobile-action admin-mobile-action--delete"
                          onClick={() => openDeleteModal(word)}
                          disabled={loading}
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {showEditModal && (
          <div
            className="admin-modal-bg"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <div className="admin-modal">
              <div className="admin-modal-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span className="admin-modal-title">
                    {editingWord ? "단어 수정" : "단어 추가"}
                  </span>
                  <span
                    className={`admin-modal-badge ${editingWord ? "edit" : "add"}`}
                  >
                    {editingWord ? "EDIT" : "NEW"}
                  </span>
                </div>
                <button className="admin-modal-close" onClick={closeEditModal}>
                  ✕
                </button>
              </div>
              <div className="admin-modal-content">
                {error && (
                  <p className="admin-inline-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="admin-modal-field">
                  <label>영어 단어 *</label>
                  <input
                    type="text"
                    value={spelling}
                    onChange={handleChangeSpelling}
                    placeholder="e.g. ambiguous"
                    className="admin-modal-input"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>뜻 / 품사 *</label>
                  <div className="admin-meaning-list">
                    {meanings.map((item, index) => (
                      <div
                        key={`meaning-${index}`}
                        className="admin-meaning-row"
                      >
                        <input
                          type="text"
                          value={item.meaning}
                          onChange={(event) =>
                            updateMeaningEntry(
                              index,
                              "meaning",
                              event.target.value,
                            )
                          }
                          placeholder="예: 불분명한, 모호한"
                          className="admin-modal-input admin-modal-input--meaning"
                        />
                        <select
                          value={item.partOfSpeech}
                          onChange={(event) =>
                            updateMeaningEntry(
                              index,
                              "partOfSpeech",
                              event.target.value,
                            )
                          }
                          className="admin-modal-select admin-modal-select--pos"
                        >
                          <option value="NOUN">명사</option>
                          <option value="VERB">동사</option>
                          <option value="ADJECTIVE">형용사</option>
                        </select>
                        <button
                          type="button"
                          className="admin-meaning-remove"
                          onClick={() => removeMeaningEntry(index)}
                          disabled={meanings.length === 1}
                          title="뜻 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="admin-meaning-add"
                    onClick={addMeaningEntry}
                  >
                    + 뜻 추가
                  </button>
                </div>
                <div className="admin-modal-field">
                  <label>난이도 *</label>
                  <select
                    value={formDifficulty}
                    onChange={(event) => setFormDifficulty(event.target.value)}
                    className="admin-modal-select"
                  >
                    <option value="EASY">쉬움</option>
                    <option value="MEDIUM">중간</option>
                    <option value="HARD">어려움</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-modal-cancel" onClick={closeEditModal}>
                  취소
                </button>
                <button
                  className="admin-modal-save"
                  onClick={handleSaveWord}
                  disabled={loading}
                >
                  {loading
                    ? "처리 중..."
                    : editingWord
                      ? "수정 저장"
                      : "단어 추가"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && deletingWord && (
          <div
            className="admin-modal-bg"
            onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}
          >
            <div className="admin-modal admin-modal--delete">
              <div className="admin-delete-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e0415a"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <p className="admin-delete-title">정말 삭제할까요?</p>
              <p className="admin-delete-desc">
                <span className="admin-delete-word">
                  "{deletingWord.spelling}"
                </span>{" "}
                단어를 삭제하면
                <br />
                학습 기록도 함께 사라집니다.
              </p>
              <div className="admin-delete-footer">
                <button
                  className="admin-modal-cancel"
                  style={{ flex: 1 }}
                  onClick={closeDeleteModal}
                >
                  취소
                </button>
                <button
                  className="admin-delete-confirm"
                  onClick={handleDeleteWord}
                  disabled={loading}
                >
                  {loading ? "처리 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
