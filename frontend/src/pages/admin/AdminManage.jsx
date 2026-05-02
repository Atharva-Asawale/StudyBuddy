import { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, User, ShieldAlert, Loader2, ArrowDown } from 'lucide-react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { customAlert, customConfirm } from '../../utils/alert';

export default function AdminManage() {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    Promise.all([fetchAdmins(), fetchStudents()]).finally(() => setLoading(false));
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminService.getStudents();
      setAllStudents(res.data);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await adminService.getAdmins();
      setAdmins(res.data);
    } catch (err) {
      setError('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.addAdmin(formData);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      await customAlert(err.response?.data?.message || 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const currentUserId = currentUser?.userId || currentUser?.id;
    if (admin.id === currentUserId) {
      await customAlert("Self-Preservation Protocol: You cannot delete your own administrative account. You're too important to the mission!");
      return;
    }
    const confirmed = await customConfirm(`Are you sure you want to delete ${admin.name}? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await adminService.deleteAdmin(admin.id);
      fetchAdmins();
    } catch (err) {
      await customAlert(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleDeleteStudent = async (student) => {
    const msg = `CRITICAL ACTION REQUIRED: You are about to permanently DELETE the student account for "${student.name}" (${student.email}).\n\nThis will ERASE all their quiz results, study progress, and profiles. This action is IRREVERSIBLE.\n\nProceed with deletion?`;
    const confirmed = await customConfirm(msg);
    
    if (!confirmed) {
      await customAlert("Operation cancelled. The student record remains safe.");
      return;
    }

    try {
      await adminService.deleteStudent(student.userId);
      await customAlert(`Account for ${student.name} has been successfully purged from the system.`);
      fetchStudents();
    } catch (err) {
      await customAlert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Admin Management</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '4px 0 0', fontSize: '1rem', fontWeight: 'bold' }}>Manage platform administrators and permissions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* ADD ADMIN FORM */}
        <div className="glass-panel" style={{ background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '8px', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', borderRadius: '8px' }}>
              <UserPlus size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Add New Admin</h3>
          </div>

          <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="glass-input"
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '10px', 
                    color: 'white', 
                    outline: 'none' 
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input 
                  type="email" 
                  required
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="glass-input"
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '10px', 
                    color: 'white', 
                    outline: 'none' 
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="glass-input"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '10px', 
                  color: 'white', 
                  outline: 'none' 
                }}
                onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{
                marginTop: '0.5rem',
                padding: '12px',
                borderRadius: '10px',
                background: '#818cf8',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#6366f1'}
              onMouseOut={(e) => e.currentTarget.style.background = '#818cf8'}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Create Admin Account'}
            </button>
          </form>
        </div>

        {/* ADMIN LIST */}
        <div className="glass-panel" style={{ background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Active Administrators</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {admins.map((admin) => (
              <div 
                key={admin.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: admin.role === 'SUPER_ADMIN' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #818cf8, #c084fc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {admin.name.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                      {admin.name} {admin.id === currentUser?.id && <span style={{ color: '#818cf8', fontSize: '0.75rem', marginLeft: '4px' }}>(You)</span>}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>{admin.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: admin.role === 'SUPER_ADMIN' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(129, 140, 248, 0.1)',
                    color: admin.role === 'SUPER_ADMIN' ? '#f59e0b' : '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${admin.role === 'SUPER_ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(129, 140, 248, 0.2)'}`
                  }}>
                    {admin.role}
                  </span>
                  
                  {admin.role !== 'SUPER_ADMIN' && (
                    <button 
                      onClick={() => handleDeleteAdmin(admin)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: 'rgba(239, 68, 68, 0.5)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.5)'; }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {admin.id === currentUser?.id && admin.role !== 'SUPER_ADMIN' && (
                    <button 
                      onClick={() => handleDeleteAdmin(admin)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: 'rgba(129, 140, 248, 0.5)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <User size={18} />
                    </button>
                  )}
                  {admin.role === 'SUPER_ADMIN' && (
                    <div style={{ padding: '8px', color: 'rgba(255, 255, 255, 0.15)' }}>
                      <ShieldAlert size={18} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-1rem' }}>
        <button 
          onClick={() => {
            const scrollArea = document.querySelector('.landing-scroll-area');
            if (scrollArea) {
              scrollArea.scrollTo({
                top: scrollArea.scrollHeight,
                behavior: 'smooth'
              });
            }
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--card-bg)',
            border: '2px solid var(--neon-cyan)',
            color: 'var(--neon-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: 'var(--glow-cyan)',
            transition: 'all 0.3s ease',
            animation: 'bounce 2s infinite'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--neon-cyan)';
            e.currentTarget.style.color = 'var(--bg-base)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--card-bg)';
            e.currentTarget.style.color = 'var(--neon-cyan)';
          }}
        >
          <ArrowDown size={20} />
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="glass-panel" style={{ marginTop: '1rem', background: '#3f0f0f', border: '1px solid #ef4444', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.2rem', margin: 0, fontWeight: '800', letterSpacing: '0.2em', fontFamily: 'var(--font-mono)' }}>Danger zone !</h2>
          <div style={{ height: '1px', background: 'rgba(239, 68, 68, 0.2)', flex: 1 }}></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'white' }}>Purge Student Records</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Permanently remove student data from the platform</p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search student by name or email..." 
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: 'white', 
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
            {studentSearch.length >= 2 ? (
              allStudents
                .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
                .map(student => (
                  <div key={student.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{student.email} • {student.branch}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteStudent(student)}
                      style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      DELETE ACCOUNT
                    </button>
                  </div>
                ))
            ) : studentSearch.length > 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Type at least 2 characters to search...</p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Search for a student to initiate deletion...</p>
            )}
          </div>
        </div>
    </div>
  );
}
