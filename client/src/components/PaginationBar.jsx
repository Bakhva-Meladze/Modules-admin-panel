import React from "react";

export default function PaginationBar({ page, totalPages, total, limit, onPageChange, t }) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const p = Math.max(1, Number(page) || 1);
  const tpRaw = Number(totalPages);
  const tp = Number.isFinite(tpRaw) && tpRaw >= 1 ? Math.floor(tpRaw) : 1;
  const lim = Math.max(1, Number(limit) || 1);
  const from = safeTotal === 0 ? 0 : (p - 1) * lim + 1;
  const to = safeTotal === 0 ? 0 : Math.min(p * lim, safeTotal);

  const canGoPrev = p > 1;
  const canGoNext = p < tp;

  return (
    <div className="pagination-bar" role="navigation" aria-label={t("pagination.aria")}>
      <p className="pagination-range muted">
        {safeTotal === 0
          ? t("pagination.empty")
          : t("pagination.range", { from, to, total: safeTotal })}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-ghost pagination-btn"
          disabled={!canGoPrev}
          aria-disabled={!canGoPrev}
          onClick={() => canGoPrev && onPageChange(p - 1)}
        >
          {t("pagination.prev")}
        </button>
        <span className="pagination-page muted">
          {t("pagination.page", { page: p, totalPages: tp })}
        </span>
        <button
          type="button"
          className="btn btn-ghost pagination-btn"
          disabled={!canGoNext}
          aria-disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange(p + 1)}
        >
          {t("pagination.next")}
        </button>
      </div>
    </div>
  );
}
