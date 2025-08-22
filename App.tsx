

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { KanbanColumnID, Shipment, Task, CalendarEvent, Email, Note, Priority, User, SubTask, Product } from './types';
import { INITIAL_SHIPMENTS, INITIAL_TASKS, INITIAL_EVENTS, MOCK_NOTES, USERS, KANBAN_COLUMNS, GOOGLE_CLIENT_ID } from './constants';

declare const google: any;

// --- Utility Functions ---
const getPriorityClass = (priority: Priority) => {
  switch (priority) {
    case Priority.High: return 'bg-red-500 hover:bg-red-600';
    case Priority.Medium: return 'bg-yellow-500 hover:bg-yellow-600';
    case Priority.Low: return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-400';
  }
};

const getEventTypeClass = (type: CalendarEvent['type']) => {
    switch(type) {
      case 'shipment': return 'bg-red-500 border-red-700';
      case 'task': return 'bg-yellow-500 border-yellow-700';
      case 'pickup': return 'bg-green-500 border-green-700';
      case 'meeting': return 'bg-purple-500 border-purple-700';
      default: return 'bg-gray-500';
    }
};

// --- ICON Component ---
const Icon = ({ name, className }: { name: string; className?: string }) => (
  <i className={`fa-solid ${name} ${className || ''}`}></i>
);


