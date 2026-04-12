import DashboardLayout from '../layouts/DashboardLayout';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/api';

const swotConfig = {
  Strengths: { color: '#6ee7b7', itemsKey: 'strengths' },
  Weaknesses: { color: '#fca5a5', itemsKey: 'weaknesses' },
  Opportunities: { color: '#93c5fd', itemsKey: 'opportunities' },
  Threats: { color: '#fde68a', itemsKey: 'threats' },
};

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

export default function SWOT() {
  const { cachedSwotData, cacheSwotData } = useAuth();
  const [loading, setLoading] = useState(!cachedSwotData);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const fetchSwot = async () => {
      if (cachedSwotData) {
        setLoading(false);
        return;
      }

      try {
        const res = await studentService.getSwot();
        cacheSwotData(res.data);
      } catch (err) {
        console.error('Failed to fetch SWOT data', err);
        cacheSwotData({
          ruleBased: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
            summary: '',
          },
          aiBased: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSwot();
  }, [cachedSwotData]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await studentService.getSwot();
      cacheSwotData(res.data);
    } catch (err) {
      console.error('Failed to regenerate SWOT data', err);
    } finally {
      setRegenerating(false);
    }
  };

  const swotData = cachedSwotData || {
    ruleBased: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      summary: '',
    },
    aiBased: null,
  };

  const renderSectionList = (analysis) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
    }}>
      {Object.entries(swotConfig).map(([key, { color, itemsKey }]) => (
        <div key={key} style={{
          padding: '1rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color,
            marginBottom: '0.85rem',
          }}>
            {key}
          </h3>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {(analysis?.[itemsKey] || []).map((item, index) => (
              <li key={`${itemsKey}-${index}`} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                fontSize: '0.88rem',
                color: 'rgba(255,255,255,0.68)',
                lineHeight: 1.5,
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: color,
                  marginTop: '6px',
                  flexShrink: 0,
                }} />
                {item}
              </li>
            ))}

            {(analysis?.[itemsKey] || []).length === 0 && (
              <li style={{
                fontSize: '0.88rem',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}>
                No signals available yet for this section.
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 700,
          color: 'white', letterSpacing: '-0.02em',
          marginBottom: '0.35rem',
        }}>
          SWOT Analysis
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
          Auto-generated based on your quiz performance and topic mastery
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        <div style={glass}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.35rem' }}>
                Performance Insights (Data-Based)
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>
                Derived from quiz scores, attempt frequency, and trend patterns.
              </p>
            </div>
          </div>

          <div style={{
            marginBottom: '1rem',
            padding: '0.9rem 1rem',
            background: 'rgba(147,197,253,0.08)',
            border: '1px solid rgba(147,197,253,0.16)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {loading
                ? 'Analyzing your performance data...'
                : swotData.ruleBased?.summary || 'Rule-based insights will appear after more quiz attempts.'}
            </p>
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>Loading...</p>
          ) : renderSectionList(swotData.ruleBased)}
        </div>

        <div style={glass}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '0.35rem' }}>
                AI-Powered Analysis
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>
                Generated with Gemini from your aggregated student performance data.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading || regenerating}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                fontWeight: 600,
                cursor: loading || regenerating ? 'not-allowed' : 'pointer',
                opacity: loading || regenerating ? 0.6 : 1,
              }}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Analysis'}
            </button>
          </div>

          <div style={{
            marginBottom: '1rem',
            padding: '0.9rem 1rem',
            background: 'rgba(110,231,183,0.08)',
            border: '1px solid rgba(110,231,183,0.16)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {loading
                ? 'Preparing your AI insight card...'
                : swotData.aiBased?.summary || 'AI analysis is unavailable right now, so you are seeing the rule-based insights only.'}
            </p>
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>Loading...</p>
          ) : swotData.aiBased ? renderSectionList(swotData.aiBased) : (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(252,165,165,0.08)',
              border: '1px solid rgba(252,165,165,0.16)',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.6,
              fontSize: '0.9rem',
            }}>
              Gemini did not return an analysis for this request. The data-based SWOT card remains available as the fallback.
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div style={{
        marginTop: '1.25rem',
        padding: '1rem 1.25rem',
        background: 'rgba(129,140,248,0.08)',
        border: '1px solid rgba(129,140,248,0.2)',
        borderRadius: '12px',
        fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.4)',
      }}>
        Cached SWOT data is reused during the active session and cleared automatically on logout.
      </div>

    </DashboardLayout>
  );
}
