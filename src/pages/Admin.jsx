import React, { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Form } from "../components/Form";
import { Input } from "../components/Input";

const initialWords = [
  {
    id: 1,
    spelling: "apple",
    meaning: "사과",
    difficulty: "EASY",
  },
  {
    id: 2,
    spelling: "compose",
    meaning: "구성하다",
    difficulty: "MEDIUM",
  },
];

export default function Admin() {
  const [words, setWords] = useState(initialWords);
  const [selectedId, setSelectedId] = useState(initialWords[0]?.id || null);
  const [spelling, setSpelling] = useState(initialWords[0]?.spelling || "");
  const [meaning, setMeaning] = useState(initialWords[0]?.meaning || "");
  const [difficulty, setDifficulty] = useState(
    initialWords[0]?.difficulty || "EASY",
  );

  const selectedWord = useMemo(
    () => words.find((word) => word.id === selectedId) || null,
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

    setSelectedId(word.id);
    setSpelling(word.spelling);
    setMeaning(word.meaning);
    setDifficulty(word.difficulty);
  };

  const handleSelectWord = (word) => {
    syncForm(word);
  };

  const buildFormWord = (id) => {
    const formWord = {
      id,
      spelling: spelling.trim(),
      meaning: meaning.trim(),
      difficulty,
    };

    return formWord;
  };

  const handleAdd = () => {
    const nextWord = buildFormWord(Date.now());

    if (!nextWord.spelling || !nextWord.meaning) {
      return;
    }

    setWords((currentWords) => [...currentWords, nextWord]);
    syncForm(nextWord);
  };

  const handleUpdate = () => {
    if (!selectedWord) {
      return;
    }

    const nextWord = buildFormWord(selectedWord.id);

    if (!nextWord.spelling || !nextWord.meaning) {
      return;
    }

    setWords((currentWords) =>
      currentWords.map((word) =>
        word.id === selectedWord.id ? nextWord : word,
      ),
    );

    syncForm(nextWord);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate();
  };

  const handleDelete = () => {
    if (!selectedWord) {
      return;
    }

    const nextWords = words.filter((word) => word.id !== selectedWord.id);
    setWords(nextWords);

    if (nextWords.length > 0) {
      syncForm(nextWords[0]);
    } else {
      syncForm(null);
    }
  };

  return (
    <div>
      <h1>단어 관리</h1>
      <p>단어를 추가, 수정, 삭제할 수 있는 관리자 폼입니다.</p>

      <Form onSubmit={handleSubmit}>
        <Input
          placeholder="영단어"
          value={spelling}
          onChange={(event) => setSpelling(event.target.value)}
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

        <Button buttonText="추가" type="button" onClick={handleAdd} />
        <Button
          buttonText="수정"
          type="submit"
          disabled={!selectedWord}
        />
        <Button
          buttonText="삭제"
          type="button"
          onClick={handleDelete}
          disabled={!selectedWord}
        />
      </Form>

      <section>
        <h2>단어 목록</h2>
        <ul>
          {words.map((word) => (
            <li key={word.id}>
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
