
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { addSemester, deleteSemester, getSemesters, updateSemester } from '../services/api';
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

const glass = {
  background: 'rgba(15, 15, 40, 0.62)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '1.25rem',
};

const chartLabel = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.95rem',
  textAlign: 'center',
};

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getScoreBandColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
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
      label: `Semester ${sem.semesterNumber}`,
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
      label: `${subject.subjectName}${subject.grade ? ` [${subject.grade}]` : ''}`,
      score: subject.scoreValue,
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

  const inputStyle = {
    padding: '0.65rem 0.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.88rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

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

  const handleEdit = (semester) => {
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
    if (!target || !window.confirm('Are you sure you want to delete this semester?')) return;

    setDeletingId(semesterId);
    try {
      await deleteSemester(semesterId);
      if (selectedSemesterId === semesterId) {
        await refreshSemesters('afterDelete', { deletedSemesterNumber: target.semesterNumber });
      } else {
        await refreshSemesters('keep');
      }
    } catch {
      window.alert('Failed to delete semester.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes progressSpin { to { transform: rotate(360deg); } }
        @keyframes progressFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', margin: 0 }}>Academic Progress</h2>
          <button onClick={() => (showForm ? setShowForm(false) : openAddModal())} style={{ padding: '0.68rem 1.8rem', background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #38bdf8, #22d3ee)', border: showForm ? '1px solid rgba(255,255,255,0.14)' : 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            {showForm ? 'Close Form' : '+ Add Semester'}
          </button>
        </div>

        {showForm && (
          <div style={{ ...glass, marginBottom: '1.25rem' }}>
            <h3 style={chartLabel}>{editingId ? 'Edit Semester' : 'Add Semester'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>Semester Number</label>
                  <input style={inputStyle} type="number" min="1" max="20" value={form.semesterNumber} onChange={(event) => setForm((prev) => ({ ...prev, semesterNumber: event.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>CGPA</label>
                  <input style={inputStyle} type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={(event) => setForm((prev) => ({ ...prev, cgpa: event.target.value }))} required />
                </div>
              </div>

              <div style={{ marginBottom: '0.8rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600 }}>Subjects</div>
              {form.subjects.map((subject, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.65rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                  <input style={inputStyle} type="text" placeholder="Subject name" value={subject.subjectName} onChange={(event) => handleSubjectChange(index, 'subjectName', event.target.value)} required />
                  <input style={inputStyle} type="text" placeholder="Grade" value={subject.grade} onChange={(event) => handleSubjectChange(index, 'grade', event.target.value)} />
                  <input style={inputStyle} type="number" placeholder="Score" min="0" max="100" value={subject.score} onChange={(event) => handleSubjectChange(index, 'score', event.target.value)} required />
                  {form.subjects.length > 1 && <button type="button" onClick={() => removeSubjectRow(index)} style={{ background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.4)', color: '#fda4af', borderRadius: '8px', padding: '0.6rem 0.75rem', cursor: 'pointer' }}>Remove</button>}
                </div>
              ))}

              <button type="button" onClick={addSubjectRow} style={{ width: '100%', marginBottom: '0.95rem', padding: '0.58rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.68)', borderRadius: '8px', cursor: 'pointer' }}>+ Add Subject</button>
              {formError && <div style={{ marginBottom: '0.9rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.14)', borderRadius: '8px', padding: '0.65rem', color: '#fca5a5', fontSize: '0.85rem' }}>{formError}</div>}
              <button type="submit" disabled={saving} style={{ padding: '0.72rem 1.6rem', background: 'linear-gradient(135deg, #38bdf8, #22d3ee)', border: 'none', borderRadius: '10px', color: '#032024', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1 }}>{saving ? 'Saving...' : editingId ? 'Update Semester' : 'Save Semester'}</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ ...glass, textAlign: 'center', padding: '3rem 1.25rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', margin: '0 auto 0.85rem', border: '3px solid rgba(56,189,248,0.25)', borderTop: '3px solid #38bdf8', animation: 'progressSpin 0.95s linear infinite' }} />
            <div style={{ color: '#000000', fontWeight: 600 }}>Loading your progress...</div>
          </div>
        ) : error ? (
          <div style={{ ...glass, textAlign: 'center', padding: '2.6rem 1.25rem' }}>
            <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '0.45rem' }}>Failed to load data. Please refresh.</div>
            <button onClick={loadData} style={{ padding: '0.62rem 1.1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ ...glass, textAlign: 'center', padding: '3rem 1.25rem' }}>
            <p style={{ color: '#000000', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>No semester data yet. Add your first semester!</p>
            <button onClick={openAddModal} style={{ padding: '0.7rem 1.15rem', background: 'linear-gradient(135deg, #38bdf8, #22d3ee)', color: '#032024', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Add Semester</button>
          </div>
        ) : (
          <>
            <div style={{ ...glass, marginBottom: '1rem', padding: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.7rem', overflowX: 'auto', paddingBottom: '0.25rem', justifyContent: 'center' }}>
                {semesters.map((sem) => {
                  const active = sem.id === selectedSemesterId;
                  return (
                    <button key={sem.id} onClick={() => setSelectedSemesterId(sem.id)} style={{ whiteSpace: 'nowrap', padding: '0.58rem 1rem', borderRadius: '999px', border: active ? '1px solid rgba(34,211,238,0.9)' : '1px solid rgba(255,255,255,0.18)', background: active ? 'rgba(34,211,238,0.16)' : 'rgba(255,255,255,0.03)', color: active ? '#67e8f9' : 'rgba(255,255,255,0.75)', boxShadow: active ? '0 0 18px rgba(34,211,238,0.3)' : 'none', fontWeight: 700, cursor: 'pointer' }}>
                      {`Sem ${sem.semesterNumber}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div key={selectedSemesterId || 'content'} style={{ display: 'grid', gap: '1rem', animation: 'progressFade 240ms ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                {[{ title: 'Current CGPA', value: stats.cgpa }, { title: 'Subjects Count', value: stats.count }, { title: 'Best Subject', value: stats.best }, { title: 'Weakest Subject', value: stats.weakest }].map((card) => (
                  <div key={card.title} style={glass}>
                    <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem', textAlign: 'center' }}>{card.title}</div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1.08rem', textAlign: 'center' }}>{card.value ?? '--'}</div>
                  </div>
                ))}
              </div>

              <div style={glass}>
                <h3 style={chartLabel}>CGPA Trend (All Semesters)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={cgpaTrendData} margin={{ top: 16, right: 16, left: 6, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.65)" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.22)' }} />
                    <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.65)" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.22)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(5,10,22,0.95)', border: '1px solid rgba(34,211,238,0.35)', borderRadius: '10px', color: '#dbeafe' }} formatter={(value, _, payload) => [`${Number(value).toFixed(2)}${payload?.isSelected ? ' (Currently Viewing)' : ''}`, 'CGPA']} />
                    <ReferenceLine y={averageCgpa} stroke="rgba(56,189,248,0.9)" strokeDasharray="5 5" label={{ value: `Avg ${averageCgpa.toFixed(2)}`, fill: '#7dd3fc', fontSize: 12, position: 'insideTopRight' }} />
                    <Line type="monotone" dataKey="cgpa" stroke="#38bdf8" strokeWidth={3} dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (cx === undefined || cy === undefined) return null;
                      const active = payload?.isSelected;
                      return <circle cx={cx} cy={cy} r={active ? 8 : 5} fill={active ? '#22d3ee' : '#bae6fd'} stroke={active ? '#67e8f9' : '#38bdf8'} strokeWidth={active ? 3 : 2} />;
                    }} activeDot={{ r: 9, fill: '#ffffff', stroke: '#22d3ee', strokeWidth: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={glass}>
                <h3 style={chartLabel}>Subject Performance (Semester {selectedSemester?.semesterNumber})</h3>
                {subjectChartData.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, subjectChartData.length * 56)}>
                    <BarChart data={subjectChartData} layout="vertical" margin={{ top: 8, right: 24, left: 36, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.7)" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.22)' }} />
                      <YAxis type="category" dataKey="label" width={220} stroke="rgba(255,255,255,0.75)" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.22)' }} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'rgba(5,10,22,0.95)', border: '1px solid rgba(34,211,238,0.35)', borderRadius: '10px', color: '#dbeafe' }} formatter={(value) => [`${value}`, 'Score']} />
                      <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                        {subjectChartData.map((subject) => <Cell key={subject.name} fill={getScoreBandColor(subject.score)} />)}
                        <LabelList dataKey="score" position="right" fill="#e5e7eb" formatter={(value) => `${value}`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: 'rgba(255,255,255,0.75)' }}>No subjects added for this semester yet.</div>}
              </div>

              <div style={glass}>
                <h3 style={chartLabel}>Subject Cards (Semester {selectedSemester?.semesterNumber})</h3>
                {selectedSubjects.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
                    {selectedSubjects.map((subject) => (
                      <div key={`${subject.subjectName}-${subject.grade}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.9rem' }}>
                        <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, marginBottom: '0.32rem' }}>{subject.subjectName}</div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.58)', marginBottom: '0.45rem' }}>Grade: {subject.grade || '--'}</div>
                        <div style={{ display: 'inline-block', padding: '0.24rem 0.6rem', borderRadius: '999px', background: `${getScoreBandColor(subject.scoreValue)}22`, border: `1px solid ${getScoreBandColor(subject.scoreValue)}66`, color: getScoreBandColor(subject.scoreValue), fontWeight: 700, fontSize: '0.82rem' }}>{subject.scoreValue}</div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: 'rgba(255,255,255,0.75)' }}>No subjects added for this semester yet.</div>}
              </div>
            </div>

            <div style={{ ...glass, marginTop: '1rem' }}>
              <h3 style={chartLabel}>Manage Semesters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                {semesters.map((sem) => (
                  <div key={sem.id} style={{ borderRadius: '12px', border: sem.id === selectedSemesterId ? '1px solid rgba(34,211,238,0.6)' : '1px solid rgba(255,255,255,0.1)', background: sem.id === selectedSemesterId ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)', padding: '0.9rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>{`Semester ${sem.semesterNumber}`}</div>
                    <div style={{ color: '#67e8f9', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem' }}>{(parseNumber(sem.cgpa) ?? 0).toFixed(2)}</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{sem.subjects?.length || 0} subjects</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(sem)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.45)', background: 'rgba(56,189,248,0.14)', color: '#7dd3fc', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(sem.id)} disabled={deletingId === sem.id} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', cursor: deletingId === sem.id ? 'not-allowed' : 'pointer', opacity: deletingId === sem.id ? 0.75 : 1 }}>
                        {deletingId === sem.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
