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
  setSelectedCapital: (capital) => {
    const current = get().selectedCapital;
    if (current?.id !== capital?.id) {
      // Clear cache when capital changes
      set({ 
        selectedCapital: capital,
        dashboardData: null,
        analyticsData: null,
        analyticsV2Data: null,
        monthPaymentsData: null,
        lastDashboardFetch: null,
        lastAnalyticsFetch: null
      });
    } else {
      set({ selectedCapital: capital });
    }
  },
  
  // Dashboard Cache
  dashboardData: null,
  lastDashboardFetch: null,
  setDashboardData: (data) => set({ dashboardData: data, lastDashboardFetch: Date.now() }),
  
  // Analytics Cache
  analyticsData: null,
  analyticsV2Data: null,
  monthPaymentsData: null,
  lastAnalyticsFetch: null,
  setAnalyticsData: (v1, v2) => set({ 
    analyticsData: v1, 
    analyticsV2Data: v2, 
    lastAnalyticsFetch: Date.now() 
  }),
  setMonthPaymentsData: (data) => set({ monthPaymentsData: data }),

  // Helpers to check if cache is stale (e.g. > 2 minutes)
  isDashboardStale: () => {
    const last = get().lastDashboardFetch;
    if (!last) return true;
    return (Date.now() - last) > 120000; // 2 minutes
  },
  isAnalyticsStale: () => {
    const last = get().lastAnalyticsFetch;
    if (!last) return true;
    return (Date.now() - last) > 120000; // 2 minutes
  },

  invalidateCache: () => set({
    dashboardData: null,
    analyticsData: null,
    analyticsV2Data: null,
    monthPaymentsData: null,
    lastDashboardFetch: null,
    lastAnalyticsFetch: null
  }),
  
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

