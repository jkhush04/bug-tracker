import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import PriorityBadge from './PriorityBadge';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function IssueCard({ issue, projectKey, onSelectIssue, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(issue.id),
    data: { issue },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
      };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={() => !isOverlay && onSelectIssue?.(issue)}
      className={`cursor-grab rounded-lg border bg-white p-3.5 shadow-sm transition active:cursor-grabbing ${
        isOverlay ? 'rotate-2 border-blue-500 shadow-xl' : 'border-gray-200 hover:border-blue-400 hover:shadow'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">
          {projectKey}-{issue.id}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
            {issue.type}
          </span>
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      <h4 className="mb-3 text-sm font-medium text-gray-900 line-clamp-2">{issue.title}</h4>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>💬 {issue.commentCount ?? 0}</span>
        {issue.assignee ? (
          <div className="flex items-center gap-1.5" title={issue.assignee.name}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {getInitials(issue.assignee.name)}
            </span>
            <span className="max-w-[100px] truncate text-gray-700">{issue.assignee.name}</span>
          </div>
        ) : (
          <span className="italic text-gray-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}
