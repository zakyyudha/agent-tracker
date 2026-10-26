import { STATUS_LABEL, type Status } from '@/lib/types';

const BAR: Record<Status, string> = {
  todo: 'border-l-st-todo',
  in_progress: 'border-l-st-in-progress',
  in_review: 'border-l-st-in-review',
  done: 'border-l-st-done',
};

const DOT: Record<Status, string> = {
  todo: 'bg-st-todo',
  in_progress: 'bg-st-in-progress',
  in_review: 'bg-st-in-review',
  done: 'bg-st-done',
};

export function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tracking-[0.2px] text-ink-muted ${className}`}
      data-status={status}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export const statusBarColor = (status: Status) => BAR[status];
export const statusDotColor = (status: Status) => DOT[status];
