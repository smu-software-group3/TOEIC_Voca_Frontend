import React, { useEffect, useState } from "react";
import { Input } from "../components/Input";

const mockWordBook = [
  { word: "apple", meaning: "사과" },
  { word: "ability", meaning: "능력" },
  { word: "balance", meaning: "균형" },
  { word: "challenge", meaning: "도전" },
  { word: "discover", meaning: "발견하다" },
];

function Word() {
  const [word, setWord] = useState("");
  const [results, setResults] = useState(mockWordBook);
  const [error, setError] = useState("");

  // 입력값이 바뀔 때마다 영어 여부를 확인하고 mock 단어장을 다시 필터링한다.
  useEffect(() => {
    const trimmedWord = word.trim();
    const englishOnlyPattern = /^[A-Za-z\s]*$/;

    if (!trimmedWord) {
      setError("");
      setResults(mockWordBook);
      return;
    }

    if (!englishOnlyPattern.test(trimmedWord)) {
      setError("검색은 영어로만 가능합니다.");
      return;
    }

    setError("");

    const nextResults = mockWordBook.filter((item) =>
      item.word.toLowerCase().includes(trimmedWord.toLowerCase()),
    );

    setResults(nextResults);
  }, [word]);

  return (
    <div>
      <h1>단어 검색</h1>

      <p>
        검색어는 영어로만 입력할 수 있습니다. 입력이 비어 있으면 mock 단어장이
        표시됩니다.
      </p>

      <label htmlFor="word-search-input">검색할 단어</label>
      <Input
        id="word-search-input"
        placeholder="Example: apple"
        value={word}
        onChange={(event) => setWord(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />

      {error && <p role="alert">{error}</p>}

      <h2>검색결과</h2>
      <ul>
        {results.length > 0 ? (
          results.map((item) => (
            <li key={item.word}>
              {item.word} - {item.meaning}
            </li>
          ))
        ) : (
          <li>검색 결과가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

export default Word;
