import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { customQuizService } from '../services/api';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';
import CountUp from '../components/CountUp';
import {
  FileText, File, X, Sparkles, Plus, Minus,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  Trash2, BarChart2, Check
} from 'lucide-react';
import { customConfirm } from '../utils/alert';

export default function CustomTest() {
  const [state, setState] = useState('setup'); // setup, loading, quiz, result
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [counts, setCounts] = useState({ easy: 5, medium: 3, hard: 2 });
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await customQuizService.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    setError(null);
    const validTypes = ['.pdf', '.doc', '.docx'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(ext)) {
      setError("FILE_FORMAT_NOT_SUPPORTED. USE PDF/DOCX.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("FILE_SIZE_LIMIT_EXCEEDED. MAX 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const droppedFile = e.dataTransfer.files[0]; validateAndSetFile(droppedFile); };

  const updateCount = (type, delta) => {
    const total = counts.easy + counts.medium + counts.hard;
    if (delta > 0 && total >= 20) return;
    setCounts(prev => ({ ...prev, [type]: Math.max(0, Math.min(20, prev[type] + delta)) }));
  };

  const handleGenerate = async () => {
    if (!file || !topicName || (counts.easy + counts.medium + counts.hard < 3)) return;
    setState('loading');
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicName', topicName);
    formData.append('easyCount', counts.easy);
    formData.append('mediumCount', counts.medium);
    formData.append('hardCount', counts.hard);
    try {
      const res = await customQuizService.generate(formData);
      setQuestions(res.data);
      setSelectedAnswers(new Array(res.data.length).fill(null));
      setCurrentIdx(0);
      setState('quiz');
    } catch (err) {
      setError(err.response?.data || "GENERATION_FAILED. TRY ALTERNATIVE SOURCE.");
      setState('setup');
    }
  };

  const handleAnswerSelect = (option) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIdx] = option;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    const correctCount = selectedAnswers.filter((ans, i) => ans === questions[i].answer).length;
    const total = questions.length;
    const percentage = ((correctCount / total) * 100).toFixed(2);
    const payload = {
      topicName,
      easyCount: counts.easy,
      mediumCount: counts.medium,
      hardCount: counts.hard,
      score: correctCount,
      total,
      percentage: parseFloat(percentage),
      questionsJson: JSON.stringify(questions)
    };
    try {
      const res = await customQuizService.submit(payload);
      setResult(res.data);
      setState('result');
      fetchHistory();
    } catch {
      setResult({ ...payload, createdAt: new Date().toISOString() });
      setState('result');
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    const confirmed = await customConfirm("Delete this test from history?");
    if (!confirmed) return;
    try {
      await customQuizService.deleteHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Return to the main Custom Test page from the result screen
  const handleGoBack = () => {
    setError(null);
    setState('setup');
  };

  const totalQuestions = counts.easy + counts.medium + counts.hard;

  // Hide the app sidebar while a test is in progress / results are shown (same pattern as the Quiz module)
  const hideSidebar = state === 'quiz' || state === 'result';

  if (state === 'loading') return <GameLoader message="READING FILE..." subMessage={`READING CONTENT FROM ${file?.name?.toUpperCase()}`} />;

  return (
    <DashboardLayout noSidebar={hideSidebar}>
      <div className="page-enter" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        {state === 'setup' && (
          <div>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>CUSTOM QUIZ GENERATOR</h1>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-pink)', fontSize: '11px', letterSpacing: '0.2em' }}>
                GENERATE QUIZ FROM DOCUMENT
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
              <div className="glass-panel" style={{ padding: '2.5rem' }}>
                {error && (
                  <div style={{ padding: '1rem', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--neon-red)', borderRadius: '8px', color: 'var(--neon-red)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><AlertCircle size={16} /> <span>{error}</span></div>
                    <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'var(--neon-red)', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                )}

                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px', padding: '3rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    background: isDragging ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.02)', marginBottom: '2rem'
                  }}
                >
                  <input type="file" id="fileInput" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={32} color="var(--neon-cyan)" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-ui)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name.toUpperCase()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(file.size / 1024).toFixed(1)} KB // READY</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="btn-ghost" style={{ padding: '8px', borderRadius: '50%', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--neon-cyan)', boxShadow: 'var(--glow-cyan)' }}><FileText size={28} /></div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '8px' }}>UPLOAD FILE</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PDF / DOCX (MAX 10MB)</div>
                    </>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOPIC NAME</label>
                  <input type="text" placeholder="e.g. QUANTUM PHYSICS" value={topicName} onChange={(e) => setTopicName(e.target.value)} maxLength={100} />
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
                  {[
                    { id: 'easy', label: 'EASY', color: 'var(--neon-green)' },
                    { id: 'medium', label: 'MEDIUM', color: 'var(--neon-gold)' },
                    { id: 'hard', label: 'HARD', color: 'var(--neon-red)' }
                  ].map((diff) => (
                    <div key={diff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: `1px solid ${diff.color}22` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: diff.color }} />
                        <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>{diff.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <button onClick={() => updateCount(diff.id, -1)} className="btn-ghost" style={{ padding: '4px 10px' }}>-</button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)', color: diff.color }}>{counts[diff.id]}</span>
                        <button onClick={() => updateCount(diff.id, 1)} disabled={totalQuestions >= 20} className="btn-ghost" style={{ padding: '4px 10px' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: totalQuestions > 20 ? 'var(--neon-red)' : 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>TOTAL QUESTIONS: {totalQuestions} / 20</div>
                </div>

                <button onClick={handleGenerate} disabled={!file || !topicName || totalQuestions < 3 || totalQuestions > 20} className="btn-primary" style={{ width: '100%', padding: '1.2rem' }}>
                  <Sparkles size={18} style={{ marginRight: '10px' }} /> GENERATE QUIZ
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart2 size={16} /> RECENT HISTORY
                </h3>

                {historyLoading ? (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MiniLoader /></div>
                ) : history.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={40} style={{ color: 'rgba(255,255,255,0.05)', marginBottom: '1rem' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NO HISTORY FOUND.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {history.map((item) => (
                      <div key={item.id} className="glass-panel card-animate" style={{ padding: '1.25rem', position: 'relative' }}>
                        <button onClick={(e) => handleDeleteHistory(item.id, e)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', paddingRight: '25px' }}>{item.topicName.toUpperCase()}</h4>
                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          <span style={{ color: 'var(--neon-green)' }}>L: {item.easyCount}</span>
                          <span style={{ color: 'var(--neon-gold)' }}>M: {item.mediumCount}</span>
                          <span style={{ color: 'var(--neon-red)' }}>H: {item.hardCount}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: item.percentage >= 70 ? 'var(--neon-green)' : item.percentage >= 40 ? 'var(--neon-gold)' : 'var(--neon-red)', fontFamily: 'var(--font-mono)' }}>{item.score}/{item.total}</div>
                          <div className="badge" style={{ borderColor: item.percentage >= 70 ? 'var(--neon-green)' : item.percentage >= 40 ? 'var(--neon-gold)' : 'var(--neon-red)', color: item.percentage >= 70 ? 'var(--neon-green)' : item.percentage >= 40 ? 'var(--neon-gold)' : 'var(--neon-red)', fontSize: '10px' }}>{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state === 'quiz' && (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{topicName.toUpperCase()}</h2>
                <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>QUIZ IN PROGRESS // {selectedAnswers.filter(a => a !== null).length} OF {questions.length} COMPLETED</div>
              </div>
              <button onClick={() => setState('setup')} className="btn-ghost" style={{ fontSize: '10px' }}>EXIT QUIZ</button>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '3rem', overflow: 'hidden' }}>
              <div style={{ width: `${(selectedAnswers.filter(a => a !== null).length / questions.length) * 100}%`, height: '100%', background: 'var(--neon-pink)', boxShadow: 'var(--glow-pink)', transition: 'all 0.4s' }}></div>
            </div>

            {/* Question Navigator */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {questions.map((_, i) => {
                const isCurrent = currentIdx === i;
                const isAnswered = selectedAnswers[i] !== null;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
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
              <div style={{ position: 'absolute', top: -12, left: 30, background: 'var(--bg-base)', padding: '0 10px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QUESTION {String(currentIdx + 1).padStart(2, '0')}</div>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <span className="badge" style={{
                  color: questions[currentIdx].difficulty === 'easy' ? 'var(--neon-green)' : questions[currentIdx].difficulty === 'medium' ? 'var(--neon-gold)' : 'var(--neon-red)',
                  borderColor: questions[currentIdx].difficulty === 'easy' ? 'var(--neon-green)' : questions[currentIdx].difficulty === 'medium' ? 'var(--neon-gold)' : 'var(--neon-red)'
                }}>{questions[currentIdx].difficulty.toUpperCase()}</span>
              </div>
              
              <p style={{ fontSize: '1.6rem', fontWeight: 600, color: '#ffffff', textAlign: 'center', marginBottom: '3rem', lineHeight: 1.5 }}>
                {questions[currentIdx].question}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {questions[currentIdx].options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentIdx] === opt;
                  return (
                    <div
                      key={i}
                      onClick={() => handleAnswerSelect(opt)}
                      className={isSelected ? "btn-primary" : "btn-secondary"}
                      style={{ 
                        padding: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        background: isSelected ? 'var(--neon-pink)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0,
                        color: isSelected ? 'white' : 'var(--neon-cyan)'
                      }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-body)' }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setCurrentIdx(prev => prev - 1)} disabled={currentIdx === 0} className="btn-ghost" style={{ flex: 1 }}>PREVIOUS</button>
              {currentIdx === questions.length - 1 ? (
                <button onClick={handleSubmitQuiz} disabled={!selectedAnswers[currentIdx]} className="btn-primary" style={{ flex: 2 }}>SUBMIT QUIZ <Check size={18} style={{ marginLeft: '8px' }} /></button>
              ) : (
                <button onClick={() => setCurrentIdx(prev => prev + 1)} disabled={!selectedAnswers[currentIdx]} className="btn-secondary" style={{ flex: 1 }}>NEXT <ChevronRight size={18} style={{ marginLeft: '8px' }} /></button>
              )}
            </div>
          </div>
        )}

        {state === 'result' && result && (
          <div>
            {(() => {
              const pct = Math.round(result.percentage);
              const color = pct >= 70 ? 'var(--neon-green)' : pct >= 50 ? 'var(--neon-gold)' : 'var(--neon-red)';
              const feedback = pct >= 90 ? "Excellent! You have mastered this topic."
                : pct >= 70 ? "Good job! Topic marked as mastered."
                : pct >= 50 ? "Fair attempt. Review weak areas and try again."
                : "Needs improvement. Study this topic carefully and retry.";
              return (
                <>
                  <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem', padding: '3rem', borderTop: `4px solid ${color}` }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.3em' }}>TEST COMPLETED</div>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>{(result.topicName || topicName || 'CUSTOM TEST').toUpperCase()}</h2>

                    <div style={{ fontSize: '6rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '0.5rem', textShadow: `0 0 30px ${color}44` }}>
                      <CountUp end={pct} suffix="%" />
                    </div>

                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>
                      PERFORMANCE: {result.score} / {result.total} QUESTIONS CORRECT
                    </div>

                    <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                      {feedback.toUpperCase()}
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '2rem', textAlign: 'center' }}>ANSWERS REVIEW</h3>
                    {questions.map((q, qi) => {
                      const userAnswer = selectedAnswers[qi];
                      return (
                        <div key={qi} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '1rem', fontFamily: 'var(--font-mono)' }}>{String(qi + 1).padStart(2, '0')}</span>
                              {q.question}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              {userAnswer == null && (
                                <span className="badge" style={{ fontSize: '8px', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}>NOT ANSWERED</span>
                              )}
                              <span className="badge" style={{ fontSize: '8px', color: q.difficulty === 'easy' ? 'var(--neon-green)' : q.difficulty === 'medium' ? 'var(--neon-gold)' : 'var(--neon-red)', borderColor: q.difficulty === 'easy' ? 'var(--neon-green)' : q.difficulty === 'medium' ? 'var(--neon-gold)' : 'var(--neon-red)' }}>{q.difficulty.toUpperCase()}</span>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {q.options.map((opt, oi) => {
                              const isCorrectOpt = opt === q.answer;
                              const isUserOpt = userAnswer != null && opt === userAnswer;
                              let borderColor = 'rgba(255,255,255,0.1)';
                              let bgColor = 'rgba(255,255,255,0.02)';
                              let textColor = 'var(--text-secondary)';

                              if (isCorrectOpt) { borderColor = 'var(--neon-green)'; bgColor = 'rgba(0,255,100,0.05)'; textColor = 'var(--neon-green)'; }
                              else if (isUserOpt) { borderColor = 'var(--neon-red)'; bgColor = 'rgba(255,23,68,0.05)'; textColor = 'var(--neon-red)'; }

                              return (
                                <div key={oi} style={{ padding: '1rem', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, fontSize: '13px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, flexShrink: 0 }}>
                                    {isCorrectOpt ? '✓' : isUserOpt ? '✗' : ''}
                                  </div>
                                  <span>{opt}</span>
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

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={handleGenerate} className="btn-secondary" style={{ flex: 1 }}>🔄 REGENERATE QUIZ</button>
                    <button onClick={handleGoBack} className="btn-primary" style={{ flex: 1 }}>← GO BACK</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
