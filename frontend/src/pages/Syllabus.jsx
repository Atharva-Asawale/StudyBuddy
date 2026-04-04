import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const syllabusData = [
  {
    subject: 'Data Structures & Algorithms',
    icon: '🌳',
    topics: [
      { name: 'Arrays & Strings', subtopics: ['1D Arrays', '2D Arrays', 'String Manipulation', 'Sliding Window'], mastery: 4 },
      { name: 'Linked Lists', subtopics: ['Singly Linked List', 'Doubly Linked List', 'Circular Linked List', 'Floyd\'s Algorithm'], mastery: 3 },
      { name: 'Trees', subtopics: ['Binary Trees', 'BST', 'AVL Trees', 'Segment Trees', 'Trie'], mastery: 2 },
      { name: 'Graphs', subtopics: ['BFS', 'DFS', 'Dijkstra', 'Floyd Warshall', 'Topological Sort'], mastery: 1 },
      { name: 'Dynamic Programming', subtopics: ['Memoization', 'Tabulation', 'LCS', 'Knapsack', 'Matrix Chain'], mastery: 2 },
    ],
  },
  {
    subject: 'Operating Systems',
    icon: '⚙️',
    topics: [
      { name: 'Process Management', subtopics: ['Process States', 'PCB', 'Context Switching', 'Threads'], mastery: 3 },
      { name: 'CPU Scheduling', subtopics: ['FCFS', 'SJF', 'Round Robin', 'Priority Scheduling'], mastery: 2 },
      { name: 'Memory Management', subtopics: ['Paging', 'Segmentation', 'Virtual Memory', 'TLB'], mastery: 2 },
      { name: 'Deadlocks', subtopics: ['Conditions', 'Prevention', 'Avoidance', 'Banker\'s Algorithm'], mastery: 1 },
    ],
  },
  {
    subject: 'Database Management',
    icon: '🗄️',
    topics: [
      { name: 'SQL Fundamentals', subtopics: ['DDL', 'DML', 'DCL', 'TCL'], mastery: 4 },
      { name: 'Joins & Subqueries', subtopics: ['Inner Join', 'Outer Join', 'Self Join', 'Correlated Subquery'], mastery: 3 },
      { name: 'Normalization', subtopics: ['1NF', '2NF', '3NF', 'BCNF', 'Decomposition'], mastery: 2 },
      { name: 'Transactions', subtopics: ['ACID Properties', 'Concurrency Control', 'Locking', 'Isolation Levels'], mastery: 1 },
    ],
  },
  {
    subject: 'Computer Networks',
    icon: '🌐',
    topics: [
      { name: 'Network Layers', subtopics: ['OSI Model', 'TCP/IP Model', 'Layer Functions'], mastery: 4 },
      { name: 'Transport Layer', subtopics: ['TCP', 'UDP', 'Flow Control', 'Congestion Control'], mastery: 3 },
      { name: 'Network Layer', subtopics: ['IP Addressing', 'Subnetting', 'Routing Protocols', 'NAT'], mastery: 2 },
      { name: 'Application Layer', subtopics: ['HTTP', 'DNS', 'SMTP', 'FTP', 'WebSockets'], mastery: 3 },
    ],
  },
];

const masteryConfig = {
  1: { color: '#fca5a5', label: 'Weak',     bg: 'rgba(252,165,165,0.15)' },
  2: { color: '#fde68a', label: 'Fair',     bg: 'rgba(253,230,138,0.15)' },
  3: { color: '#818cf8', label: 'Good',     bg: 'rgba(129,140,248,0.15)' },
  4: { color: '#6ee7b7', label: 'Strong',   bg: 'rgba(110,231,183,0.15)' },
};

function SubtopicList({ subtopics }) {
  return (
    <div style={{
      paddingLeft: '1rem',
      paddingTop: '0.5rem',
      display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
    }}>
      {subtopics.map((s, i) => (
        <span key={i} style={{
          padding: '0.3rem 0.75rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '999px',
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.6)',
        }}>
          {s}
        </span>
      ))}
    </div>
  );
}

function TopicRow({ name, subtopics, mastery }) {
  const [open, setOpen] = useState(false);
  const { color, label, bg } = masteryConfig[mastery];

  return (
    <div style={{
      borderLeft: `2px solid rgba(255,255,255,0.06)`,
      marginLeft: '0.5rem',
      marginBottom: '0.5rem',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.75rem',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>▶</span>
          <span style={{
            fontSize: '0.88rem',
            color: 'rgba(255,255,255,0.75)',
          }}>
            {name}
          </span>
        </div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          background: bg,
          color: color,
          border: `1px solid ${color}40`,
        }}>
          {label}
        </span>
      </div>

      {open && <SubtopicList subtopics={subtopics} />}
    </div>
  );
}

function SubjectCard({ subject, icon, topics }) {
  const [open, setOpen] = useState(false);

  const weakCount = topics.filter(t => t.mastery === 1).length;
  const strongCount = topics.filter(t => t.mastery === 4).length;

  return (
    <div style={{
      background: 'rgba(15, 15, 40, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      marginBottom: '1rem',
      overflow: 'hidden',
    }}>
      {/* Subject Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.5rem',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
            {subject}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {weakCount > 0 && (
            <span style={{
              fontSize: '0.72rem', padding: '0.2rem 0.6rem',
              background: 'rgba(252,165,165,0.15)',
              color: '#fca5a5', borderRadius: '999px',
              border: '1px solid rgba(252,165,165,0.3)',
            }}>
              {weakCount} weak
            </span>
          )}
          {strongCount > 0 && (
            <span style={{
              fontSize: '0.72rem', padding: '0.2rem 0.6rem',
              background: 'rgba(110,231,183,0.15)',
              color: '#6ee7b7', borderRadius: '999px',
              border: '1px solid rgba(110,231,183,0.3)',
            }}>
              {strongCount} strong
            </span>
          )}
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {/* Topics */}
      {open && (
        <div style={{
          padding: '0.5rem 1.25rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {topics.map((t, i) => (
            <TopicRow key={i} {...t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Syllabus() {
  return (
    <DashboardLayout>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{
            fontSize: '1.6rem', fontWeight: 700,
            color: 'white', letterSpacing: '-0.02em',
            marginBottom: '0.35rem',
          }}>
            Syllabus Tree
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
            Expand subjects to view topics and subtopics
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(masteryConfig).map(([level, { color, bg, label }]) => (
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
      </div>

      {/* Syllabus Cards */}
      {syllabusData.map((s, i) => (
        <SubjectCard key={i} {...s} />
      ))}

    </DashboardLayout>
  );
}