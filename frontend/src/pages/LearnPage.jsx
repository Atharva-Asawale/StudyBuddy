import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { resourceService, syllabusService } from '../services/api';
import GameLoader from '../components/GameLoader';
import { 
  Sparkles, 
  Video, 
  Globe,
  FileText, 
  ExternalLink, 
  RotateCcw, 
  ArrowLeft,
  ChevronRight,
  Compass,
  Play
} from 'lucide-react';

export default function LearnPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Build a stable cache key.
  // IMPORTANT: wait until currentUser is resolved – never use 'undefined' as userKey.
  const userKey = currentUser?.id || currentUser?.email || null;
  const cacheKey = (chapterId && userKey) ? `learning_resources_${userKey}_${chapterId}` : null;

  // ── helpers ──────────────────────────────────────────────────────────────
  const readCache = (key) => {
    if (!key) return null;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.topicName &&
          (Array.isArray(parsed.videos) || Array.isArray(parsed.webResources) || Array.isArray(parsed.pdfs))) {
        return parsed;
      }
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('[LearnPage] Cache parse error:', e);
      sessionStorage.removeItem(key);
    }
    return null;
  };

  // ── state ─────────────────────────────────────────────────────────────────
  const [resourcesData, setResourcesData] = useState(() => readCache(cacheKey));
  const [loadingResources, setLoadingResources] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Landing page syllabus state
  const [syllabusTree, setSyllabusTree] = useState(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(!chapterId);

  // Prevent double-fetch in StrictMode / concurrent re-renders
  const fetchingRef = useRef(false);

  // ── fetch resources ───────────────────────────────────────────────────────
  const fetchResources = useCallback(async (force = false) => {
    if (!chapterId || !cacheKey) return;

    // If not forced, check sessionStorage first (survives route changes)
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) {
        setResourcesData(cached);
        setLoadingResources(false);
        return;
      }
    }

    if (fetchingRef.current) return;   // already in-flight
    fetchingRef.current = true;

    if (force) setRefreshing(true);
    else setLoadingResources(true);
    setError(null);

    try {
      const res = await resourceService.getChapterResources(chapterId);
      if (res.data) {
        setResourcesData(res.data);
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('[LearnPage] Failed to fetch resources:', err);
      setError('Failed to retrieve learning resources. Please try refreshing.');
    } finally {
      setLoadingResources(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [chapterId, cacheKey]); // NO resourcesData here – avoids stale closure loop

  // ── fetch syllabus (landing page) ─────────────────────────────────────────
  const fetchSyllabus = useCallback(async () => {
    if (chapterId) return;
    setLoadingSyllabus(true);
    try {
      const res = await syllabusService.getTree();
      if (res.data) setSyllabusTree(res.data);
    } catch (err) {
      console.error('[LearnPage] Syllabus fetch error:', err);
      setError('Failed to load syllabus chapters. Please refresh.');
    } finally {
      setLoadingSyllabus(false);
    }
  }, [chapterId]);

  // ── effect: triggered by chapterId / cacheKey changes only ───────────────
  useEffect(() => {
    if (!chapterId) {
      fetchSyllabus();
      return;
    }

    // Wait until userKey is resolved (auth hydration)
    if (!cacheKey) return;

    // Always try sessionStorage first – it survives unmount/remount
    const cached = readCache(cacheKey);
    if (cached) {
      setResourcesData(cached);
      setLoadingResources(false);
    } else {
      setLoadingResources(true);
      fetchResources(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, cacheKey]); // intentionally omit fetchResources/fetchSyllabus to avoid loops

  // ── regenerate handler ────────────────────────────────────────────────────
  const handleRefresh = () => {
    if (cacheKey) {
      sessionStorage.removeItem(cacheKey);
      setResourcesData(null);
      fetchResources(true);
    }
  };


  const getStatusColor = (status, score) => {
    if (status === 'WEAK' || (score !== null && score !== undefined && score < 60)) return 'var(--neon-red, #ff0055)';
    if (status === 'AT_RISK' || (score !== null && score !== undefined && score < 80)) return 'var(--neon-cyan, #00f0ff)';
    return 'var(--neon-green, #00e676)';
  };

  // =========================================================================
  // CASE A: Landing Page Layout (No chapterId selected)
  // =========================================================================
  if (!chapterId) {
    if (loadingSyllabus) {
      return <GameLoader message="LOADING LEARNING HUB..." subMessage="RETRIEVING SYLLABUS CHAPTERS" />;
    }

    return (
      <DashboardLayout>
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', gap: '2rem', paddingBottom: '3rem' }}>
          
          {/* Header */}
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', borderRadius: '16px', borderTop: '3px solid var(--neon-pink)', background: 'linear-gradient(135deg, rgba(20, 10, 35, 0.75) 0%, rgba(5, 5, 15, 0.95) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Compass size={24} color="var(--neon-pink)" className="animate-pulse" />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--neon-pink)', letterSpacing: '0.2em', fontWeight: 800 }}>
                PERSONALIZED LEARNING HUB
              </div>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase' }}>
              RECOMMENDED CHAPTER RESOURCES
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '650px' }}>
              Access video tutorials, verified web study resources, and academic PDFs customized specifically for your active courses. Select a chapter below to load resources tailored to your current mastery.
            </p>
          </div>

          {error && (
            <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--neon-red)', color: 'var(--neon-red)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Chapter Selector Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {syllabusTree && syllabusTree.length > 0 ? (
              syllabusTree.map((subject, sIdx) => {
                // Get UNITs (Chapters) under this Subject
                const chapters = subject.children || [];
                if (chapters.length === 0) return null;

                return (
                  <div key={subject.id || sIdx} className="glass-panel" style={{ padding: '1.5rem 2rem 2rem', borderRadius: '12px', borderLeft: '4px solid var(--neon-purple)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1.25rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📘</span> {subject.name}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          onClick={() => navigate(`/learn/${chapter.id}`)}
                          className="glass-panel card-animate"
                          style={{
                            padding: '1.25rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            background: 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.border = '1px solid var(--neon-pink)';
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.04)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <span style={{ fontSize: '16px' }}>📂</span>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {chapter.name}
                              </h3>
                              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                {(chapter.children || []).length} Topics
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} color="var(--neon-pink)" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No syllabus chapters registered for your branch/semester yet.</p>
                <button onClick={() => navigate('/syllabus')} className="btn-primary" style={{ marginTop: '1rem' }}>
                  GO TO SYLLABUS
                </button>
              </div>
            )}
          </div>

        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // CASE B: Chapter Specific Page Layout
  // =========================================================================
  if (loadingResources) {
    return (
      <GameLoader 
        message="CURATING PERSONALIZED RESOURCES..." 
        subMessage="SEARCHING YOUTUBE &amp; TINYFISH ENGINES" 
      />
    );
  }

  const topicName = resourcesData?.topicName || 'Chapter Resources';
  const score = resourcesData?.score;
  const status = resourcesData?.status || 'AT_RISK';
  const statusColor = getStatusColor(status, score);
  const videos = resourcesData?.videos || [];
  const webResources = resourcesData?.webResources || [];
  const pdfs = resourcesData?.pdfs || [];

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', gap: '1.75rem', paddingBottom: '3rem' }}>
        
        {/* Navigation & Actions Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/learn')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--neon-cyan)', color: 'var(--bg-base)', boxShadow: 'var(--glow-cyan)' }}
          >
            <ArrowLeft size={14} />
            CHOOSE ANOTHER CHAPTER
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '11px', background: 'var(--neon-pink)', color: '#ffffff', boxShadow: 'var(--glow-pink)' }}
            >
              <RotateCcw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'RE-CURATING...' : '✨ RE-GENERATE RESOURCES'}
            </button>
          </div>
        </div>

        {/* Topic Header & Mastery Banner */}
        <div 
          className="glass-panel card-animate" 
          style={{ 
            padding: '2rem', 
            borderRadius: '16px',
            borderLeft: `5px solid ${statusColor}`,
            background: 'linear-gradient(135deg, rgba(25, 25, 40, 0.85) 0%, rgba(10, 10, 25, 0.95) 100%)',
            boxShadow: `0 0 25px ${statusColor}30`,
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', fontWeight: 800, marginBottom: '6px', textShadow: 'var(--glow-cyan)' }}>
                LEARNING HUB • {resourcesData?.subject ? resourcesData.subject.toUpperCase() : 'CHAPTER'} {resourcesData?.semester ? `(SEM ${resourcesData.semester})` : ''}
              </div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {topicName}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.06)', padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#e2e8f0', textTransform: 'uppercase' }}>
                  CHAPTER MASTERY
                </div>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: statusColor }}>
                  {score !== null && score !== undefined ? `${score}%` : 'N/A'}
                </div>
              </div>
              <div 
                style={{ 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '10px', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 800, 
                  background: `${statusColor}25`, 
                  color: '#ffffff', 
                  border: `1px solid ${statusColor}` 
                }}
              >
                {status}
              </div>
            </div>
          </div>

          {/* AI Mentor Personalized Insight Banner */}
          {resourcesData?.overallInsight && (
            <div 
              style={{ 
                marginTop: '1.25rem', 
                padding: '1.25rem', 
                borderRadius: '10px', 
                background: 'rgba(0, 240, 255, 0.08)', 
                border: '1px solid rgba(0, 240, 255, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <Sparkles size={20} style={{ color: 'var(--neon-cyan)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.05em' }}>
                  ✨ PERSONALIZED MENTOR GUIDANCE
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#ffffff', lineHeight: 1.5, fontWeight: '500' }}>
                  {resourcesData.overallInsight}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--neon-red)', color: '#ffffff', background: 'rgba(255,23,68,0.2)', textAlign: 'center', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {/* SECTION 1: VIDEO LESSONS (YouTube) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 45, 120, 0.15)', border: '1px solid var(--neon-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-pink)' }}>
              <Video size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
                VIDEO LESSONS
              </h2>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e0' }}>
                Curated educational video lectures from YouTube
              </span>
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
              No video tutorials found for this chapter.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {videos.map((vid, idx) => (
                <div 
                  key={vid.id || idx}
                  className="glass-panel card-animate"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'var(--card-bg)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 45, 120, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '170px', background: '#000', overflow: 'hidden' }}>
                    {vid.thumbnailUrl ? (
                      <img 
                        src={vid.thumbnailUrl} 
                        alt={vid.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 45, 120, 0.1)' }}>
                        <Video size={40} color="var(--neon-pink)" />
                      </div>
                    )}
                    <a 
                      href={vid.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.35)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 45, 120, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px var(--neon-pink)' }}>
                        <Play size={20} fill="#fff" style={{ marginLeft: '3px' }} />
                      </div>
                    </a>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--neon-pink)', fontWeight: 800, marginBottom: '6px' }}>
                      {vid.channel || 'YouTube'}
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.4 }}>
                      {vid.title}
                    </h3>
                    
                    {vid.reason && (
                      <div style={{ marginTop: 'auto', marginBottom: '1rem', padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--neon-pink)', fontSize: '11px', color: '#cbd5e0', lineHeight: 1.4 }}>
                        {vid.reason}
                      </div>
                    )}

                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '11px', textDecoration: 'none', background: 'var(--neon-pink)', color: '#ffffff', fontWeight: 'bold' }}
                    >
                      WATCH NOW <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: WEB RESOURCES & GUIDES (TinyFish Web) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)' }}>
              <Globe size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
                WEB RESOURCES &amp; GUIDES
              </h2>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e0' }}>
                Educational course pages, verified tutorials, and text guides
              </span>
            </div>
          </div>

          {webResources.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
              No web learning guides found for this chapter.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {webResources.map((web, idx) => (
                <div 
                  key={web.id || idx}
                  className="glass-panel card-animate"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'var(--card-bg)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 240, 255, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 800 }}>
                      {web.source || 'Web Guide'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: 'rgba(0, 240, 255, 0.15)',
                        color: '#ffffff',
                        border: '1px solid var(--neon-cyan)'
                      }}
                    >
                      TUTORIAL
                    </span>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {web.title}
                  </h3>

                  {web.description && (
                    <p style={{ fontSize: '12px', color: '#cbd5e0', margin: '0 0 10px', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {web.description}
                    </p>
                  )}

                  {web.reason && (
                    <div style={{ marginTop: 'auto', marginBottom: '1rem', padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--neon-cyan)', fontSize: '11px', color: '#cbd5e0', lineHeight: 1.4 }}>
                      {web.reason}
                    </div>
                  )}

                  <a
                    href={web.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '11px', textDecoration: 'none', background: 'var(--neon-cyan)', color: 'var(--bg-base)', fontWeight: 'bold', boxShadow: 'var(--glow-cyan)' }}
                  >
                    OPEN RESOURCE <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: TEXTBOOKS & PDFS (TinyFish PDF) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--neon-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
                TEXTBOOKS &amp; PDFS
              </h2>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e0' }}>
                Academic study booklets, course notebooks, and reference texts
              </span>
            </div>
          </div>

          {pdfs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
              No textbook PDFs found for this chapter.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {pdfs.map((pdf, idx) => (
                <div 
                  key={pdf.id || idx}
                  className="glass-panel card-animate"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'var(--card-bg)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 230, 118, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', fontWeight: 800 }}>
                      {pdf.source || 'University Library'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: '3px', 
                        background: 'rgba(0, 230, 118, 0.15)', 
                        color: '#ffffff', 
                        border: '1px solid var(--neon-green)' 
                      }}
                    >
                      PDF DOCUMENT
                    </span>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {pdf.title}
                  </h3>

                  {pdf.description && (
                    <p style={{ fontSize: '12px', color: '#cbd5e0', margin: '0 0 10px', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pdf.description}
                    </p>
                  )}

                  {pdf.reason && (
                    <div style={{ marginTop: 'auto', marginBottom: '1rem', padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--neon-green)', fontSize: '11px', color: '#cbd5e0', lineHeight: 1.4 }}>
                      {pdf.reason}
                    </div>
                  )}

                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '11px', textDecoration: 'none', background: 'var(--neon-green)', color: 'var(--bg-base)', fontWeight: 'bold', boxShadow: 'var(--glow-green)' }}
                  >
                    READ PDF <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
