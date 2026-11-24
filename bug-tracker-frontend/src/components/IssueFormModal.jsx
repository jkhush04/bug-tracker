import { useState, useEffect } from 'react';
import Modal from './Modal';
import { issueApi } from '../api/issueApi';

export default function IssueFormModal({
  isOpen,
  onClose,
  project,
  existingIssue = null,
  initialStatus = 'TODO',
  onSaved,
}) {
  const isEdit = Boolean(existingIssue);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('BUG');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingIssue) {
      setTitle(existingIssue.title || '');
      setDescription(existingIssue.description || '');
      setType(existingIssue.type || 'BUG');
      setPriority(existingIssue.priority || 'MEDIUM');
      setAssigneeId(existingIssue.assignee?.id ? String(existingIssue.assignee.id) : '');
    } else {
      setTitle('');
      setDescription('');
      setType('BUG');
      setPriority('MEDIUM');
      setAssigneeId('');
    }
    setError('');
  }, [existingIssue, isOpen]);

  if (!project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEdit) {
        let updated = await issueApi.updateIssue(existingIssue.id, {
          title,
          description,
          type,
          priority,
        });
        const newAssigneeId = assigneeId ? Number(assigneeId) : null;
        const oldAssigneeId = existingIssue.assignee?.id ?? null;
        if (newAssigneeId !== oldAssigneeId) {
          updated = await issueApi.assignIssue(existingIssue.id, newAssigneeId);
        }
        onSaved(updated, true);
      } else {
        let created = await issueApi.createIssue(project.id, {
          title,
          description,
          type,
          priority,
          assigneeId: assigneeId ? Number(assigneeId) : null,
        });
        // If created from IN_PROGRESS or DONE column, update status immediately
        if (initialStatus && initialStatus !== 'TODO') {
          created = await issueApi.updateStatus(created.id, initialStatus);
        }
        onSaved(created, false);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${project.projectKey}-${existingIssue.id}` : 'Create New Issue'}
      subtitle={!isEdit && initialStatus !== 'TODO' ? `Adding directly to ${initialStatus}` : undefined}
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="BUG">Bug</option>
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {project.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
