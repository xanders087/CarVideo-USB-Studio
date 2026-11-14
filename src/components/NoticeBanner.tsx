import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { NoticeState, NoticeTone } from '../utils/mediaHelpers';

interface NoticeBannerProps {
  notice: NoticeState | null;
  onDismiss: () => void;
}

const TONE_META: Record<
  NoticeTone,
  { container: string; iconColor: string; Icon: typeof Info }
> = {
  warning: {
    container: 'bg-amber-950/70 border-amber-700/80 text-amber-200',
    iconColor: 'text-amber-400',
    Icon: AlertTriangle,
  },
  success: {
    container: 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200',
    iconColor: 'text-emerald-400',
    Icon: CheckCircle2,
  },
  info: {
    container: 'bg-cyan-950/70 border-cyan-700/80 text-cyan-200',
    iconColor: 'text-cyan-400',
    Icon: Info,
  },
};

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ notice, onDismiss }) => {
  if (!notice) return null;

  const { container, iconColor, Icon } = TONE_META[notice.tone];

  return (
    <output
      className={`px-3.5 py-2.5 border rounded-xl text-xs flex items-center justify-between gap-3 ${container}`}
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
    </output>
  );
};
