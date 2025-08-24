import { useEffect } from 'react';
import eventEmitter, { EventType } from '@/services/EventEmitter';

/**
 * Custom hook for subscribing to app-wide data events
 * @param eventType - The type of event to subscribe to
 * @param callback - Function to call when the event is emitted
 */
export const useDataSubscription = (eventType: EventType, callback: (...args: any[]) => void) => {
  useEffect(() => {
    // Attach event listener
    eventEmitter.addListener(eventType, callback);
    
    // Cleanup function to remove event listener
    return () => {
      eventEmitter.removeListener(eventType, callback);
    };
  }, [eventType, callback]);
};

/**
 * Custom hook for subscribing to expense-related events
 * @param callback - Function to call when any expense event is emitted
 */
export const useExpenseSubscription = (callback: (...args: any[]) => void) => {
  useEffect(() => {
    // Attach listeners for all expense events
    eventEmitter.addListener('expenseAdded', callback);
    eventEmitter.addListener('expenseUpdated', callback);
    eventEmitter.addListener('expenseDeleted', callback);
    
    // Cleanup function to remove event listeners
    return () => {
      eventEmitter.removeListener('expenseAdded', callback);
      eventEmitter.removeListener('expenseUpdated', callback);
      eventEmitter.removeListener('expenseDeleted', callback);
    };
  }, [callback]);
};

/**
 * Custom hook for subscribing to budget-related events
 * @param callback - Function to call when any budget event is emitted
 */
export const useBudgetSubscription = (callback: (...args: any[]) => void) => {
  useEffect(() => {
    // Attach listeners for all budget events
    eventEmitter.addListener('budgetAdded', callback);
    eventEmitter.addListener('budgetUpdated', callback);
    eventEmitter.addListener('budgetDeleted', callback);
    
    // Cleanup function to remove event listeners
    return () => {
      eventEmitter.removeListener('budgetAdded', callback);
      eventEmitter.removeListener('budgetUpdated', callback);
      eventEmitter.removeListener('budgetDeleted', callback);
    };
  }, [callback]);
};

export default useDataSubscription;