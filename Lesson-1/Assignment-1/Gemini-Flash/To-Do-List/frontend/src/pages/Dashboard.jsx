import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  LogOut, 
  Plus, 
  CheckCircle, 
  Circle, 
  Trash2, 
  Calendar, 
  Flag, 
  Tag, 
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'low',
    dueDate: '',
    category: 'General'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/tasks', newTask);
      setTasks([data, ...tasks]);
      setNewTask({ title: '', description: '', priority: 'low', dueDate: '', category: 'General' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { data } = await API.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? data : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Hello, <span className="text-primary">{user?.name}</span>
          </h1>
          <p className="text-text-muted mt-2">You have {tasks.filter(t => t.status !== 'completed').length} tasks pending today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary shadow-lg"
          >
            <Plus size={20} /> Create New Task
          </button>
          <button 
            onClick={logout}
            className="btn bg-white/5 hover:bg-white/10 text-text-main border border-white/10"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: Calendar, color: 'text-primary' },
          { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'text-green-400' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress' || t.status === 'pending').length, icon: Circle, color: 'text-yellow-400' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-text-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Recent Tasks</h2>
        
        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="glass-card p-12 text-center text-text-muted">
            <Calendar className="mx-auto mb-4 opacity-20" size={48} />
            <p>No tasks found. Click "Create New Task" to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div 
                  key={task._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-card p-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className={`transition-colors ${task.status === 'completed' ? 'text-green-400' : 'text-text-muted group-hover:text-primary'}`}
                    >
                      {task.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> {task.category}
                        </span>
                        <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                          <Flag size={12} /> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-8 relative z-10"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label>Task Title</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="input-field min-h-[100px]"
                  placeholder="Add some details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Priority</label>
                  <select 
                    className="input-field"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Category</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="Work, Personal, etc."
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn bg-white/5 flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Save Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
