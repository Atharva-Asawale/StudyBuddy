import { useState, useEffect } from 'react';
import { X, Book, Target, Award, AlertCircle, Clock, Battery, Calendar, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function StudentDetailDrawer({ userId, onClose }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) fetchDetail();
  }, [userId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStudentDetail(userId);
      setStudent(res.data);
    } catch (err) {
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '480px', height: '100vh',
        background: 'rgba(15, 15, 35, 0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)',
        zIndex: 101, transform: userId ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', color: 'white'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{loading ? 'Loading...' : student?.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{student?.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading details...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>
          ) : (
            <>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '6px 16px', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold' }}>{student.branch}</span>
                <span style={{ padding: '6px 16px', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold' }}>Semester {student.currentSemester}</span>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>CGPA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>{student.latestCgpa ? student.latestCgpa.toFixed(2) : 'N/A'}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '4px' }}>Quizzes</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>{student.totalQuizzes}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Mastered</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{student.masteredTopics}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Weak</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>{student.weakTopics}</div>
                </div>
              </div>

              {/* Academic Baseline */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} /> Academic Baseline
                </h3>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>10th Grade</div>
                    <div style={{ fontSize: '1rem' }}>{student.tenthPercentage ? `${student.tenthPercentage}%` : 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>12th Grade</div>
                    <div style={{ fontSize: '1rem' }}>{student.twelfthPercentage ? `${student.twelfthPercentage}%` : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Study Profile */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} /> Study Profile
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Study Hours/Day</div>
                    <div style={{ fontSize: '0.9rem' }}>{student.studyHoursPerDay || 'N/A'} hrs</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Stress Level</div>
                    <div style={{ padding: '2px 8px', borderRadius: '4px', background: student.stressLevel > 3 ? '#ef444433' : '#22c55e33', color: student.stressLevel > 3 ? '#ef4444' : '#22c55e', fontSize: '0.8rem', display: 'inline-block' }}>
                      Level {student.stressLevel || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Preffered Time</div>
                    <div style={{ fontSize: '0.9rem' }}>{student.preferredStudyTime || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Consistency</div>
                    <div style={{ fontSize: '0.9rem' }}>{student.consistencyScore || '0'}/5</div>
                  </div>
                </div>
              </div>

              {/* CGPA Timeline */}
              {student && student.semesters && student.semesters.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>CGPA Timeline</h3>
                  <div style={{ height: '200px', width: '100%', minHeight: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                      <LineChart data={student.semesters.map(s => ({ name: `Sem ${s.semesterNumber}`, cgpa: s.cgpa }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                        <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.4)" fontSize={10} />
                        <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none', color: 'white' }} />
                        <Line type="monotone" dataKey="cgpa" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Subject Performance */}
              {student && student.semesters && student.semesters.length > 0 && student.semesters[student.semesters.length - 1].subjects && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Subject Performance (Latest)</h3>
                  {student.semesters[student.semesters.length - 1].subjects.map(sub => (
                    <div key={sub.subjectName} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>{sub.subjectName}</span>
                        <span>{sub.score}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${sub.score}%`, 
                          background: sub.score >= 75 ? '#22c55e' : sub.score >= 60 ? '#eab308' : '#ef4444',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Topic Progress */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Topic Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {student.topicProgress?.slice(0, 10).map(tp => (
                    <div key={tp.topicId} style={{ padding: '10px', background: 'rgba(5, 5, 20, 0.4)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {tp.mastered ? <CheckCircle size={16} color="#22c55e" /> : <AlertCircle size={16} color="#ef4444" />}
                        <span style={{ fontSize: '0.85rem' }}>{tp.topicName}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{tp.score}%</span>
                    </div>
                  ))}
                  {student.topicProgress?.length > 10 && (
                    <button style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer' }}>Show more topics...</button>
                  )}
                  {student.topicProgress?.length === 0 && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>No quiz data recorded yet.</p>}
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </>
  );
}
