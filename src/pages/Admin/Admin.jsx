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
import "./Admin.css";

function adminButtonStyle(variant, loading) {
  const base = {
    width: "auto",
    flex: "0 0 auto",
    minWidth: "unset",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    boxSizing: "border-box",
    color: "#fff",
  };

  if (variant === "add") {
    return {
      ...base,
      background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
      boxShadow: "0 2px 12px rgba(109,40,217,0.25)",
    };
  }

  if (variant === "save") {
    return {
      ...base,
      background: "linear-gradient(135deg, #4c1d95, #1e1b4b)",
      boxShadow: "0 2px 12px rgba(109,40,217,0.22)",
    };
  }

  return {
    ...base,
    background: "linear-gradient(135deg, #e0415a, #be123c)",
    boxShadow: "0 2px 12px rgba(190,18,60,0.22)",
  };
}

export default function Admin() {
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("asc");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [deletingWord, setDeletingWord] = useState(null);

  // Form states
  const [spelling, setSpelling] = useState("");
  const [meaning, setMeaning] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("EASY");

  const extractRole = (memberInfo) => {
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
  };

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

  // Filter words based on search term, difficulty, and sort
  useEffect(() => {
    let filtered = [...words];

    // Apply difficulty filter
    if (difficulty) {
      filtered = filtered.filter((word) => word.difficulty === difficulty);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (word) =>
          word.spelling.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.meaning.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sort === "asc") {
        return a.spelling.localeCompare(b.spelling);
      } else {
        return b.spelling.localeCompare(a.spelling);
      }
    });

    setFilteredWords(filtered);
  }, [searchTerm, difficulty, sort, words]);

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

  // Modal management functions
  const openAddModal = () => {
    setEditingWord(null);
    setSpelling("");
    setMeaning("");
    setFormDifficulty("EASY");
    setError("");
    setShowEditModal(true);
  };

  const openEditModal = (word) => {
    setEditingWord(word);
    setSpelling(word.spelling);
    setMeaning(word.meaning);
    setFormDifficulty(word.difficulty);
    setError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingWord(null);
    setSpelling("");
    setMeaning("");
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

  const buildRequestBody = () => ({
    spelling: spelling.trim(),
    meaning: meaning.trim(),
    difficulty: formDifficulty,
  });

  const handleSaveWord = async () => {
    const requestBody = buildRequestBody();

    if (!requestBody.spelling || !requestBody.meaning) {
      setError("단어와 뜻은 필수 항목입니다.");
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
    } else {
      setError("영단어는 알파벳 대소문자만 입력할 수 있습니다.");
    }
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
          <h1 className="admin-page-title">단어 관리</h1>
          <p>{error || "관리자만 접근할 수 있습니다."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-inner">
        <header className="admin-page-header">
          <div className="admin-page-header-left">
            <h1 className="admin-page-title">단어 관리</h1>
            <p className="admin-page-sub">전체 단어 데이터를 관리합니다</p>
          </div>
          <div className="admin-header-btns">
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
        </header>

        {/* Search Bar */}
        <div className="admin-toolbar">
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
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="admin-filter-select"
          >
            <option value="">전체</option>
            <option value="EASY">쉬움</option>
            <option value="MEDIUM">중간</option>
            <option value="HARD">어려움</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="admin-filter-select"
          >
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select>
        </div>

        {message && (
          <p className="admin-banner admin-banner--success" role="status">
            {message}
          </p>
        )}

        <section
          className="admin-word-section"
          aria-labelledby="admin-word-list-heading"
        >
          <h2 id="admin-word-list-heading" className="admin-section-title">
            단어 목록 ({filteredWords.length}개)
          </h2>
          <div className="admin-table-wrap">
            <div className="admin-table-head" aria-hidden="true">
              <span>영단어</span>
              <span>뜻</span>
              <span>난이도</span>
              <span>관리</span>
            </div>
            <ul className="admin-table-body">
              {filteredWords.map((word) => (
                <li key={word.wordId}>
                  <div className="admin-table-row">
                    <span className="admin-word-en">{word.spelling}</span>
                    <span className="admin-word-ko">{word.meaning}</span>
                    <span className="admin-diff-wrap">
                      <span className={difficultyBadgeClass(word.difficulty)}>
                        {translateDifficulty(word.difficulty)}
                      </span>
                    </span>
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
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Add/Edit Modal */}
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
                  <label>뜻 (한국어) *</label>
                  <input
                    type="text"
                    value={meaning}
                    onChange={(event) => setMeaning(event.target.value)}
                    placeholder="e.g. 불분명한, 모호한"
                    className="admin-modal-input"
                  />
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

        {/* Delete Confirmation Modal */}
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
