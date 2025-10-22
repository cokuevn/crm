import { create } from 'zustand';

// Zustand store для глобального состояния приложения
export const useAppStore = create((set, get) => ({
  // Клиенты
  clients: [],
  setClients: (clients) => set({ clients }),
  
  // Просроченные платежи - вычисляемое значение
  get overdueCount() {
    const clients = get().clients;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    clients.forEach(client => {
      if (client.schedule) {
        client.schedule.forEach(payment => {
          if (payment.status === 'pending' || payment.status === 'overdue') {
            try {
              const paymentDate = new Date(payment.payment_date);
              paymentDate.setHours(0, 0, 0, 0);
              if (paymentDate < today) {
                count++;
              }
            } catch (e) {
              // Skip invalid dates
            }
          }
        });
      }
    });
    
    return count;
  },
  
  // Капиталы
  capitals: [],
  setCapitals: (capitals) => set({ capitals }),
  
  selectedCapital: null,
  setSelectedCapital: (capital) => set({ selectedCapital: capital }),
  
  // Уведомления
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));

export default useAppStore;

