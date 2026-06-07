import { useState, useEffect } from 'react';
import { FireIcon, TrashIcon, PlusIcon, CheckCircleIcon, ClockIcon, PencilIcon, SparklesIcon, ShieldExclamationIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/solid';

interface Task {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null; 
  startDate: string;   // Explicit selected start date formatted string
  endDate: string;     // Explicit selected end date formatted string
  deadlineTime: number; 
  priority: 'easy' | 'medium' | 'hard';
  note: string;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  
  // Two distinct visual calendar picker states
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStartDateInput, setEditStartDateInput] = useState('');
  const [editEndDateInput, setEditEndDateInput] = useState('');
  const [editPriority, setEditPriority] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [editNote, setEditNote] = useState('');

  // Automatically preset Start Date to today, and End Date to 20 days out
  useEffect(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 20);
    
    setStartDateInput(today.toISOString().split('T')[0]);
    setEndDateInput(future.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedTasks = localStorage.getItem('streak_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('streak_tasks', JSON.stringify(updatedTasks));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !startDateInput || !endDateInput) return;

    const startObj = new Date(startDateInput);
    const endObj = new Date(endDateInput);
    
    // Set deadline time to the absolute end of the targeted finish day
    endObj.setHours(23, 59, 59, 999);

    if (endObj.getTime() <= startObj.getTime()) {
      alert("The final target date must be set after your chosen start date!");
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName.trim(),
      streak: 0,
      lastCompleted: null,
      startDate: startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      deadlineTime: endObj.getTime(),
      priority: 'easy',
      note: ''
    };

    saveTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const deleteTask = (id: string) => {
    const filtered = tasks.filter(task => task.id !== id);
    saveTasks(filtered);
  };

  const saveTaskEdits = (id: string) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        let finalDeadlineTime = task.deadlineTime;
        let finalStartDateString = task.startDate;
        let finalEndDateString = task.endDate;

        // Re-calculate dates if user edited them in configuration drawer
        if (editStartDateInput) {
          finalStartDateString = new Date(editStartDateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        if (editEndDateInput) {
          const targetEnd = new Date(editEndDateInput);
          targetEnd.setHours(23, 59, 59, 999);
          finalDeadlineTime = targetEnd.getTime();
          finalEndDateString = targetEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        return {
          ...task,
          priority: editPriority,
          note: editNote.trim(),
          startDate: finalStartDateString,
          endDate: finalEndDateString,
          deadlineTime: finalDeadlineTime
        };
      }
      return task;
    });

    saveTasks(updated);
    setEditingTaskId(null);
  };

  const applyFreezeDay = (id: string) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        const extendedTime = task.deadlineTime + 24 * 60 * 60 * 1000;
        return {
          ...task,
          deadlineTime: extendedTime,
          endDate: new Date(extendedTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return task;
    });
    saveTasks(updated);
    alert("🛡️ Freeze Shield Active! 24 Hours pushed down your calendar deadline.");
  };

  const completeTaskDaily = (id: string) => {
    const todayStr = new Date().toDateString();
    
    const updated = tasks.map(task => {
      if (task.id === id) {
        if (currentTime > task.deadlineTime) {
          alert("This calendar deadline has already closed!");
          return task;
        }

        if (task.lastCompleted && new Date(task.lastCompleted).toDateString() === todayStr) {
          alert("Streak secured for today! Save some fuel for tomorrow.");
          return task;
        }
        
        return {
          ...task,
          streak: task.streak + 1,
          lastCompleted: new Date().toISOString()
        };
      }
      return task;
    });

    saveTasks(updated);
  };

  const getDeadlineCountdown = (deadline: number) => {
    const totalMs = deadline - currentTime;
    if (totalMs <= 0) return "TIME EXPIRED 🛑";

    const totalSeconds = Math.floor(totalMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);

    return `${days}d ${hours}h left`;
  };

  const getWeekDays = () => {
    const current = new Date();
    const currentDayOfWeek = current.getDay();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() - currentDayOfWeek + i);
      week.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
        dateString: d.toDateString(),
        isToday: d.toDateString() === current.toDateString()
      });
    }
    return week;
  };

  const weekDays = getWeekDays();

  const priorityStyles = {
    easy: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    medium: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    hard: 'border-rose-500/40 bg-rose-500/10 text-rose-400'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-12 md:py-20 selection:bg-orange-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <FireIcon className="h-14 w-14 text-orange-500 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
              DopaStreak
            </h1>
          </div>
          <p className="text-slate-400 text-lg md:text-xl font-medium tracking-wide">
            Precision micro-scheduling framework.
          </p>
        </header>

        {/* Deploy Form with Dual Calendar System (Start & End) */}
        <form onSubmit={addTask} className="mb-12 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl focus-within:border-orange-500/50 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all duration-300">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="What target target are we scheduling?..."
              className="w-full px-2 py-2 bg-transparent text-slate-100 text-xl font-bold outline-none placeholder:text-slate-500 border-b border-slate-800/80 focus:border-slate-700 pb-3"
            />
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              
              {/* Dual Range Picker Container */}
              <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                {/* START PICKER */}
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Start:</span>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="bg-transparent font-bold outline-none text-xs text-slate-200 cursor-pointer w-full"
                  />
                </div>

                {/* END PICKER */}
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">End:</span>
                  <input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="bg-transparent font-bold outline-none text-xs text-slate-200 cursor-pointer w-full"
                  />
                </div>
              </div>
              
              <button type="submit" className="md:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap">
                <PlusIcon className="h-5 w-5 stroke-[3]" /> Deploy Timeline
              </button>
            </div>
          </div>
        </form>

        {/* Dashboard Cards Feed */}
        <div className="space-y-4">
          {tasks.map(task => {
            const isCompletedToday = task.lastCompleted && new Date(task.lastCompleted).toDateString() === new Date().toDateString();
            const isExpired = currentTime > task.deadlineTime;

            return (
              <div 
                key={task.id} 
                className={`flex flex-col p-6 rounded-2xl border transition-all duration-500 gap-5 bg-slate-900 ${
                  isExpired ? 'opacity-50 border-rose-950/40' : task.priority === 'hard' ? 'border-rose-500/30 ring-1 ring-rose-500/10 shadow-lg' : 'border-slate-800/80 shadow-xl'
                }`}
              >
                {/* Top Information Controls */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5 flex-1">
                    <button
                      onClick={() => completeTaskDaily(task.id)}
                      disabled={isCompletedToday || isExpired}
                      className={`p-1.5 rounded-xl transition-all duration-300 ${
                        isCompletedToday 
                          ? 'text-emerald-400 bg-emerald-500/10' 
                          : isExpired ? 'text-slate-800 cursor-not-allowed' : 'text-slate-400 bg-slate-800 hover:bg-orange-500/20 hover:text-orange-400 cursor-pointer'
                      }`}
                    >
                      <CheckCircleIcon className="h-9 w-9 md:h-10 md:w-10" />
                    </button>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-xl md:text-2xl tracking-tight ${isCompletedToday ? 'line-through text-slate-400 font-medium' : 'text-slate-100'}`}>
                          {task.name}
                        </h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${priorityStyles[task.priority || 'easy']}`}>
                          {task.priority || 'easy'}
                        </span>
                      </div>

                      {/* Displaying Precise Boundaries */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wide">
                        <CalendarIcon className="h-3.5 w-3.5 text-orange-500/80" />
                        <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                          {task.startDate} ➔ {task.endDate}
                        </span>
                      </div>
                      
                      {task.note && (
                        <p className="text-xs text-slate-400 italic font-medium flex items-center gap-1 pt-0.5">
                          <DocumentTextIcon className="h-3.5 w-3.5 text-slate-500" /> {task.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Analytics */}
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mono font-bold bg-slate-950 text-blue-400 border border-slate-800/80">
                      <ClockIcon className="h-4 w-4 text-blue-500" />
                      <span>{getDeadlineCountdown(task.deadlineTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-base md:text-lg font-black bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 border border-orange-500/30">
                      <FireIcon className="h-5 w-5 text-orange-500" />
                      <span>{task.streak} DAYS</span>
                    </div>

                    <div className="flex gap-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => { 
                          setEditingTaskId(task.id); 
                          setEditStartDateInput('');
                          setEditEndDateInput('');
                          setEditPriority(task.priority || 'easy');
                          setEditNote(task.note || '');
                        }}
                        className="text-slate-500 hover:text-blue-400 p-2 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configurations Expanded Sub-Menu Area */}
                {editingTaskId === task.id && (
                  <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-4 animate-fadeIn">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <SparklesIcon className="h-4 w-4 text-orange-500" />
                      Re-Configure Timeline Boundaries
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority Multiplier</label>
                          <div className="flex gap-2">
                            {(['easy', 'medium', 'hard'] as const).map((tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => setEditPriority(tier)}
                                className={`flex-1 p-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${
                                  editPriority === tier ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                                }`}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* EDIT START & END DATES */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Edit Start</label>
                            <input 
                              type="date" 
                              value={editStartDateInput} 
                              onChange={(e) => setEditStartDateInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold outline-none text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Edit End</label>
                            <input 
                              type="date" 
                              value={editEndDateInput} 
                              onChange={(e) => setEditEndDateInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold outline-none text-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Focus Anchor Description</label>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-2 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyFreezeDay(task.id)}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-400 hover:bg-amber-500/5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShieldExclamationIcon className="h-4 w-4" /> Apply Freeze Day (+24h)
                      </button>

                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => setEditingTaskId(null)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
                        <button onClick={() => saveTaskEdits(task.id)} className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Row Calendar Visualization Cells */}
                <div className="border-t border-slate-800/60 pt-4">
                  <div className="grid grid-cols-7 gap-2 max-w-md">
                    {weekDays.map((day, idx) => {
                      const completedThisSlot = isCompletedToday && day.isToday;

                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${
                            completedThisSlot 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                              : day.isToday 
                              ? 'bg-orange-500/5 border-orange-500/50 text-orange-400 font-bold' 
                              : 'bg-slate-950 border-slate-900 text-slate-500'
                          }`}
                        >
                          <span className="text-xs uppercase tracking-wider font-semibold">{day.name}</span>
                          <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-md font-mono ${day.isToday && !completedThisSlot ? 'bg-orange-500/20' : ''}`}>
                            {new Date(day.dateString).getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}