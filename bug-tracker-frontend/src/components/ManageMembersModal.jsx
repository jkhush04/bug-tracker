import { useState } from 'react';
import { authApi } from '../api/authApi';
import { projectApi } from '../api/projectApi';


export default function ManageMemberModel({ project, onClose, onProjectUpdated }) {
    const [searchQuery , setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching , setSearching] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy]= useState(false);


    if(!project) return null;

    const handleSearch= async(e)=>{
           e.preventDefault();
             if (!searchQuery.trim()) return;
             setError('');
             setSearching(true);

             try{
                 const users= await authApi.searchUsers(searchQuery.trim());
                 const memberIds = new Set(project.members.map((m)=> m.id));

                 setSearchResults(users.filter((u)=> !memberIds.has(u.id)));

                 }
             catch (err) {
                   setError(err.response?.data?.message || 'Failed to search users');
                 } finally {
                   setSearching(false);
                 }
        };

       const handleAddMember = async(email)=>{
           setError('');
           setBusy(true);
           try{
               const updated= await projectApi.addMember(project.id, email);
               onProjectUpdated(updated);
               setSearchResults((prev)=> prev.filter((u)=> u.email !== email));
               }
           catch(err){
               setError(err.response?.data?.message || 'Failed to add member');
               }
           finally {
             setBusy(false);
           }
         };


     const handleRemoveMember = async(email)=>{
           setError('');
           setBusy(true);
           try{
               const updated= await projectApi.removeMember(project.id, email);
               onProjectUpdated(updated);
               }
           catch(err){
               setError(err.response?.data?.message || 'Failed to remove member');
               }
           finally {
             setBusy(false);
           }
         };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
            <p className="text-xs text-gray-500">
              {project.name} ({project.projectKey})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search Users Form */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user by email..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-5 rounded-md border border-blue-100 bg-blue-50/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Matching Users
            </p>
            <ul className="space-y-2">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{u.name}</span>{' '}
                    <span className="text-gray-500">({u.email})</span>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAddMember(u.email)}
                    className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current Members List */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Current Members ({project.members.length})
          </p>
          <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
            {project.members.map((member) => {
              const isOwner = member.id === project.owner.id;
              return (
                <li key={member.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.name}{' '}
                      {isOwner && (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                          Owner
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{member.role}</span>
                    {!isOwner && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
