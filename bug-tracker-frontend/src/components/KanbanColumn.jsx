import { useDroppable } from '@dnd-kit/core';
import IssueCard from './IssueCard';

export default function KanbanColumn({ status, title, issues, projectKey, onSelectIssue, onAddIssueClick }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[72vh] min-h-[480px] flex-col rounded-xl border p-3.5 transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-gray-100/70'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">{title}</h3>
        <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
          {issues.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {issues.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 text-xs text-gray-400">
            Drop issues here
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectKey={projectKey}
              onSelectIssue={onSelectIssue}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => onAddIssueClick(status)}
        className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs font-semibold text-gray-600 hover:border-blue-400 hover:bg-white hover:text-blue-600"
      >
        + Add issue
      </button>
    </div>
  );
}
