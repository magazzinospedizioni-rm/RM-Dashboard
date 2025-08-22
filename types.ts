export enum Priority {
  High = 'Alta',
  Medium = 'Media',
  Low = 'Bassa',
}

export enum KanbanColumnID {
  ToDo = 'Spedizioni Ferme',
  InProgress = 'Spedizioni Future',
  Ready = 'Ritira il Cliente',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image';
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: Date;
}

export interface Shipment {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  customer: {
    name: string;
    address: string;
  };
  products: Product[];
  assignedTo: User;
  dueDate: Date;
  priority: Priority;
  status: KanbanColumnID;
  attachments: Attachment[];
  comments: Comment[];
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: User;
  dueDate: Date;
  priority: Priority;
  tags: string[];
  category: string;
  subTasks: SubTask[];
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'shipment' | 'task' | 'pickup' | 'meeting';
  resourceId: string; // ID of the shipment or task
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  timestamp: Date;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    notebook: string;
    isShared: boolean;
    lastModified: Date;
}