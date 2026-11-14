import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { NoticeState } from '../utils/mediaHelpers';

interface NoticeBannerProps {
  notice: NoticeState | null;
  onDismiss: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ notice, onDismiss }) => {
  if (!notice) return null;

  const styles =
    notice.tone === 'warning'
      ? 'bg-amber-950/70 border-amber-700/80 text-amber-200'
      : notice.tone === 'success'
        ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
        : 'bg-cyan-950/70 border-cyan-700/80 text-cyan-200';

  const Icon =
    notice.tone === 'warning'
      ? AlertTriangle
      : notice.tone === 'success'
        ? CheckCircle2
        : Info;

  const iconColor =
    notice.tone === 'warning'
      ? 'text-amber-400'
      : notice.tone === 'success'
        ? 'text-emerald-400'
        : 'text-cyan-400';

  return (
    <div
      role="status"
      className={`px-3.5 py-2.5 border rounded-xl text-xs flex items-center justify-between gap-3 ${styles}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span className="leading-snug">{notice.message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded hover:bg-black/20 shrink-0 opacity-80 hover:opacity-100"
        aria-label="Cerrar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
