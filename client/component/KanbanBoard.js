"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';

// Connect to socket (we will authenticate socket later, for now it's public)
const socket = io('https://taskflow-api-77yp.onrender.com/');

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // 1. Check for Login Token
    const token = localStorage.getItem("token");
    if (!token) {
        router.push("/login"); // Kick user out if no token
        return;
    }

    // 2. Fetch Tasks (WITH TOKEN WRISTBAND)
    axios.get('https://taskflow-api-77yp.onrender.com/api/tasks', {
        headers: { token: token }
    }).then((res) => {
      setTasks(res.data);
    }).catch((err) => {
      console.error("Access Denied:", err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
          router.push("/login");
      }
    });

    // 3. Realtime Updates
    socket.on("task_updated", (data) => {
      if (data.type === "CREATE") {
        setTasks((prev) => [...prev, data.task]);
      } else if (data.type === "UPDATE") {
        setTasks((prev) => prev.map(t => t.id === data.task.id ? data.task : t));
      }
    });

    return () => socket.off("task_updated");
  }, []);

  const createTask = async () => {
    if (!newTaskTitle) return;
    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIX: Sending the Token here!
      await axios.post('https://taskflow-api-77yp.onrender.com/api/tasks', {
        title: newTaskTitle,
        description: "Added via Frontend",
        status: "TODO",
        priority: "MEDIUM"
      }, {
        headers: { token: token } // <--- The important part
      });

      setNewTaskTitle("");
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to add task. Are you logged in?");
    }
  };

  const generateSummary = async () => {
    setLoadingAI(true);
    setSummary("");
    try {
      // (Optional) We can protect this route too if we want
      const res = await axios.post('https://taskflow-api-77yp.onrender.com/api/ai-summary');
      setSummary(res.data.summary);
    } catch (err) {
      console.error("AI Error:", err);
      alert("Failed to generate summary");
    }
    setLoadingAI(false);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const draggedTaskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic Update
    const updatedTasks = tasks.map((t) => 
      t.id === draggedTaskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      const token = localStorage.getItem("token");

      // ✅ FIX: Sending the Token here too!
      await axios.put(`https://taskflow-api-77yp.onrender.com/api/tasks/${draggedTaskId}`, {
        status: newStatus
      }, {
        headers: { token: token } // <--- The important part
      });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  if (!isClient) return null;

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-black">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">TaskFlow Pro</h1>
      
      {/* AI Summary Section */}
      <div className="flex flex-col items-center mb-6">
        <button 
          onClick={generateSummary} 
          disabled={loadingAI}
          className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition ${loadingAI ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'}`}
        >
          {loadingAI ? "✨ AI is thinking..." : "✨ Generate Weekly Summary"}
        </button>
        {summary && (
          <div className="mt-6 p-6 bg-white border-l-4 border-purple-500 rounded-r-lg shadow-md max-w-2xl w-full animate-fade-in">
            <h3 className="font-bold text-purple-800 mb-2">🤖 AI Report:</h3>
            <p className="whitespace-pre-line text-gray-700">{summary}</p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex justify-center mb-8 gap-4">
        <input 
          className="p-3 border rounded-lg w-1/3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter a new task..."
        />
        <button 
          onClick={createTask} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-md">
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 min-h-[400px]"
                >
                  <h2 className="font-bold text-xl mb-4 text-gray-700 border-b pb-2 tracking-wide">
                    {status.replace('_', ' ')}
                  </h2>
                  <div className="space-y-3 min-h-[200px]">
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition cursor-pointer"
                            style={provided.draggableProps.style}
                          >
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">{task.description}</p>
                            <div className="mt-3 flex justify-between text-xs font-medium text-gray-400">
                              <span>ID: #{task.id}</span>
                              <span className={`px-2 py-1 rounded ${task.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}