import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../api/projectApi';
import { useAuth } from '../hooks/useAuth';
import CreateProjectModal from '../components/CreateProjectModal';
import ManageMembersModal from '../components/ManageMembersModal';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState(null);

  const canCreateProject = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectApi.getMyProjects();
        setProjects(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProjectForMembers(updatedProject);
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) return;
    try {
      await projectApi.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">Select a project to view its Kanban board and issues</p>
        </div>

        {canCreateProject && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + New Project
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <h3 className="text-base font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreateProject
              ? 'Create your first project to start tracking issues.'
              : 'Ask a project manager to add you to a project.'}
          </p>
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const canManage = user?.role === 'ADMIN' || project.owner.id === user?.id;

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold tracking-wide text-blue-700">
                      {project.projectKey}
                    </span>
                    <span className="text-xs text-gray-400">
                      Owner: {project.owner.name}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="mt-1 block text-lg font-bold text-gray-900 hover:text-blue-600"
                  >
                    {project.name}
                  </Link>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                    </span>

                    <div className="flex items-center gap-3">
                      {canManage && (
                        <>
                          <button
                            onClick={() => setSelectedProjectForMembers(project)}
                            className="text-xs font-medium text-gray-600 hover:text-blue-600"
                          >
                            Members
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <Link
                        to={`/projects/${project.id}`}
                        className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800 hover:bg-blue-600 hover:text-white"
                      >
                        Open Board →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <ManageMembersModal
        project={selectedProjectForMembers}
        onClose={() => setSelectedProjectForMembers(null)}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
}
