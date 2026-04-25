import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { debtService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sparkles, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';

const glassMorphism = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

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
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: '600',
            width: 200,
          }
        });
        nodeSet.add(weakTopic.id);
      }

      let childYOffset = yOffset - 50;

      if (weakTopic.affects) {
        weakTopic.affects.forEach((affect, idx2) => {
          if (!nodeSet.has(affect.id)) {
            initialNodes.push({
              id: affect.id,
              position: { x: 400, y: childYOffset },
              data: { label: affect.name, ...affect, isAffected: true },
              style: {
                background: affect.source === 'ai' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: affect.source === 'ai' ? '#fcd34d' : '#93c5fd',
                border: affect.source === 'ai' ? '2px solid #f59e0b' : '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '12px',
                fontWeight: '600',
                width: 200,
              }
            });
            nodeSet.add(affect.id);
          }

          initialEdges.push({
            id: `e-${weakTopic.id}-${affect.id}`,
            source: weakTopic.id,
            target: affect.id,
            animated: true,
            label: affect.source === 'ai' ? 'AI Identified' : 'Rules Base',
            style: { stroke: affect.source === 'ai' ? '#f59e0b' : '#3b82f6', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: affect.source === 'ai' ? '#f59e0b' : '#3b82f6',
            },
          });
          
          childYOffset += 80;
        });
      }
      yOffset += Math.max((weakTopic.affects ? weakTopic.affects.length * 80 : 80), 100);
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [cachedDebtData, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeData(node.data);
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2 style={{
            fontSize: '1.8rem', fontWeight: 700,
            color: 'white', letterSpacing: '-0.02em',
            marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={26} color="#fca5a5" /> Learning Debt Graph
          </h2>
          <p style={{ color: '#000000', fontSize: '0.95rem', fontWeight: 600 }}>
            Map your weak areas to syllabus concepts they impact
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <button
          onClick={handleRegenerate}
          disabled={loading || regenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'linear-gradient(90deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
            color: '#fcd34d',
            fontWeight: 600,
            cursor: loading || regenerating ? 'not-allowed' : 'pointer',
            opacity: loading || regenerating ? 0.6 : 1,
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={18} />
          {regenerating ? 'Analyzing with AI...' : 'AI Analysis'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedNodeData ? '1fr 340px' : '1fr', gap: '1.25rem', height: 'calc(100vh - 180px)' }}>
        
        {/* Graph Area */}
        <div style={{ ...glassMorphism, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#000000', fontWeight: 600 }}>Loading your graph...</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              colorMode="dark"
            >
              <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
              <Controls style={{ background: 'rgba(15,15,40,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </ReactFlow>
          )}
        </div>

        {/* Side Panel */}
        {selectedNodeData && (
          <div style={{
            ...glassMorphism,
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease-out forwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: selectedNodeData.isWeak ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: selectedNodeData.isWeak ? '#fca5a5' : '#93c5fd',
                border: selectedNodeData.isWeak ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                {selectedNodeData.isWeak ? 'Weak Domain' : 'Affected Topic'}
              </div>
              <button onClick={() => setSelectedNodeData(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.2rem' }}>
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {selectedNodeData.label}
            </h3>

            {selectedNodeData.isWeak && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Score</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fca5a5' }}>
                    {selectedNodeData.score}%
                  </span>
                </div>
              </div>
            )}

            {selectedNodeData.isAffected && selectedNodeData.reason && (
               <div style={{
                 padding: '1rem', background: 'rgba(255,255,255,0.03)',
                 borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
                 marginBottom: '1.5rem'
               }}>
                 <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                   Why this depends
                 </span>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
                   {selectedNodeData.reason}
                 </p>
               </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button
                onClick={() => navigate(`/quiz/${selectedNodeData.id}/${encodeURIComponent(selectedNodeData.label)}`)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#6366f1',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
              >
                <BookOpen size={18} />
                Take Master Quiz
              </button>
            </div>
            <style>{`
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
