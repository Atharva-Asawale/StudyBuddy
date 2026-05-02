import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { debtService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import GameLoader from '../components/GameLoader';

export default function LearningDebt() {
  const { cachedDebtData, cacheDebtData } = useAuth();
  const [loading, setLoading] = useState(!cachedDebtData);
  const [regenerating, setRegenerating] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  
  const navigate = useNavigate();

  const fetchGraph = useCallback(async () => {
    if (cachedDebtData) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await debtService.getGraph();
      if (res.data) {
        cacheDebtData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch debt graph', err);
    } finally {
      setLoading(false);
    }
  }, [cachedDebtData, cacheDebtData]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await debtService.analyzeGraph();
      cacheDebtData(res.data);
    } catch (err) {
      console.error('Failed to regenerate AI analysis', err);
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!cachedDebtData || !cachedDebtData.weakTopics) return;

    const initialNodes = [];
    const initialEdges = [];
    const nodeSet = new Set();
    let yOffset = 50;

    cachedDebtData.weakTopics.forEach((weakTopic, idx) => {
      if (!nodeSet.has(weakTopic.id)) {
        initialNodes.push({
          id: weakTopic.id,
          position: { x: 50, y: yOffset },
          data: { label: weakTopic.name, ...weakTopic, isWeak: true },
          style: {
            background: 'rgba(255, 23, 68, 0.1)',
            color: 'var(--neon-red)',
            border: '2px solid var(--neon-red)',
            borderRadius: '4px',
            padding: '12px',
            fontWeight: '900',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            width: 280,
            boxShadow: '0 0 20px rgba(255, 23, 68, 0.3)'
          }
        });
        nodeSet.add(weakTopic.id);
      }

      let childYOffset = yOffset - 50;

      if (weakTopic.affects) {
        weakTopic.affects.forEach((affect, idx2) => {
          if (!nodeSet.has(affect.id)) {
            const isAI = affect.source === 'ai';
            initialNodes.push({
              id: affect.id,
              position: { x: 450, y: childYOffset },
              data: { label: affect.name, ...affect, isAffected: true },
              style: {
                background: isAI ? 'rgba(255, 171, 0, 0.1)' : 'rgba(0, 240, 255, 0.1)',
                color: isAI ? 'var(--neon-gold)' : 'var(--neon-cyan)',
                border: `2px solid ${isAI ? 'var(--neon-gold)' : 'var(--neon-cyan)'}`,
                borderRadius: '4px',
                padding: '12px',
                fontWeight: '900',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                width: 280,
                boxShadow: isAI ? '0 0 20px rgba(255, 171, 0, 0.3)' : '0 0 20px rgba(0, 240, 255, 0.3)'
              }
            });
            nodeSet.add(affect.id);
          }

          initialEdges.push({
            id: `e-${weakTopic.id}-${affect.id}`,
            source: weakTopic.id,
            target: affect.id,
            animated: true,
            label: affect.source === 'ai' ? 'AI ANALYSIS' : 'SYSTEM RULE',
            labelStyle: { fill: 'var(--text-muted)', fontSize: 8, fontWeight: 800, fontFamily: 'var(--font-mono)' },
            style: { stroke: affect.source === 'ai' ? 'var(--neon-gold)' : 'var(--neon-cyan)', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: affect.source === 'ai' ? 'var(--neon-gold)' : 'var(--neon-cyan)',
            },
          });
          
          childYOffset += 100;
        });
      }
      yOffset += Math.max((weakTopic.affects ? weakTopic.affects.length * 100 : 100), 120);
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [cachedDebtData, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeData(node.data);
  }, []);

  if (loading) return <GameLoader message="LOADING DEBT MAP..." subMessage="ANALYZING TOPICS" />;

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ minHeight: '1200px', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', padding: 0 }}>
        <header style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>LEARNING DEBT MAP</h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-red)', fontSize: '14px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            TOPIC DEPENDENCY REPORT
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary"
            style={{ minWidth: '240px', padding: '12px 24px', borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}
          >
            <Sparkles size={16} style={{ marginRight: '8px' }} />
            {regenerating ? 'RE-CALCULATING...' : 'RUN AI ANALYSIS'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedNodeData ? '1fr 300px' : '1fr', gap: '1rem', minHeight: 0 }}>
          
          {/* Graph Area */}
          <div className="glass-panel" style={{ flex: 1, minHeight: '1000px', overflow: 'hidden', position: 'relative', padding: 0, background: '#02020a', border: '2px solid rgba(255,255,255,0.1)' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              colorMode="dark"
            >
              <Background color="var(--neon-cyan)" gap={20} size={1} opacity={0.05} />
              <Controls style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
            </ReactFlow>
          </div>

          {/* Side Panel */}
          {selectedNodeData && (
            <div className="glass-panel card-animate" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{
                  padding: '4px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: 800,
                  background: selectedNodeData.isWeak ? 'rgba(255,23,68,0.1)' : 'rgba(0,240,255,0.1)',
                  color: selectedNodeData.isWeak ? 'var(--neon-red)' : 'var(--neon-cyan)',
                  border: `1px solid ${selectedNodeData.isWeak ? 'var(--neon-red)' : 'var(--neon-cyan)'}`,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {selectedNodeData.isWeak ? 'WEAK TOPIC' : 'AFFECTED TOPIC'}
                </div>
                <button onClick={() => setSelectedNodeData(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                  ✕
                </button>
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                {selectedNodeData.label.toUpperCase()}
              </h3>

              {selectedNodeData.isWeak && (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,23,68,0.05)', borderRadius: '4px', borderLeft: '3px solid var(--neon-red)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>SCORE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neon-red)', fontFamily: 'var(--font-mono)' }}>
                    {selectedNodeData.score}%
                  </div>
                </div>
              )}

              {selectedNodeData.isAffected && selectedNodeData.reason && (
                 <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                   <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                     DEPENDENCY REASON
                   </div>
                   <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                     {selectedNodeData.reason}
                   </p>
                 </div>
              )}

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => navigate(`/quiz/${selectedNodeData.id}/${encodeURIComponent(selectedNodeData.label)}`)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '1rem' }}
                >
                  <BookOpen size={16} style={{ marginRight: '8px' }} />
                  START QUIZ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
