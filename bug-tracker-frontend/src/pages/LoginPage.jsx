import { useState} from 'react';

import {Link , useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';

export default function LoginPage(){
    const [email, setEmail] = useState('');
    const [password , setPassword] = useState('');
    const [error , setError] = useState('');
    const [submitting , setSubmitting] = useState(false);


    const {login} = useAuth();
    const navigate =useNavigate();

    const handleSubmit = async(e)=>{
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(email, password);

            navigate('/projects');
              console.log("navigate successfully from login page to projects");
        } catch (error) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign in to BugTracker</h1>
        <p className="mb-6 text-sm text-gray-500">Enter your credentials to access your projects</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
