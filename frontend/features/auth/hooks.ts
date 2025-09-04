// Mock auth hooks for testing
export const useMe = () => ({
  data: { email: 'test@example.com', name: 'Test User' }
});

export const useLogout = () => ({
  mutateAsync: async () => {},
  isPending: false
});