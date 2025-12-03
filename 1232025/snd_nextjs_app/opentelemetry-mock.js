// Mock OpenTelemetry API to prevent context.getValue errors
const createDefaultContext = () => {
  const baseContext = {
    getValue: () => undefined,
    setValue: () => undefined,
    deleteValue: () => undefined,
    getValues: () => ({}),
    active: () => undefined,
    createContextKey: (name) => Symbol(name),
    with: (ctx, f) => f ? f(ctx) : ctx,
    bind: (target, ctx) => target,
    extract: (carrier, getter) => undefined,
    inject: (ctx, carrier, setter) => {},
    SERVER: Symbol('SERVER'),
  };
  
  // Make the context immutable and add getters to prevent property access issues
  return new Proxy(baseContext, {
    get(target, prop, receiver) {
      // Always ensure we have a valid target
      if (!target || typeof target !== 'object') {
        target = baseContext;
      }
      
      if (prop in target) {
        return target[prop];
      }
      
      // Return safe defaults for any missing properties
      if (prop === 'SERVER') {
        return Symbol('SERVER');
      }
      if (prop === 'getValue' || prop === 'setValue' || prop === 'deleteValue' || prop === 'getValues' || prop === 'active') {
        return () => undefined;
      }
      if (prop === 'createContextKey') {
        return (name) => Symbol(name);
      }
      if (prop === 'with') {
        return (ctx, f) => f ? f(ctx) : ctx;
      }
      if (prop === 'bind') {
        return (target, ctx) => target;
      }
      if (prop === 'extract') {
        return (carrier, getter) => undefined;
      }
      if (prop === 'inject') {
        return (ctx, carrier, setter) => {};
      }
      
      // For any other property, return undefined
      return undefined;
    },
    set(target, prop, value) {
      // Always ensure we have a valid target
      if (!target || typeof target !== 'object') {
        target = baseContext;
      }
      
      // Allow setting properties but ensure they're safe
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      // Always ensure we have a valid target
      if (!target || typeof target !== 'object') {
        target = baseContext;
      }
      
      // Always return true for required properties
      if (prop === 'SERVER' || prop === 'getValue' || prop === 'setValue' || prop === 'deleteValue' || 
          prop === 'getValues' || prop === 'active' || prop === 'createContextKey' || prop === 'with' || 
          prop === 'bind' || prop === 'extract' || prop === 'inject') {
        return true;
      }
      
      return prop in target;
    }
  });
};

const mockContext = createDefaultContext();

// Ensure the SERVER property is always available on the context
Object.defineProperty(mockContext, 'SERVER', {
  value: Symbol('SERVER'),
  writable: false,
  configurable: false,
  enumerable: true,
});

// Also add it as a regular property for compatibility
mockContext.SERVER = Symbol('SERVER');

const mockTrace = {
  getSpan: () => undefined,
  getSpanContext: () => undefined,
  withPropagatedContext: (fn) => fn(),
  getTracer: () => ({
    startSpan: () => ({
      end: () => {},
      setStatus: () => {},
      setAttributes: () => {},
    }),
    startActiveSpan: (name, options, fn) => {
      const span = {
        end: () => {},
        setStatus: () => {},
        setAttributes: () => {},
        setAttribute: () => {},
        recordException: () => {},
        updateName: () => {},
      };
      if (fn) {
        return fn(span);
      }
      return span;
    },
  }),
  trace: (name, options, fn) => {
    if (fn) {
      return fn();
    }
    return undefined;
  },
  // Add missing propagation methods
  getActiveSpan: () => undefined,
  setSpan: (context, span) => context,
  setSpanContext: (context, spanContext) => context,
  deleteSpan: (context) => context,
  getSpan: (context) => undefined,
  getSpanContext: (context) => undefined,
};

const mockAPI = {
  context: mockContext,
  trace: mockTrace,
  // Add any other OpenTelemetry exports that might be needed
  diag: {
    setLogger: () => {},
    setLogLevel: () => {},
    log: () => {},
  },
  metrics: {
    getMeter: () => ({
      createCounter: () => ({
        add: () => {},
      }),
      createHistogram: () => ({
        record: () => {},
      }),
    }),
  },
  // Add missing methods that Next.js expects
  createContextKey: (name) => Symbol(name),
  with: (context, fn) => {
    try {
      // Always create a fresh, safe context
      const safeContext = createDefaultContext();
      
      // Ensure the SERVER property is always available
      if (!safeContext.SERVER) {
        safeContext.SERVER = Symbol('SERVER');
      }
      
      // If we have a function, call it with the safe context
      if (typeof fn === 'function') {
        return fn(safeContext);
      }
      
      // If we have a context function, call it
      if (typeof context === 'function') {
        return context();
      }
      
      // Return the safe context
      return safeContext;
    } catch (error) {
      // If anything goes wrong, return a minimal safe context
      return {
        getValue: () => undefined,
        setValue: () => undefined,
        deleteValue: () => undefined,
        getValues: () => ({}),
        active: () => undefined,
        createContextKey: (name) => Symbol(name),
        with: (ctx, f) => f ? f(ctx) : ctx,
        bind: (target, ctx) => target,
        extract: (carrier, getter) => undefined,
        inject: (ctx, carrier, setter) => {},
        SERVER: Symbol('SERVER'),
      };
    }
  },
  bind: (target, context) => target,
  // Add propagation methods
  propagation: {
    extract: (carrier, getter) => undefined,
    inject: (context, carrier, setter) => {},
    fields: () => [],
  },
  // Add trace methods
  trace: mockTrace,
  // Add context methods
  context: mockContext,
  // Add SERVER property that Next.js expects
  SERVER: Symbol('SERVER'),
};

// Ensure the context object has all required properties
Object.defineProperty(mockAPI.context, 'SERVER', {
  value: Symbol('SERVER'),
  writable: false,
  configurable: false,
  enumerable: true,
});

// Ensure the API object has all required properties
Object.defineProperty(mockAPI, 'SERVER', {
  value: Symbol('SERVER'),
  writable: false,
  configurable: false,
  enumerable: true,
});

// Create a getter for the context property to ensure it's always properly structured
Object.defineProperty(mockAPI, 'context', {
  get() {
    // Always return a properly structured context
    const ctx = createDefaultContext();
    Object.defineProperty(ctx, 'SERVER', {
      value: Symbol('SERVER'),
      writable: false,
      configurable: false,
      enumerable: true,
    });
    return ctx;
  },
  configurable: false,
  enumerable: true,
});

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = mockAPI;
} else {
  // ES modules
  export default mockAPI;
}
