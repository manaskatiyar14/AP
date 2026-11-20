import { useEffect, useState } from "react";
import UserNavbar from "../components/UserNavbar";
import { api, saveStoredUser } from "../api";
import { skills, normalizeCategory } from "../lib/skills";

const emptyQuestion = {
  title: "",
  description: "",
  category: "",
  difficulty: "easy",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  explanation: "",
};

export default function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [savingContest, setSavingContest] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [contests, setContests] = useState([]);
  const [draft, setDraft] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdminData() {
    const [questionList, contestList] = await Promise.all([
      api("/questions/admin"),
      api("/contests"),
    ]);
    setQuestions(questionList);
    setContests(contestList);
  }

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const user = await api("/users/me");
        if (!active) return;
        saveStoredUser(user);
        if (!user.is_admin) {
          setDenied(true);
          return;
        }
        setAuthorized(true);
        await loadAdminData();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  function updateDraft(event) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function editQuestion(question) {
    setEditingId(question.id);
    setDraft({
      title: question.title,
      description: question.description,
      category: normalizeCategory(question.category),
      difficulty: question.difficulty,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      explanation: question.explanation || "",
    });
    setMessage("");
    setError("");
    document.getElementById("admin-question-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetQuestionForm() {
    setEditingId(null);
    setDraft(emptyQuestion);
  }

  async function submitQuestion(event) {
    event.preventDefault();
    if (savingQuestion) return;
    setSavingQuestion(true);
    setMessage("");
    setError("");
    try {
      const result = await api(editingId ? `/questions/${editingId}` : "/questions", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(draft),
      });
      setMessage(editingId ? "Question updated." : "Question created.");
      resetQuestionForm();
      await loadAdminData();
      return result;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingQuestion(false);
    }
  }

  async function deleteQuestion(question) {
    if (!window.confirm(`Delete “${question.title}”?`)) return;
    setMessage("");
    setError("");
    try {
      await api(`/questions/${question.id}`, { method: "DELETE" });
      setMessage("Question deleted.");
      if (editingId === question.id) resetQuestionForm();
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitContest(event) {
    event.preventDefault();
    if (savingContest) return;
    setSavingContest(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/contests", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          start_time: new Date(String(form.get("start_time"))).toISOString(),
          end_time: new Date(String(form.get("end_time"))).toISOString(),
        }),
      });
      event.currentTarget.reset();
      setMessage("Contest created.");
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingContest(false);
    }
  }

  return (
    <div className="dashboard-page sf-page">
      <UserNavbar />
      <main className="dashboard-main admin-main">
        <header className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">SKILLFORGE ADMINISTRATION</p>
            <h1>Manage questions and contests</h1>
            <p>Changes are saved to the SkillForge database.</p>
          </div>
        </header>
        {loading && <p className="problems-status" role="status">Checking administrator access…</p>}
        {error && <p className="problems-status problems-error" role="alert">{error}</p>}
        {message && <p className="problems-status" role="status">{message}</p>}
        {denied && <p className="problems-status problems-error" role="alert">Administrator access is required for this page.</p>}

        {!loading && authorized && <>
          <section className="dashboard-insight admin-panel" id="admin-question-form">
            <p className="dashboard-eyebrow">QUESTION BANK</p>
            <h2>{editingId ? "Edit question" : "Create a question"}</h2>
            <form className="admin-form" onSubmit={submitQuestion}>
              <label>Question title<input name="title" value={draft.title} onChange={updateDraft} required minLength="3" maxLength="200" /></label>
              <label>Category<select name="category" value={draft.category} onChange={updateDraft} required><option value="" disabled>Select a skill</option>{skills.map((skill) => <option key={skill.name} value={skill.name}>{skill.name}</option>)}</select></label>
              <label>Difficulty<select name="difficulty" value={draft.difficulty} onChange={updateDraft}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
              <label className="admin-form-wide">Question text<textarea name="description" value={draft.description} onChange={updateDraft} required rows="3" /></label>
              {[["option_a", "Option A"], ["option_b", "Option B"], ["option_c", "Option C"], ["option_d", "Option D"]].map(([name, label]) => (
                <label key={name}>{label}<input name={name} value={draft[name]} onChange={updateDraft} required /></label>
              ))}
              <label>Correct option<select name="correct_option" value={draft.correct_option} onChange={updateDraft}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label>
              <label className="admin-form-wide">Explanation<textarea name="explanation" value={draft.explanation} onChange={updateDraft} required rows="3" /></label>
              <div className="admin-form-actions admin-form-wide">
                <button className="problem-submit" type="submit" disabled={savingQuestion}>{savingQuestion ? "Saving…" : editingId ? "Save changes" : "Create question"}</button>
                {editingId && <button className="admin-secondary-button" type="button" onClick={resetQuestionForm}>Cancel edit</button>}
              </div>
            </form>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">DATABASE QUESTIONS</p><h2>{questions.length} questions</h2></div></div>
            {questions.length === 0 ? <p>No questions are stored yet.</p> : <div className="admin-question-list">{questions.map((question) => (
              <article className="admin-question-row" key={question.id}>
                <div><strong>{question.title}</strong><span>{question.category} · {question.difficulty}</span></div>
                <div className="admin-row-actions"><button type="button" onClick={() => editQuestion(question)}>Edit</button><button type="button" onClick={() => deleteQuestion(question)}>Delete</button></div>
              </article>
            ))}</div>}
          </section>

          <section className="dashboard-insight admin-panel">
            <p className="dashboard-eyebrow">CONTESTS</p>
            <h2>Create a contest</h2>
            <p>Use the dates supplied by the contest organizer. The system does not invent contest schedules.</p>
            <form className="admin-form" onSubmit={submitContest}>
              <label>Contest title<input name="title" required minLength="3" maxLength="200" /></label>
              <label className="admin-form-wide">Description<textarea name="description" rows="3" maxLength="10000" /></label>
              <label>Starts<input name="start_time" type="datetime-local" required /></label>
              <label>Ends<input name="end_time" type="datetime-local" required /></label>
              <div className="admin-form-actions admin-form-wide"><button className="problem-submit" type="submit" disabled={savingContest}>{savingContest ? "Saving…" : "Create contest"}</button></div>
            </form>
            <div className="admin-question-list">{contests.map((contest) => (
              <article className="admin-question-row" key={contest.id}>
                <div><strong>{contest.title}</strong><span>{new Date(contest.start_time).toLocaleString()} · {contest.registration_count} registered</span></div>
              </article>
            ))}</div>
          </section>
        </>}
      </main>
    </div>
  );
}
