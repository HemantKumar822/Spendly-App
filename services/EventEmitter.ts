// Custom event emitter implementation for React Native
type Listener = (...args: any[]) => void;

class EventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  // Add a listener for an event
  addListener(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  // Remove a listener for an event
  removeListener(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  // Emit an event with arguments
  emit(event: string, ...args: any[]): void {
    if (!this.listeners.has(event)) return;
    
    // Create a copy of the listeners array to avoid issues if listeners are removed during execution
    const listeners = [...this.listeners.get(event)!];
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event: string): void {
    this.listeners.delete(event);
  }

  // Get the number of listeners for an event
  listenerCount(event: string): number {
    return this.listeners.has(event) ? this.listeners.get(event)!.length : 0;
  }
}

// Create a singleton instance
const eventEmitter = new EventEmitter();

// Define event types
export const EVENT_TYPES = {
  EXPENSE_ADDED: 'expenseAdded',
  EXPENSE_UPDATED: 'expenseUpdated',
  EXPENSE_DELETED: 'expenseDeleted',
  BUDGET_ADDED: 'budgetAdded',
  BUDGET_UPDATED: 'budgetUpdated',
  BUDGET_DELETED: 'budgetDeleted',
  DATA_CHANGED: 'dataChanged',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Export the event emitter instance
export default eventEmitter;