import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { capitalService } from '../services/capitalService';
import { clientService } from '../services/clientService';
import { expenseService, analyticsService, dashboardService } from '../services/dataService';

// App context
const AppContext = createContext();

// App reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIALIZING':
      return { ...state, initializing: action.payload };
    case 'SET_CAPITALS_LOADING':
      return { ...state, capitalsLoading: action.payload };
    case 'SET_CLIENTS_LOADING':
      return { ...state, clientsLoading: action.payload };
    case 'SET_CAPITALS':
      return { ...state, capitals: action.payload };
    case 'SET_SELECTED_CAPITAL':
      return { ...state, selectedCapital: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.client_id === action.payload.client_id ? action.payload : client
        )
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.client_id !== action.payload)
      };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.expense_id === action.payload.expense_id ? action.payload : expense
        )
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.expense_id !== action.payload)
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  loading: false,
  initializing: true,
  capitalsLoading: false,
  clientsLoading: false,
  capitals: [],
  selectedCapital: null,
  clients: [],
  expenses: [],
  analytics: null,
  dashboard: null,
  error: null,
  currentPage: 'dashboard'
};

// App provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Error handler
  const handleError = useCallback((error) => {
    console.error('App error:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message || 'Произошла ошибка' });
  }, []);

  // Capital methods
  const loadCapitals = useCallback(async () => {
    try {
      dispatch({ type: 'SET_CAPITALS_LOADING', payload: true });
      const capitals = await capitalService.getAll();
      dispatch({ type: 'SET_CAPITALS', payload: capitals });
      
      // Auto-select first capital if none selected
      if (capitals.length > 0 && !state.selectedCapital) {
        dispatch({ type: 'SET_SELECTED_CAPITAL', payload: capitals[0] });
      }
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_CAPITALS_LOADING', payload: false });
    }
  }, [state.selectedCapital, handleError]);

  const selectCapital = useCallback((capital) => {
    dispatch({ type: 'SET_SELECTED_CAPITAL', payload: capital });
  }, []);

  const createCapital = useCallback(async (capitalData) => {
    try {
      const newCapital = await capitalService.create(capitalData);
      await loadCapitals(); // Reload all capitals
      return newCapital;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [loadCapitals, handleError]);

  const updateCapitalBalance = useCallback(async (capitalId, newBalance) => {
    try {
      // Update the capital balance (you might need to add this endpoint to the backend)
      const updatedCapital = await capitalService.updateBalance(capitalId, newBalance);
      await loadCapitals(); // Reload all capitals to get updated data
      return updatedCapital;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [loadCapitals, handleError]);

  const deleteCapital = useCallback(async (capitalId) => {
    try {
      await capitalService.delete(capitalId);
      await loadCapitals(); // Reload all capitals
      // If the deleted capital was selected, clear selection
      if (state.selectedCapital?.id === capitalId) {
        dispatch({ type: 'SET_SELECTED_CAPITAL', payload: null });
      }
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [loadCapitals, handleError, state.selectedCapital]);

  // Client methods
  const loadClients = useCallback(async (capitalId = null) => {
    try {
      dispatch({ type: 'SET_CLIENTS_LOADING', payload: true });
      const clients = await clientService.getAll(capitalId);
      dispatch({ type: 'SET_CLIENTS', payload: clients });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_CLIENTS_LOADING', payload: false });
    }
  }, [handleError]);

  const createClient = useCallback(async (clientData) => {
    try {
      const newClient = await clientService.create(clientData);
      dispatch({ type: 'ADD_CLIENT', payload: newClient });
      return newClient;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      const updatedClient = await clientService.update(clientId, clientData);
      dispatch({ type: 'UPDATE_CLIENT', payload: updatedClient });
      return updatedClient;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  const deleteClient = useCallback(async (clientId) => {
    try {
      await clientService.delete(clientId);
      dispatch({ type: 'DELETE_CLIENT', payload: clientId });
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  // Expense methods
  const loadExpenses = useCallback(async (capitalId = null) => {
    try {
      const expenses = await expenseService.getAll(capitalId);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const createExpense = useCallback(async (expenseData) => {
    try {
      const newExpense = await expenseService.create(expenseData);
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      return newExpense;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  // Analytics methods
  const loadAnalytics = useCallback(async (capitalId) => {
    try {
      const analytics = await analyticsService.getByCapital(capitalId);
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  // Dashboard methods
  const loadDashboard = useCallback(async (capitalId = null) => {
    try {
      const dashboard = await dashboardService.getData(capitalId);
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  // Auto-init
  const autoInit = useCallback(async () => {
    try {
      dispatch({ type: 'SET_INITIALIZING', payload: true });
      await capitalService.autoInit();
      await loadCapitals();
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_INITIALIZING', payload: false });
    }
  }, [loadCapitals, handleError]);

  // Navigation
  const setCurrentPage = useCallback((page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const value = {
    ...state,
    // Capital methods
    loadCapitals,
    selectCapital,
    createCapital,
    // Client methods
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    // Expense methods
    loadExpenses,
    createExpense,
    // Analytics methods
    loadAnalytics,
    // Dashboard methods
    loadDashboard,
    // Utils
    autoInit,
    setCurrentPage,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};