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
    socket.on('tasksUpdated', (updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => socket.off('tasksUpdated');
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
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
      await axios.post(`${API_URL}/tasks`, { 
        title: newTask, 
        status: 'todo',
        priority: 'medium' 
      });
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // 3. Delete Task
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // 4. Handle Drag and Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;

    // Optimistic Update
    const updatedTasks = Array.from(tasks);
    const movedTaskIndex = updatedTasks.findIndex(t => t.id.toString() === draggableId);
    const [movedTask] = updatedTasks.splice(movedTaskIndex, 1);
    movedTask.status = destination.droppableId;
    updatedTasks.splice(destination.index, 0, movedTask);
    setTasks(updatedTasks);

    // Send to Server
    try {
      await axios.put(`${API_URL}/tasks/${draggableId}`, {
        status: destination.droppableId,
        position: destination.index
      });
    } catch (error) {
      fetchTasks(); // Revert on error
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status && task.status.toLowerCase() === status.toLowerCase());
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Board...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-6 md:mb-8">TaskFlow Pro</h1>
      
      {/* Input Section - Fixed Text Color */}
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

      {/* Board Columns - Stack on Mobile, Row on Desktop */}
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
                    
                    {/* Delete Button (Trash Icon) */}
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