import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { api } from "../api";
import { normalizeCategory } from "../lib/skills";

const choices = ["A", "B", "C", "D"];

function ProblemPage({ id }) {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nextQuestionId, setNextQuestionId] = useState(null);
  const attemptIdRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([api(`/questions/${id}`), api("/questions")])
      .then(([data, questions]) => {
        if (!active) return;
        setQuestion(data);
        const ordered = [...questions].sort((a, b) => Number(a.id) - Number(b.id));
        const currentIndex = ordered.findIndex((item) => String(item.id) === String(id));
        setNextQuestionId(currentIndex >= 0 ? ordered[currentIndex + 1]?.id ?? null : null);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    if (!selected || result) return;
    setSubmitting(true);
    setError("");
    try {
      if (!attemptIdRef.current) attemptIdRef.current = globalThis.crypto?.randomUUID?.();
      if (!attemptIdRef.current) throw new Error("This browser cannot create a secure attempt ID. Please use a current browser.");
      const data = await api("/submissions", { method: "POST", body: JSON.stringify({ question_id: Number(id), selected_option: selected, attempt_id: attemptIdRef.current }) });
      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const optionFields = { A: "option_a", B: "option_b", C: "option_c", D: "option_d" };
  return <div className="problem-page sf-page sf-question-page">
    <UserNavbar />
    <main className="problem-main">
      <Link to="/problems" className="problem-back">← Back to Problems</Link>
      <section className="problem-unavailable sf-question-card">
        {loading ? <p role="status">Loading question…</p> : error && !question ? <p className="problems-status problems-error" role="alert">{error}</p> : question && <>
          <div className="problem-meta"><span>{normalizeCategory(question.category) || "PRACTICE QUESTION"}</span><span>{question.difficulty}</span></div>
          <div className="problem-unavailable-icon">✦</div>
          <h1>{question.title}</h1>
          <p>{question.description}</p>
          <form onSubmit={submit}>
            <div className="problem-options" role="radiogroup" aria-label="Answer options">
              {choices.map((choice) => <button type="button" className={`problem-option${selected === choice ? " problem-option-selected" : ""}${result && choice === result.correct_option ? " is-correct" : ""}${result && selected === choice && !result.submission.is_correct ? " is-wrong" : ""}`} key={choice} onClick={() => !result && setSelected(choice)} aria-pressed={selected === choice} disabled={Boolean(result)}><span>{choice}</span>{question[optionFields[choice]]}</button>)}
            </div>
            {error && <p className="problems-status problems-error" role="alert">{error}</p>}
            <button type="submit" className="problem-submit" disabled={!selected || submitting || Boolean(result)}>{submitting ? "Submitting…" : result ? "Answer submitted" : "Submit Answer"}</button>
          </form>
          {result && <div className="problem-answer-result" role="status"><h2>{result.submission.is_correct ? "Correct answer" : "Not quite"}</h2><p><strong>Correct option: {result.correct_option}</strong> — {question[optionFields[result.correct_option]]}</p>{result.explanation && <p>{result.explanation}</p>}<Link className="problem-submit" to={nextQuestionId ? `/problem/${nextQuestionId}` : "/problems"}>{nextQuestionId ? "Next question →" : "Browse more questions →"}</Link></div>}
        </>}
      </section>
    </main>
  </div>;
}

export default function Problem() {
  const { id } = useParams();
  return <ProblemPage key={id} id={id} />;
}
