"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Send data to backend
      const res = await axios.post("https://taskflow-api-77yp.onrender.com/register", formData);
      
      // 2. Save the "wristband" (token)
      localStorage.setItem("token", res.data.token);
      
      // 3. Go to the board
      router.push("/");
    } catch (err) {
      alert(err.response?.data || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">Sign Up</h1>
        
        <input 
          className="w-full p-3 mb-4 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder="Username" 
          onChange={(e) => setFormData({...formData, username: e.target.value})} 
        />
        <input 
          className="w-full p-3 mb-4 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          type="email" 
          placeholder="Email" 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          className="w-full p-3 mb-6 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          type="password" 
          placeholder="Password" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        
        <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition">
          Register
        </button>
        <p className="mt-4 text-center text-gray-400">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}