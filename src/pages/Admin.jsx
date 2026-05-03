import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import {
  createAdminWord,
  deleteAdminWord,
  getMemberInfo,
  getWords,
  updateAdminWord,
} from "../api/server";

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
    return <div>관리자 권한을 확인 중입니다...</div>;
  }

  if (!isAdmin) {
    return (
      <div>
        <h1>단어 관리</h1>
        <p>{error || "관리자만 접근할 수 있습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>단어 관리</h1>
      <p>단어를 추가, 수정, 삭제할 수 있는 관리자 폼입니다.</p>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      <Form onSubmit={handleSubmit}>
        <Input
          placeholder="영단어"
          value={spelling}
          onChange={handleChangeSpelling}
        />
        <Input
          placeholder="뜻"
          value={meaning}
          onChange={(event) => setMeaning(event.target.value)}
        />
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
        </select>

        <Button
          buttonText={loading ? "처리 중..." : "추가"}
          type="button"
          onClick={handleAdd}
          disabled={loading}
        />
        <Button
          buttonText={loading ? "처리 중..." : "수정"}
          type="submit"
          disabled={!selectedWord || loading}
        />
        <Button
          buttonText={loading ? "처리 중..." : "삭제"}
          type="button"
          onClick={handleDelete}
          disabled={!selectedWord || loading}
        />
      </Form>

      <section>
        <h2>단어 목록</h2>
        <ul>
          {words.map((word) => (
            <li key={word.wordId}>
              <button type="button" onClick={() => handleSelectWord(word)}>
                {word.spelling} / {word.meaning} / {word.difficulty}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
