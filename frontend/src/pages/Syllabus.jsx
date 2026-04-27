import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { syllabusService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';

const typeConfig = {
  SUBJECT: { icon: '📘', color: 'var(--neon-purple)', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)' },
  UNIT: { icon: '📂', color: 'var(--neon-pink)', bg: 'rgba(249,168,212,0.1)', border: 'rgba(249,168,212,0.3)' },
  TOPIC: { icon: '📌', color: 'var(--neon-cyan)', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.3)' },
  SUBTOPIC: { icon: '◦', color: 'var(--neon-gold)', bg: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.3)' },
};

// ─── Add Custom Node Form ───────────────────────────────────
function AddNodeForm({ parentId, parentType, branch, semester, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const childType = {
    SUBJECT: 'UNIT',
    UNIT: 'TOPIC',
    TOPIC: 'SUBTOPIC',
    SUBTOPIC: 'SUBTOPIC',
  }[parentType] || 'TOPIC';

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await syllabusService.addCustomNode({
        name: name.trim(),
        type: childType,
        parentId,
        branch,
        semester,
      });
      onSave();
    } catch (err) {
      alert('Failed to add. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: 'flex', gap: '0.75rem', padding: '1rem', alignItems: 'center',
      background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem'
    }}>
      <input
        placeholder={`ENTER ${childType} NAME...`}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        autoFocus
        style={{ flex: 1 }}
      />
      <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '8px 20px', fontSize: '10px' }}>
        {saving ? <MiniLoader /> : 'SAVE'}
      </button>
      <button onClick={onCancel} className="btn-ghost" style={{ padding: '8px 20px', fontSize: '10px' }}>
        CANCEL
      </button>
    </div>
  );
}

