
import React, { useState, useMemo, useEffect } from 'react';
import type { Task, User } from '../types';
import { TrashIcon, UserCircleIcon, CalendarIcon, CheckCircleIcon, DocumentTextIcon, PencilSquareIcon } from './Icons';

interface TasksPageProps {
    tasks: Task[];
    users: User[];
    currentUser: User;
    onAddTask: (task: Omit<Task, 'id'>) => void;
    onToggleTask: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onLogout: () => void;
    onNavigate: (view: string) => void;
}

const TaskItem: React.FC<{
    task: Task;
    user?: User;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    currentUser: User;
}> = ({ task, user, onToggle, onDelete, onUpdateTask, currentUser }) => {
    const [showRemarks, setShowRemarks] = useState(false);
    const [remarks, setRemarks] = useState(task.remarks || '');
    const [isEditingRemarks, setIsEditingRemarks] = useState(false);

    useEffect(() => {
        setRemarks(task.remarks || '');
    }, [task.remarks]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete this task: "${task.title}"?`)) {
            onDelete(task.id);
        }
    };

    const handleSaveRemarks = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUpdateTask) {
            onUpdateTask(task.id, { remarks: remarks.trim() || undefined });
        }
        setIsEditingRemarks(false);
    };

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.isCompleted && dueDate < now;
    const isToday = !task.isCompleted && dueDate.toDateString() === now.toDateString();

    return (
        <div className={`group relative p-3.5 md:p-5 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 shadow-sm overflow-hidden active:scale-[0.98] ${task.isCompleted
            ? 'bg-emerald-50/50 border-emerald-100 opacity-80'
            : isOverdue
                ? 'bg-rose-50 border-rose-100 shadow-rose-100/50 ring-4 ring-rose-50/50'
                : 'bg-white border-slate-100 hover:border-indigo-200'
            }`}>
            <div className="flex items-start gap-2.5 md:gap-4">
                {/* Checkbox - Large touch area */}
                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => onToggle(task.id)}
                        className={`h-5 w-5 md:h-7 md:w-7 rounded-lg md:rounded-xl border-2 transition-all cursor-pointer shadow-sm ${task.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isOverdue
                                ? 'border-rose-300 text-rose-500 focus:ring-rose-200'
                                : 'border-slate-300 text-indigo-600 focus:ring-indigo-100'
                            }`}
                    />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1 md:gap-2 items-center">
                            <h3 className={`font-black text-[13px] md:text-lg leading-tight break-words pr-2 ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {task.title}
                            </h3>
                            {isOverdue && <span className="px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-widest bg-rose-500 text-white">Overdue</span>}
                            {isToday && <span className="px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-widest bg-amber-500 text-white">Today</span>}
                        </div>
                        <button onClick={handleDeleteClick} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <div className={`flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full border text-[8px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-widest ${isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                            <CalendarIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {user && (
                            <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-widest">
                                <UserCircleIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                {user.name}
                            </div>
                        )}
                    </div>

                    {/* Remarks Preview/Edit */}
                    <div className="pt-1 md:pt-2">
                        {isEditingRemarks ? (
                            <div className="space-y-2 md:space-y-3 animate-fade-in">
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 focus:bg-white text-[11px] md:text-sm font-medium transition-all min-h-[80px]"
                                    placeholder="Add notes..."
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsEditingRemarks(false)} className="px-3 py-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                                    <button onClick={handleSaveRemarks} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingRemarks(true)}
                                className={`group/remark p-2 md:p-3 rounded-xl md:rounded-2xl border border-dashed transition-all cursor-pointer flex items-center gap-1.5 md:gap-2 ${task.remarks ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100' : 'border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30'
                                    }`}
                            >
                                <DocumentTextIcon className="w-3 h-3 md:w-4 md:h-4 text-slate-400 group-hover/remark:text-indigo-500" />
                                <p className={`text-[9px] md:text-[11px] font-medium break-words ${task.remarks ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                    {task.remarks || 'Add task remarks...'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TasksPage: React.FC<TasksPageProps> = ({ tasks, users, currentUser, onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onLogout, onNavigate }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [reminderOffset, setReminderOffset] = useState<string>('');
    const [assignedToId, setAssignedToId] = useState(currentUser.id);
    const [showCompleted, setShowCompleted] = useState(false);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) return;

        let reminderDate: string | undefined;
        if (reminderOffset && reminderOffset !== 'none') {
            const due = new Date(dueDate);
            const minutes = parseInt(reminderOffset, 10);
            const reminder = new Date(due.getTime() - (minutes * 60000));
            reminderDate = reminder.toISOString();
        }

        onAddTask({
            title,
            dueDate: new Date(dueDate).toISOString(),
            assignedToId,
            isCompleted: false,
            createdBy: currentUser.name,
            reminderDate: reminderDate,
            hasReminded: false
        });

        setTitle('');
        setDueDate('');
        setReminderOffset('');
    };

    const sortedTasks = useMemo(() => {
        // Remove duplicates by task ID (keep first occurrence)
        const uniqueTasks = Array.from(
            new Map(tasks.map(task => [task.id, task])).values()
        ) as Task[];
        return uniqueTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [tasks]);

    const { pendingTasks, completedTasks } = useMemo(() => {
        // Admin sees all tasks, regular users see only their assigned tasks
        const filteredTasks = currentUser.role === 'Admin'
            ? sortedTasks
            : sortedTasks.filter(t => t.assignedToId === currentUser.id);

        const pending = filteredTasks.filter(t => !t.isCompleted);
        const completed = filteredTasks.filter(t => t.isCompleted);
        return { pendingTasks: pending, completedTasks: completed };
    }, [sortedTasks, currentUser]);

    return (
        <div className="space-y-4 md:space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight">Tasks</h1>
                    <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1 font-black uppercase tracking-widest">Assignments & Reminders</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Add Task Column */}
                <div className="lg:col-span-1">
                    <div className="card p-3 md:p-6 h-fit sticky top-2 border-t-4 border-primary">
                        <h3 className="text-sm md:text-xl font-black text-text-primary mb-3 md:mb-4 uppercase tracking-wider">Add New Task</h3>
                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            <div>
                                <label htmlFor="taskTitle" className="label-style">Description</label>
                                <input
                                    id="taskTitle"
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="input-style"
                                    placeholder="Task title..."
                                />
                            </div>
                            <div>
                                <label htmlFor="taskDueDate" className="label-style">Due Date</label>
                                <input
                                    id="taskDueDate"
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="input-style"
                                />
                            </div>
                            <div>
                                <label htmlFor="taskReminder" className="label-style">Reminder</label>
                                <select
                                    id="taskReminder"
                                    value={reminderOffset}
                                    onChange={e => setReminderOffset(e.target.value)}
                                    className="input-style"
                                >
                                    <option value="">No Reminder</option>
                                    <option value="0">At due time</option>
                                    <option value="15">15 mins before</option>
                                    <option value="30">30 mins before</option>
                                    <option value="60">1 hour before</option>
                                </select>
                            </div>
                            {currentUser.role === 'Admin' && (
                                <div>
                                    <label htmlFor="taskAssignee" className="label-style">Assign To</label>
                                    <select id="taskAssignee" value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="input-style">
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button type="submit" className="button-primary w-full justify-center">
                                Create Task
                            </button>
                        </form>
                    </div>
                </div>

                {/* Task List Column */}
                <div className="lg:col-span-2 space-y-4 md:space-y-8">
                    {/* Pending Tasks Section */}
                    <div className="card p-3 md:p-6 min-h-[150px] md:min-h-[300px]">
                        <div className="flex justify-between items-end border-b border-border-color pb-2 md:pb-3 mb-3 md:mb-4">
                            <h3 className="text-sm md:text-lg font-black text-base-content flex items-center gap-2 uppercase tracking-tight">
                                Pending Tasks
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-black bg-blue-100 text-blue-800">
                                    {pendingTasks.length}
                                </span>
                            </h3>
                        </div>

                        <div className="space-y-2.5 md:space-y-3">
                            {pendingTasks.length > 0 ? (
                                pendingTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        user={userMap.get(task.assignedToId)}
                                        onToggle={onToggleTask}
                                        onDelete={onDeleteTask}
                                        onUpdateTask={onUpdateTask}
                                        currentUser={currentUser}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-6 md:py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                    <p className="text-[11px] md:text-sm text-slate-400 font-black uppercase tracking-widest">No pending tasks!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks Section */}
                    <div className="card bg-gray-50/80 border-gray-200 overflow-hidden rounded-2xl">
                        <div
                            className="p-3 md:p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                            onClick={() => setShowCompleted(!showCompleted)}
                        >
                            <h3 className="text-[11px] md:text-md font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
                                    <CheckCircleIcon className="w-3 md:w-4 h-3 md:h-4" />
                                </span>
                                Completed
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] md:text-xs font-black bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                    {completedTasks.length}
                                </span>
                                <svg
                                    className={`w-4 md:w-5 h-4 md:h-5 text-gray-400 transform transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {showCompleted && (
                            <div className="p-4 pt-0 border-t border-gray-200 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="space-y-3 mt-4">
                                    {completedTasks.length > 0 ? (
                                        completedTasks.map(task => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                user={userMap.get(task.assignedToId)}
                                                onToggle={onToggleTask}
                                                onDelete={onDeleteTask}
                                                onUpdateTask={onUpdateTask}
                                                currentUser={currentUser}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-muted-content py-4 italic">No completed tasks yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasksPage;