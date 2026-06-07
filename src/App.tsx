import { useState, useEffect } from 'react';
import { FireIcon, TrashIcon, PlusIcon, CheckCircleIcon, ClockIcon, PencilIcon, SparklesIcon, ShieldExclamationIcon, DocumentTextIcon, CalendarIcon, BoltIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface Task {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null; 
  startDate: string;   
  endDate: string;     
  deadlineTime: number; 
  priority: 'easy' | 'medium' | 'hard';
  note: string;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStartDateInput, setEditStartDateInput] = useState('');
  const [editEndDateInput, setEditEndDateInput] = useState('');
  const [editPriority, setEditPriority] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [editNote, setEditNote] = useState('');

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
  };

  const completeTaskDaily = (id: string) => {
    const todayStr = new Date().toDateString();
    
    const updated = tasks.map(task => {
      if (task.id === id) {
        if (currentTime > task.deadlineTime) return task;
        if (task.lastCompleted && new Date(task.lastCompleted).toDateString() === todayStr) return task;
        
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
    if (totalMs <= 0) return "EXPIRED";

    const totalSeconds = Math.floor(totalMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);

    return `${days}d ${hours}h ${mins}m`;
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
    easy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    medium: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    hard: 'border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
  };

  const totalStreakPool = tasks.reduce((acc, t) => acc + t.streak, 0);
  const activeTasksCount = tasks.filter(t => currentTime < t.deadlineTime).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans antialiased px-4 py-12 selection:bg-orange-500/40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-neutral-950 to-neutral-950">
      <div className="max-w-4xl mx-auto">
        
        {/* Neon HUD Header */}
        <header className="mb-12 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-3.5 mb-2 relative">
            <FireIcon className="h-12 w-12 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-neutral-100 via-orange-400 to-amber-300 bg-clip-text text-transparent uppercase">
              DopaStreak
            </h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.25em] mb-8">
            Precision Micro-Scheduling Framework // Version 2.0
          </p>

          {/* Global Level Engine Metrics */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto p-1.5 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-950/60 rounded-xl border border-neutral-900">
              <TrophyIcon className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Global Score</div>
                <div className="text-xl font-black text-slate-100 font-mono tracking-tight">{totalStreakPool} PTS</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-950/60 rounded-xl border border-neutral-900">
              <BoltIcon className="h-5 w-5 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Active Buffs</div>
                <div className="text-xl font-black text-slate-100 font-mono tracking-tight">{activeTasksCount} CORES</div>
              </div>
            </div>
          </div>
        </header>

        {/* Deploy Terminal Command Panel */}
        <form onSubmit={addTask} className="mb-10 p-5 bg-neutral-900/40 border border-neutral-800/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl focus-within:border-orange-500/40 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent group-focus-within:via-orange-500/50 transition-all duration-700" />
          
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="INITIALIZE NEW FOCUS CORE OBJECTIVE..."
                className="w-full px-3 py-2.5 bg-neutral-950/40 border border-neutral-800/60 focus:border-neutral-700/90 rounded-xl text-slate-200 text-md font-bold outline-none placeholder:text-neutral-600 font-mono transition-all"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                
                {/* START CALENDAR - STYLED FIX */}
                <div className="flex items-center justify-between gap-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl px-3 py-2 flex-1 focus-within:border-neutral-700 transition-all relative">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest font-mono">Start</span>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="bg-transparent font-bold outline-none text-xs text-slate-200 cursor-pointer tracking-wide uppercase w-full text-right"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* END CALENDAR - STYLED FIX */}
                <div className="flex items-center justify-between gap-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl px-3 py-2 flex-1 focus-within:border-neutral-700 transition-all relative">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest font-mono">End</span>
                  <input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="bg-transparent font-bold outline-none text-xs text-slate-200 cursor-pointer tracking-wide uppercase w-full text-right"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              
              <button type="submit" className="px-6 py-3 bg-neutral-100 hover:bg-orange-500 text-neutral-950 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer border border-neutral-200/10">
                <PlusIcon className="h-4 w-4 stroke-[3]" /> Deploy Core
              </button>
            </div>
          </div>
        </form>

        {/* Premium Dashboard Feed Matrix */}
        <div className="space-y-4">
          {tasks.map(task => {
            const isCompletedToday = task.lastCompleted && new Date(task.lastCompleted).toDateString() === new Date().toDateString();
            const isExpired = currentTime > task.deadlineTime;

            return (
              <div 
                key={task.id} 
                className={`flex flex-col p-5 rounded-2xl border transition-all duration-500 gap-5 relative group/card ${
                  isExpired 
                    ? 'opacity-40 border-neutral-900 bg-neutral-950/40' 
                    : isCompletedToday
                    ? 'border-emerald-500/20 bg-neutral-900/20 shadow-lg'
                    : task.priority === 'hard' 
                    ? 'border-rose-500/20 bg-neutral-900/40 shadow-[0_10px_30px_rgba(244,63,94,0.03)] hover:border-rose-500/40' 
                    : 'border-neutral-800/80 bg-neutral-900/30 hover:border-neutral-700 hover:-translate-y-0.5 shadow-md'
                }`}
              >
                {!isExpired && !isCompletedToday && (
                  <div className={`absolute left-0 top-1/4 w-[3px] h-1/2 rounded-r-full transition-all ${
                    task.priority === 'hard' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                )}

                {/* Primary Management Hub Row */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4.5 flex-1">
                    <button
                      onClick={() => completeTaskDaily(task.id)}
                      disabled={isCompletedToday || isExpired}
                      className={`p-1 rounded-xl transition-all duration-300 ${
                        isCompletedToday 
                          ? 'text-emerald-400 bg-emerald-500/10 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                          : isExpired 
                          ? 'text-neutral-800 cursor-not-allowed border border-neutral-900' 
                          : 'text-neutral-500 bg-neutral-950/80 border border-neutral-800/60 hover:border-orange-500/50 hover:text-orange-400 cursor-pointer'
                      }`}
                    >
                      <CheckCircleIcon className="h-10 w-10 md:h-11 md:w-11" />
                    </button>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-xl tracking-tight transition-all duration-300 ${
                          isCompletedToday ? 'line-through text-neutral-600 font-medium' : 'text-neutral-100'
                        }`}>
                          {task.name}
                        </h3>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityStyles[task.priority || 'easy']}`}>
                          {task.priority || 'easy'}
                        </span>
                      </div>

                      {/* Explicit Timeline Grid Markers */}
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-500">
                        <CalendarIcon className="h-3.5 w-3.5 text-neutral-600" />
                        <span className="text-neutral-400">{task.startDate}</span>
                        <span className="text-neutral-600 font-sans text-[10px]">➔</span>
                        <span className="text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-900">{task.endDate}</span>
                      </div>
                      
                      {task.note && (
                        <p className="text-xs text-neutral-400 italic font-medium flex items-center gap-1 bg-neutral-950/40 p-1.5 rounded-lg border border-neutral-900/50 max-w-prose">
                          <DocumentTextIcon className="h-3.5 w-3.5 text-neutral-600" /> {task.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Metric Badges */}
                  <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-neutral-950 border border-neutral-900 text-blue-400 shadow-inner">
                      <ClockIcon className="h-3.5 w-3.5 text-blue-500/80" />
                      <span>{getDeadlineCountdown(task.deadlineTime)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-orange-500/5 text-orange-400 border border-orange-500/20 shadow-md">
                      <FireIcon className="h-4 w-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
                      <span className="font-mono">{task.streak}D</span>
                    </div>

                    <div className="flex gap-0.5 border-l border-neutral-900 pl-1.5 opacity-60 group-hover/card:opacity-100 transition-all">
                      <button
                        onClick={() => { 
                          setEditingTaskId(task.id); 
                          setEditStartDateInput('');
                          setEditEndDateInput('');
                          setEditPriority(task.priority || 'easy');
                          setEditNote(task.note || '');
                        }}
                        className="text-neutral-500 hover:text-neutral-200 p-2 rounded-lg hover:bg-neutral-900 transition-all cursor-pointer"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="text-neutral-600 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/5 transition-all cursor-pointer">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configurations Expanded Module */}
                {editingTaskId === task.id && (
                  <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4 animate-fadeIn shadow-2xl relative">
                    <div className="absolute top-0 left-6 w-12 h-[2px] bg-orange-500" />
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2.5 font-mono">
                      <SparklesIcon className="h-3.5 w-3.5 text-orange-500" /> Mod Core Matrix Parameters
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Priority Factor</label>
                          <div className="flex gap-2">
                            {(['easy', 'medium', 'hard'] as const).map((tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => setEditPriority(tier)}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border font-mono transition-all cursor-pointer ${
                                  editPriority === tier 
                                    ? 'bg-neutral-900 border-neutral-700 text-slate-100 shadow-md' 
                                    : 'bg-neutral-950 border-neutral-900/80 text-neutral-600 hover:text-neutral-400'
                                }`}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1 font-mono">Shift Start</label>
                            <input 
                              type="date" 
                              value={editStartDateInput} 
                              onChange={(e) => setEditStartDateInput(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-xs font-bold outline-none text-slate-300"
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1 font-mono">Shift End</label>
                            <input 
                              type="date" 
                              value={editEndDateInput} 
                              onChange={(e) => setEditEndDateInput(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-xs font-bold outline-none text-slate-300"
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Anchor Logs / Sub-Notes</label>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Inject logs or notes regarding this directive..."
                          className="w-full h-[92px] px-3 py-2 bg-neutral-900 border border-neutral-800 text-slate-200 text-xs rounded-xl outline-none resize-none focus:border-neutral-700 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-900/60 pt-3 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyFreezeDay(task.id)}
                        className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/30 text-amber-400 hover:bg-amber-500/5 font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-mono"
                      >
                        <ShieldExclamationIcon className="h-4 w-4" /> Trigger Freeze (+24h)
                      </button>

                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => setEditingTaskId(null)} className="px-3.5 py-1.5 bg-neutral-900 text-neutral-400 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
                        <button onClick={() => saveTaskEdits(task.id)} className="px-4 py-1.5 bg-white text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:bg-neutral-200 transition-all">Apply Matrix</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Synchronization Strip Footer */}
                <div className="border-t border-neutral-900 pt-3.5">
                  <div className="grid grid-cols-7 gap-1.5 max-w-sm">
                    {weekDays.map((day, idx) => {
                      const completedThisSlot = isCompletedToday && day.isToday;

                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col items-center py-1.5 px-1 rounded-xl border transition-all duration-300 ${
                            completedThisSlot 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                              : day.isToday 
                              ? 'bg-orange-500/5 border-orange-500/40 text-orange-400 font-bold' 
                              : 'bg-neutral-950/50 border-neutral-950 text-neutral-600'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider font-mono font-black">{day.name}</span>
                          <span className={`text-[11px] mt-0.5 px-1 font-mono font-bold rounded ${
                            day.isToday && !completedThisSlot ? 'text-orange-400' : ''
                          }`}>
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