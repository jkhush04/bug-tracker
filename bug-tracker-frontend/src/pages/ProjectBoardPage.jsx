import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { projectApi } from '../api/projectApi';
import { issueApi } from '../api/issueApi';
import { useAuth } from '../hooks/useAuth';
import { useProjectIssues } from '../hooks/useProjectIssues';
import KanbanColumn from '../components/KanbanColumn';
import IssueCard from '../components/IssueCard';
import IssueFormModal from '../components/IssueFormModal';
import IssueDetailModal from '../components/IssueDetailModal';
import ManageMembersModal from '../components/ManageMembersModal';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

const COLUMNS = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'DONE', title: 'Done' },
];

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState('BOARD');
  const [project, setProject] = useState(null);
  const [board, setBoard] = useState({ TODO: [], IN_PROGRESS: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDragIssue, setActiveDragIssue] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    type: '',
    assigneeId: '',
    assignedToMe: false,
    page: 0,
    size: 10,
  });

  const {
    issuesPage,
    loading: listLoading,
    refetch: refetchList,
  } = useProjectIssues(projectId, filters);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [createInitialStatus, setCreateInitialStatus] = useState('TODO');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const loadBoardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectData, boardData] = await Promise.all([
        projectApi.getProjectById(projectId),
        issueApi.getProjectBoard(projectId),
      ]);
      setProject(projectData);
      setBoard({
        TODO: boardData.TODO || [],
        IN_PROGRESS: boardData.IN_PROGRESS || [],
        DONE: boardData.DONE || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [projectId]);

  const filteredBoard = useMemo(() => {
    const filterList = (list) =>
      list.filter((issue) => {
        if (filters.status && issue.status !== filters.status) return false;
        if (filters.type && issue.type !== filters.type) return false;
        if (filters.priority && issue.priority !== filters.priority) return false;
        if (filters.assigneeId && String(issue.assignee?.id) !== filters.assigneeId) return false;
        if (filters.assignedToMe && issue.assignee?.id !== user?.id) return false;
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const match =
            issue.title?.toLowerCase().includes(q) ||
            issue.description?.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

    return {
      TODO: filterList(board.TODO),
      IN_PROGRESS: filterList(board.IN_PROGRESS),
      DONE: filterList(board.DONE),
    };
  }, [board, filters, user]);

  const handleDragStart = (event) => {
    setActiveDragIssue(event.active.data.current?.issue || null);
  };

  const handleDragEnd = async (event) => {
    setActiveDragIssue(null);
    const { active, over } = event;
    if (!over) return;

    const draggedIssue = active.data.current?.issue;
    const newStatus = over.id;
    if (!draggedIssue || draggedIssue.status === newStatus) return;

    const oldStatus = draggedIssue.status;
    const previousBoard = {
      TODO: [...board.TODO],
      IN_PROGRESS: [...board.IN_PROGRESS],
      DONE: [...board.DONE],
    };

    const updatedIssue = { ...draggedIssue, status: newStatus };
    setBoard((prev) => ({
      ...prev,
      [oldStatus]: prev[oldStatus].filter((i) => i.id !== draggedIssue.id),
      [newStatus]: [updatedIssue, ...prev[newStatus]],
    }));

    try {
      await issueApi.updateStatus(draggedIssue.id, newStatus);
      refetchList();
    } catch (err) {
      setBoard(previousBoard);
      alert(err.response?.data?.message || 'Failed to update issue status');
    }
  };

  const handleIssueSaved = (savedIssue, isEdit) => {
    if (isEdit) {
      setBoard((prev) => ({
        TODO: prev.TODO.map((i) => (i.id === savedIssue.id ? savedIssue : i)),
        IN_PROGRESS: prev.IN_PROGRESS.map((i) => (i.id === savedIssue.id ? savedIssue : i)),
        DONE: prev.DONE.map((i) => (i.id === savedIssue.id ? savedIssue : i)),
      }));
      if (selectedIssue?.id === savedIssue.id) {
        setSelectedIssue(savedIssue);
      }
    } else {
      setBoard((prev) => ({
        ...prev,
        [savedIssue.status]: [savedIssue, ...prev[savedIssue.status]],
      }));
    }
    refetchList();
  };

  const handleIssueUpdatedFromDetail = (updatedIssue) => {
    setBoard((prev) => {
      const withoutOld = {
        TODO: prev.TODO.filter((i) => i.id !== updatedIssue.id),
        IN_PROGRESS: prev.IN_PROGRESS.filter((i) => i.id !== updatedIssue.id),
        DONE: prev.DONE.filter((i) => i.id !== updatedIssue.id),
      };
      return {
        ...withoutOld,
        [updatedIssue.status]: [updatedIssue, ...withoutOld[updatedIssue.status]],
      };
    });
    setSelectedIssue(updatedIssue);
    refetchList();
  };

  const handleIssueDeleted = (deletedId) => {
    setBoard((prev) => ({
      TODO: prev.TODO.filter((i) => i.id !== deletedId),
      IN_PROGRESS: prev.IN_PROGRESS.filter((i) => i.id !== deletedId),
      DONE: prev.DONE.filter((i) => i.id !== deletedId),
    }));
    refetchList();
  };

  const openCreateModal = (status = 'TODO') => {
    setEditingIssue(null);
    setCreateInitialStatus(status);
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      type: '',
      assigneeId: '',
      assignedToMe: false,
      page: 0,
      size: 10,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">{error}</p>
        <Link to="/projects" className="mt-3 inline-block text-sm font-medium underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const canManageMembers = user?.role === 'ADMIN' || project.owner.id === user?.id;
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.type ||
      filters.priority ||
      filters.assigneeId ||
      filters.assignedToMe
  );

  return (
    <div>
      {/* Project Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/projects" className="text-xs font-medium text-blue-600 hover:underline">
            ← Back to Projects
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
              {project.projectKey}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Members: {project.members.map((m) => m.name).join(', ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('BOARD')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'BOARD' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List
            </button>
          </div>

          {canManageMembers && (
            <button
              type="button"
              onClick={() => setIsMembersOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage Members ({project.members.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => openCreateModal('TODO')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Create Issue
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 0 }))}
          placeholder="Search issues..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none sm:w-56"
        />

        {viewMode === 'LIST' && (
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 0 }))}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        )}

        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 0 }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="BUG">Bug</option>
          <option value="TASK">Task</option>
          <option value="STORY">Story</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value, page: 0 }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={filters.assigneeId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, assigneeId: e.target.value, assignedToMe: false, page: 0 }))
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Assignees</option>
          {project.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={filters.assignedToMe}
            onChange={(e) =>
              setFilters((f) => ({ ...f, assignedToMe: e.target.checked, assigneeId: '', page: 0 }))
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Assigned to me
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* View Content */}
      {viewMode === 'BOARD' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <div key={col.status} className="w-80 flex-shrink-0 md:flex-1">
                <KanbanColumn
                  status={col.status}
                  title={col.title}
                  issues={filteredBoard[col.status]}
                  projectKey={project.projectKey}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onAddIssueClick={openCreateModal}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeDragIssue ? (
              <IssueCard issue={activeDragIssue} projectKey={project.projectKey} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {listLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading issues...</div>
          ) : issuesPage.content.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No issues match your filters.</div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Key</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {issuesPage.content.map((issue) => (
                      <tr
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className="cursor-pointer hover:bg-blue-50/40"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {project.projectKey}-{issue.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{issue.title}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                          {issue.type}
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={issue.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {issue.assignee ? issue.assignee.name : 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <span>
                  Page {issuesPage.number + 1} of {Math.max(issuesPage.totalPages, 1)} (
                  {issuesPage.totalElements} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={issuesPage.number === 0}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                    className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={issuesPage.number + 1 >= issuesPage.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                    className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <IssueFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        project={project}
        existingIssue={editingIssue}
        initialStatus={createInitialStatus}
        onSaved={handleIssueSaved}
      />

      <IssueDetailModal
        issue={selectedIssue}
        project={project}
        onClose={() => setSelectedIssue(null)}
        onEditClick={(issueToEdit) => {
          setEditingIssue(issueToEdit);
          setIsFormOpen(true);
        }}
        onIssueUpdated={handleIssueUpdatedFromDetail}
        onIssueDeleted={handleIssueDeleted}
      />

      {isMembersOpen && (
        <ManageMembersModal
          project={project}
          onClose={() => setIsMembersOpen(false)}
          onProjectUpdated={(updated) => setProject(updated)}
        />
      )}
    </div>
  );
}