// ─── Tree Node ──────────────────────────────────────────────
function TreeNode({ node, depth = 0, onRefresh }) {
  const [open, setOpen] = useState(depth === 0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [saving, setSaving] = useState(false);

  const config = typeConfig[node.type] || typeConfig.TOPIC;
  const hasChildren = node.children && node.children.length > 0;
  const canAddChild = node.type !== 'SUBTOPIC';
  const isCustom = node.isCustom;

  const handleEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await syllabusService.editCustomNode(node.id, { name: editName.trim() });
      setEditing(false);
      onRefresh();
    } catch (err) {
      alert('Failed to edit.');
    } finally {
      setSaving(false);
    }
  };
  const navigate = useNavigate();
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    try {
      await syllabusService.deleteCustomNode(node.id);
      onRefresh();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : '0', borderLeft: depth > 0 ? `1px dashed ${config.color}33` : 'none' }}>
      {/* Node Row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.75rem', padding: '0.75rem 1rem',
        borderRadius: '6px', cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '2px',
        position: 'relative'
      }}
        className="syllabus-node-row"
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Expand Arrow */}
        {hasChildren ? (
          <span
            onClick={() => setOpen(!open)}
            style={{
              fontSize: '10px', color: config.color,
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s', display: 'inline-block',
              flexShrink: 0, width: '16px',
            }}
          >▶</span>
        ) : (
          <span style={{ width: '16px', flexShrink: 0 }} />
        )}

        {/* Name — editable if custom */}
        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, padding: '4px 8px' }}
          />
        ) : (
          <span
            onClick={() => setOpen(!open)}
            style={{
              flex: 1, fontSize: depth === 0 ? '14px' : '13px',
              color: depth === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: depth === 0 ? 700 : 500,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.02em'
            }}
          >
            {node.name.toUpperCase()}
          </span>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isCustom && !editing && (
            <span className="badge badge-warning" style={{ fontSize: '8px' }}>CUSTOM</span>
          )}
          {!editing && (
            <span style={{
              fontSize: '8px', padding: '2px 8px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${config.color}44`,
              borderRadius: '2px', color: config.color,
              fontFamily: 'var(--font-mono)', fontWeight: 800
            }}>{node.type}</span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}
          onClick={e => e.stopPropagation()}>

          {editing ? (
            <>
              <button onClick={handleEdit} disabled={saving} className="btn-ghost" style={{ padding: '4px 8px', borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}>✓</button>
              <button onClick={() => setEditing(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </>
          ) : (
            <>
              {canAddChild && (
                <button onClick={() => { setShowAddForm(!showAddForm); setOpen(true); }} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '9px' }}>+ ADD</button>
              )}
              {node.type === 'TOPIC' && (
                <button
                  onClick={() => navigate(`/quiz/${node.id}/${encodeURIComponent(node.name)}`)}
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '9px' }}
                >
                  📝 QUIZ
                </button>
              )}
              {isCustom && (
                <>
                  <button onClick={() => setEditing(true)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '9px' }}>✏️</button>
                  <button onClick={handleDelete} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '9px', borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>🗑️</button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{ marginLeft: '1.5rem' }}>
          <AddNodeForm
            parentId={node.id}
            parentType={node.type}
            branch={node.branch}
            semester={node.semester}
            onSave={() => { setShowAddForm(false); setOpen(true); onRefresh(); }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Children */}
      {open && hasChildren && (
        <div style={{ paddingBottom: '0.5rem' }}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subject Card ───────────────────────────────────────────
function SubjectCard({ node, onRefresh }) {
  const [open, setOpen] = useState(false);
  const customCount = node.children?.filter(c => c.isCustom).length || 0;

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem', overflow: 'hidden', padding: 0 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem', cursor: 'pointer',
          background: open ? 'rgba(255,255,255,0.03)' : 'transparent',
          transition: 'all 0.3s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '8px', 
            background: 'rgba(255, 45, 120, 0.1)', border: '1px solid var(--neon-pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: 'var(--glow-pink)'
          }}>📘</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
              {node.name.toUpperCase()}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '0.1em' }}>
              SEMESTER {node.semester} // SUBJECT
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {customCount > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>{customCount} CUSTOM TOPICS</span>
          )}
          <span style={{
            fontSize: '12px', color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease', display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{
          padding: '1rem 1.5rem 2rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {node.children?.map(child => (
            <TreeNode key={child.id} node={child} depth={1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Syllabus Page ─────────────────────────────────────
export default function Syllabus() {
  const { currentUser, cachedSyllabusData, cacheSyllabusData } = useAuth();
  const initialSem = cachedSyllabusData?.semester || currentUser?.currentSemester || 3;
  const isCacheHit = cachedSyllabusData && cachedSyllabusData.semester === initialSem;

  const [tree, setTree] = useState(isCacheHit ? cachedSyllabusData.data : []);
  const [loading, setLoading] = useState(!isCacheHit);
  const [error, setError] = useState('');
  const [activeSem, setActiveSem] = useState(initialSem);

  const fetchTree = async (sem) => {
    setLoading(true);
    setError('');
    try {
      const res = await syllabusService.getTree(sem);
      setTree(res.data);
      cacheSyllabusData({ semester: sem, data: res.data });
    } catch (err) {
      setError('FAILED TO LOAD SYLLABUS. PLEASE CHECK YOUR CONNECTION.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedSyllabusData && cachedSyllabusData.semester === activeSem) {
      setTree(cachedSyllabusData.data);
      setLoading(false);
      setError('');
    } else {
      fetchTree(activeSem);
    }
  }, [activeSem]);

  const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading) return <GameLoader message="LOADING SYLLABUS..." subMessage={`LOADING SEMESTER ${activeSem} DATA`} />;

  return (
    <DashboardLayout>
      <div className="page-enter">
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>SYLLABUS</h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-pink)', fontSize: '12px', letterSpacing: '0.2em' }}>
            BRANCH: {currentUser?.branch?.toUpperCase() || 'UNKNOWN'}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
            {Object.entries(typeConfig).map(([type, { color, icon }]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontSize: '12px' }}>{icon}</span>
                <span style={{ color, fontWeight: 800 }}>{type}</span>
              </div>
            ))}
          </div>

          {/* Semester Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {allSemesters.map(sem => (
              <button
                key={sem}
                onClick={() => setActiveSem(sem)}
                className={activeSem === sem ? "btn-primary" : "btn-ghost"}
                style={{ padding: '8px 18px', fontSize: '11px' }}
              >
                SEM {sem}
                {sem === currentUser?.currentSemester && (
                  <span style={{ marginLeft: '6px', fontSize: '8px', color: 'var(--neon-cyan)', fontWeight: 800 }}>[CURRENT]</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderTop: '4px solid var(--neon-red)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              BRANCH: <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.branch}</strong>
            </p>
          </div>
        ) : tree.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>NO DATA FOUND FOR SEMESTER {activeSem}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '10px' }}>BRANCH: {currentUser?.branch}</p>
          </div>
        ) : (
          <div style={{ paddingBottom: '4rem' }}>
            {tree.map(subject => (
              <SubjectCard key={subject.id} node={subject} onRefresh={() => fetchTree(activeSem)} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}