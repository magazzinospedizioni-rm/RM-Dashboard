
import { User, Shipment, Task, CalendarEvent, Email, Note, Priority, KanbanColumnID } from './types';

// !!! IMPORTANTE !!!
// Sostituisci questo valore con il tuo Client ID ottenuto dalla Google Cloud Console
// per abilitare l'integrazione con l'API di Gmail.
// Vai su https://console.cloud.google.com/apis/credentials per crearne uno.
export const GOOGLE_CLIENT_ID = '897853466694-sk7jm43mflqg2e2a67bi14n541fm58hc.apps.googleusercontent.com';


export const USERS: User[] = [
  { id: 'u1', name: 'Mario Rossi', avatarUrl: 'https://picsum.photos/id/1005/100/100' },
  { id: 'u2', name: 'Luigi Verdi', avatarUrl: 'https://picsum.photos/id/1011/100/100' },
  { id: 'u3', name: 'Anna Bianchi', avatarUrl: 'https://picsum.photos/id/1027/100/100' },
];

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 's1',
    orderNumber: 'RM-00123',
    trackingNumber: '1Z999AA10123456784',
    customer: { name: 'Tech Solutions Srl', address: 'Via Roma 1, Milano' },
    products: [{ id: 'p1', name: 'Laptop Pro 15"', quantity: 2 }, { id: 'p2', name: 'Mouse Wireless', quantity: 2 }],
    assignedTo: USERS[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    priority: Priority.High,
    status: KanbanColumnID.ToDo,
    attachments: [{ id: 'a1', name: 'bolla_123.pdf', url: '#', type: 'document' }],
    comments: [{ id: 'c1', author: USERS[2], text: 'Cliente ha richiesto consegna mattutina.', timestamp: new Date() }],
  },
  {
    id: 's2',
    orderNumber: 'RM-00124',
    trackingNumber: '1Z999AA10123456785',
    customer: { name: 'Creative Minds Agency', address: 'Corso Vittorio Emanuele 10, Torino' },
    products: [{ id: 'p3', name: 'Monitor 27" 4K', quantity: 1 }],
    assignedTo: USERS[1],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    priority: Priority.Medium,
    status: KanbanColumnID.InProgress,
    attachments: [],
    comments: [],
  },
  {
    id: 's3',
    orderNumber: 'RM-00125',
    trackingNumber: '1Z999AA10123456786',
    customer: { name: 'Global Imports', address: 'Piazza del Popolo 5, Roma' },
    products: [{ id: 'p4', name: 'Tastiera Meccanica RGB', quantity: 5 }, { id: 'p5', name: 'Webcam HD', quantity: 5 }],
    assignedTo: USERS[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    priority: Priority.Low,
    status: KanbanColumnID.Ready,
    attachments: [{ id: 'a2', name: 'foto_pacco.jpg', url: 'https://picsum.photos/200/300', type: 'image' }],
    comments: [],
  },
  {
    id: 's4',
    orderNumber: 'RM-00121',
    trackingNumber: '1Z999AA10123456782',
    customer: { name: 'Ufficio Stampa', address: 'Via della Conciliazione, Roma' },
    products: [{ id: 'p6', name: 'Stampante Laser', quantity: 1 }],
    assignedTo: USERS[2],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    priority: Priority.Medium,
    status: KanbanColumnID.Ready,
    attachments: [],
    comments: [],
  },
  {
    id: 's5',
    orderNumber: 'RM-00120',
    trackingNumber: '1Z999AA10123456781',
    customer: { name: 'Studio Legale & Associati', address: 'Via Montenapoleone 2, Milano' },
    products: [{ id: 'p7', name: 'Scanner Professionale', quantity: 1 }],
    assignedTo: USERS[1],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    priority: Priority.Low,
    status: KanbanColumnID.Ready,
    attachments: [],
    comments: [],
  },
  {
    id: 's6',
    orderNumber: 'RM-00119',
    trackingNumber: '1Z999AA10123456780',
    customer: { name: 'Ospedale San Raffaele', address: 'Via Olgettina 60, Milano' },
    products: [{ id: 'p8', name: 'Cavi HDMI 10m', quantity: 20 }],
    assignedTo: USERS[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    priority: Priority.High,
    status: KanbanColumnID.Ready,
    attachments: [],
    comments: [],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Inventario scaffale B-03',
    assignedTo: USERS[1],
    dueDate: new Date(),
    priority: Priority.High,
    tags: ['#inventario', '#magazzino'],
    category: 'Operazioni Magazzino',
    subTasks: [
      { id: 'st1-1', text: 'Contare articoli tipo A', completed: true },
      { id: 'st1-2', text: 'Contare articoli tipo B', completed: false },
      { id: 'st1-3', text: 'Aggiornare gestionale', completed: false },
    ],
    completed: false,
  },
  {
    id: 't2',
    title: 'Gestire reso ordine RM-00115',
    assignedTo: USERS[2],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    priority: Priority.Medium,
    tags: ['#resi'],
    category: 'Amministrazione',
    subTasks: [],
    completed: false,
  },
  {
    id: 't3',
    title: 'Manutenzione muletto',
    assignedTo: USERS[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: Priority.Low,
    tags: ['#manutenzione'],
    category: 'Manutenzione',
    subTasks: [],
    completed: true,
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  ...INITIAL_SHIPMENTS.map(s => ({
    id: `event-s-${s.id}`,
    title: `Scadenza ${s.orderNumber}`,
    start: s.dueDate,
    end: s.dueDate,
    type: 'shipment' as const,
    resourceId: s.id,
  })),
  ...INITIAL_TASKS.map(t => ({
    id: `event-t-${t.id}`,
    title: t.title,
    start: t.dueDate,
    end: t.dueDate,
    type: 'task' as const,
    resourceId: t.id,
  })),
  {
    id: 'event-p1',
    title: 'Ritiro Corriere TNT',
    start: new Date(new Date().setHours(16, 0, 0, 0)),
    end: new Date(new Date().setHours(17, 0, 0, 0)),
    type: 'pickup',
    resourceId: 'tnt'
  }
];

export const MOCK_EMAILS: Email[] = [
    { id: 'e1', sender: 'corriere@brt.it', subject: 'Conferma ritiro per oggi', snippet: 'Buongiorno, confermiamo il ritiro per le ore 16:00...', isRead: false, timestamp: new Date(new Date().setHours(9, 15)) },
    { id: 'e2', sender: 'info@techsolutions.it', subject: 'Info su ordine RM-00123', snippet: 'Salve, vorremmo sapere a che punto è la nostra spedizione...', isRead: false, timestamp: new Date(new Date().setHours(10, 30))},
    { id: 'e3', sender: 'support@dhl.com', subject: 'Documentazione spedizione internazionale', snippet: 'In allegato i documenti necessari per la spedizione in Svizzera.', isRead: true, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
];

export const MOCK_NOTES: Note[] = [
    { id: 'n1', title: 'Procedure Corriere TNT', notebook: 'Procedure Corrieri', isShared: true, lastModified: new Date(), content: 'Contattare referente Marco al 333-1234567. Assicurarsi che le bolle siano firmate in duplice copia.' },
    { id: 'n2', title: 'Note Riunione Logistica 15/07', notebook: 'Note Riunioni', isShared: true, lastModified: new Date(), content: 'Punti discussi: ottimizzazione percorsi, nuovo software di tracking, gestione ferie agosto.' },
    { id: 'n3', title: 'Codici allarme magazzino', notebook: 'Informazioni Riservate', isShared: false, lastModified: new Date(), content: 'Ingresso: 1234#, Uscita: 5678#. Non condividere.' },
];

export const KANBAN_COLUMNS: KanbanColumnID[] = [
    KanbanColumnID.ToDo,
    KanbanColumnID.InProgress,
    KanbanColumnID.Ready,
];