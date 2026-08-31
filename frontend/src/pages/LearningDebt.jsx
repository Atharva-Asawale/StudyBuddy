import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/api';
import { Sparkles } from 'lucide-react';
import GameLoader from '../components/GameLoader';
import LearningDebtGraph from '../components/LearningDebtGraph';

export default function LearningDebt() {
  const { cachedDebtHierarchy, cacheDebtHierarchy } = useAuth();
  const [treeData, setTreeData] = useState(() => cachedDebtHierarchy);
  const [loading, setLoading] = useState(!cachedDebtHierarchy);
  const [regenerating, setRegenerating] = useState(false);

  // Guard ref: pre-set if auth cache already has data (no network call needed).
  // Prevents duplicate requests caused by React StrictMode double-mount or
  // the useEffect→useCallback→cache-update→re-render→useEffect cycle.
  const hasFetched = useRef(!!cachedDebtHierarchy);

  // Keep a stable ref to the latest cached value so the stable callback
  // below can read it without becoming a dependency.
  const cachedRef = useRef(cachedDebtHierarchy);
  useEffect(() => {
    cachedRef.current = cachedDebtHierarchy;
  }, [cachedDebtHierarchy]);

  // Stable callback — empty deps array so identity never changes.
  // This breaks the useCallback→useEffect dependency cycle entirely.
  const fetchGraph = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return;
    hasFetched.current = true;

    // Honour the auth-level cache when not forced
    if (cachedRef.current && !force) {
      setTreeData(cachedRef.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await debtService.getHierarchy();
      if (res.data) {
        setTreeData(res.data);
        cacheDebtHierarchy(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch debt hierarchy graph', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally stable — cacheDebtHierarchy is a stable context fn

  // fetchGraph is stable so this fires exactly once per mount
  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    hasFetched.current = false; // allow the next fetchGraph(true) to proceed
    try {
      await debtService.analyzeGraph();
      await fetchGraph(true);
    } catch (err) {
      console.error('Failed to regenerate AI analysis', err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return <GameLoader message="LOADING DEBT HIERARCHY..." subMessage="COMPUTING TOPIC DEBT" />;

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', padding: 0 }}>
        <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
            LEARNING DEBT HIERARCHY
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-pink)', fontSize: '13px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            INTERACTIVE EXPANDABLE SYLLABUS TREE
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary"
            style={{ minWidth: '240px', padding: '12px 24px', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
          >
            <Sparkles size={16} style={{ marginRight: '8px' }} />
            {regenerating ? 'RE-CALCULATING DEBT...' : 'RE-CALCULATE DEBT'}
          </button>
        </div>

        {treeData ? (
          <LearningDebtGraph data={treeData} />
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No syllabus tree data available yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
