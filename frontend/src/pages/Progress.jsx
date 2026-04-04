import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { semesterService } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const heatmapTopics = [
  { name: 'Arrays', level: 4 },
  { name: 'Linked Lists', level: 3 },
  { name: 'Trees', level: 2 },
  { name: 'Graphs', level: 1 },
  { name: 'DP', level: 2 },
  { name: 'Sorting', level: 4 },
  { name: 'Searching', level: 3 },
  { name: 'OS Basics', level: 2 },
  { name: 'Deadlocks', level: 1 },
  { name: 'Memory Mgmt', level: 3 },
  { name: 'SQL', level: 4 },
  { name: 'Normalization', level: 2 },
  { name: 'Networking', level: 3 },
  { name: 'TCP/IP', level: 2 },
  { name: 'HTTP', level: 4 },
];

const heatmapColors = {
  1: { color: '#fca5a5', bg: 'rgba(252,165,165,0.15)', border: 'rgba(252,165,165,0.4)', label: 'Weak' },
  2: { color: '#fde68a', bg: 'rgba(253,230,138,0.15)', border: 'rgba(253,230,138,0.4)', label: 'Fair' },
  3: { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.4)', label: 'Good' },
  4: { color: '#6ee7b7', bg: 'rgba(110,231,183,0.15)', border: 'rgba(110,231,183,0.4)', label: 'Strong' },
};

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const chartLabel = {
  fontSize: '0.8rem', fontWeight: 600,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '1rem',
};

