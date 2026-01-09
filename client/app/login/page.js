"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 👇 POINT TO RENDER BACKEND
const API_URL = 'https://taskflow-api-77yp.onrender.com';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      
      // Save the token!
      localStorage.setItem('token', res.data.token);
      
      // router.push is better than window.location for Next.js
      router.push('/board'); 
    } catch (err) {
      console.error("Login Error:", err);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Login</h2>
        
        {error && <p className="text-red-500 text-center mb-4 bg-red-900/20 py-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            className="p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500 transition"
            placeholder="Email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            className="p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500 transition"
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition shadow-lg mt-2">
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Need an account? <Link href="/register" className="text-blue-400 hover:underline">Sign Up</Link>
        </p>

        {/* --- DEMO CREDENTIALS BOX --- */}
        <div className="mt-8 p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-center">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">
            Recruiter / Demo Access
          </p>
          <div className="text-sm space-y-1">
            <p>Email: <span className="text-blue-300 font-mono bg-gray-800 px-2 py-0.5 rounded">demo@test.com</span></p>
            <p>Pass: <span className="text-blue-300 font-mono bg-gray-800 px-2 py-0.5 rounded">123456</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}