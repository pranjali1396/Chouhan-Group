
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
        e.stopPropagation(); // Prevent toggling the task when clicking delete
        if (window.confirm(`Are you sure you want to delete this task: "${task.title}"?`)) {
            onDelete(task.id);
        }
    };

    const handleToggleRemarks = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowRemarks(!showRemarks);
        if (!showRemarks && !task.remarks) {
            setIsEditingRemarks(true);
        }
    };

    const handleSaveRemarks = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUpdateTask) {
            onUpdateTask(task.id, { remarks: remarks.trim() || undefined });
        }
        setIsEditingRemarks(false);
    };

    const handleCancelRemarks = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRemarks(task.remarks || '');
        setIsEditingRemarks(false);
    };

    // Determine status
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.isCompleted && dueDate < now;
    const isToday = !task.isCompleted && dueDate.toDateString() === now.toDateString();
    
    const reminderDate = task.reminderDate ? new Date(task.reminderDate) : null;

    return (
        <div className={`group flex items-start justify-between p-4 rounded-lg border transition-all duration-200 ${
            task.isCompleted 
                ? 'bg-green-50 border-green-200' 
                : isOverdue 
                    ? 'bg-red-50 border-red-200 shadow-sm' 
                    : 'bg-white border-border-color hover:border-primary hover:shadow-md'
        }`}>
            <div className="flex items-start flex-grow min-w-0 gap-3">
                <div className="mt-0.5 relative">
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => onToggle(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`h-5 w-5 rounded border-2 text-primary focus:ring-primary cursor-pointer transition-colors ${
                            isOverdue ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                </div>
                
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium truncate transition-all ${
                            task.isCompleted ? 'text-gray-600' : 'text-base-content'
                        }`}>
                            {task.title}
                        </p>
                        {isOverdue && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
                                Overdue
                            </span>
                        )}
                        {isToday && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200">
                                Today
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-content">
                        <span className={`flex items-center font-medium ${
                            isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : ''
                        }`}>
                            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                            {isToday 
                                ? `Due Today at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                : dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            }
                        </span>

                        {reminderDate && !task.isCompleted && (
                             <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                🔔 {reminderDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                             </span>
                        )}
                        
                        {user && (
                            <span className="flex items-center bg-base-200 px-2 py-0.5 rounded text-text-secondary">
                                <UserCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                                {user.name}
                            </span>
                        )}
                        
                        <span className="text-xs text-gray-400 border-l border-gray-300 pl-3">
                            Added by {task.createdBy}
                        </span>
                    </div>

                    {/* Remarks Section */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={handleToggleRemarks}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                <DocumentTextIcon className="w-4 h-4" />
                                {task.remarks ? 'View/Edit Remarks' : 'Add Remarks'}
                            </button>
                            {task.remarks && !isEditingRemarks && (
                                <span className="text-xs text-gray-500">✓ Has remarks</span>
                            )}
                        </div>
                        {showRemarks && (
                            <div className="mt-2">
                                {isEditingRemarks ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            rows={4}
                                            className="input-style w-full text-sm p-3 min-h-[100px] resize-y"
                                            placeholder="Enter task remarks, notes, or completion details..."
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={handleCancelRemarks}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveRemarks}
                                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Save Remarks
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.remarks || 'No remarks added yet.'}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditingRemarks(true);
                                            }}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                            Edit Remarks
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(task.id);
                    }}
                    className={`p-2 rounded-full transition-all ${
                        task.isCompleted 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={task.isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                >
                    <CheckCircleIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="p-2 rounded-full text-muted-content hover:bg-red-100 hover:text-danger opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete Task"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
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
        );
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
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-base-content">My Tasks</h1>
                    <p className="text-sm text-muted-content mt-1">Manage your to-do list, assignments, and reminders.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Task Column */}
                <div className="lg:col-span-1">
                    <div className="card p-6 h-fit sticky top-6 border-t-4 border-primary">
                        <h3 className="text-xl font-bold text-text-primary mb-4">Add New Task</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="taskTitle" className="label-style">Task Description</label>
                                <input 
                                    id="taskTitle" 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    className="input-style" 
                                    placeholder="What needs to be done?" 
                                />
                            </div>
                            <div>
                                <label htmlFor="taskDueDate" className="label-style">Due Date & Time</label>
                                <input 
                                    id="taskDueDate" 
                                    type="datetime-local" 
                                    value={dueDate} 
                                    onChange={e => setDueDate(e.target.value)} 
                                    className="input-style" 
                                />
                            </div>
                             <div>
                                <label htmlFor="taskReminder" className="label-style">Set Reminder</label>
                                <select 
                                    id="taskReminder" 
                                    value={reminderOffset} 
                                    onChange={e => setReminderOffset(e.target.value)} 
                                    className="input-style"
                                >
                                    <option value="">No Reminder</option>
                                    <option value="0">At due time</option>
                                    <option value="15">15 minutes before</option>
                                    <option value="30">30 minutes before</option>
                                    <option value="60">1 hour before</option>
                                    <option value="1440">1 day before</option>
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
                <div className="lg:col-span-2 space-y-8">
                    {/* Pending Tasks Section */}
                    <div className="card p-6 min-h-[300px]">
                        <div className="flex justify-between items-end border-b border-border-color pb-3 mb-4">
                            <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                                Pending Tasks
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {pendingTasks.length}
                                </span>
                            </h3>
                        </div>
                        
                        <div className="space-y-3">
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
                                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                    <p className="text-muted-content font-medium">No pending tasks!</p>
                                    <p className="text-sm text-gray-400 mt-1">You're all caught up. Enjoy your day!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks Section */}
                    <div className="card bg-gray-50/80 border-gray-200 overflow-hidden">
                        <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                            onClick={() => setShowCompleted(!showCompleted)}
                        >
                            <h3 className="text-md font-semibold text-muted-content flex items-center gap-2">
                                <span className="bg-green-100 text-green-600 p-1 rounded-full">
                                    <CheckCircleIcon className="w-4 h-4" />
                                </span>
                                Completed Tasks
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                    {completedTasks.length}
                                </span>
                                <svg 
                                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} 
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