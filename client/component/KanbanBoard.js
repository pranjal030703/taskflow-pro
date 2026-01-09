import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const API_URL = 'https://taskflow-api-77yp.onrender.com'; 
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Tasks & Listen for Real-Time Updates
  useEffect(() => {
    fetchTasks();
    
    // Listen for updates (and filter them if needed)
    socket.on('tasksUpdated', (updatedTask) => {
        // Simple strategy: Just refresh list to be safe and accurate
        fetchTasks();
    });

    socket.on('taskDeleted', (deletedId) => {
        setTasks(prev => prev.filter(t => t.id !== deletedId));
    });

    return () => {
        socket.off('tasksUpdated');
        socket.off('taskDeleted');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      // 👇 SECURITY UPGRADE: Get Token
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: token } // 👇 Send Token
      });
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
      if (error.response && error.response.status === 403) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
      }
    }
  };

  // 2. Add New Task
  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/tasks`, { 
        title: newTask, 
        status: 'todo',
        priority: 'medium' 
      }, {
        headers: { Authorization: token } // 👇 Send Token
      });
      setNewTask('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // 3. Delete Task
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: token } // 👇 Send Token
      });
      // Optimistic update
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert("Could not delete task.");
    }
  };

  // 4. Handle Drag and Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;

    // Optimistic Update
    const updatedTasks = Array.from(tasks);
    const movedTaskIndex = updatedTasks.findIndex(t => t.id.toString() === draggableId);
    if (movedTaskIndex === -1) return; // Safety check

    const [movedTask] = updatedTasks.splice(movedTaskIndex, 1);
    movedTask.status = destination.droppableId;
    updatedTasks.splice(destination.index, 0, movedTask);
    setTasks(updatedTasks);

    // Send to Server
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${draggableId}`, {
        status: destination.droppableId,
        position: destination.index
      }, {
        headers: { Authorization: token } // 👇 Send Token
      });
    } catch (error) {
      console.error("Move failed:", error);
      fetchTasks(); // Revert on error
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status && task.status.toLowerCase() === status.toLowerCase());
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading your private board...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="flex justify-between w-full max-w-6xl items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600">TaskFlow Pro</h1>
        <button 
            onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }}
            className="text-sm text-red-500 hover:underline"
        >
            Logout
        </button>
      </div>
      
      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full max-w-lg">
        <input
          type="text"
          className="flex-1 p-3 border rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button 
          onClick={addTask}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-full sm:w-auto"
        >
          Add Task
        </button>
      </div>

      {/* Board Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row justify-center items-start gap-6 w-full max-w-6xl">
          
          <Column 
            title="TODO" 
            id="todo" 
            tasks={getTasksByStatus('todo')} 
            onDelete={deleteTask}
          />

          <Column 
            title="IN PROGRESS" 
            id="in progress" 
            tasks={getTasksByStatus('in progress')} 
            onDelete={deleteTask}
          />

          <Column 
            title="DONE" 
            id="done" 
            tasks={getTasksByStatus('done')} 
            onDelete={deleteTask}
          />

        </div>
      </DragDropContext>
    </div>
  );
};

// --- SUB-COMPONENT: Column ---
const Column = ({ title, id, tasks, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full md:w-80 min-h-[300px] flex flex-col">
      <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wide">
        {title}
      </h2>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 transition-colors rounded-lg p-2 ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-gray-100 p-3 mb-3 rounded-lg shadow-sm hover:shadow-md transition flex justify-between items-start group ${
                      snapshot.isDragging ? 'bg-blue-100 scale-105' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800 break-words">{task.title}</p>
                      {task.priority && (
                        <span className={`text-[10px] px-2 py-0.5 rounded mt-2 inline-block uppercase font-bold ${
                          task.priority === 'high' ? 'bg-red-200 text-red-800' : 
                          task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 
                          'bg-green-200 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => onDelete(task.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                      title="Delete Task"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanBoard;