// Simple toast implementation for Vue
export const useToast = () => {
  const toast = (options) => {
    // Simple alert for now - can be replaced with a proper toast library
    if (options.variant === 'destructive') {
      console.error(options.title, options.description);
    } else {
      console.log(options.title, options.description);
    }
    
    // You can integrate a toast library like vue-toastification here
    // For now, we'll use a simple approach
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${options.title}: ${options.description}`);
    }
  };

  return { toast };
};

