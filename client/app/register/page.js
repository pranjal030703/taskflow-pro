"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 👇 THIS IS THE FIX: POINT TO RENDER, NOT VERCEL
const API_URL = 'https://taskflow-api-77yp.onrender.com';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear past errors
    
    try {
      // Use the API_URL here
      await axios.post(`${API_URL}/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      alert('Registration Successful! Please Login.');
      router.push('/login');
    } catch (err) {
      console.error("Registration Error:", err);
      // improved error handling
      setError(err.response?.data?.error || 'Registration failed. Try a different email.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Sign Up</h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Username" 
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
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
            Register
          </button>
        </form>
        
        <p className="mt-4 text-center text-gray-400">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}