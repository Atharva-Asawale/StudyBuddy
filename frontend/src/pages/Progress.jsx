import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { addSemester, deleteSemester, getSemesters, updateSemester } from '../services/api';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';
import { customAlert, customConfirm } from '../utils/alert';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const getScoreBandColor = (score) => {
  if (score >= 80) return 'var(--neon-green)';
  if (score >= 60) return 'var(--neon-gold)';
  if (score >= 40) return 'var(--neon-orange)';
  return 'var(--neon-red)';
};

const normalizeSemesters = (list) => [...list].sort((a, b) => a.semesterNumber - b.semesterNumber);
const latestSemester = (list) => list.reduce((acc, s) => (s.semesterNumber > acc.semesterNumber ? s : acc), list[0]);

export default function Progress() {
  const { cachedSemestersData, cacheSemestersData } = useAuth();
  
  const [semesters, setSemesters] = useState(cachedSemestersData || []);
  const [selectedSemesterId, setSelectedSemesterId] = useState(() => {
    const data = cachedSemestersData || [];
    return data.length ? latestSemester(data).id : null;
  });

  const [loading, setLoading] = useState(!cachedSemestersData);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    semesterNumber: '',
    cgpa: '',
    subjects: [{ subjectName: '', grade: '', score: '' }],
  });

  const parseNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const pickSelected = (list, mode, prevSelectedId, extra = {}) => {
    if (!list.length) return null;
    if (mode === 'new') {
      if (extra.targetId && list.some((sem) => sem.id === extra.targetId)) return extra.targetId;
      if (extra.targetSemesterNumber) {
        const byNumber = list.find((sem) => sem.semesterNumber === extra.targetSemesterNumber);
        if (byNumber) return byNumber.id;
      }
      return latestSemester(list).id;
    }
    if (mode === 'afterDelete') {
      const previous = [...list]
        .filter((sem) => sem.semesterNumber < extra.deletedSemesterNumber)
        .sort((a, b) => b.semesterNumber - a.semesterNumber)[0];
      return previous?.id || latestSemester(list).id;
    }
    if (mode === 'latest') return latestSemester(list).id;
    if (prevSelectedId && list.some((sem) => sem.id === prevSelectedId)) return prevSelectedId;
    return latestSemester(list).id;
  };

  const refreshSemesters = async (mode = 'keep', extra = {}) => {
    const response = await getSemesters();
    const normalized = normalizeSemesters(Array.isArray(response.data) ? response.data : []);
    setSemesters(normalized);
    cacheSemestersData(normalized);
    setSelectedSemesterId((prev) => pickSelected(normalized, mode, prev, extra));
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSemesters();
      const normalized = normalizeSemesters(Array.isArray(response.data) ? response.data : []);
      setSemesters(normalized);
      cacheSemestersData(normalized);
      setSelectedSemesterId(normalized.length ? latestSemester(normalized).id : null);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedSemestersData || semesters.length === 0) {
      loadData();
    }
  }, []);

  const selectedSemester = useMemo(
    () => semesters.find((sem) => sem.id === selectedSemesterId) || null,
    [semesters, selectedSemesterId],
  );

  const selectedSubjects = useMemo(() => {
    if (!selectedSemester || !Array.isArray(selectedSemester.subjects)) return [];
    return selectedSemester.subjects.map((subject) => ({
      ...subject,
      scoreValue: parseNumber(subject.score) ?? 0,
    }));
  }, [selectedSemester]);

  const cgpaTrendData = useMemo(
    () => semesters.map((sem) => ({
      id: sem.id,
      label: `SEM ${sem.semesterNumber}`,
      cgpa: parseNumber(sem.cgpa) ?? 0,
      isSelected: sem.id === selectedSemesterId,
    })),
    [semesters, selectedSemesterId],
  );

  const averageCgpa = useMemo(() => {
    if (!cgpaTrendData.length) return 0;
    return cgpaTrendData.reduce((sum, item) => sum + item.cgpa, 0) / cgpaTrendData.length;
  }, [cgpaTrendData]);

  const subjectChartData = useMemo(
    () => selectedSubjects.map((subject) => ({
      name: subject.subjectName,
      label: `${subject.subjectName.toUpperCase()}`,
      score: subject.scoreValue,
      grade: subject.grade
    })),
    [selectedSubjects],
  );

  const stats = useMemo(() => {
    if (!selectedSemester) return { cgpa: '--', count: '--', best: '--', weakest: '--' };
    const sortedByScore = [...selectedSubjects].sort((a, b) => b.scoreValue - a.scoreValue);
    return {
      cgpa: parseNumber(selectedSemester.cgpa) !== null ? Number(selectedSemester.cgpa).toFixed(2) : '--',
      count: selectedSubjects.length,
      best: selectedSubjects.length ? sortedByScore[0].subjectName : '--',
      weakest: selectedSubjects.length ? sortedByScore[sortedByScore.length - 1].subjectName : '--',
    };
  }, [selectedSemester, selectedSubjects]);

  const resetForm = () => {
    setForm({ semesterNumber: '', cgpa: '', subjects: [{ subjectName: '', grade: '', score: '' }] });
    setEditingId(null);
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...form.subjects];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, subjects: updated }));
  };

  const addSubjectRow = () => {
    setForm((prev) => ({ ...prev, subjects: [...prev.subjects, { subjectName: '', grade: '', score: '' }] }));
  };

  const removeSubjectRow = (index) => {
    const updated = form.subjects.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, subjects: updated }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      semesterNumber: Number(form.semesterNumber),
      cgpa: Number(form.cgpa),
      subjects: form.subjects
        .filter((subject) => subject.subjectName.trim())
        .map((subject) => ({ subjectName: subject.subjectName.trim(), grade: subject.grade.trim(), score: Number(subject.score) })),
    };

    try {
      if (editingId) {
        await updateSemester(editingId, payload);
        await refreshSemesters('keep');
      } else {
        const created = await addSemester(payload);
        await refreshSemesters('new', { targetId: created?.data?.id, targetSemesterNumber: created?.data?.semesterNumber });
      }
      resetForm();
      setShowForm(false);
    } catch {
      setFormError('Failed to save semester. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (semester) => {
    const confirmed = await customConfirm('Are you sure you want to edit this semester?');
    if (!confirmed) return;

    setEditingId(semester.id);
    setForm({
      semesterNumber: String(semester.semesterNumber),
      cgpa: String(parseNumber(semester.cgpa) ?? ''),
      subjects: semester.subjects?.length
        ? semester.subjects.map((subject) => ({ subjectName: subject.subjectName || '', grade: subject.grade || '', score: String(parseNumber(subject.score) ?? '') }))
        : [{ subjectName: '', grade: '', score: '' }],
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (semesterId) => {
    const target = semesters.find((sem) => sem.id === semesterId);
    if (!target) return;
    const confirmed = await customConfirm('Are you sure you want to delete this semester?');
    if (!confirmed) return;

    setDeletingId(semesterId);
    try {
      await deleteSemester(semesterId);
      if (selectedSemesterId === semesterId) {
        await refreshSemesters('afterDelete', { deletedSemesterNumber: target.semesterNumber });
      } else {
        await refreshSemesters('keep');
      }
    } catch {
      await customAlert('Failed to delete semester.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <GameLoader message="LOADING PROGRESS..." subMessage="RETRIEVING ACADEMIC DATA" />;

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>ACADEMIC PROGRESS</h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '0.2em' }}>
            PERFORMANCE TRACKING // SEMESTER ANALYTICS
          </div>
        </div>

        {showForm && (
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowForm(false)}
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--neon-red)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              CLOSE [X]
            </button>
            <h3 style={{ fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              {editingId ? 'UPDATE SEMESTER' : 'ADD NEW SEMESTER'}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>SEMESTER NUMBER</label>
                  <input type="number" min="1" max="20" value={form.semesterNumber} onChange={(event) => setForm((prev) => ({ ...prev, semesterNumber: event.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>CGPA</label>
                  <input type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={(event) => setForm((prev) => ({ ...prev, cgpa: event.target.value }))} required style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem', color: 'var(--neon-cyan)', fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700 }}>SUBJECTS LIST</div>
              {form.subjects.map((subject, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <input type="text" placeholder="SUBJECT NAME" value={subject.subjectName} onChange={(event) => handleSubjectChange(index, 'subjectName', event.target.value)} required />
                  <input type="text" placeholder="GRADE" value={subject.grade} onChange={(event) => handleSubjectChange(index, 'grade', event.target.value)} />
                  <input type="number" placeholder="SCORE" min="0" max="100" value={subject.score} onChange={(event) => handleSubjectChange(index, 'score', event.target.value)} required />
                  {form.subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubjectRow(index)} style={{ 
                      background: 'rgba(255, 23, 68, 0.15)', 
                      border: '1px solid var(--neon-red)', 
                      color: 'var(--neon-red)', 
                      borderRadius: '8px', 
                      padding: '12px', 
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>REMOVE</button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addSubjectRow} style={{ 
                width: '100%', marginBottom: '1.5rem', padding: '12px', 
                background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.2)', 
                color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: '10px', letterSpacing: '0.1em'
              }}>+ ADD SUBJECT ROW</button>
              
              {formError && (
                <div style={{ marginBottom: '1.5rem', border: '1px solid var(--neon-red)', background: 'rgba(255,23,68,0.1)', borderRadius: '8px', padding: '1rem', color: 'var(--neon-red)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  ERROR: {formError.toUpperCase()}
                </div>
              )}
              
              <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%' }}>
                {saving ? <MiniLoader /> : editingId ? 'UPDATE SEMESTER' : 'SAVE SEMESTER'}
              </button>
            </form>
          </div>
        )}

        {semesters.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.2rem', fontFamily: 'var(--font-body)' }}>NO ACADEMIC RECORDS FOUND.</p>
            <button onClick={openAddModal} className="btn-primary">ADD YOUR FIRST SEMESTER</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>PERFORMANCE ANALYTICS</h1>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-gold)', fontSize: '12px', letterSpacing: '0.1em' }}>
                  ACADEMIC TRACKING // SEMESTER RECORDS
                </div>
              </div>
              {!showForm && (
                <button 
                  className="btn-primary"
                  onClick={openAddModal}
                  style={{ padding: '12px 24px', fontSize: '12px' }}
                >
                  + ADD SEMESTER
                </button>
              )}
            </div>

            {/* Semester Tabs */}
            <div className="glass-panel" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '999px' }}>
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '4px', justifyContent: 'center' }}>
                {semesters.map((sem) => {
                  const active = sem.id === selectedSemesterId;
                  return (
                    <button 
                      key={sem.id} 
                      onClick={() => setSelectedSemesterId(sem.id)} 
                      style={{ 
                        whiteSpace: 'nowrap', padding: '10px 24px', borderRadius: '999px', 
                        border: active ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)', 
                        background: active ? 'rgba(0, 240, 255, 0.15)' : 'transparent', 
                        color: active ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        boxShadow: active ? 'var(--glow-cyan)' : 'none',
                        fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-ui)', fontSize: '10px', letterSpacing: '0.1em'
                      }}>
                      SEM {sem.semesterNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            <div key={selectedSemesterId || 'content'} style={{ display: 'grid', gap: '1rem' }}>
              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {[
                  { title: 'SEMESTER CGPA', value: stats.cgpa, color: 'var(--neon-gold)' },
                  { title: 'TOTAL SUBJECTS', value: stats.count, color: 'var(--neon-cyan)' },
                  { title: 'TOP PERFORMANCE', value: stats.best?.toUpperCase(), color: 'var(--neon-green)' },
                  { title: 'WEAKEST SUBJECT', value: stats.weakest?.toUpperCase(), color: 'var(--neon-red)' }
                ].map((card, i) => (
                  <div key={i} className="glass-panel card-animate" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>{card.title}</div>
                    <div style={{ color: card.color, fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-mono)', textShadow: `0 0 10px ${card.color}44` }}>{card.value ?? '--'}</div>
                  </div>
                ))}
              </div>

              {/* CGPA Trend Chart */}
              <div className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.2em', marginBottom: '1.5rem', textAlign: 'center' }}>
                  CGPA TREND ANALYSIS
                </h3>
                <div style={{ height: '320px', width: '100%', minWidth: 0, minHeight: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cgpaTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} stroke="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--neon-pink)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                        itemStyle={{ color: 'var(--neon-pink)' }}
                      />
                      <ReferenceLine y={averageCgpa} stroke="var(--neon-cyan)" strokeDasharray="5 5" label={{ value: `AVG: ${averageCgpa.toFixed(2)}`, fill: 'var(--neon-cyan)', fontSize: 10, fontFamily: 'var(--font-mono)', position: 'insideTopRight' }} />
                      <Line type="monotone" dataKey="cgpa" stroke="var(--neon-pink)" strokeWidth={4} dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (!cx || !cy) return null;
                        const active = payload?.isSelected;
                        return <circle cx={cx} cy={cy} r={active ? 8 : 4} fill={active ? 'var(--neon-pink)' : 'var(--bg-base)'} stroke="var(--neon-pink)" strokeWidth={2} style={{ filter: active ? 'drop-shadow(0 0 8px var(--neon-pink))' : 'none' }} />;
                      }} activeDot={{ r: 10, fill: '#fff', stroke: 'var(--neon-pink)', strokeWidth: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Performance Bar Chart */}
              <div className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '11px', color: 'var(--neon-green)', letterSpacing: '0.2em', marginBottom: '1.5rem', textAlign: 'center' }}>
                  SUBJECT PERFORMANCE // SEMESTER {selectedSemester?.semesterNumber}
                </h3>
                {subjectChartData.length ? (
                  <div style={{ height: `${Math.max(300, subjectChartData.length * 50)}px`, width: '100%', minWidth: 0, minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="label" width={180} stroke="var(--text-primary)" fontSize={11} fontFamily="var(--font-ui)" tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--neon-green)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {subjectChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getScoreBandColor(entry.score)} />
                          ))}
                          <LabelList dataKey="score" position="right" fill="var(--text-primary)" fontSize={11} fontFamily="var(--font-mono)" offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NO SUBJECT DATA AVAILABLE</div>}
              </div>

              {/* Detailed Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {selectedSubjects.map((subject, idx) => (
                  <div key={idx} className="glass-panel card-animate" style={{ padding: '1.5rem', borderLeft: `4px solid ${getScoreBandColor(subject.scoreValue)}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>{subject.subjectName.toUpperCase()}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>GRADE: {subject.grade || 'N/A'}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: getScoreBandColor(subject.scoreValue), fontFamily: 'var(--font-mono)' }}>{subject.scoreValue}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Management Section */}
              <div className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
                  MANAGE SEMESTERS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {semesters.map((sem) => (
                    <div key={sem.id} style={{ 
                      borderRadius: '12px', 
                      border: sem.id === selectedSemesterId ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.05)', 
                      background: 'rgba(255,255,255,0.02)', 
                      padding: '1.25rem' 
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{`SEM ${sem.semesterNumber}`}</div>
                      <div style={{ color: 'var(--neon-cyan)', fontWeight: 800, fontSize: '1.8rem', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>{(parseNumber(sem.cgpa) ?? 0).toFixed(2)}</div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => handleEdit(sem)} className="btn-ghost" style={{ flex: 1, fontSize: '10px', padding: '8px' }}>EDIT</button>
                        <button onClick={() => handleDelete(sem.id)} disabled={deletingId === sem.id} className="btn-ghost" style={{ 
                          flex: 1, fontSize: '10px', padding: '8px', 
                          borderColor: 'var(--neon-red)', color: 'var(--neon-red)' 
                        }}>
                          {deletingId === sem.id ? '...' : 'DELETE'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
