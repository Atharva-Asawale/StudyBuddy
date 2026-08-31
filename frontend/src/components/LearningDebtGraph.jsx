import { useState, useMemo, useRef, useEffect } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { BookOpen, Sparkles, Plus, Minus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LearningDebtGraph({ data }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Expanded node IDs state (starts with root expanded)
  const [expandedIds, setExpandedIds] = useState(() => new Set(['root']));
  const [selectedNode, setSelectedNode] = useState(null);

  // Pan and Zoom state
  const [transform, setTransform] = useState({ x: 450, y: 150, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter hierarchy based on expanded state
  const filteredData = useMemo(() => {
    if (!data) return null;

    const cloneNode = (node) => {
      const isExpanded = expandedIds.has(node.id);
      const cloned = { ...node };

      if (isExpanded && node.children && node.children.length > 0) {
        cloned.children = node.children.map(cloneNode);
      } else {
        cloned.children = [];
      }
      return cloned;
    };

    return cloneNode(data);
  }, [data, expandedIds]);

  // Compute layout using d3-hierarchy
  const { nodes, links } = useMemo(() => {
    if (!filteredData) return { nodes: [], links: [] };

    const rootNode = hierarchy(filteredData);
    // Increase node sizes and horizontal spacing to prevent overlaps
    const layout = tree()
      .nodeSize([240, 160])
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3));

    layout(rootNode);

    const nodesList = rootNode.descendants();
    const linksList = rootNode.links();

    return { nodes: nodesList, links: linksList };
  }, [filteredData]);

  // Toggle node expansion
  const toggleNode = (nodeData, e) => {
    if (e) e.stopPropagation();

    // Check if node has children in original tree
    const rawChildren = findOriginalChildren(data, nodeData.id);
    if (!rawChildren || rawChildren.length === 0) {
      setSelectedNode(nodeData);
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeData.id)) {
        next.delete(nodeData.id);
      } else {
        next.add(nodeData.id);
      }
      return next;
    });

    setSelectedNode(nodeData);
  };

  const findOriginalChildren = (root, id) => {
    if (!root) return null;
    if (root.id === id) return root.children;
    if (root.children) {
      for (const c of root.children) {
        const found = findOriginalChildren(c, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => {
      const newK = Math.max(0.4, Math.min(2.5, prev.k * zoomFactor));
      return { ...prev, k: newK };
    });
  };

  // Color helper based on debtScore
  const getNodeColor = (debtScore, type) => {
    if (type === 'ROOT') return 'var(--neon-pink)';
    if (debtScore >= 0.4) return 'var(--neon-red)';
    if (debtScore >= 0.2) return 'var(--neon-cyan)';
    return 'var(--neon-green, #00e676)';
  };

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedNode ? '1fr 320px' : '1fr', gap: '1rem', minHeight: 0 }}>
      {/* SVG Viewport */}
      <div
        ref={containerRef}
        className="glass-panel"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          minHeight: '750px',
          overflow: 'hidden',
          position: 'relative',
          padding: 0,
          background: '#02020a',
          border: '2px solid rgba(255,255,255,0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Controls Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            background: 'rgba(5, 5, 12, 0.8)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={() => setTransform((prev) => ({ ...prev, k: Math.min(2.5, prev.k + 0.2) }))}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            +
          </button>
          <button
            onClick={() => setTransform((prev) => ({ ...prev, k: Math.max(0.4, prev.k - 0.2) }))}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            -
          </button>
          <button
            onClick={() => setTransform({ x: 450, y: 150, k: 1 })}
            style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          >
            RESET
          </button>
        </div>

        {/* Graph Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '16px',
            background: 'rgba(5, 5, 12, 0.8)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-red)', boxShadow: '0 0 8px var(--neon-red)' }}></span>
            HIGH DEBT (&gt;0.4)
          </span>
          <span style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }}></span>
            MEDIUM DEBT (0.2-0.4)
          </span>
          <span style={{ color: 'var(--neon-green, #00e676)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green, #00e676)', boxShadow: '0 0 8px var(--neon-green, #00e676)' }}></span>
            LOW DEBT (&lt;0.2)
          </span>
        </div>

        {/* SVG Drawing Canvas */}
        <svg style={{ width: '100%', height: '100%', minHeight: '750px' }}>
          <defs>
            <linearGradient id="rootGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--neon-pink)" />
              <stop offset="100%" stopColor="var(--neon-cyan)" />
            </linearGradient>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Draw Links */}
            {links.map((link, idx) => {
              const sourceIsRoot = link.source.data.type === 'ROOT';
              const targetIsRoot = link.target.data.type === 'ROOT';
              const sourceH = sourceIsRoot ? 74 : 64;
              const targetH = targetIsRoot ? 74 : 64;

              const startX = link.source.x;
              const startY = link.source.y + sourceH / 2;
              const endX = link.target.x;
              const endY = link.target.y - targetH / 2;

              const pathD = `M ${startX} ${startY}
                             C ${startX} ${(startY + endY) / 2},
                               ${endX} ${(startY + endY) / 2},
                               ${endX} ${endY}`;

              const strokeColor = getNodeColor(link.target.data.debtScore, link.target.data.type);

              return (
                <path
                  key={`link-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeOpacity="0.6"
                  style={{ transition: 'all 0.3s ease-in-out' }}
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const d = node.data;
              const isRoot = d.type === 'ROOT';
              const rawChildren = findOriginalChildren(data, d.id);
              const hasChildren = rawChildren && rawChildren.length > 0;
              const isExpanded = expandedIds.has(d.id);
              const color = getNodeColor(d.debtScore, d.type);

              const w = isRoot ? 220 : 180;
              const h = isRoot ? 74 : 64;

              return (
                <g
                  key={d.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => toggleNode(d, e)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease-in-out' }}
                >
                  <foreignObject
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    style={{ overflow: 'visible' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${color}`,
                        boxShadow: isRoot 
                          ? '0 0 25px var(--neon-pink), inset 0 0 10px rgba(255, 45, 120, 0.2)' 
                          : `0 0 15px ${color}50`,
                        background: isRoot 
                          ? 'linear-gradient(135deg, rgba(255, 45, 120, 0.25) 0%, rgba(0, 240, 255, 0.2) 100%)' 
                          : 'rgba(5, 5, 15, 0.95)',
                        backdropFilter: 'blur(8px)',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Node Name */}
                      <div
                        style={{
                          fontSize: isRoot ? '13px' : '11px',
                          fontWeight: isRoot ? '900' : '700',
                          color: '#ffffff',
                          width: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: isRoot ? 'var(--font-display)' : 'var(--font-ui)',
                          letterSpacing: isRoot ? '0.05em' : 'normal',
                          textTransform: 'uppercase',
                        }}
                      >
                        {d.name}
                      </div>

                      {/* Score Meta Label */}
                      {!isRoot && d.debtScore !== undefined && (
                        <div
                          style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-mono)',
                            color: color,
                            marginTop: '4px',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {d.type}: {(d.debtScore * 100).toFixed(0)}% DEBT
                        </div>
                      )}

                      {/* Expand / Collapse Indicator Indicator */}
                      {hasChildren && !isRoot && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'rgba(5, 5, 15, 0.95)',
                            border: `1.5px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: color,
                            boxShadow: `0 0 8px ${color}`,
                          }}
                        >
                          {isExpanded ? '-' : '+'}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>


      {/* Side Panel for Selected Node */}
      {selectedNode && (
        <div className="glass-panel card-animate" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'rgba(5, 5, 12, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 800,
                background: 'rgba(255,255,255,0.05)',
                color: getNodeColor(selectedNode.debtScore, selectedNode.type),
                border: `1px solid ${getNodeColor(selectedNode.debtScore, selectedNode.type)}`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {selectedNode.type}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            {selectedNode.name}
          </h3>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: `3px solid ${getNodeColor(selectedNode.debtScore, selectedNode.type)}` }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
              DEBT SCORE
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: getNodeColor(selectedNode.debtScore, selectedNode.type), fontFamily: 'var(--font-mono)' }}>
              {selectedNode.debtScore !== undefined ? `${(selectedNode.debtScore * 100).toFixed(0)}%` : 'N/A'}
            </div>
          </div>

          {selectedNode.masteryLevel && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                MASTERY LEVEL
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.masteryLevel}
              </div>
            </div>
          )}

          {selectedNode.type === 'TOPIC' && (
            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => {
                  const rawId = selectedNode.id.replace('topic-', '');
                  navigate(`/quiz/${rawId}/${encodeURIComponent(selectedNode.name)}`);
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '0.8rem' }}
              >
                <BookOpen size={16} style={{ marginRight: '8px' }} />
                PRACTICE QUIZ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
