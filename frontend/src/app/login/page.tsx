'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useSocket } from '@/context/SocketContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { connect } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
     const response = await axios.post('http://localhost:3000/auth/login', {
        username,
        password,
     });

     if(response.status === 201){
        const data=response.data;
        localStorage.setItem('jwt_token', data.access_token);
        connect();
        console.log('Login successful:', data);
        router.push('/game');
        setUsername('');
        setPassword('');
     }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Login to Hidden Word Duel
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username" className="mb-1 block text-sm font-medium text-gray-600">Username</label>
            <input
              type="text"
              id="login-username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-primary"
            />

            <label htmlFor="login-password" className="mt-4 mb-1 block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              id="login-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-primary"
            />
            
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="mt-6 w-full rounded-md bg-primary py-2 font-bold text-white hover:bg-primary-hover disabled:bg-gray-400"
            >
              Login
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}