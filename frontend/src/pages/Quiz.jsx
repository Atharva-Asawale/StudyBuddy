import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { quizService } from '../services/api';
import GameLoader from '../components/GameLoader';
import CountUp from '../components/CountUp';
import CyberNotification from '../components/CyberNotification';
import { CheckCircle, Plus, Minus, Sparkles, ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react';

export default function Quiz() {
  const { topicId, topicName } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [counts, setCounts] = useState({ easy: 5, medium: 3, hard: 2 });
  const [started, setStarted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const updateCount = (type, delta) => {
    const total = counts.easy + counts.medium + counts.hard;
    if (delta > 0 && total >= 20) return;
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(20, prev[type] + delta))
    }));
  };

  const totalQuestions = counts.easy + counts.medium + counts.hard;

  const fetchQuiz = async () => {
    if (totalQuestions < 3 || totalQuestions > 20) return;
    setLoading(true);
    setError('');
    try {
      const res = await quizService.generate(topicId, file, counts.easy, counts.medium, counts.hard);
      setQuestions(res.data);
      setStarted(true);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionIndex, optionIndex) => {
    if (result) return;
    setSelected({ ...selected, [questionIndex]: optionIndex });
  };

  const handleSubmit = async () => {
    if (Object.keys(selected).length < questions.length) {
      alert('Please answer all questions before submitting!');
      return;
    }
    setSubmitting(true);
    try {
      const answers = questions.map((_, i) => selected[i] ?? -1);
      const res = await quizService.submit({
        topicId,
        selectedAnswers: answers,
      });
      setResult(res.data);
      setCurrent(0);
      setShowNotification(true);

      const existing = (() => {
        try {
          const raw = sessionStorage.getItem('studybuddy_quiz_results');
          const parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const nextEntry = {
        topicId,
        topicName: decodeURIComponent(topicName || 'Topic'),
        score: Number(res.data?.percentage ?? 0),
        attemptedAt: new Date().toISOString(),
      };

      const filtered = existing.filter((item) => String(item?.topicId) !== String(topicId));
      sessionStorage.setItem('studybuddy_quiz_results', JSON.stringify([nextEntry, ...filtered]));
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const decodedName = decodeURIComponent(topicName || 'Topic');

  if (loading) return <GameLoader message={file ? "PROCESSING FILE..." : "GENERATING QUIZ..."} subMessage={`PREPARING ${totalQuestions} QUESTIONS FOR ${decodedName.toUpperCase()}`} />;
  
  if (submitting) return <GameLoader message="CHECKING ANSWERS..." subMessage="CALCULATING SCORE" />;

  // ─── Prepare Screen ────────────────────────────────────
  if (!started && !result) {
    return (
      <DashboardLayout noSidebar={true}>
        <div className="page-enter" style={{ maxWidth: '700px', margin: '4rem auto' }}>
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: 'var(--neon-pink)', color: 'white', padding: '4px 20px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em' }}>QUIZ SETTINGS</div>
            
            <h2 style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>QUIZ</h2>
            <p style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '2rem' }}>
              TOPIC: {decodedName.toUpperCase()}
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', padding: '2rem',
              marginBottom: '2rem'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem' }}>UPLOAD STUDY MATERIAL (OPTIONAL)</p>
              
              <input 
                type="file" 
                id="rag-file" 
                accept=".pdf,.docx" 
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <label htmlFor="rag-file" className="btn-secondary" style={{ display: 'inline-block', minWidth: '280px' }}>
                {file ? `FILE LOADED: ${file.name.toUpperCase()}` : '📁 SELECT PDF/DOCX SOURCE'}
              </label>
              {file && (
                <button onClick={() => setFile(null)} style={{
                  display: 'block', margin: '1rem auto 0', background: 'transparent', border: 'none',
                  color: 'var(--neon-red)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em'
                }}>REMOVE FILE</button>
              )}
            </div>

            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>DIFFICULTY DISTRIBUTION</h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  { id: 'easy', label: 'EASY', color: 'var(--neon-green)' },
                  { id: 'medium', label: 'MEDIUM', color: 'var(--neon-gold)' },
                  { id: 'hard', label: 'HARD', color: 'var(--neon-red)' }
                ].map((diff) => (
                  <div key={diff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: `1px solid ${diff.color}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: diff.color, boxShadow: `0 0 10px ${diff.color}` }}></div>
                      <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>{diff.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      <button onClick={() => updateCount(diff.id, -1)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '14px' }}>-</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)', color: diff.color, fontSize: '18px' }}>{counts[diff.id]}</span>
                      <button onClick={() => updateCount(diff.id, 1)} disabled={totalQuestions >= 20} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '14px' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: totalQuestions > 20 ? 'var(--neon-red)' : 'var(--neon-cyan)', marginTop: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                TOTAL QUESTIONS: {totalQuestions} / 20
              </div>
            </div>

            <button 
              onClick={fetchQuiz} 
              disabled={totalQuestions < 3 || totalQuestions > 20}
              className="btn-primary"
              style={{ width: '100%', padding: '1.2rem' }}
            >
              START QUIZ →
            </button>
            
            <button onClick={() => navigate('/syllabus')} className="btn-ghost" style={{ marginTop: '1.5rem', width: '100%' }}>
              CANCEL
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Result Screen ─────────────────────────────────────
  if (result) {
    const pct = Math.round(result.percentage);
    const color = pct >= 70 ? 'var(--neon-green)' : pct >= 50 ? 'var(--neon-gold)' : 'var(--neon-red)' ;

    return (
      <DashboardLayout noSidebar={true}>
        {showNotification && (
          <CyberNotification 
            message="QUIZ COMPLETED" 
            subMessage={`SCORE: ${pct}%`}
            type={pct >= 70 ? "success" : pct >= 40 ? "warning" : "danger"}
            onComplete={() => setShowNotification(false)}
          />
        )}
        <div className="page-enter" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem', padding: '3rem', borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.3em' }}>QUIZ SUMMARY</div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>{decodedName.toUpperCase()}</h2>
            
            <div style={{ fontSize: '6rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '0.5rem', textShadow: `0 0 30px ${color}44` }}>
              <CountUp end={pct} suffix="%" />
            </div>
            
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>
              PERFORMANCE: {result.score} / {result.total} QUESTIONS CORRECT
            </div>

            <div style={{
              display: 'inline-block', padding: '10px 30px',
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}`,
              borderRadius: '4px', color: color, fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2rem'
            }}>
              {result.mastered ? 'STATUS: TOPIC MASTERED' : 'STATUS: REVIEW RECOMMENDED'}
            </div>
            
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              {result.feedback.toUpperCase()}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '2rem', textAlign: 'center' }}>ANSWERS REVIEW</h3>
            {result.questions.map((q, qi) => {
              const userAnswer = result.selectedAnswers[qi];
              const correct = q.correctIndex;
              const isCorrect = userAnswer === correct;
              return (
                <div key={qi} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>{String(qi + 1).padStart(2, '0')}</span> {q.question}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {q.options.map((opt, oi) => {
                      const isCorrectOpt = oi === correct;
                      const isUserOpt = oi === userAnswer;
                      let borderColor = 'rgba(255,255,255,0.1)';
                      let bgColor = 'rgba(255,255,255,0.02)';
                      let textColor = 'var(--text-secondary)';
                      
                      if (isCorrectOpt) { borderColor = 'var(--neon-green)'; bgColor = 'rgba(0,255,100,0.05)'; textColor = 'var(--neon-green)'; }
                      else if (isUserOpt) { borderColor = 'var(--neon-red)'; bgColor = 'rgba(255,23,68,0.05)'; textColor = 'var(--neon-red)'; }

                      return (
                        <div key={oi} style={{ padding: '1rem', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, fontSize: '13px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>
                            {isCorrectOpt ? '✓' : isUserOpt ? '✗' : ''}
                          </div>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(0,240,255,0.03)', borderLeft: '3px solid var(--neon-cyan)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                      <div style={{ color: 'var(--neon-cyan)', fontSize: '10px', fontWeight: 800, marginBottom: '4px' }}>EXPLANATION</div>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={fetchQuiz} className="btn-secondary" style={{ flex: 1 }}>🔄 RETAKE QUIZ</button>
            <button onClick={() => navigate('/syllabus')} className="btn-primary" style={{ flex: 1 }}>← RETURN TO TOPICS</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Quiz Screen ────────────────────────────────────────
  const q = questions[current];
  const answered = Object.keys(selected).length;

  return (
    <DashboardLayout noSidebar={true}>
      <div className="page-enter" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{decodedName.toUpperCase()}</h2>
            <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>QUIZ IN PROGRESS // {answered} OF {questions.length} COMPLETED</div>
          </div>
          <button onClick={() => navigate('/syllabus')} className="btn-ghost" style={{ fontSize: '10px' }}>EXIT QUIZ</button>
        </div>

        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '3rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answered / questions.length) * 100}%`, background: 'var(--neon-pink)', boxShadow: 'var(--glow-pink)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((_, i) => {
            const isCurrent = current === i;
            const isAnswered = selected[i] !== undefined;
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: '40px', height: '40px', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', transition: 'all 0.2s',
                  background: isCurrent ? 'var(--neon-pink)' : isAnswered ? 'rgba(255, 45, 120, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isCurrent ? 'white' : isAnswered ? 'var(--neon-pink)' : 'var(--text-muted)',
                  border: isCurrent ? 'none' : isAnswered ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isCurrent ? 'var(--glow-pink)' : 'none'
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="glass-panel" style={{ padding: '3rem', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: 30, background: 'var(--bg-base)', padding: '0 10px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QUESTION {String(current + 1).padStart(2, '0')}</div>
          
          <p style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '3rem', lineHeight: 1.5 }}>
            {q.question}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {q.options.map((opt, oi) => {
              const isSelected = selected[current] === oi;
              return (
                <div
                  key={oi}
                  onClick={() => handleSelect(current, oi)}
                  className={isSelected ? "btn-primary" : "btn-secondary"}
                  style={{ 
                    padding: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'var(--neon-pink)' : 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0,
                    color: isSelected ? 'white' : 'var(--neon-cyan)'
                  }}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn-ghost" style={{ flex: 1 }}>PREVIOUS</button>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(current + 1)} className="btn-secondary" style={{ flex: 1 }}>NEXT</button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting || answered < questions.length} 
              className="btn-primary" 
              style={{ flex: 2 }}
            >
              {submitting ? 'SUBMITTING...' : `SUBMIT QUIZ (${answered}/${questions.length})`}
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
