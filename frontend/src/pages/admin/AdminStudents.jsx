import { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentDetailDrawer from './StudentDetailDrawer';

export default function AdminStudents() {
  const [searchParams] = useSearchParams();
  const { cachedAdminStudents, cacheAdminStudents } = useAuth();
  const [students, setStudents] = useState(cachedAdminStudents || []);
  const [loading, setLoading] = useState(!cachedAdminStudents);
  const [error, setError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selection
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get('selected'));

  useEffect(() => {
    if (students.length === 0 || sortBy !== 'createdAt') {
      fetchStudents();
    }
  }, [sortBy]);

  const fetchStudents = async () => {
    if (students.length === 0) setLoading(true);
    try {
      const res = await adminService.getStudents({ sortBy });
      setStudents(res.data);
      cacheAdminStudents(res.data);
      setError(null);
    } catch (err) {
      if (students.length === 0) setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Local filtering and searching
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branch === 'All' || s.branch === branch;
    return matchesSearch && matchesBranch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchReset = () => {
    setSearch('');
    setBranch('All');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            Students
            <span style={{ fontSize: '0.9rem', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'record' : 'records'}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{
                background: '#000000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '10px 12px 10px 40px',
                color: 'white',
                width: '300px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#818cf8'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
          </div>

          {/* Branch Filter */}
          <select 
            value={branch}
            onChange={(e) => { setBranch(e.target.value); setCurrentPage(1); }}
            style={{
              background: '#000000',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '0 12px',
              color: 'white',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="All">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="AIML">AIML</option>
          </select>

          {/* Sort Dropdown */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: '#000000',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '0 12px',
              color: 'white',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="cgpa">Highest CGPA</option>
            <option value="quizzes">Most Quizzes</option>
            <option value="weakTopics">Most Weak Topics</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ 
        background: 'rgba(5, 5, 20, 0.6)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '16px', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>No students found matching your search.</p>
            <button 
              onClick={handleSearchReset}
              style={{ background: '#818cf8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>#</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Student Info</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Branch</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Sem</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>CGPA</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Quizzes</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Avg Score</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Weak</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Joined</th>
                    <th style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((s, idx) => (
                    <tr 
                      key={s.userId} 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{s.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{s.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{s.branch}</td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{s.currentSemester}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '0.9rem', fontWeight: '700',
                          color: s.latestCgpa >= 8 ? '#22c55e' : s.latestCgpa >= 6 ? '#eab308' : s.latestCgpa > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)'
                        }}>
                          {s.latestCgpa ? s.latestCgpa.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{s.totalQuizzes}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, width: '40px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${s.averageScore}%`, background: s.averageScore >= 75 ? '#22c55e' : s.averageScore >= 50 ? '#eab308' : '#ef4444', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{Math.round(s.averageScore)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ 
                          padding: '2px 8px', borderRadius: '4px', 
                          background: s.weakTopics > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: s.weakTopics > 0 ? '#ef4444' : '#22c55e',
                          fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block'
                        }}>
                          {s.weakTopics}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{s.createdAt}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedUserId(s.userId)}
                          style={{
                            background: 'rgba(129, 140, 248, 0.1)',
                            border: '1px solid rgba(129, 140, 248, 0.2)',
                            color: '#818cf8',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.2)'; e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.4)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.1)'; e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.2)'; }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ 
              padding: '1rem 1.5rem', 
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                        background: currentPage === page ? '#818cf8' : 'transparent',
                        color: currentPage === page ? 'white' : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <StudentDetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />

    </div>
  );
}