export default function Progress() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    semesterNumber: '',
    cgpa: '',
    subjects: [{ subjectName: '', grade: '', score: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await semesterService.getAll();
      setSemesters(res.data);
    } catch (err) {
      console.error('Failed to fetch semesters', err);
    } finally {
      setLoading(false);
    }
  };

  const cgpaData = semesters.map(s => ({
    sem: `S${s.semesterNumber}`,
    cgpa: parseFloat(s.cgpa),
  }));

  const subjectData = semesters.length > 0
    ? (semesters[semesters.length - 1].subjects || []).map(s => ({
      subject: s.subjectName,
      marks: parseFloat(s.score),
    }))
    : [];

  const handleSubjectChange = (index, field, value) => {
    const updated = [...form.subjects];
    updated[index][field] = value;
    setForm({ ...form, subjects: updated });
  };

  const addSubjectRow = () => {
    setForm({
      ...form,
      subjects: [...form.subjects, { subjectName: '', grade: '', score: '' }],
    });
  };

  const removeSubjectRow = (index) => {
    const updated = form.subjects.filter((_, i) => i !== index);
    setForm({ ...form, subjects: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        semesterNumber: parseInt(form.semesterNumber),
        cgpa: parseFloat(form.cgpa),
        subjects: form.subjects.map(s => ({
          subjectName: s.subjectName,
          grade: s.grade,
          score: parseFloat(s.score),
        })),
      };

      if (editingId) {
        await semesterService.update(editingId, payload);
        setEditingId(null);
      } else {
        await semesterService.add(payload);
      }

      setForm({
        semesterNumber: '',
        cgpa: '',
        subjects: [{ subjectName: '', grade: '', score: '' }],
      });
      setShowForm(false);
      fetchSemesters();
    } catch (err) {
      setError('Failed to save semester. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sem) => {
    setEditingId(sem.id);
    setForm({
      semesterNumber: sem.semesterNumber.toString(),
      cgpa: parseFloat(sem.cgpa).toString(),
      subjects: sem.subjects?.length > 0
        ? sem.subjects.map(s => ({
          subjectName: s.subjectName,
          grade: s.grade || '',
          score: s.score?.toString() || '',
        }))
        : [{ subjectName: '', grade: '', score: '' }],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return;
    setDeleting(id);
    try {
      await semesterService.delete(id);
      fetchSemesters();
    } catch (err) {
      alert('Failed to delete semester.');
    } finally {
      setDeleting(null);
    }
  };
  const inputStyle = {
    padding: '0.6rem 0.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <DashboardLayout>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem',
      }}>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 700,
          color: 'white', letterSpacing: '-0.02em',
        }}>
          Academic Progress
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ semesterNumber: '', cgpa: '', subjects: [{ subjectName: '', grade: '', score: '' }] }); }}
          style={{
            padding: '0.65rem 1.25rem',
            background: showForm
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #818cf8, #c084fc)',
            border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRadius: '10px',
            color: 'white', fontWeight: 600,
            fontSize: '0.88rem', cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Semester'}
        </button>
      </div>

      {/* Add Semester Form */}
      {showForm && (
        <div style={{ ...glass, borderColor: 'rgba(129,140,248,0.3)' }}>
          <h3 style={{ ...chartLabel, marginBottom: '1.25rem' }}>
            {editingId ? '✏️ Edit Semester' : 'Add Semester Data'}
          </h3>
          <form onSubmit={handleSave}>

            {/* Semester Number + CGPA */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem', marginBottom: '1rem',
            }}>
              <div>
                <label style={{
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
                  display: 'block', marginBottom: '0.4rem',
                }}>
                  Semester Number
                </label>
                <input
                  style={inputStyle} type="number"
                  placeholder="e.g. 4" min="1" max="8"
                  value={form.semesterNumber}
                  onChange={e => setForm({ ...form, semesterNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
                  display: 'block', marginBottom: '0.4rem',
                }}>
                  CGPA
                </label>
                <input
                  style={inputStyle} type="number"
                  placeholder="e.g. 8.5" min="0" max="10" step="0.01"
                  value={form.cgpa}
                  onChange={e => setForm({ ...form, cgpa: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Subjects */}
            <label style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
              display: 'block', marginBottom: '0.75rem',
            }}>
              Subjects
            </label>

            {form.subjects.map((subject, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '0.75rem', marginBottom: '0.6rem',
                alignItems: 'center',
              }}>
                <input
                  style={inputStyle} type="text"
                  placeholder="Subject name"
                  value={subject.subjectName}
                  onChange={e => handleSubjectChange(index, 'subjectName', e.target.value)}
                  required
                />
                <input
                  style={inputStyle} type="text"
                  placeholder="Grade (A, B+)"
                  value={subject.grade}
                  onChange={e => handleSubjectChange(index, 'grade', e.target.value)}
                />
                <input
                  style={inputStyle} type="number"
                  placeholder="Score" min="0" max="100"
                  value={subject.score}
                  onChange={e => handleSubjectChange(index, 'score', e.target.value)}
                  required
                />
                {form.subjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubjectRow(index)}
                    style={{
                      background: 'rgba(252,165,165,0.1)',
                      border: '1px solid rgba(252,165,165,0.3)',
                      color: '#fca5a5', borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button" onClick={addSubjectRow}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
                borderRadius: '8px', padding: '0.5rem 1rem',
                cursor: 'pointer', fontSize: '0.82rem',
                marginBottom: '1.25rem', width: '100%',
              }}
            >
              + Add Subject
            </button>

            {error && (
              <div style={{
                padding: '0.75rem', background: 'rgba(252,165,165,0.1)',
                border: '1px solid rgba(252,165,165,0.3)',
                borderRadius: '8px', color: '#fca5a5',
                fontSize: '0.85rem', marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={saving}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontWeight: 700,
                fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Update Semester' : 'Save Semester'}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>
          Loading your progress...
        </div>
      ) : semesters.length === 0 ? (
        <div style={{
          ...glass, textAlign: 'center',
          padding: '3rem', color: 'rgba(255,255,255,0.3)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
          <p>No semester data yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Click "Add Semester" to get started.
          </p>
        </div>
      ) : (
        <>
          {/* CGPA Trend */}
          <div style={glass}>
            <h3 style={chartLabel}>CGPA Trend</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={cgpaData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="cgpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f9a8d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f9a8d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="sem" stroke="#aaa" fontSize={13}
                  tick={{ fill: '#ccc', fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#aaa" fontSize={13}
                  domain={[5, 10]} ticks={[5, 6, 7, 8, 9, 10]}
                  tick={{ fill: '#ccc', fontWeight: 600 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,50,0.95)',
                    border: '1px solid rgba(249,168,212,0.4)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#f9a8d4', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone" dataKey="cgpa"
                  stroke="#f9a8d4" strokeWidth={3}
                  dot={{ fill: '#f9a8d4', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 9, fill: '#fff', stroke: '#f9a8d4', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Latest Semester Subject Performance */}
          <div style={glass}>
            <h3 style={chartLabel}>
              Subject Performance — Semester {semesters[semesters.length - 1].semesterNumber}
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={subjectData} barSize={40} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  {subjectData.map((_, i) => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={
                        ['#6ee7b7', '#818cf8', '#f9a8d4', '#fde68a', '#93c5fd', '#c084fc', '#fb923c'][i % 7]
                      } stopOpacity={1} />
                      <stop offset="100%" stopColor={
                        ['#6ee7b7', '#818cf8', '#f9a8d4', '#fde68a', '#93c5fd', '#c084fc', '#fb923c'][i % 7]
                      } stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="subject" stroke="#aaa" fontSize={13}
                  tick={{ fill: '#ccc', fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#aaa" fontSize={13}
                  domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: '#ccc', fontWeight: 600 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,50,0.95)',
                    border: '1px solid rgba(129,140,248,0.4)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="marks" radius={[8, 8, 0, 0]}>
                  {subjectData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={['#6ee7b7', '#818cf8', '#f9a8d4', '#fde68a', '#93c5fd', '#c084fc', '#fb923c'][i % 7]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Semester Cards */}
          <div style={glass}>
            <h3 style={chartLabel}>All Semesters</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {semesters.map((sem) => (
                <div key={sem.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '1rem',
                  position: 'relative',
                }}>
                  <div style={{
                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
                    marginBottom: '0.4rem', textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    Semester {sem.semesterNumber}
                  </div>
                  <div style={{
                    fontSize: '1.8rem', fontWeight: 700,
                    color: '#818cf8', lineHeight: 1,
                    marginBottom: '0.5rem',
                  }}>
                    {parseFloat(sem.cgpa).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
                    {sem.subjects?.length || 0} subjects
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(sem)}
                      style={{
                        flex: 1, padding: '0.4rem',
                        background: 'rgba(129,140,248,0.1)',
                        border: '1px solid rgba(129,140,248,0.3)',
                        borderRadius: '6px', color: '#818cf8',
                        fontSize: '0.75rem', cursor: 'pointer',
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sem.id)}
                      style={{
                        flex: 1, padding: '0.4rem',
                        background: 'rgba(252,165,165,0.1)',
                        border: '1px solid rgba(252,165,165,0.3)',
                        borderRadius: '6px', color: '#fca5a5',
                        fontSize: '0.75rem', cursor: 'pointer',
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Topic Mastery Heatmap */}
      <div style={glass}>
        <h3 style={chartLabel}>Topic Mastery Heatmap</h3>
        <div style={{
          display: 'flex', gap: '1rem',
          marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          {Object.entries(heatmapColors).map(([level, { color, label }]) => (
            <div key={level} style={{
              display: 'flex', alignItems: 'center',
              gap: '0.4rem', fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
            }}>
              <div style={{
                width: '10px', height: '10px',
                borderRadius: '50%', background: color,
              }} />
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {heatmapTopics.map(({ name, level }) => {
            const { bg, border } = heatmapColors[level];
            return (
              <div key={name}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  background: bg,
                  border: `1px solid ${border}`,
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'default',
                  transition: 'transform 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>

    </DashboardLayout>
  );
}