// --- SIDEBAR Component ---
const Sidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (view: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-table-columns' },
    { id: 'kanban', name: 'Spedizioni', icon: 'fa-brands fa-trello' },
    { id: 'todo', name: 'To-Do List', icon: 'fa-list-check' },
    { id: 'calendar', name: 'Calendario', icon: 'fa-calendar-days' },
    { id: 'gmail', name: 'Gmail', icon: 'fa-envelope' },
    { id: 'notes', name: 'Blocco Note', icon: 'fa-note-sticky' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex flex-col shadow-lg flex-shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
        <Icon name="fa-truck-fast" className="text-2xl text-blue-500" />
        <h1 className="text-xl font-bold">RM Dashboard</h1>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {menuItems.map(item => (
            <li key={item.id} className="mb-2">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                  activeView === item.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon name={item.icon} className="w-5 text-center" />
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img src={USERS[0].avatarUrl} alt={USERS[0].name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-semibold">{USERS[0].name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Responsabile</p>
          </div>
        </div>
      </div>
    </aside>
  );
};


// --- HEADER Component ---
const Header = ({ title, theme, onToggleTheme, onSearch }: { title: string, theme: string, onToggleTheme: () => void, onSearch: (query: string) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              placeholder="Cerca tag, menzioni..." 
              className="pl-10 pr-4 py-2 w-64 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Icon name="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </form>
        <button onClick={onToggleTheme} className="p-2 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
          <Icon name={theme === 'dark' ? 'fa-sun' : 'fa-moon'} />
        </button>
        <button className="p-2 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name="fa-bell" />
        </button>
        <button className="p-2 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name="fa-cog" />
        </button>
      </div>
    </header>
  );
};


// --- DASHBOARD VIEW ---
const DashboardView = ({ 
    shipments, 
    tasks, 
    events, 
    notes,
    onCardClick, 
    onTaskClick,
    onNoteClick,
    onEventClick
}: { 
    shipments: Shipment[], 
    tasks: Task[], 
    events: CalendarEvent[],
    notes: Note[],
    onCardClick: (s: Shipment) => void, 
    onTaskClick: (t: Task) => void,
    onNoteClick: (n: Note) => void,
    onEventClick: (e: CalendarEvent) => void,
}) => {
  const summary = {
    pendingShipments: shipments.filter(s => s.status === KanbanColumnID.ToDo || s.status === KanbanColumnID.InProgress).length,
    tasksDueToday: tasks.filter(t => !t.completed && new Date(t.dueDate).toDateString() === new Date().toDateString()).length,
    nextPickup: events.find(e => e.type === 'pickup' && e.start > new Date())
  };

  const SummaryCard = ({ icon, title, value, color }: {icon: string, title: string, value: React.ReactNode, color: string}) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} text-white`}>
        <Icon name={icon} className="text-2xl w-8 h-8 flex items-center justify-center" />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
  
  const shipmentsByStatus = {
    [KanbanColumnID.ToDo]: shipments.filter(s => s.status === KanbanColumnID.ToDo),
    [KanbanColumnID.InProgress]: shipments.filter(s => s.status === KanbanColumnID.InProgress),
    [KanbanColumnID.Ready]: shipments.filter(s => s.status === KanbanColumnID.Ready),
  };
  
  const DashboardShipmentCard = ({shipment, onClick}: {shipment: Shipment, onClick: () => void}) => (
    <div onClick={onClick} className="p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border dark:border-gray-200 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
            <p className="font-semibold text-sm">{shipment.orderNumber}</p>
            <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${getPriorityClass(shipment.priority)}`}>{shipment.priority.slice(0,1)}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{shipment.customer.name}</p>
        <p className="text-xs text-right text-gray-500 mt-1">{shipment.dueDate.toLocaleDateString()}</p>
    </div>
  );
  
  const recentTasks = tasks.filter(t => !t.completed).sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5);
  const recentNotes = notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()).slice(0, 3);
  const todayEvents = events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).sort((a,b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard icon="fa-box" title="Spedizioni in attesa" value={summary.pendingShipments} color="bg-blue-500" />
        <SummaryCard icon="fa-list-check" title="Task in scadenza oggi" value={summary.tasksDueToday} color="bg-yellow-500" />
        <SummaryCard 
          icon="fa-truck" 
          title="Prossimo ritiro" 
          value={summary.nextPickup ? `${summary.nextPickup.title} @ ${summary.nextPickup.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Nessuno'}
          color="bg-green-500" 
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-xl mb-4">Panoramica Spedizioni</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.keys(shipmentsByStatus) as KanbanColumnID[]).map(status => (
                  <div key={status}>
                      <div className="flex items-center mb-3">
                          <h4 className="font-semibold text-md">{status}</h4>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                              {shipmentsByStatus[status].length}
                          </span>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {shipmentsByStatus[status].length > 0 ? (
                            shipmentsByStatus[status]
                                .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                                .map(s => <DashboardShipmentCard key={s.id} shipment={s} onClick={() => onCardClick(s)} />)
                        ) : (
                            <p className="text-sm text-gray-500 italic mt-4">Nessuna spedizione in questa fase.</p>
                        )}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Task Urgenti</h3>
              <ul className="space-y-2">
                  {recentTasks.map(t => (
                      <li key={t.id} onClick={() => onTaskClick(t)} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          <div>
                              <p className="font-semibold">{t.title}</p>
                              <p className="text-sm text-gray-500">{t.assignedTo.name}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm">{t.dueDate.toLocaleDateString()}</p>
                               <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getPriorityClass(t.priority)}`}>{t.priority}</span>
                          </div>
                      </li>
                  ))}
              </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Note Recenti</h3>
              <ul className="space-y-2">
                  {recentNotes.map(n => (
                      <li key={n.id} onClick={() => onNoteClick(n)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          <Icon name="fa-note-sticky" className="text-yellow-400" />
                          <div>
                              <p className="font-semibold">{n.title}</p>
                              <p className="text-sm text-gray-500">{n.notebook}</p>
                          </div>
                      </li>
                  ))}
              </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Eventi di Oggi</h3>
              <ul className="space-y-2">
                  {todayEvents.length > 0 ? todayEvents.map(e => (
                      <li key={e.id} onClick={() => onEventClick(e)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getEventTypeClass(e.type)}`}></span>
                          <div>
                              <p className="font-semibold">{e.title}</p>
                              <p className="text-sm text-gray-500">{e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                      </li>
                  )) : <p className="text-sm text-gray-500">Nessun evento per oggi.</p>}
              </ul>
          </div>
      </div>
    </div>
  );
};

// --- KANBAN VIEW ---
const KanbanCard = ({ shipment, onClick }: { shipment: Shipment, onClick: () => void }) => (
    <div 
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('shipmentId', shipment.id);
      }}
      onClick={onClick} 
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4 cursor-pointer hover:shadow-xl transition-shadow"
    >
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-md">{shipment.orderNumber}</h4>
            <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getPriorityClass(shipment.priority)}`}>
                {shipment.priority}
            </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{shipment.customer.name}</p>
        <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Icon name="fa-calendar-alt" />
                <span>{shipment.dueDate.toLocaleDateString()}</span>
            </div>
            <img src={shipment.assignedTo.avatarUrl} alt={shipment.assignedTo.name} className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800" />
        </div>
    </div>
);

const KanbanColumn = ({ title, shipments, onCardClick, onUpdateStatus }: { title: KanbanColumnID, shipments: Shipment[], onCardClick: (shipment: Shipment) => void, onUpdateStatus: (shipmentId: string, newStatus: KanbanColumnID) => void }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const shipmentId = e.dataTransfer.getData('shipmentId');
        if (shipmentId) {
            onUpdateStatus(shipmentId, title);
        }
    };

    return (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="bg-gray-200 dark:bg-gray-900 rounded-lg p-3 w-80 flex-shrink-0"
        >
            <h3 className="font-bold text-lg mb-4 px-2">{title} ({shipments.length})</h3>
            <div className="min-h-[200px]">
                {shipments.map(shipment => (
                    <KanbanCard key={shipment.id} shipment={shipment} onClick={() => onCardClick(shipment)} />
                ))}
            </div>
        </div>
    );
};

const ShipmentModal = ({ shipment, onClose, onUpdateStatus, onEdit, onDelete }: { shipment: Shipment | null, onClose: () => void, onUpdateStatus: (shipmentId: string, newStatus: KanbanColumnID) => void, onEdit: (shipment: Shipment) => void, onDelete: (id: string) => void }) => {
    if (!shipment) return null;

    const currentIndex = KANBAN_COLUMNS.findIndex(col => col === shipment.status);
    const prevStatus = currentIndex > 0 ? KANBAN_COLUMNS[currentIndex - 1] : null;
    const nextStatus = currentIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentIndex + 1] : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl font-bold">{shipment.orderNumber}</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onEdit(shipment)} className="text-gray-500 hover:text-blue-500 transition"><Icon name="fa-pencil" /></button>
                        <button onClick={() => onDelete(shipment.id)} className="text-gray-500 hover:text-red-500 transition"><Icon name="fa-trash" /></button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
                            <Icon name="fa-times" className="text-2xl" />
                        </button>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto flex-grow">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="font-bold mb-2">Prodotti</h4>
                        <ul className="list-disc list-inside bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          {shipment.products.map(p => <li key={p.id}>{p.quantity}x {p.name}</li>)}
                        </ul>
                      </div>
                      <div>
                          <h4 className="font-bold mb-2">Allegati</h4>
                          {shipment.attachments.length > 0 ? (
                            shipment.attachments.map(att => <a href={att.url} key={att.id} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-blue-500 hover:underline">{att.type === 'image' ? <Icon name="fa-image" /> : <Icon name="fa-file-pdf" />}<span>{att.name}</span></a>)
                          ) : <p className="text-sm text-gray-500">Nessun allegato.</p>}
                      </div>
                      <div>
                          <h4 className="font-bold mb-2">Commenti</h4>
                           {shipment.comments.length > 0 ? (
                            shipment.comments.map(c => <div key={c.id} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md mb-2"><p className="font-semibold">{c.author.name}:</p><p>{c.text}</p></div>)
                          ) : <p className="text-sm text-gray-500">Nessun commento.</p>}
                      </div>
                    </div>
                    {/* Sidebar Info */}
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div><h5 className="font-bold">Cliente</h5><p>{shipment.customer.name}</p><p className="text-sm text-gray-500">{shipment.customer.address}</p></div>
                        <div><h5 className="font-bold">Assegnato a</h5><div className="flex items-center space-x-2 mt-1"><img src={shipment.assignedTo.avatarUrl} className="w-8 h-8 rounded-full" /><span>{shipment.assignedTo.name}</span></div></div>
                        <div><h5 className="font-bold">Scadenza</h5><p>{shipment.dueDate.toLocaleDateString()}</p></div>
                        <div><h5 className="font-bold">Priorità</h5><p><span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getPriorityClass(shipment.priority)}`}>{shipment.priority}</span></p></div>
                        <div><h5 className="font-bold">Tracking</h5><p className="text-sm break-all">{shipment.trackingNumber}</p></div>
                    </div>
                </div>
                 <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between flex-shrink-0">
                    {prevStatus ? (
                        <button onClick={() => onUpdateStatus(shipment.id, prevStatus)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Icon name="fa-arrow-left" /><span>{prevStatus}</span></button>
                    ) : <div />}
                    {nextStatus ? (
                        <button onClick={() => onUpdateStatus(shipment.id, nextStatus)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><span>{nextStatus}</span><Icon name="fa-arrow-right" /></button>
                    ) : <div />}
                </div>
            </div>
        </div>
    );
};


const KanbanView = ({ shipments, onCardClick, onUpdateStatus, onAddNew }: { shipments: Shipment[], onCardClick: (s: Shipment) => void, onUpdateStatus: (id: string, status: KanbanColumnID) => void, onAddNew: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredShipments = useMemo(() => 
        shipments.filter(s => 
            s.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), 
    [shipments, searchTerm]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cerca per ordine o cliente..." 
                      className="pl-10 pr-4 py-2 w-64 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Icon name="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button onClick={onAddNew} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                    <Icon name="fa-plus" />
                    <span>Nuova Spedizione</span>
                </button>
            </div>
            <div className="flex-1 flex space-x-4 p-4 overflow-x-auto bg-gray-100 dark:bg-gray-900/50">
                {KANBAN_COLUMNS.map(columnId => (
                    <KanbanColumn
                        key={columnId}
                        title={columnId}
                        shipments={filteredShipments.filter(s => s.status === columnId)}
                        onCardClick={onCardClick}
                        onUpdateStatus={onUpdateStatus}
                    />
                ))}
            </div>
        </div>
    );
};


// --- TODO VIEW ---
const TodoItem = ({ task, onToggle, onToggleSubtask, onEdit, onDelete }: { task: Task, onToggle: (id: string) => void, onToggleSubtask: (taskId: string, subtaskId: string) => void, onEdit: (task: Task) => void, onDelete: (id: string) => void }) => {
  const completedSubtasks = task.subTasks.filter(st => st.completed).length;
  
  return (
    <div className={`p-4 rounded-lg shadow-sm transition-colors relative group ${task.completed ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-500' : 'bg-white dark:bg-gray-800'}`}>
      <div className="flex items-start space-x-4">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
        <div className="flex-1">
          <p className={`font-semibold ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <div className="flex items-center space-x-1"><Icon name="fa-user" /><p>{task.assignedTo.name}</p></div>
            <div className="flex items-center space-x-1"><Icon name="fa-calendar" /><p>{task.dueDate.toLocaleDateString()}</p></div>
            <div className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${getPriorityClass(task.priority)}`}>{task.priority}</div>
          </div>
          {task.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{task.tags.map(tag => <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">{tag}</span>)}</div>}
          {task.subTasks.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold mb-1">Sotto-attività ({completedSubtasks}/{task.subTasks.length})</p>
              <div className="space-y-1">
                {task.subTasks.map(st => (
                  <div key={st.id} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={st.completed} onChange={() => onToggleSubtask(task.id, st.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className={st.completed ? 'line-through text-gray-500' : ''}>{st.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
       <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 hover:text-white"><Icon name="fa-pencil" className="text-xs" /></button>
          <button onClick={() => onDelete(task.id)} className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white"><Icon name="fa-trash" className="text-xs" /></button>
       </div>
    </div>
  );
};

const TodoView = ({ tasks, onToggle, onToggleSubtask, onAddNew, onEdit, onDelete }: { tasks: Task[], onToggle: (id: string) => void, onToggleSubtask: (taskId: string, subtaskId: string) => void, onAddNew: () => void, onEdit: (t: Task) => void, onDelete: (id: string) => void }) => {
    const ongoingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Attività in Corso ({ongoingTasks.length})</h3>
              <button onClick={onAddNew} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Icon name="fa-plus" /><span>Nuovo Task</span></button>
            </div>
            <div className="space-y-4">
              {ongoingTasks.map(task => <TodoItem key={task.id} task={task} onToggle={onToggle} onToggleSubtask={onToggleSubtask} onEdit={onEdit} onDelete={onDelete}/>)}
            </div>
            <h3 className="text-xl font-bold pt-4 border-t dark:border-gray-700">Attività Completate ({completedTasks.length})</h3>
            <div className="space-y-4">
              {completedTasks.map(task => <TodoItem key={task.id} task={task} onToggle={onToggle} onToggleSubtask={onToggleSubtask} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
        </div>
    );
};

// --- CALENDAR VIEW ---
const CalendarView = ({ events, onSelectEvent, onAddEvent }: { events: CalendarEvent[], onSelectEvent: (event: CalendarEvent) => void, onAddEvent: (date: Date) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState('month');

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + offset);
        return newDate;
    });
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7; // Monday is 0
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const emptyDays = Array(firstDayOfMonth).fill(null);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold capitalize">{currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(-1)} className="p-2 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icon name="fa-chevron-left" /></button>
            <button onClick={() => changeMonth(1)} className="p-2 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Icon name="fa-chevron-right" /></button>
        </div>
        <div className="flex items-center space-x-4">
            <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex space-x-1">
                <button className={`px-3 py-1 text-sm font-semibold rounded-md ${calendarViewMode === 'month' ? 'bg-white dark:bg-gray-800 shadow' : ''}`} onClick={() => setCalendarViewMode('month')}>Mese</button>
                <button className={`px-3 py-1 text-sm font-semibold rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed`} disabled>Settimana</button>
                <button className={`px-3 py-1 text-sm font-semibold rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed`} disabled>Giorno</button>
            </div>
            <button onClick={() => onAddEvent(new Date())} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <Icon name="fa-plus" />
                <span>Nuovo Evento</span>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
        {weekDays.map(day => <div key={day} className="text-center font-bold text-sm p-2 bg-white dark:bg-gray-800">{day}</div>)}
        {emptyDays.map((_, i) => <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-800/50"></div>)}
        {days.map(day => {
          const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = events.filter(e => new Date(e.start).toDateString() === dayDate.toDateString());
          const isToday = dayDate.toDateString() === new Date().toDateString();
          return (
            <div key={day} className="bg-white dark:bg-gray-800 min-h-32 p-1 overflow-y-auto relative cursor-pointer" onClick={(e) => { if (e.currentTarget === e.target) onAddEvent(dayDate) }}>
              <span className={`font-semibold text-sm ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.map(event => (
                  <div key={event.id} onClick={() => onSelectEvent(event)} className={`${getEventTypeClass(event.type)} text-white text-xs p-1 rounded-md truncate cursor-pointer`}>
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- GMAIL WIDGET VIEW ---
const GmailView = ({ emails, onTaskFromEmail, onSignIn, onSignOut, isSignedIn, isLoading, profile }: { emails: Email[], onTaskFromEmail: (email: Email) => void, onSignIn: () => void, onSignOut: () => void, isSignedIn: boolean, isLoading: boolean, profile: any }) => {
  if (!isSignedIn) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <Icon name="fa-envelope" className="text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Collega il tuo account Gmail</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Visualizza e gestisci le email importanti direttamente da qui.</p>
          <button onClick={onSignIn} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2 mx-auto">
            <Icon name="fa-brands fa-google" />
            <span>Connetti a Gmail</span>
          </button>
          {GOOGLE_CLIENT_ID.startsWith('IL_TUO') && <p className="text-xs text-red-500 mt-4">Attenzione: Configurare un Client ID in `constants.ts` per abilitare la funzionalità.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Posta in Arrivo</h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          <button onClick={onSignOut} className="bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-xs font-bold py-1 px-3 rounded-lg">Disconnetti</button>
        </div>
        
        {isLoading ? (
            <div className="p-6 text-center">
                <Icon name="fa-spinner fa-spin" className="text-3xl text-gray-400"/>
                <p>Caricamento email...</p>
            </div>
        ) : (
          <ul>
            {emails.map(email => (
              <li key={email.id} className={`p-4 border-b dark:border-gray-700 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!email.isRead ? 'font-bold' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-md truncate">{email.sender}</p>
                  <p className={`text-sm ${!email.isRead ? '' : 'text-gray-600 dark:text-gray-400'}`}>{email.subject}</p>
                  <p className={`text-xs text-gray-500 truncate`}>{email.snippet}</p>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                   <p className="text-xs text-gray-400">{email.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   <div className="flex space-x-2">
                     <button onClick={() => onTaskFromEmail(email)} title="Crea Task da Email" className="text-gray-500 hover:text-blue-500"><Icon name="fa-list-check" /></button>
                     <button title="Collega a Spedizione" className="text-gray-500 hover:text-green-500"><Icon name="fa-link" /></button>
                   </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


// --- NOTES VIEW ---
const NotesView = ({ notes, activeNoteId, setActiveNoteId, onAddNote, onUpdateNote, onDeleteNote }: { notes: Note[], activeNoteId: string | null, setActiveNoteId: (id: string | null) => void, onAddNote: () => void, onUpdateNote: (note: Note) => void, onDeleteNote: (id: string) => void }) => {
    const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);
    const notebooks = [...new Set(notes.map(n => n.notebook))];

    return (
        <div className="flex h-full p-6 space-x-6">
            <div className="w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between">
                    <input type="text" placeholder="Cerca note..." className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"/>
                    <button onClick={onAddNote} className="ml-2 p-2 w-10 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex-shrink-0"><Icon name="fa-plus"/></button>
                </div>
                <div className="overflow-y-auto">
                {notebooks.map(nb => (
                    <div key={nb}>
                        <h4 className="font-bold p-3 text-md">{nb}</h4>
                        <ul>
                            {notes.filter(n => n.notebook === nb).map(note => (
                                <li key={note.id} onClick={() => setActiveNoteId(note.id)} className={`px-4 py-3 border-l-4 cursor-pointer ${activeNoteId === note.id ? 'border-blue-500 bg-blue-50 dark:bg-gray-700/50' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-900/50'}`}>
                                    <h5 className="font-semibold">{note.title}</h5>
                                    <p className="text-xs text-gray-500">Modificato: {note.lastModified.toLocaleDateString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                </div>
            </div>

            <div className="w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                {activeNote ? (
                    <>
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <input 
                              type="text"
                              value={activeNote.title}
                              onChange={e => onUpdateNote({...activeNote, title: e.target.value})}
                              className="text-xl font-bold bg-transparent w-full focus:outline-none"
                            />
                            <div>
                                <button className="text-gray-500 hover:text-blue-500 mr-2"><Icon name="fa-share-alt" /> Condividi</button>
                                <button onClick={() => { if(confirm('Sei sicuro?')) { onDeleteNote(activeNote.id); } }} className="text-gray-500 hover:text-red-500"><Icon name="fa-trash" /></button>
                            </div>
                        </div>
                        <div className="p-4 flex-grow">
                            <textarea
                                value={activeNote.content}
                                onChange={(e) => onUpdateNote({...activeNote, content: e.target.value, lastModified: new Date()})}
                                className="w-full h-full p-2 border rounded-md resize-none bg-transparent dark:border-gray-600 focus:outline-none"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        <p>Seleziona una nota o creane una nuova.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- SHIPMENT FORM MODAL ---
type ShipmentFormData = Omit<Shipment, 'id' | 'assignedTo' | 'attachments' | 'comments' | 'dueDate'> & {
  id?: string;
  assignedToId: string;
  dueDate: string;
};

const ShipmentFormModal = ({ isOpen, onClose, onSave, shipmentToEdit, users }: { isOpen: boolean, onClose: () => void, onSave: (data: Shipment) => void, shipmentToEdit: Shipment | null, users: User[] }) => {
    const defaultState: ShipmentFormData = {
        orderNumber: '',
        trackingNumber: '',
        customer: { name: '', address: '' },
        products: [{ id: crypto.randomUUID(), name: '', quantity: 1 }],
        assignedToId: users[0]?.id || '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: Priority.Medium,
        status: KanbanColumnID.ToDo,
    };

    const [formData, setFormData] = useState<ShipmentFormData>(defaultState);
    
    useEffect(() => {
        if (isOpen) {
            if (shipmentToEdit) {
                setFormData({
                    ...shipmentToEdit,
                    assignedToId: shipmentToEdit.assignedTo.id,
                    dueDate: new Date(shipmentToEdit.dueDate).toISOString().split('T')[0],
                });
            } else {
                setFormData(defaultState);
            }
        }
    }, [shipmentToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, customer: { ...prev.customer, [name]: value } }));
    };

    const handleProductChange = (id: string, field: keyof Product, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p),
        }));
    };

    const addProduct = () => {
        setFormData(prev => ({ ...prev, products: [...prev.products, { id: crypto.randomUUID(), name: '', quantity: 1 }] }));
    };

    const removeProduct = (id: string) => {
        setFormData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assignedTo = users.find(u => u.id === formData.assignedToId);
        if (!assignedTo) {
            alert('Utente non valido');
            return;
        }
        const finalData: Shipment = {
            ...(shipmentToEdit || { attachments: [], comments: [] }),
            ...formData,
            id: shipmentToEdit?.id || crypto.randomUUID(),
            dueDate: new Date(formData.dueDate),
            assignedTo,
        };
        onSave(finalData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{shipmentToEdit ? 'Modifica Spedizione' : 'Nuova Spedizione'}</h3>
                    <button onClick={onClose}><Icon name="fa-times" className="text-xl" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block font-semibold mb-1">Numero Ordine</label><input required type="text" name="orderNumber" value={formData.orderNumber} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Numero Tracking</label><input type="text" name="trackingNumber" value={formData.trackingNumber} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Nome Cliente</label><input required type="text" name="name" value={formData.customer.name} onChange={handleCustomerChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Indirizzo Cliente</label><input required type="text" name="address" value={formData.customer.address} onChange={handleCustomerChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Scadenza</label><input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Assegnato a</label><select name="assignedToId" value={formData.assignedToId} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="" disabled>-- Seleziona --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                        <div><label className="block font-semibold mb-1">Priorità</label><select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">{Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                        <div><label className="block font-semibold mb-1">Stato</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">{KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    </div>
                    <div>
                        <label className="block font-semibold mb-2">Prodotti</label>
                        {formData.products.map((p, index) => (
                            <div key={p.id} className="flex items-center space-x-2 mb-2">
                                <input type="text" placeholder="Nome prodotto" value={p.name} onChange={e => handleProductChange(p.id, 'name', e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                <input type="number" placeholder="Qtà" min="1" value={p.quantity} onChange={e => handleProductChange(p.id, 'quantity', parseInt(e.target.value, 10))} required className="w-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                <button type="button" onClick={() => removeProduct(p.id)} disabled={formData.products.length <= 1} className="p-2 w-10 h-10 rounded-md bg-red-500 text-white disabled:bg-gray-400"><Icon name="fa-trash" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={addProduct} className="mt-2 text-blue-500 font-semibold flex items-center space-x-1"><Icon name="fa-plus-circle"/><span>Aggiungi Prodotto</span></button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Annulla</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salva Spedizione</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- TASK FORM MODAL ---
type TaskFormData = Omit<Task, 'id' | 'assignedTo' | 'subTasks' | 'completed' | 'dueDate' | 'tags' | 'category'> & {
  id?: string;
  assignedToId: string;
  dueDate: string;
  tags: string;
};

const TaskFormModal = ({ isOpen, onClose, onSave, taskToEdit, users }: { isOpen: boolean, onClose: () => void, onSave: (data: Task) => void, taskToEdit: Task | null, users: User[] }) => {
    const defaultState: TaskFormData = {
        title: '',
        assignedToId: users[0]?.id || '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: Priority.Medium,
        tags: '',
    };

    const [formData, setFormData] = useState<TaskFormData>(defaultState);
    
    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setFormData({
                    ...taskToEdit,
                    assignedToId: taskToEdit.assignedTo.id,
                    dueDate: new Date(taskToEdit.dueDate).toISOString().split('T')[0],
                    tags: taskToEdit.tags.join(', '),
                });
            } else {
                setFormData(defaultState);
            }
        }
    }, [taskToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assignedTo = users.find(u => u.id === formData.assignedToId);
        if (!assignedTo) {
            alert('Utente non valido');
            return;
        }
        const finalData: Task = {
            ...(taskToEdit || { subTasks: [], completed: false, category: 'Generale' }),
            ...formData,
            id: taskToEdit?.id || crypto.randomUUID(),
            dueDate: new Date(formData.dueDate),
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            assignedTo,
        };
        onSave(finalData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{taskToEdit ? 'Modifica Task' : 'Nuovo Task'}</h3>
                    <button onClick={onClose}><Icon name="fa-times" className="text-xl" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div><label className="block font-semibold mb-1">Titolo Task</label><input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block font-semibold mb-1">Scadenza</label><input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block font-semibold mb-1">Assegnato a</label><select name="assignedToId" value={formData.assignedToId} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="" disabled>-- Seleziona --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                        <div><label className="block font-semibold mb-1">Priorità</label><select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">{Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                    </div>
                    <div><label className="block font-semibold mb-1">Tag (separati da virgola)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Annulla</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salva Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- EVENT FORM MODAL ---
const EventFormModal = ({ isOpen, onClose, onSave, eventToEdit, defaultDate }: { isOpen: boolean, onClose: () => void, onSave: (event: CalendarEvent) => void, eventToEdit: CalendarEvent | null, defaultDate: Date | null }) => {
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        type: 'meeting' as CalendarEvent['type']
    });

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setFormData({
                    title: eventToEdit.title,
                    start: new Date(eventToEdit.start).toISOString().split('T')[0],
                    end: new Date(eventToEdit.end).toISOString().split('T')[0],
                    type: eventToEdit.type,
                });
            } else {
                const date = defaultDate || new Date();
                setFormData({
                    title: '',
                    start: date.toISOString().split('T')[0],
                    end: date.toISOString().split('T')[0],
                    type: 'meeting',
                });
            }
        }
    }, [eventToEdit, defaultDate, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalEvent: CalendarEvent = {
            id: eventToEdit?.id || crypto.randomUUID(),
            resourceId: eventToEdit?.resourceId || crypto.randomUUID(),
            title: formData.title,
            start: new Date(formData.start),
            end: new Date(formData.end),
            type: formData.type
        };
        onSave(finalEvent);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{eventToEdit ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
                    <button onClick={onClose}><Icon name="fa-times" className="text-xl" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label className="block font-semibold mb-1">Titolo Evento</label><input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block font-semibold mb-1">Inizio</label><input required type="date" name="start" value={formData.start} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                            <div><label className="block font-semibold mb-1">Fine</label><input required type="date" name="end" value={formData.end} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                        </div>
                        <div><label className="block font-semibold mb-1">Tipo Evento</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="meeting">Meeting</option><option value="pickup">Ritiro</option></select></div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Annulla</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salva Evento</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- EVENT DETAIL MODAL ---
const EventDetailModal = ({ event, onClose, onEdit, onDelete, onViewResource }: { event: CalendarEvent | null, onClose: () => void, onEdit: (event: CalendarEvent) => void, onDelete: (id: string) => void, onViewResource: (event: CalendarEvent) => void }) => {
    if (!event) return null;
    
    const isCustomEvent = event.type === 'meeting' || event.type === 'pickup';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                         <div className={`w-3 h-3 rounded-full ${getEventTypeClass(event.type)}`}></div>
                         <h3 className="text-xl font-bold">{event.title}</h3>
                    </div>
                    <button onClick={onClose}><Icon name="fa-times" className="text-xl" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400">Periodo</h4>
                        <p>{new Date(event.start).toLocaleDateString()} - {new Date(event.end).toLocaleDateString()}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400">Tipo</h4>
                        <p className="capitalize">{event.type}</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-4">
                    {isCustomEvent ? (
                        <>
                            <button onClick={() => onDelete(event.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Elimina</button>
                            <button onClick={() => onEdit(event)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Modifica</button>
                        </>
                    ) : (
                        <button onClick={() => onViewResource(event)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Vedi Dettagli</button>
                    )}
                </div>
            </div>
        </div>
    )
};

// --- SEARCH RESULT MODAL ---
type SearchResult = {
  type: 'shipment' | 'task' | 'note';
  item: Shipment | Task | Note;
  context: string;
  match: string;
};

const SearchResultsModal = ({ isOpen, onClose, results, query, onResultClick }: { isOpen: boolean, onClose: () => void, results: SearchResult[], query: string, onResultClick: (item: Shipment | Task | Note) => void }) => {
    if (!isOpen) return null;

    const resultGroups = {
        shipments: results.filter(r => r.type === 'shipment'),
        tasks: results.filter(r => r.type === 'task'),
        notes: results.filter(r => r.type === 'note'),
    };

    const getIconForType = (type: SearchResult['type']) => {
        switch (type) {
            case 'shipment': return 'fa-truck';
            case 'task': return 'fa-list-check';
            case 'note': return 'fa-note-sticky';
        }
    };

    const getTitleForItem = (item: Shipment | Task | Note) => {
        if ('orderNumber' in item) return item.orderNumber;
        if ('title' in item) return item.title;
        return 'Elemento senza titolo';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 pt-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Risultati per: <span className="text-blue-500">{query}</span></h3>
                    <button onClick={onClose}><Icon name="fa-times" className="text-xl" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {results.length === 0 ? (
                        <p className="text-center text-gray-500">Nessun risultato trovato.</p>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(resultGroups).map(([type, items]) => {
                                if (items.length === 0) return null;
                                return (
                                    <div key={type}>
                                        <h4 className="text-lg font-bold mb-2 capitalize">{type === 'shipments' ? 'Spedizioni' : type}</h4>
                                        <ul className="space-y-2">
                                            {items.map(result => (
                                                <li key={(result.item as any).id} onClick={() => onResultClick(result.item)} className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border dark:border-gray-700">
                                                    <div className="flex items-center space-x-3 mb-1">
                                                        <Icon name={getIconForType(result.type)} className="text-blue-500"/>
                                                        <p className="font-semibold">{getTitleForItem(result.item)}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{result.context}:</span> "{result.match}"</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main APP Component ---
export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // --- STATE MANAGEMENT ---
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [emails, setEmails] = useState<Email[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS.filter(e => e.type !== 'shipment' && e.type !== 'task'));
  
  // --- GMAIL API STATE ---
  const [googleToken, setGoogleToken] = useState<any>(null);
  const [googleProfile, setGoogleProfile] = useState<any>(null);
  const [isGmailLoading, setIsGmailLoading] = useState(false);
  const tokenClient = useRef<any>(null);

  // --- MODAL STATE ---
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isShipmentFormOpen, setIsShipmentFormOpen] = useState(false);
  const [shipmentToEdit, setShipmentToEdit] = useState<Shipment | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<Date | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // --- NOTES STATE (LIFTED) ---
  const [activeNoteId, setActiveNoteId] = useState<string | null>(MOCK_NOTES.length > 0 ? MOCK_NOTES[0].id : null);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Initialize Google Auth Client
  useEffect(() => {
    if (google && google.accounts) {
      tokenClient.current = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        callback: (tokenResponse: any) => {
          setGoogleToken(tokenResponse);
        },
      });
    }
  }, []);

  const fetchGmailMessages = useCallback(async (token: any) => {
    if (!token) return;
    setIsGmailLoading(true);
    try {
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token.access_token}`);

      // Fetch user profile
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers });
      const profileData = await profileResponse.json();
      setGoogleProfile(profileData);
      
      // Fetch message IDs
      const messagesResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox', { headers });
      const messagesData = await messagesResponse.json();
      if (!messagesData.messages) {
          setEmails([]);
          setIsGmailLoading(false);
          return;
      }
      
      // Fetch details for each message
      const emailPromises = messagesData.messages.map(async (message: { id: string }) => {
        const emailResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, { headers });
        const emailData = await emailResponse.json();
        
        const getHeader = (name: string) => emailData.payload.headers.find((h: any) => h.name === name)?.value || '';
        
        return {
          id: emailData.id,
          sender: getHeader('From'),
          subject: getHeader('Subject'),
          snippet: emailData.snippet,
          isRead: !emailData.labelIds.includes('UNREAD'),
          timestamp: new Date(getHeader('Date')),
        };
      });
      
      const fetchedEmails = await Promise.all(emailPromises);
      setEmails(fetchedEmails);
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      // Handle error, maybe show a message to the user
    } finally {
      setIsGmailLoading(false);
    }
  }, []);

  // Fetch emails when token is available
  useEffect(() => {
    fetchGmailMessages(googleToken);
  }, [googleToken, fetchGmailMessages]);

  const handleGoogleSignIn = () => {
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    } else {
        alert('Libreria Google non ancora caricata. Riprova tra un istante.');
    }
  };

  const handleGoogleSignOut = () => {
    setGoogleToken(null);
    setGoogleProfile(null);
    setEmails([]);
    if (googleToken && google && google.accounts) {
      google.accounts.oauth2.revoke(googleToken.access_token, () => {});
    }
  };


  const handleToggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const calendarEvents = useMemo<CalendarEvent[]>(() => [
    ...shipments.map(s => ({
      id: `event-s-${s.id}`, title: `Scad. ${s.orderNumber}`, start: s.dueDate, end: s.dueDate, type: 'shipment' as const, resourceId: s.id,
    })),
    ...tasks.filter(t => !t.completed).map(t => ({
      id: `event-t-${t.id}`, title: t.title, start: t.dueDate, end: t.dueDate, type: 'task' as const, resourceId: t.id,
    })),
    ...customEvents,
  ], [shipments, tasks, customEvents]);

  // --- Shipment Handlers ---
  const handleUpdateShipmentStatus = useCallback((shipmentId: string, newStatus: KanbanColumnID) => {
      setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status: newStatus } : s));
  }, []);
  
  const handleOpenNewShipmentForm = () => {
    setShipmentToEdit(null);
    setIsShipmentFormOpen(true);
  };

  const handleOpenEditShipmentForm = (shipment: Shipment) => {
    setSelectedShipment(null);
    setShipmentToEdit(shipment);
    setIsShipmentFormOpen(true);
  };
  
  const handleSaveShipment = useCallback((shipmentData: Shipment) => {
    setShipments(prev => {
        const exists = prev.some(s => s.id === shipmentData.id);
        if (exists) {
            return prev.map(s => s.id === shipmentData.id ? shipmentData : s);
        }
        return [shipmentData, ...prev];
    });
    setIsShipmentFormOpen(false);
  }, []);

  const handleDeleteShipment = useCallback((id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa spedizione? L\'azione è irreversibile.')) {
        setShipments(prev => prev.filter(s => s.id !== id));
        setSelectedShipment(null);
    }
  }, []);

  // --- Task Handlers ---
  const handleTaskFromEmail = useCallback((email: Email) => {
      const newTask: Task = {
          id: crypto.randomUUID(),
          title: `Follow-up: ${email.subject}`,
          assignedTo: USERS[0],
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
          priority: Priority.Medium,
          tags: ['#email', '#follow-up'],
          category: 'Amministrazione',
          subTasks: [],
          completed: false,
      };
      setTasks(prev => [newTask, ...prev]);
      setActiveView('todo');
  }, []);

  const handleToggleTask = useCallback((id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, [tasks]);
  
  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
      setTasks(tasks.map(t => {
          if (t.id === taskId) {
              return {
                  ...t,
                  subTasks: t.subTasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
              }
          }
          return t;
      }));
  }, [tasks]);

  const handleDeleteTask = useCallback((id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const handleOpenNewTaskForm = () => {
    setTaskToEdit(null);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTaskForm = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleSaveTask = (taskData: Task) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === taskData.id);
      if (exists) {
        return prev.map(t => t.id === taskData.id ? taskData : t);
      }
      return [taskData, ...prev];
    });
    setIsTaskFormOpen(false);
  };
  
  // --- Note Handlers ---
  const handleAddNote = useCallback(() => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Nuova Nota',
      content: '',
      notebook: 'Generale',
      isShared: false,
      lastModified: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }, []);

  const handleUpdateNote = useCallback((updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => {
        const newNotes = prev.filter(n => n.id !== id);
        if (activeNoteId === id) {
            setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
        }
        return newNotes;
    });
  }, [activeNoteId]);
  
  const handleDashboardNoteClick = useCallback((note: Note) => {
    setActiveView('notes');
    setActiveNoteId(note.id);
  }, []);

  // --- Calendar Event Handlers ---
  const handleOpenNewEventForm = useCallback((date: Date) => {
    setEventToEdit(null);
    setDefaultEventDate(date);
    setIsEventFormOpen(true);
  }, []);
  
  const handleOpenEditEventForm = useCallback((event: CalendarEvent) => {
    setSelectedCalendarEvent(null);
    setEventToEdit(event);
    setIsEventFormOpen(true);
  }, []);

  const handleSaveEvent = useCallback((eventData: CalendarEvent) => {
    setCustomEvents(prev => {
        const exists = prev.some(e => e.id === eventData.id);
        if (exists) {
            return prev.map(e => e.id === eventData.id ? eventData : e);
        }
        return [eventData, ...prev];
    });
    setIsEventFormOpen(false);
  }, []);
  
  const handleDeleteEvent = useCallback((id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo evento?')) {
        setCustomEvents(prev => prev.filter(e => e.id !== id));
        setSelectedCalendarEvent(null);
    }
  }, []);
  
  const handleSelectCalendarEvent = useCallback((event: CalendarEvent) => {
      setSelectedCalendarEvent(event);
  }, []);
  
  const handleViewEventResource = useCallback((event: CalendarEvent) => {
      setSelectedCalendarEvent(null);
      if (event.type === 'shipment') {
          const shipment = shipments.find(s => s.id === event.resourceId);
          if (shipment) setSelectedShipment(shipment);
      } else if (event.type === 'task') {
          // Since there is no specific modal for a task, we just switch to the todo view.
          // A potential improvement would be to highlight the specific task.
          setActiveView('todo');
      }
  }, [shipments]);
  
    // --- Search Handlers ---
    const handleSearch = (query: string) => {
        if (!query.trim()) return;
        
        setSearchQuery(query);
        const lowerCaseQuery = query.toLowerCase();
        const results: SearchResult[] = [];
        const createSnippet = (text: string, term: string) => {
            const index = text.toLowerCase().indexOf(term);
            if (index === -1) return text.slice(0, 100) + (text.length > 100 ? '...' : '');
            const start = Math.max(0, index - 30);
            const end = Math.min(text.length, index + term.length + 30);
            const snippet = text.slice(start, end);
            return `${start > 0 ? '...' : ''}${snippet}${end < text.length ? '...' : ''}`;
        };

        shipments.forEach(s => {
            s.comments.forEach(c => {
                if (c.text.toLowerCase().includes(lowerCaseQuery)) {
                    results.push({ type: 'shipment', item: s, context: `Commento di ${c.author.name}`, match: createSnippet(c.text, lowerCaseQuery) });
                }
            });
        });

        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(lowerCaseQuery)) {
                results.push({ type: 'task', item: t, context: 'Titolo del task', match: t.title });
            }
            t.tags.forEach(tag => {
                if (tag.toLowerCase().includes(lowerCaseQuery)) {
                    results.push({ type: 'task', item: t, context: `Tag: ${tag}`, match: t.title });
                }
            });
        });

        notes.forEach(n => {
            if (n.title.toLowerCase().includes(lowerCaseQuery)) {
                results.push({ type: 'note', item: n, context: 'Titolo della nota', match: n.title });
            }
            if (n.content.toLowerCase().includes(lowerCaseQuery)) {
                results.push({ type: 'note', item: n, context: 'Contenuto della nota', match: createSnippet(n.content, lowerCaseQuery) });
            }
        });

        const uniqueResults = Array.from(new Map(results.map(r => [(r.item as any).id, r])).values());

        setSearchResults(uniqueResults);
        setIsSearchModalOpen(true);
    };

    const handleSearchResultClick = (item: Shipment | Task | Note) => {
        setIsSearchModalOpen(false);
        
        if ('orderNumber' in item) { // Shipment
            setSelectedShipment(item);
        } else if ('subTasks' in item) { // Task
            setActiveView('todo');
        } else if ('notebook' in item) { // Note
            setActiveNoteId(item.id);
            setActiveView('notes');
        }
    };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView shipments={shipments} tasks={tasks} events={calendarEvents} notes={notes} onCardClick={setSelectedShipment} onTaskClick={() => setActiveView('todo')} onNoteClick={handleDashboardNoteClick} onEventClick={setSelectedCalendarEvent} />;
      case 'kanban': return <KanbanView shipments={shipments} onCardClick={setSelectedShipment} onUpdateStatus={handleUpdateShipmentStatus} onAddNew={handleOpenNewShipmentForm} />;
      case 'todo': return <TodoView tasks={tasks} onToggle={handleToggleTask} onToggleSubtask={handleToggleSubtask} onAddNew={handleOpenNewTaskForm} onEdit={handleOpenEditTaskForm} onDelete={handleDeleteTask}/>;
      case 'calendar': return <CalendarView events={calendarEvents} onSelectEvent={handleSelectCalendarEvent} onAddEvent={handleOpenNewEventForm} />;
      case 'gmail': return <GmailView emails={emails} onTaskFromEmail={handleTaskFromEmail} onSignIn={handleGoogleSignIn} onSignOut={handleGoogleSignOut} isSignedIn={!!googleToken} isLoading={isGmailLoading} profile={googleProfile} />;
      case 'notes': return <NotesView notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />;
      default: return <DashboardView shipments={shipments} tasks={tasks} events={calendarEvents} notes={notes} onCardClick={setSelectedShipment} onTaskClick={()=>{}} onNoteClick={handleDashboardNoteClick} onEventClick={setSelectedCalendarEvent}/>;
    }
  };
  
  const getTitle = () => {
      switch (activeView) {
        case 'dashboard': return 'Dashboard Riepilogo';
        case 'kanban': return 'Gestione Spedizioni';
        case 'todo': return 'To-Do List Operativa';
        case 'calendar': return 'Calendario Logistico';
        case 'gmail': return 'Widget Gmail';
        case 'notes': return 'Blocco Note Condiviso';
        default: return 'RM Dashboard';
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} theme={theme} onToggleTheme={handleToggleTheme} onSearch={handleSearch} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderActiveView()}
        </div>
      </main>
      <ShipmentModal 
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdateStatus={(shipmentId, newStatus) => {
          handleUpdateShipmentStatus(shipmentId, newStatus);
          setSelectedShipment(prev => prev ? { ...prev, status: newStatus } : null);
        }}
        onEdit={handleOpenEditShipmentForm}
        onDelete={handleDeleteShipment}
      />
      <ShipmentFormModal
        isOpen={isShipmentFormOpen}
        onClose={() => setIsShipmentFormOpen(false)}
        onSave={handleSaveShipment}
        shipmentToEdit={shipmentToEdit}
        users={USERS}
       />
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        users={USERS}
      />
       <EventDetailModal
        event={selectedCalendarEvent}
        onClose={() => setSelectedCalendarEvent(null)}
        onEdit={handleOpenEditEventForm}
        onDelete={handleDeleteEvent}
        onViewResource={handleViewEventResource}
       />
       <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        defaultDate={defaultEventDate}
       />
        <SearchResultsModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            results={searchResults}
            query={searchQuery}
            onResultClick={handleSearchResultClick}
        />
    </div>
  );
}
