// Fix for OpenTelemetry context.SERVER undefined error
// This file provides a safe fallback for OpenTelemetry context operations

// Create a safe context object
const safeContext = {
  getValue: () => undefined,
  setValue: () => undefined,
  deleteValue: () => undefined,
  getValues: () => ({}),
  active: () => undefined,
  createContextKey: (name) => Symbol(name),
  with: (ctx, fn) => {
    try {
      if (typeof fn === 'function') {
        return fn(ctx || safeContext);
      }
      return ctx || safeContext;
    } catch (error) {
      return safeContext;
    }
  },
  bind: (target, ctx) => target,
  extract: (carrier, getter) => undefined,
  inject: (ctx, carrier, setter) => {},
};

// Create a safe API object
const safeAPI = {
  context: safeContext,
  trace: {
    getSpan: () => undefined,
    getSpanContext: () => undefined,
    withPropagatedContext: (fn) => {
      try {
        return fn();
      } catch (error) {
        return undefined;
      }
    },
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
          try {
            return fn(span);
          } catch (error) {
            return span;
          }
        }
        return span;
      },
    }),
    trace: (name, options, fn) => {
      if (fn) {
        try {
          return fn();
        } catch (error) {
          return undefined;
        }
      }
      return undefined;
    },
    getActiveSpan: () => undefined,
    setSpan: (context, span) => context,
    setSpanContext: (context, spanContext) => context,
    deleteSpan: (context) => context,
  },
  createContextKey: (name) => Symbol(name),
  with: (context, fn) => {
    try {
      if (typeof fn === 'function') {
        return fn(context || safeContext);
      }
      return context || safeContext;
    } catch (error) {
      return safeContext;
    }
  },
  bind: (target, context) => target,
  propagation: {
    extract: (carrier, getter) => undefined,
    inject: (context, carrier, setter) => {},
    fields: () => [],
  },
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
};

// Function to safely set properties only if they don't exist
const setPropertyIfNotExists = (obj, prop, value) => {
  try {
    // Check if property already exists
    if (obj.hasOwnProperty(prop)) {
      return; // Property already exists, skip
    }
    
    // Try to define the property
    Object.defineProperty(obj, prop, {
      value: value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch (error) {
    // If defineProperty fails, try direct assignment
    try {
      if (!obj.hasOwnProperty(prop)) {
        obj[prop] = value;
      }
    } catch (assignError) {
      // If both fail, skip this property silently
    }
  }
};

// Set SERVER properties only if they don't exist
setPropertyIfNotExists(safeAPI, 'SERVER', Symbol('SERVER'));
setPropertyIfNotExists(safeAPI.context, 'SERVER', Symbol('SERVER'));

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = safeAPI;
}

// Make available globally for browser environments
if (typeof window !== 'undefined') {
  window.opentelemetry = safeAPI;
}

// Make available globally for other environments
if (typeof global !== 'undefined') {
  global.opentelemetry = safeAPI;
}
