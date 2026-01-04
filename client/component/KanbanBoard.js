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

  // 1. Fetch Tasks on Load
  useEffect(() => {
    fetchTasks();

    // Real-time listener: When server says "tasksUpdated", reload list
    socket.on('tasksUpdated', (updatedTasks) => {
      console.log("Socket received update:", updatedTasks);
      setTasks(updatedTasks);
    });

    return () => socket.off('tasksUpdated');
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: token }
      });
      console.log("Fetched tasks:", response.data);
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  // 2. Add New Task
  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const token = localStorage.getItem('token');
      // Default status is 'todo'
      await axios.post(`${API_URL}/tasks`, { 
        title: newTask, 
        status: 'todo',
        priority: 'medium' 
      }, {
        headers: { Authorization: token }
      });
      setNewTask('');
      // No need to manually fetchTasks() here because Socket.io will trigger it!
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Are you logged in?');
    }
  };

  // 3. Handle Drag and Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // If dropped in the same place, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Optimistic Update (Update UI instantly before Server responds)
    const updatedTasks = Array.from(tasks);
    const [movedTask] = updatedTasks.splice(updatedTasks.findIndex(t => t.id.toString() === draggableId), 1);
    
    // Update the task's status to the new column name
    movedTask.status = destination.droppableId; 
    updatedTasks.splice(destination.index, 0, movedTask);
    
    setTasks(updatedTasks);

    // Send update to Server
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${draggableId}`, {
        status: destination.droppableId,
        position: destination.index
      }, {
        headers: { Authorization: token }
      });
    } catch (error) {
      console.error("Error moving task:", error);
      fetchTasks(); // Revert changes if server fails
    }
  };

  // 4. Filter Tasks for Columns (Case Insensitive Fix)
  const getTasksByStatus = (status) => {
    return tasks.filter(task => 
      task.status && task.status.toLowerCase() === status.toLowerCase()
    );
  };

  if (loading) return <div className="p-10 text-center">Loading Board...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">TaskFlow Pro</h1>
      
      {/* Input Section */}
      <div className="flex gap-4 mb-10 w-full max-w-lg">
        <input
          type="text"
          className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button 
          onClick={addTask}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Add Task
        </button>
      </div>

      {/* Board Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
          
          {/* TODO Column */}
          <Column 
            title="TODO" 
            id="todo" 
            tasks={getTasksByStatus('todo')} 
          />

          {/* IN PROGRESS Column */}
          <Column 
            title="IN PROGRESS" 
            id="in progress" // Must match DB value
            tasks={getTasksByStatus('in progress')} 
          />

          {/* DONE Column */}
          <Column 
            title="DONE" 
            id="done" 
            tasks={getTasksByStatus('done')} 
          />

        </div>
      </DragDropContext>
    </div>
  );
};

// --- SUB-COMPONENT: Column (Renders the list) ---
const Column = ({ title, id, tasks }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md w-80 min-h-[400px] flex flex-col">
      <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wide">
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
                    className={`bg-gray-100 p-4 mb-3 rounded-lg shadow-sm hover:shadow-md transition ${
                      snapshot.isDragging ? 'bg-blue-100 scale-105' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-800">{task.title}</p>
                    {task.priority && (
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        task.priority === 'high' ? 'bg-red-200 text-red-800' : 
                        task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 
                        'bg-green-200 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    )}
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