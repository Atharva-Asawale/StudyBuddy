import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { syllabusService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const typeConfig = {
  SUBJECT: { icon: '📘', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)' },
  UNIT: { icon: '📂', color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', border: 'rgba(249,168,212,0.3)' },
  TOPIC: { icon: '📌', color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.3)' },
  SUBTOPIC: { icon: '◦', color: '#fde68a', bg: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.3)' },
};

const glass = {
  background: 'rgba(15,15,40,0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  marginBottom: '1rem',
  overflow: 'hidden',
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
      display: 'flex', gap: '0.5rem',
      padding: '0.5rem 0', alignItems: 'center',
    }}>
      <input
        style={{ ...inputStyle, flex: 1 }}
        placeholder={`Add ${childType.toLowerCase()} name...`}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        autoFocus
      />
      <button onClick={handleSave} disabled={saving} style={{
        padding: '0.5rem 0.85rem',
        background: 'linear-gradient(135deg, #818cf8, #c084fc)',
        border: 'none', borderRadius: '8px',
        color: 'white', fontSize: '0.8rem',
        cursor: 'pointer', fontWeight: 600,
      }}>
        {saving ? '...' : 'Add'}
      </button>
      <button onClick={onCancel} style={{
        padding: '0.5rem 0.75rem',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', color: 'rgba(255,255,255,0.4)',
        fontSize: '0.8rem', cursor: 'pointer',
      }}>
        Cancel
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
    <div style={{ marginLeft: depth > 0 ? '1.25rem' : '0' }}>
      {/* Node Row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.5rem', padding: '0.55rem 0.75rem',
        borderRadius: '8px', cursor: 'pointer',
        transition: 'background 0.15s',
        borderLeft: depth > 0 ? `2px solid ${config.color}30` : 'none',
      }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Expand Arrow */}
        {hasChildren ? (
          <span
            onClick={() => setOpen(!open)}
            style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s', display: 'inline-block',
              flexShrink: 0, width: '12px',
            }}
          >▶</span>
        ) : (
          <span style={{ width: '12px', flexShrink: 0 }} />
        )}

        {/* Icon */}
        <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{config.icon}</span>

        {/* Name — editable if custom */}
        {editing ? (
          <input
            style={{ ...inputStyle, flex: 1, padding: '0.3rem 0.5rem' }}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={() => setOpen(!open)}
            style={{
              flex: 1, fontSize: '0.88rem',
              color: depth === 0 ? 'white' : 'rgba(255,255,255,0.75)',
              fontWeight: depth === 0 ? 600 : 400,
            }}
          >
            {node.name}
          </span>
        )}

        {/* Custom badge */}
        {isCustom && !editing && (
          <span style={{
            fontSize: '0.65rem', padding: '0.15rem 0.45rem',
            background: 'rgba(253,230,138,0.15)',
            border: '1px solid rgba(253,230,138,0.3)',
            borderRadius: '999px', color: '#fde68a',
            flexShrink: 0,
          }}>custom</span>
        )}

        {/* Type badge */}
        {!editing && (
          <span style={{
            fontSize: '0.65rem', padding: '0.15rem 0.5rem',
            background: config.bg, border: `1px solid ${config.border}`,
            borderRadius: '999px', color: config.color,
            flexShrink: 0,
          }}>{node.type}</span>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>

          {editing ? (
            <>
              <button onClick={handleEdit} disabled={saving} style={{
                padding: '0.25rem 0.6rem', background: 'rgba(110,231,183,0.2)',
                border: '1px solid rgba(110,231,183,0.4)', borderRadius: '6px',
                color: '#6ee7b7', fontSize: '0.72rem', cursor: 'pointer',
              }}>
                {saving ? '...' : '✓'}
              </button>
              <button onClick={() => setEditing(false)} style={{
                padding: '0.25rem 0.6rem', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', cursor: 'pointer',
              }}>✕</button>
            </>
          ) : (
            <>
              {canAddChild && (
                <button onClick={() => { setShowAddForm(!showAddForm); setOpen(true); }} style={{
                  padding: '0.25rem 0.6rem', background: 'rgba(129,140,248,0.1)',
                  border: '1px solid rgba(129,140,248,0.3)', borderRadius: '6px',
                  color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer',
                }}>+ Add</button>
              )}
              {node.type === 'TOPIC' && (
                <button
                  onClick={() => navigate(`/quiz/${node.id}/${encodeURIComponent(node.name)}`)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(110,231,183,0.1)',
                    border: '1px solid rgba(110,231,183,0.3)',
                    borderRadius: '6px', color: '#6ee7b7',
                    fontSize: '0.72rem', cursor: 'pointer',
                  }}
                >
                  📝 Quiz
                </button>
              )}
              {isCustom && (
                <>
                  <button onClick={() => setEditing(true)} style={{
                    padding: '0.25rem 0.6rem', background: 'rgba(253,230,138,0.1)',
                    border: '1px solid rgba(253,230,138,0.3)', borderRadius: '6px',
                    color: '#fde68a', fontSize: '0.72rem', cursor: 'pointer',
                  }}>✏️</button>
                  <button onClick={handleDelete} style={{
                    padding: '0.25rem 0.6rem', background: 'rgba(252,165,165,0.1)',
                    border: '1px solid rgba(252,165,165,0.3)', borderRadius: '6px',
                    color: '#fca5a5', fontSize: '0.72rem', cursor: 'pointer',
                  }}>🗑️</button>
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
        <div>
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

  const weakCount = 0;
  const customCount = node.children?.filter(c => c.isCustom).length || 0;

  return (
    <div style={glass}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem', cursor: 'pointer',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📘</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white' }}>
              {node.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>
              Semester {node.semester}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {customCount > 0 && (
            <span style={{
              fontSize: '0.7rem', padding: '0.2rem 0.6rem',
              background: 'rgba(253,230,138,0.15)',
              color: '#fde68a', borderRadius: '999px',
              border: '1px solid rgba(253,230,138,0.3)',
            }}>
              {customCount} custom
            </span>
          )}
          <span style={{
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{
          padding: '0.5rem 1.25rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
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
  const { currentUser } = useAuth();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSem, setActiveSem] = useState(currentUser?.currentSemester || 3);

  const fetchTree = async () => {
    try {
      const res = await syllabusService.getTree();
      setTree(res.data);
    } catch (err) {
      setError('Failed to load syllabus. Make sure your branch matches exactly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // Group by semester
  const semesters = [...new Set(tree.map(n => n.semester))].sort();
  const filtered = tree.filter(n => n.semester === activeSem);

  return (
    <DashboardLayout>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{
              fontSize: '1.6rem', fontWeight: 700,
              color: 'white', letterSpacing: '-0.02em',
              marginBottom: '0.35rem',
            }}>
              Syllabus Tree
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
              Branch: <span style={{ color: '#818cf8', fontWeight: 600 }}>
                {currentUser?.branch || '—'}
              </span>
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(typeConfig).map(([type, { color, icon }]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center',
                gap: '0.35rem', fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.4)',
              }}>
                <span>{icon}</span>
                <span style={{ color }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Semester Tabs */}
        {semesters.length > 0 && (
          <div style={{
            display: 'flex', gap: '0.5rem',
            marginTop: '1.25rem', flexWrap: 'wrap',
          }}>
            {semesters.map(sem => (
              <button
                key={sem}
                onClick={() => setActiveSem(sem)}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeSem === sem
                    ? 'linear-gradient(135deg, #818cf8, #c084fc)'
                    : 'rgba(255,255,255,0.05)',
                  border: activeSem === sem
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: activeSem === sem ? 'white' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                Sem {sem}
                {sem === currentUser?.currentSemester && (
                  <span style={{
                    marginLeft: '0.4rem', fontSize: '0.6rem',
                    background: 'rgba(110,231,183,0.3)',
                    color: '#6ee7b7', padding: '0.1rem 0.35rem',
                    borderRadius: '999px',
                  }}>current</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          textAlign: 'center', padding: '4rem',
          color: 'rgba(255,255,255,0.3)',
        }}>
          Loading syllabus...
        </div>
      ) : error ? (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(252,165,165,0.1)',
          border: '1px solid rgba(252,165,165,0.3)',
          borderRadius: '12px', color: '#fca5a5',
        }}>
          ⚠️ {error}
          <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>
            Your registered branch: <strong>{currentUser?.branch}</strong>.
            Make sure it matches exactly with the database (e.g. "CSE" or "CSE (AIML)").
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem',
          color: 'rgba(255,255,255,0.3)',
          background: 'rgba(15,15,40,0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
          <p>No syllabus found for Semester {activeSem}</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Branch: {currentUser?.branch}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(subject => (
            <SubjectCard key={subject.id} node={subject} onRefresh={fetchTree} />
          ))}
        </div>
      )}

    </DashboardLayout>
  );
}