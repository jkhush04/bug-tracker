import Modal from './Modal';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { issueApi } from '../api/issueApi';
import CommentSection from './CommentSection';

export default function IssueDetailModal({
  issue,
  project,
  onClose,
  onEditClick,
  onIssueUpdated,
  onIssueDeleted,
}) {
  const { user } = useAuth();
  if (!issue || !project) return null;

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isReporter = issue.reporter?.id === user?.id;
  const isAssignee = issue.assignee?.id === user?.id;

  const canEdit = isAdminOrManager || isReporter || isAssignee;
  const canDelete = isAdminOrManager || isReporter;

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await issueApi.updateStatus(issue.id, newStatus);
      onIssueUpdated(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      const updated = await issueApi.assignIssue(
        issue.id,
        newAssigneeId ? Number(newAssigneeId) : null
      );
      onIssueUpdated(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue permanently?')) return;
    try {
      await issueApi.deleteIssue(issue.id);
      onIssueDeleted(issue.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  return (
    <Modal
      isOpen={Boolean(issue)}
      onClose={onClose}
      title={`${project.projectKey}-${issue.id}: ${issue.title}`}
      subtitle={`Reported by ${issue.reporter?.name} • Created ${new Date(issue.createdAt).toLocaleString()}`}
      maxWidth="max-w-2xl"
    >
      {/* Top Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {issue.type}
          </span>
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onEditClick(issue)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Quick Status & Assignee Controls */}
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3.5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Status</label>
          <select
            value={issue.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Assignee</label>
          <select
            value={issue.assignee?.id || ''}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="mb-1.5 text-xs font-semibold uppercase text-gray-500">Description</h4>
        <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-3.5 text-sm text-gray-800">
          {issue.description || <span className="italic text-gray-400">No description provided.</span>}
        </div>
      </div>

      <CommentSection
        key={issue.id}
        issueId={issue.id}
        project={project}
        onCountChange={(count) => onIssueUpdated({ ...issue, commentCount: count })}
      />

      <div className="border-t border-gray-200 pt-4">
        <h4 className="mb-2 text-sm font-bold text-gray-800">
          Comments ({issue.commentCount ?? 0})
        </h4>
        <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
          Comments thread will be connected in Step 10.
        </p>
      </div>
    </Modal>
  );
}
