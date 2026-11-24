import {useState} from 'react';
import {projectApi} from '../api/projectApi';

export default function CreateProjectModel({isOpen , onClose, onProjectCreated}){
    const [name , setName] = useState('');
    const [projectKey , setProjectKey] = useState('');
    const [description, setDescription] = useState('');
    const [error , setError] = useState('');
    const [submitting ,setSubmitting] = useState('');


    if(!isOpen) return null;

    const handleSubmit= async(e)=>{
        e.preventDefault();
        setError('');
        setSubmitting('');

        try{
            const created = await projectApi.createProject({
                name,
                projectKey: projectKey.toUpperCase().trim(),
                description,
                });
            onProjectCreated(created);
            setName('');
            setProjectKey('');
            setDescription('');
            onClose();
            }
        catch(err){
            setError(err.response?.data?.message || "Failed to create project.");
            }
        finally{
            setSubmitting(false);
            }

        };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Create New Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Portal"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Project Key <span className="text-xs text-gray-400">(2–10 chars, unique)</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={10}
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
              placeholder="e.g. PORT"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this project tracks..."
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
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

}





