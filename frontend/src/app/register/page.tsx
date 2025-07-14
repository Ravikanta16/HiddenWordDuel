'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/auth/register', {
        username,
        email,
        password,
      });

      if(response.status === 201){
        const data=response.data;
        setSuccessMessage(`Registration successful! You can now log in.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return Error;
    }
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create an Account
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-gray-600">Username</label>
            <input
              type="text"
              id="reg-username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-primary"
            />

            <label htmlFor="reg-email" className="mt-4 mb-1 block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              id="reg-email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-primary"
            />

            <label htmlFor="reg-password" className="mt-4 mb-1 block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              id="reg-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-primary"
            />
            
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}

            <button
              type="submit"
              className="mt-6 w-full rounded-md bg-primary py-2 font-bold text-white hover:bg-primary-hover disabled:bg-gray-400"
            >
              Register
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}