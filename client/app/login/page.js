"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 👇 THE FIX
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
      
      alert('Login Successful! 🚀');
      router.push('/board'); // Go to the Kanban Board
    } catch (err) {
      console.error("Login Error:", err);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Login</h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition">
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          Need an account? <Link href="/register" className="text-blue-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}