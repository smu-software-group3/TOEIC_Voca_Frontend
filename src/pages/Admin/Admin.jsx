import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { Form } from "../../components/Form";
import { Input } from "../../components/Input";
import {
  createAdminWord,
  deleteAdminWord,
  getMemberInfo,
  getWords,
  updateAdminWord,
} from "../../api/server";
import { difficultyBadgeClass, translateDifficulty } from "../../utils/difficulty";
import "./Admin.css";

const adminInputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid rgba(139,92,246,0.28)",
  borderRadius: "10px",
  fontSize: "15px",
  color: "#1e1b4b",
  outline: "none",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.88)",
};

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
  const [selectedId, setSelectedId] = useState(null);
  const [spelling, setSpelling] = useState("");
  const [meaning, setMeaning] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const loadWords = useCallback(async (preferredWordId = null) => {
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

    setSelectedId((prevId) => {
      if (list.length === 0) {
        setSpelling("");
        setMeaning("");
        setDifficulty("EASY");
        return null;
      }

      const target =
        list.find((word) => word.wordId === preferredWordId) ||
        list.find((word) => word.wordId === prevId) ||
        list[0];

      setSpelling(target?.spelling || "");
      setMeaning(target?.meaning || "");
      setDifficulty(target?.difficulty || "EASY");
      return target?.wordId || null;
    });
  }, []);

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

  const selectedWord = useMemo(
    () => words.find((word) => word.wordId === selectedId) || null,
    [words, selectedId],
  );

  const syncForm = (word) => {
    if (!word) {
      setSelectedId(null);
      setSpelling("");
      setMeaning("");
      setDifficulty("EASY");
      return;
    }

    setSelectedId(word.wordId);
    setSpelling(word.spelling);
    setMeaning(word.meaning);
    setDifficulty(word.difficulty);
  };

  const handleSelectWord = (word) => {
    syncForm(word);
  };

  const buildRequestBody = () => ({
    spelling: spelling.trim(),
    meaning: meaning.trim(),
    difficulty,
  });

  const handleAdd = async () => {
    const requestBody = buildRequestBody();

    if (!requestBody.spelling || !requestBody.meaning) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const created = await createAdminWord(requestBody);
      setMessage("단어가 추가되었습니다.");
      const payload = created?.data || created;
      await loadWords(payload?.wordId || null);
    } catch (requestError) {
      setError(requestError.message || "단어 추가 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWord) {
      return;
    }

    const requestBody = buildRequestBody();

    if (!requestBody.spelling || !requestBody.meaning) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await updateAdminWord(selectedWord.wordId, requestBody);
      setMessage("단어가 수정되었습니다.");
      await loadWords(selectedWord.wordId);
    } catch (requestError) {
      setError(requestError.message || "단어 수정 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedWord) {
      return;
    }

    handleUpdate();
  };

  const handleDelete = async () => {
    if (!selectedWord) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await deleteAdminWord(selectedWord.wordId);
      setMessage("단어가 삭제되었습니다.");
      await loadWords();
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
          <h1 className="admin-page-title">단어 관리</h1>
          <p className="admin-page-sub">
            단어를 추가, 수정, 삭제할 수 있는 관리자 폼입니다.
          </p>
        </header>

        {message && (
          <p className="admin-banner admin-banner--success" role="status">
            {message}
          </p>
        )}

        <Form
          onSubmit={handleSubmit}
          className="admin-form-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            width: "100%",
            maxWidth: "min(100%, 920px)",
            marginInline: "auto",
            padding: "28px 30px",
            backgroundColor: "rgba(255,255,255,0.72)",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(109,40,217,0.08)",
            border: "0.5px solid rgba(139,92,246,0.12)",
          }}
        >
          <div className="admin-form-fields-row">
            <Input
              placeholder="영단어"
              value={spelling}
              onChange={handleChangeSpelling}
              style={adminInputStyle}
            />
            <Input
              placeholder="뜻"
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
              style={adminInputStyle}
            />
            <select
              className="admin-select admin-select--difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              aria-label="난이도"
            >
              <option value="EASY">쉬움</option>
              <option value="MEDIUM">중간</option>
              <option value="HARD">어려움</option>
            </select>
          </div>

          <div className="admin-actions">
            {error ? (
              <p className="admin-inline-error" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              buttonText={loading ? "처리 중..." : "추가"}
              type="button"
              onClick={handleAdd}
              disabled={loading}
              className="admin-btn admin-btn--add"
              style={adminButtonStyle("add", loading)}
            />
            <Button
              buttonText={loading ? "처리 중..." : "수정"}
              type="submit"
              disabled={!selectedWord || loading}
              className="admin-btn admin-btn--save"
              style={adminButtonStyle("save", loading)}
            />
            <Button
              buttonText={loading ? "처리 중..." : "삭제"}
              type="button"
              onClick={handleDelete}
              disabled={!selectedWord || loading}
              className="admin-btn admin-btn--delete"
              style={adminButtonStyle("delete", loading)}
            />
          </div>
        </Form>

        <section className="admin-word-section" aria-labelledby="admin-word-list-heading">
          <h2 id="admin-word-list-heading" className="admin-section-title">
            단어 목록
          </h2>
          <div className="admin-table-wrap">
            <div className="admin-table-head" aria-hidden="true">
              <span>영단어</span>
              <span>뜻</span>
              <span>난이도</span>
            </div>
            <ul className="admin-table-body">
              {words.map((word) => {
                const selected = word.wordId === selectedId;
                return (
                  <li key={word.wordId}>
                    <button
                      type="button"
                      className={`admin-table-row${selected ? " admin-table-row--selected" : ""}`}
                      onClick={() => handleSelectWord(word)}
                    >
                      <span className="admin-word-en">{word.spelling}</span>
                      <span className="admin-word-ko">{word.meaning}</span>
                      <span className="admin-diff-wrap">
                        <span className={difficultyBadgeClass(word.difficulty)}>
                          {translateDifficulty(word.difficulty)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
