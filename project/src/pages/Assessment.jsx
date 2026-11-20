import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { api } from '../api';
import { normalizeCategory } from '../lib/skills';

const optionFields = { A: 'option_a', B: 'option_b', C: 'option_c', D: 'option_d' };
const choices = ['A', 'B', 'C', 'D'];
function shuffle(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
function buildSession(pool, count) {
  const buckets = Object.fromEntries(['easy','medium','hard'].map((level)=>[level,shuffle(pool.filter((item)=>item.difficulty===level))]));
  const wanted = { easy: Math.ceil(count * .3), medium: Math.round(count * .4), hard: Math.floor(count * .3) };
  const chosen = [];
  for (const level of ['easy','medium','hard']) chosen.push(...buckets[level].splice(0,wanted[level]));
  const used = new Set(chosen.map((item)=>item.id));
  const rest = shuffle(pool.filter((item)=>!used.has(item.id)));
  return shuffle(chosen.concat(rest.slice(0,Math.max(0,count-chosen.length))));
}
function elapsedLabel(seconds) { return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }

export default function Assessment() {
  const [params] = useSearchParams();
  const category = params.get('category') || '';
  const [questions,setQuestions] = useState([]);
  const [selected,setSelected] = useState('');
  const [answers,setAnswers] = useState([]);
  const [result,setResult] = useState(null);
  const [questionIndex,setQuestionIndex] = useState(0);
  const [seconds,setSeconds] = useState(0);
  const [count,setCount] = useState(10);
  const [loading,setLoading] = useState(true);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState('');
  const [started,setStarted] = useState(false);
  const [finished,setFinished] = useState(false);
  const attemptIdRef = useRef(null);

  useEffect(()=>{let active=true;api('/questions').then((rows)=>{if(active){setQuestions(rows.filter((item)=>normalizeCategory(item.category)===category));}}).catch((e)=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;}},[category]);
  useEffect(()=>{if(!started||finished)return undefined;const timer=setInterval(()=>setSeconds((value)=>value+1),1000);return()=>clearInterval(timer)},[started,finished]);
  const session = useMemo(()=>buildSession(questions,count),[questions,count]);
  const question = session[questionIndex];
  const score = answers.filter((item)=>item.is_correct).length;
  const difficultyResults = ['easy','medium','hard'].map((difficulty)=>{const list=answers.filter((item)=>item.difficulty===difficulty);return{difficulty,attempted:list.length,correct:list.filter((item)=>item.is_correct).length};});

  async function submit(event) {
    event.preventDefault(); if(!selected||submitting||!question)return;
    setSubmitting(true);setError('');
    try {
      if(!attemptIdRef.current) attemptIdRef.current=globalThis.crypto?.randomUUID?.();
      if(!attemptIdRef.current) throw new Error('This browser cannot create a secure attempt ID. Please use a current browser.');
      const response=await api('/submissions',{method:'POST',body:JSON.stringify({question_id:Number(question.id),selected_option:selected,attempt_id:attemptIdRef.current})});
      setResult(response);setAnswers((items)=>[...items,{question_id:question.id,title:question.title,difficulty:question.difficulty,selected_option:selected,is_correct:response.submission.is_correct,correct_option:response.correct_option,explanation:response.explanation}]);
    }
    catch(e){setError(e.message);}
    finally{setSubmitting(false);}
  }
  function next(){setSelected('');setResult(null);attemptIdRef.current=null;if(questionIndex+1>=session.length){setFinished(true);return;}setQuestionIndex((value)=>value+1);}

  return <div className="sf-page"><UserNavbar/><main className="sf-content sf-assessment-main"><Link className="sf-back-link" to="/assessments">← All assessments</Link>
    {loading&&<div className="sf-loading-panel" role="status">Preparing your session…</div>}
    {!loading&&!error&&!started&&!finished&&<section className="sf-assessment-start"><p className="sf-kicker">{category.toUpperCase()} PRACTICE ASSESSMENT</p><h1>Build a clear baseline.</h1><p>Answer the questions selected from the current database. Your answers are saved individually, and explanations appear after each submission.</p><label>Session length <select value={count} onChange={(event)=>setCount(Number(event.target.value))}>{[5,10,20].map((n)=><option value={n} key={n}>{n} questions</option>)}</select></label><p className="sf-session-available">{questions.length} available · session will use up to {Math.min(count,questions.length)}</p><button className="sf-button sf-button-primary" disabled={!questions.length} onClick={()=>setStarted(true)}>Begin assessment ↗</button></section>}
    {!loading&&!error&&!questions.length&&<div className="sf-empty-state"><h2>No questions for {category}</h2><p>Choose another skill or add questions to the bank.</p><Link className="sf-button sf-button-secondary" to="/assessments">Choose another skill</Link></div>}
    {error&&<div className="sf-inline-error" role="alert">{error}</div>}
    {started&&!finished&&question&&<section className="sf-question-session"><div className="sf-session-top"><div><p className="sf-kicker">QUESTION {questionIndex+1} OF {session.length}</p><h1>{category}</h1></div><div className="sf-session-timer"><small>ELAPSED</small><b>{elapsedLabel(seconds)}</b></div></div><div className="sf-session-track"><i style={{width:`${((questionIndex+(result?1:0))/session.length)*100}%`}}/></div><article className="sf-session-card"><div className="sf-question-tags"><span>{question.difficulty}</span><span>{answers.length} saved</span></div><h2>{question.title}</h2><p>{question.description}</p><form onSubmit={submit}><div className="sf-session-options" role="radiogroup" aria-label="Answer options">{choices.map((choice)=><button type="button" key={choice} className={`sf-session-option ${selected===choice?'selected':''} ${result&&choice===result.correct_option?'is-correct':''} ${result&&selected===choice&&!result.submission.is_correct?'is-wrong':''}`} onClick={()=>!result&&setSelected(choice)} disabled={Boolean(result)} aria-pressed={selected===choice}><b>{choice}</b><span>{question[optionFields[choice]]}</span></button>)}</div>{error&&<p className="sf-inline-error" role="alert">{error}</p>}{!result?<button className="sf-button sf-button-primary" disabled={!selected||submitting}>{submitting?'Saving answer…':'Submit answer ↗'}</button>:<div className="sf-answer-feedback" role="status"><b>{result.submission.is_correct?'Correct':'Review this one'}</b>{!result.submission.is_correct&&<p>Correct option: {result.correct_option} — {question[optionFields[result.correct_option]]}</p>}<p>{result.explanation}</p><button type="button" className="sf-button sf-button-primary" onClick={next}>{questionIndex+1===session.length?'View results':'Next question →'}</button></div>}</form></article></section>}
    {finished&&<section className="sf-assessment-results"><p className="sf-kicker">SESSION COMPLETE · {elapsedLabel(seconds)}</p><h1>Your practice assessment</h1><div className="sf-result-summary"><article><small>Attempted</small><b>{answers.length}</b></article><article><small>Correct</small><b>{score}</b></article><article><small>Accuracy</small><b>{answers.length?Math.round(score/answers.length*100):0}%</b></article></div><p className="sf-assessment-disclaimer">This is a SkillForge practice score from this session, not a validated IQ or EQ measurement.</p><div className="sf-difficulty-results">{difficultyResults.map((item)=><article key={item.difficulty}><span>{item.difficulty}</span><b>{item.attempted?`${item.correct}/${item.attempted} correct`:'Not assessed'}</b></article>)}</div><h2>Answer review</h2><div className="sf-review-list">{answers.map((item,index)=><article key={`${item.question_id}-${index}`}><span className={item.is_correct?'sf-result-dot correct':'sf-result-dot'}>{item.is_correct?'✓':'×'}</span><div><b>{item.title}</b><p>{item.is_correct?'Correct':`Correct answer: ${item.correct_option}`} · {item.difficulty}</p><small>{item.explanation}</small></div></article>)}</div><div className="sf-hero-actions"><Link className="sf-button sf-button-primary" to={`/assessments?category=${encodeURIComponent(category)}`}>Retake assessment ↗</Link><Link className="sf-button sf-button-secondary" to="/progress">Review progress</Link></div></section>}
  </main></div>;
}
