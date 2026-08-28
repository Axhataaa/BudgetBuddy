import { useEffect, useState } from "react";
import {
  LuSparkles,
  LuBrainCircuit,
  LuTrendingUp,
  LuTriangleAlert,
  LuFlag,
  LuTarget,
  LuPartyPopper,
  LuRefreshCw,
} from "react-icons/lu";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { getAIFinancialAnalysis } from "../../services/aiAnalysisService";

const SECTION_CONFIG = [
  { key: "key_observations", title: "Key Observations", icon: LuBrainCircuit, tone: "badge-accent-subtle" },
  { key: "patterns", title: "Patterns", icon: LuTrendingUp, tone: "bg-info-subtle text-info" },
  { key: "risks", title: "Attention", icon: LuTriangleAlert, tone: "bg-warning-subtle text-warning" },
  { key: "recommendations", title: "Recommendations", icon: LuFlag, tone: "bg-primary-subtle text-primary" },
  { key: "positive_progress", title: "Positive Progress", icon: LuPartyPopper, tone: "bg-success-subtle text-success" },
];

export default function AIFinancialAnalysis({ dateFrom, dateTo, periodLabel, canAnalyze }) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analyzedRange, setAnalyzedRange] = useState(null);

  // If the reporting period changes after an analysis has already been
  // generated, don't silently refetch (that would call Gemini on every
  // render / period tweak). Just flag the existing result as stale so the
  // user knows to hit refresh if they want an updated take.
  const isStale = result && analyzedRange && (analyzedRange.from !== dateFrom || analyzedRange.to !== dateTo);

  useEffect(() => {
    setResult(null);
    setAnalyzedRange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const runAnalysis = async (refresh = false) => {
    setLoading(true);
    try {
      const data = await getAIFinancialAnalysis({ date_from: dateFrom, date_to: dateTo, refresh });
      setResult(data);
      setAnalyzedRange({ from: dateFrom, to: dateTo });
    } catch {
      showToast("Couldn't generate AI analysis. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.status === "ok" ? result.analysis : null;
  const visibleSections = analysis
    ? SECTION_CONFIG.filter((section) => analysis[section.key]?.length > 0)
    : [];

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
        <div className="d-flex align-items-center gap-2">
          <span
            className="page-header-icon"
            style={{ width: 36, height: 36, background: "rgba(200, 155, 60, 0.16)", color: "var(--color-accent)" }}
          >
            <LuSparkles size={18} />
          </span>
          <div>
            <h2 className="font-display fs-6 fw-semibold mb-0">AI Financial Analysis</h2>
            <p className="text-muted-ink small mb-0">A personalized read on your activity for {periodLabel}</p>
          </div>
        </div>

        {result && (
          <Button
            variant="secondary"
            size="sm"
            icon={LuRefreshCw}
            loading={loading}
            disabled={!canAnalyze}
            onClick={() => runAnalysis(true)}
          >
            Refresh Analysis
          </Button>
        )}
      </div>

      {!result && !loading && (
        <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-4 text-center">
          <p className="text-muted-ink small mb-0" style={{ maxWidth: 420 }}>
            Get an AI-generated read on what your income, spending, budgets, and savings goals
            actually mean together &mdash; not just a repeat of the charts above.
          </p>
          <Button variant="primary" icon={LuSparkles} disabled={!canAnalyze} onClick={() => runAnalysis(false)}>
            Analyze My Finances
          </Button>
          {!canAnalyze && (
            <p className="text-muted-ink small mb-0">Add some income or expenses in this period to enable analysis.</p>
          )}
        </div>
      )}

      {loading && !result && (
        <div className="py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-3 py-2">
              <span className="placeholder-glow">
                <span className="placeholder rounded" style={{ width: 32, height: 32, display: "inline-block" }} />
              </span>
              <span className="placeholder-glow flex-grow-1">
                <span className="placeholder col-8" />
              </span>
            </div>
          ))}
        </div>
      )}

      {result?.status === "insufficient_data" && <EmptyState icon={LuSparkles} message={result.message} />}

      {result?.status === "unavailable" && <EmptyState icon={LuTriangleAlert} message={result.message} />}

      {analysis && (
        <div className="pt-2">
          {isStale && (
            <div className="badge rounded-pill bg-surface-sunken text-ink mb-3">
              Showing analysis for a previous date range &mdash; refresh to update
            </div>
          )}

          {analysis.overall && <p className="small mb-3">{analysis.overall}</p>}

          {visibleSections.map((section) => (
            <div key={section.key} className="mb-3">
              <h3 className="font-display fs-6 fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                {section.title}
              </h3>
              {analysis[section.key].map((line, i) => (
                <div key={i} className="insight-row">
                  <span className={`insight-icon ${section.tone}`}>
                    <section.icon size={16} />
                  </span>
                  <div className="small">{line}</div>
                </div>
              ))}
            </div>
          ))}

          {analysis.savings_strategy && (
            <div className="mb-1">
              <h3 className="font-display fs-6 fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                Savings Strategy
              </h3>
              <div className="insight-row">
                <span className="insight-icon bg-primary-subtle text-primary">
                  <LuTarget size={16} />
                </span>
                <div className="small">{analysis.savings_strategy}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
