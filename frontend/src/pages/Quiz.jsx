import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { quizService } from '../services/api';

const glass = {
  background: 'rgba(15,15,40,0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

export default function Quiz() {
  const { topicId, topicName } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuiz();
  }, [topicId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await quizService.generate(topicId);
      setQuestions(res.data);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionIndex, optionIndex) => {
    if (result) return; // don't allow changes after submit
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

  // ─── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout noSidebar={true}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '80vh', gap: '1rem', textAlign: 'center'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid rgba(129,140,248,0.2)',
            borderTop: '3px solid #818cf8',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#000000', fontSize: '1rem', fontWeight: 600 }}>
            Generating quiz for <strong style={{ color: '#818cf8', fontWeight: 700 }}>{decodedName}</strong>...
          </p>
          <p style={{ color: '#000000', fontSize: '0.86rem', fontWeight: 600 }}>
            AI is creating 10 questions just for you ✨
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout noSidebar={true}>
        <div style={{ ...glass, textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: '#fca5a5', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchQuiz} style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            border: 'none', borderRadius: '10px',
            color: 'white', fontWeight: 700, cursor: 'pointer',
          }}>
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Result Screen ─────────────────────────────────────
  if (result) {
    const pct = Math.round(result.percentage);
    const color = pct >= 70 ? '#6ee7b7' : pct >= 50 ? '#fde68a' : '#fca5a5';

    return (
      <DashboardLayout noSidebar={true}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>

          {/* Score Card */}
          <div style={{
            ...glass,
            textAlign: 'center',
            marginBottom: '1.5rem',
            background: 'rgba(129,140,248,0.08)',
            borderColor: 'rgba(129,140,248,0.2)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quiz Complete
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>
              {decodedName}
            </h2>
            <div style={{ fontSize: '5rem', fontWeight: 700, color, lineHeight: 1, marginBottom: '0.5rem' }}>
              {pct}%
            </div>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              {result.score} / {result.total} correct
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              background: result.mastered ? 'rgba(110,231,183,0.15)' : 'rgba(252,165,165,0.15)',
              border: `1px solid ${result.mastered ? 'rgba(110,231,183,0.3)' : 'rgba(252,165,165,0.3)'}`,
              borderRadius: '999px',
              color: result.mastered ? '#6ee7b7' : '#fca5a5',
              fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '1rem',
            }}>
              {result.mastered ? '✅ Topic Mastered!' : '📚 Keep Practicing'}
            </div>
            <p style={{ color: '#000000', fontSize: '0.9rem', fontWeight: 600 }}>
              {result.feedback}
            </p>
          </div>

          {/* Review Answers */}
          <div style={{ ...glass, marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.9rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem', textAlign: 'center'
            }}>
              Answer Review
            </h3>
            {result.questions.map((q, qi) => {
              const userAnswer = result.selectedAnswers[qi];
              const correct = q.correctIndex;
              const isCorrect = userAnswer === correct;
              return (
                <div key={qi} style={{
                  marginBottom: '1.25rem',
                  paddingBottom: '1.25rem',
                  borderBottom: qi < result.questions.length - 1
                    ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <p style={{
                    fontSize: '0.9rem', fontWeight: 600,
                    marginBottom: '0.75rem', color: 'white',
                  }}>
                    {qi + 1}. {q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {q.options.map((opt, oi) => {
                      const isCorrectOpt = oi === correct;
                      const isUserOpt = oi === userAnswer;
                      let bg = 'rgba(255,255,255,0.03)';
                      let border = 'rgba(255,255,255,0.06)';
                      let color = 'rgba(255,255,255,0.6)';
                      if (isCorrectOpt) { bg = 'rgba(110,231,183,0.15)'; border = 'rgba(110,231,183,0.4)'; color = '#6ee7b7'; }
                      if (isUserOpt && !isCorrect) { bg = 'rgba(252,165,165,0.15)'; border = 'rgba(252,165,165,0.4)'; color = '#fca5a5'; }
                      return (
                        <div key={oi} style={{
                          padding: '0.5rem 0.85rem',
                          background: bg, border: `1px solid ${border}`,
                          borderRadius: '8px', color,
                          fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                          <span>{isCorrectOpt ? '✓' : isUserOpt ? '✗' : '○'}</span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={fetchQuiz} style={{
              flex: 1, padding: '0.85rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: 'white',
              fontWeight: 600, cursor: 'pointer',
            }}>
              🔄 Retake Quiz
            </button>
            <button onClick={() => navigate('/syllabus')} style={{
              flex: 1, padding: '0.85rem',
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontWeight: 700, cursor: 'pointer',
            }}>
              ← Back to Syllabus
            </button>
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
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/syllabus')}
            style={{
              background: 'transparent',
              border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: '0.9rem',
              marginBottom: '1.5rem', padding: 0,
            }}
          >
            ← Back to Syllabus
          </button>
          <h2 style={{
            fontSize: '1.8rem', fontWeight: 700,
            color: 'white', marginBottom: '0.5rem',
          }}>
            {decodedName}
          </h2>
          <p style={{ color: '#000000', fontSize: '1rem', fontWeight: 600 }}>
            {answered} of {questions.length} answered
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '4px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(answered / questions.length) * 100}%`,
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question Navigation Pills */}
        <div style={{
          display: 'flex', gap: '0.5rem',
          marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.82rem',
                fontWeight: 600, transition: 'all 0.15s',
                background: current === i
                  ? 'linear-gradient(135deg, #818cf8, #c084fc)'
                  : selected[i] !== undefined
                    ? 'rgba(110,231,183,0.2)'
                    : 'rgba(255,255,255,0.06)',
                color: current === i
                  ? 'white'
                  : selected[i] !== undefined
                    ? '#6ee7b7'
                    : 'rgba(255,255,255,0.5)',
                border: selected[i] !== undefined && current !== i
                  ? '1px solid rgba(110,231,183,0.3)'
                  : current === i ? 'none' : '1px solid transparent',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <div style={{ ...glass, marginBottom: '1.25rem' }}>
          <div style={{
            fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)',
            marginBottom: '1rem', textAlign: 'center'
          }}>
            Question {current + 1} of {questions.length}
          </div>
          <p style={{
            fontSize: '1.25rem', fontWeight: 600,
            color: 'white', lineHeight: 1.6,
            marginBottom: '1.5rem', textAlign: 'center'
          }}>
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {q.options.map((opt, oi) => {
              const isSelected = selected[current] === oi;
              return (
                <div
                  key={oi}
                  onClick={() => handleSelect(current, oi)}
                  style={{
                    padding: '0.85rem 1rem',
                    background: isSelected
                      ? 'rgba(129,140,248,0.2)'
                      : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? '1px solid rgba(129,140,248,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}
                  onMouseOver={e => {
                    if (!isSelected)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseOut={e => {
                    if (!isSelected)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: isSelected
                      ? '2px solid #818cf8'
                      : '2px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.75rem', fontWeight: 700,
                    background: isSelected ? 'rgba(129,140,248,0.3)' : 'transparent',
                    color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.4)',
                  }}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </div>
                  <span style={{
                    fontSize: '0.9rem',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                  }}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
              cursor: current === 0 ? 'not-allowed' : 'pointer',
              opacity: current === 0 ? 0.4 : 1,
            }}
          >
            ← Previous
          </button>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(current + 1)}
              style={{
                flex: 1, padding: '0.75rem',
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || answered < questions.length}
              style={{
                flex: 2, padding: '0.75rem',
                background: answered === questions.length
                  ? 'linear-gradient(135deg, #6ee7b7, #818cf8)'
                  : 'rgba(255,255,255,0.05)',
                border: answered === questions.length
                  ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: answered === questions.length ? '#0d0d1a' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, cursor: submitting ? 'wait'
                  : answered < questions.length ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : `Submit Quiz (${answered}/${questions.length})`}
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
