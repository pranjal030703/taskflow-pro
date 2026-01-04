"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/auth/login", formData);
      
      // Save Token & User Info
      localStorage.setItem("token", res.data.token);
      
      router.push("/"); // Go to Board
    } catch (err) {
      alert("Invalid Email or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-500">Login</h1>
        
        <input 
          className="w-full p-3 mb-4 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-green-500"
          type="email" 
          placeholder="Email" 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          className="w-full p-3 mb-6 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-green-500"
          type="password" 
          placeholder="Password" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        
        <button className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition">
          Login
        </button>
        <p className="mt-4 text-center text-gray-400">
          New here? <Link href="/register" className="text-green-400 hover:underline">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}