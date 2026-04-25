import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { customQuizService } from '../services/api';
import { 
  FileText, File, X, Sparkles, Plus, Minus, 
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  Trash2, BarChart2, Check, ArrowRight
} from 'lucide-react';

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

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
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Loading subtext logic
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let timer;
    if (state === 'loading') {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(timer);
  }, [state]);

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
      setError("Only PDF or DOCX files are supported.");
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const updateCount = (type, delta) => {
    const total = counts.easy + counts.medium + counts.hard;
    if (delta > 0 && total >= 20) return;
    
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(20, prev[type] + delta))
    }));
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
      setError(err.response?.data || "Generation failed. Please try a different document.");
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
    } catch (err) {
      console.error('Submission failed', err);
      // Still show results locally even if save fails
      setResult({ ...payload, createdAt: new Date().toISOString() });
      setState('result');
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this test from history?")) return;
    try {
      await customQuizService.deleteHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const totalQuestions = counts.easy + counts.medium + counts.hard;

  return (
    <DashboardLayout>
      <div style={{ padding: '1rem' }}>
        {state === 'setup' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={glass}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                Custom Quiz Generator
              </h2>

              {error && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '1rem',
                  borderRadius: '10px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* File Upload */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: `2px dashed ${isDragging ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '2.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isDragging ? 'rgba(129, 140, 248, 0.05)' : 'transparent',
                  marginBottom: '1.5rem'
                }}
              >
                <input type="file" id="fileInput" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    {file.name.endsWith('.pdf') ? <File color="#f87171" size={40} /> : <FileText color="#60a5fa" size={40} />}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(129,140,248,0.1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#818cf8'
                    }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Upload Document</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>PDF or DOCX (Max 10MB)</div>
                  </>
                )}
              </div>

              {/* Topic Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Test Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chapter 3 – Thermodynamics"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Difficulty Selectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { id: 'easy', label: 'Easy', color: '#6ee7b7', icon: '🟢' },
                  { id: 'medium', label: 'Medium', color: '#fcd34d', icon: '🟡' },
                  { id: 'hard', label: 'Hard', color: '#f87171', icon: '🔴' }
                ].map((diff) => (
                  <div key={diff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{diff.icon}</span>
                      <span style={{ fontWeight: 600 }}>{diff.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button 
                        onClick={() => updateCount(diff.id, -1)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', width: '32px', height: '32px', color: 'white', cursor: 'pointer' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700 }}>{counts[diff.id]}</span>
                      <button 
                        onClick={() => updateCount(diff.id, 1)}
                        disabled={totalQuestions >= 20}
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', width: '32px', height: '32px', 
                          color: totalQuestions >= 20 ? 'rgba(255,255,255,0.1)' : 'white', cursor: totalQuestions >= 20 ? 'not-allowed' : 'pointer' 
                        }}
                      >
                        <Plus size={16} />
                      </button>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>questions</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: totalQuestions > 20 ? '#f87171' : '#6ee7b7' }}>
                  Total: {totalQuestions} / 20
                </div>
                {totalQuestions > 20 && (
                  <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.25rem' }}>Maximum 20 questions total. Please reduce.</div>
                )}
                {totalQuestions < 3 && totalQuestions > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Minimum 3 questions required.</div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!file || !topicName || totalQuestions < 3 || totalQuestions > 20}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: (!file || !topicName || totalQuestions < 3 || totalQuestions > 20) 
                    ? 'rgba(129, 140, 248, 0.2)' 
                    : 'linear-gradient(135deg, #818cf8, #c084fc)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: (!file || !topicName || totalQuestions < 3 || totalQuestions > 20) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Sparkles size={20} />
                Generate Quiz
              </button>
            </div>

            {/* History Section */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={20} /> Previous Custom Tests
              </h3>
              
              {historyLoading ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner-small" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : history.length === 0 ? (
                <div style={{ ...glass, textAlign: 'center', padding: '3rem' }}>
                  <FileText size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>No custom tests yet. Upload a document to get started.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {history.map((item) => (
                    <div key={item.id} style={{ ...glass, position: 'relative', transition: 'transform 0.2s' }} className="history-card">
                      <button 
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', paddingRight: '25px' }}>{item.topicName}</h4>
                      
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#6ee7b7' }}>🟢 {item.easyCount}</span>
                        <span style={{ color: '#fcd34d' }}>🟡 {item.mediumCount}</span>
                        <span style={{ color: '#f87171' }}>🔴 {item.hardCount}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 
                            item.percentage >= 70 ? '#6ee7b7' : item.percentage >= 50 ? '#fcd34d' : '#f87171'
                          }}>
                            {item.score} / {item.total}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ 
                          padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                          background: item.percentage >= 70 ? 'rgba(110, 231, 183, 0.1)' : item.percentage >= 50 ? 'rgba(252, 211, 77, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                          color: item.percentage >= 70 ? '#6ee7b7' : item.percentage >= 50 ? '#fcd34d' : '#f87171',
                          border: `1px solid ${item.percentage >= 70 ? 'rgba(110, 231, 183, 0.2)' : item.percentage >= 50 ? 'rgba(252, 211, 77, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                        }}>
                          {item.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', position: 'relative', marginBottom: '2rem' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid rgba(129,140,248,0.1)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid transparent', borderTopColor: '#c084fc', borderRadius: '50%', animation: 'spin 1.5s ease-in-out infinite' }}></div>
              <Sparkles size={32} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#818cf8' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Analyzing your document...</h2>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
              {loadingTime < 15 ? "This may take 15–30 seconds" : "Still working... almost there!"}
            </div>
          </div>
        )}

        {state === 'quiz' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header/Progress */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Test</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{topicName}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>{currentIdx + 1}</span>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}> / {questions.length}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(to right, #818cf8, #c084fc)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            {/* Question Card */}
            <div style={glass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  background: questions[currentIdx].difficulty === 'easy' ? 'rgba(110, 231, 183, 0.1)' : questions[currentIdx].difficulty === 'medium' ? 'rgba(252, 211, 77, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  color: questions[currentIdx].difficulty === 'easy' ? '#6ee7b7' : questions[currentIdx].difficulty === 'medium' ? '#fcd34d' : '#f87171'
                }}>
                  {questions[currentIdx].difficulty}
                </div>
              </div>

              <h4 style={{ fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '2rem' }}>{questions[currentIdx].question}</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions[currentIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(opt)}
                    style={{
                      textAlign: 'left',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedAnswers[currentIdx] === opt ? '#818cf8' : 'rgba(255,255,255,0.08)',
                      background: selectedAnswers[currentIdx] === opt ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: selectedAnswers[currentIdx] === opt ? '#a5b4fc' : 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{opt}</span>
                    {selectedAnswers[currentIdx] === opt && <CheckCircle size={20} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                onClick={() => setCurrentIdx(prev => prev - 1)}
                disabled={currentIdx === 0}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: currentIdx === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
                }}
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!selectedAnswers[currentIdx]}
                  style={{
                    padding: '0.8rem 2rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: !selectedAnswers[currentIdx] ? 'rgba(129, 140, 248, 0.2)' : 'linear-gradient(135deg, #818cf8, #c084fc)',
                    color: 'white',
                    cursor: !selectedAnswers[currentIdx] ? 'not-allowed' : 'pointer',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  Submit Quiz <Check size={20} />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  disabled={!selectedAnswers[currentIdx]}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '10px',
                    border: !selectedAnswers[currentIdx] ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    background: !selectedAnswers[currentIdx] ? 'rgba(255,255,255,0.05)' : '#818cf8',
                    color: !selectedAnswers[currentIdx] ? 'rgba(255,255,255,0.2)' : 'white',
                    cursor: !selectedAnswers[currentIdx] ? 'not-allowed' : 'pointer',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  Next <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {state === 'result' && result && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {/* Score Card */}
            <div style={{ ...glass, textAlign: 'center', padding: '3rem', marginBottom: '2rem', background: 'rgba(129,140,248,0.05)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '0.5rem', color: result.percentage >= 70 ? '#6ee7b7' : result.percentage >= 50 ? '#fcd34d' : '#f87171' }}>
                {result.score} / {result.total}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                {result.percentage}% {result.percentage >= 70 ? '🎉' : result.percentage >= 50 ? '👍' : '📚'}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                {result.percentage >= 70 ? "Excellent work! You've mastered the concepts in this document." : 
                 result.percentage >= 50 ? "Good effort. You have a fair understanding but there's room for improvement." : 
                 "Don't worry! Review the document and try again to solidfy your understanding."}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => { setState('setup'); setFile(null); setTopicName(''); setError(null); }}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#818cf8', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Take Another Test <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ ...glass, marginBottom: '2rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Difficulty Breakdown</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.85rem' }}>Difficulty</th>
                      <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.85rem' }}>Questions</th>
                      <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.85rem' }}>Correct</th>
                      <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.85rem' }}>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['easy', 'medium', 'hard'].map((diff) => {
                      const qCount = questions.filter(q => q.difficulty === diff).length;
                      const cCount = questions.filter((q, i) => q.difficulty === diff && selectedAnswers[i] === q.answer).length;
                      return (
                        <tr key={diff} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: 600 }}>
                            {diff === 'easy' ? '🟢 ' : diff === 'medium' ? '🟡 ' : '🔴 '}{diff}
                          </td>
                          <td style={{ padding: '1rem' }}>{qCount}</td>
                          <td style={{ padding: '1rem' }}>{cCount}</td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: qCount === 0 ? 'gray' : (cCount/qCount >= 0.7 ? '#6ee7b7' : cCount/qCount >= 0.5 ? '#fcd34d' : '#f87171') }}>
                            {qCount === 0 ? '-' : Math.round((cCount/qCount)*100) + '%'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Question Review */}
            <h4 style={{ fontWeight: 700, marginBottom: '1.5rem', color: 'rgba(255,255,255,0.6)' }}>Question Review</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
              {questions.map((q, i) => {
                const isCorrect = selectedAnswers[i] === q.answer;
                return (
                  <div key={i} style={glass}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>QUESTION {i + 1}</span>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px',
                        background: q.difficulty === 'easy' ? 'rgba(110, 231, 183, 0.1)' : q.difficulty === 'medium' ? 'rgba(252, 211, 77, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                        color: q.difficulty === 'easy' ? '#6ee7b7' : q.difficulty === 'medium' ? '#fcd34d' : '#f87171'
                      }}>{q.difficulty}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.5 }}>{q.question}</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ 
                        padding: '1rem', borderRadius: '8px', 
                        background: isCorrect ? 'rgba(110, 231, 183, 0.05)' : 'rgba(248, 113, 113, 0.05)',
                        border: `1px solid ${isCorrect ? 'rgba(110, 231, 183, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                      }}>
                        {isCorrect ? <Check size={18} color="#6ee7b7" /> : <X size={18} color="#f87171" />}
                        <div>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Your Answer:</span>
                          <span style={{ color: isCorrect ? '#6ee7b7' : '#f87171', fontWeight: 600 }}>{selectedAnswers[i] || 'No answer'}</span>
                        </div>
                      </div>
                      {!isCorrect && (
                        <div style={{ 
                          padding: '1rem', borderRadius: '8px', 
                          background: 'rgba(110, 231, 183, 0.05)',
                          border: '1px solid rgba(110, 231, 183, 0.2)',
                          display: 'flex', alignItems: 'center', gap: '0.75rem'
                        }}>
                          <Check size={18} color="#6ee7b7" />
                          <div>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Correct Answer:</span>
                            <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{q.answer}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      padding: '1rem', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '8px', borderLeft: '3px solid #818cf8',
                      fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5
                    }}>
                      <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Explanation</div>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-small { animation: spin 1s linear infinite; }
        .history-card:hover { transform: translateY(-3px); }
        .history-card button:hover { color: #f87171 !important; }
      `}</style>
    </DashboardLayout>
  );
}
