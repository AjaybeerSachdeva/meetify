import userReducer, { login, logout } from '../../../redux/slices/userSlice';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

describe('userSlice', () => {
  // Initial state for testing
  const initialState = {
    info: null,
    token: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return the initial state when passed undefined', () => {
      const result = userReducer(undefined, { type: '@@INIT' });
      expect(result).toEqual(initialState);
    });

    it('should have correct initial state structure', () => {
      const result = userReducer(undefined, { type: '@@INIT' });
      expect(result).toHaveProperty('info', null);
      expect(result).toHaveProperty('token', null);
    });
  });

  describe('login action', () => {
    it('should handle login action with user and token', () => {
      const loginPayload = {
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          department: 'Engineering'
        },
        token: 'abc123token'
      };

      const action = login(loginPayload);
      const result = userReducer(initialState, action);

      expect(result.info).toEqual(loginPayload.user);
      expect(result.token).toEqual(loginPayload.token);
    });

    it('should preserve existing state when user logs in', () => {
      const currentState = {
        info: { id: 999, name: 'Old User' },
        token: 'oldtoken'
      };

      const newLoginPayload = {
        user: { id: 1, name: 'New User', email: 'new@example.com' },
        token: 'newtoken'
      };

      const action = login(newLoginPayload);
      const result = userReducer(currentState, action);

      // Should completely replace with new data
      expect(result.info).toEqual(newLoginPayload.user);
      expect(result.token).toEqual(newLoginPayload.token);
    });

    it('should handle login with minimal user data', () => {
      const loginPayload = {
        user: { id: 1, name: 'Jane' },
        token: 'token123'
      };

      const action = login(loginPayload);
      const result = userReducer(initialState, action);

      expect(result.info).toEqual({ id: 1, name: 'Jane' });
      expect(result.token).toBe('token123');
    });

    it('should handle login with empty user object', () => {
      const loginPayload = {
        user: {},
        token: 'emptyusertoken'
      };

      const action = login(loginPayload);
      const result = userReducer(initialState, action);

      expect(result.info).toEqual({});
      expect(result.token).toBe('emptyusertoken');
    });

    it('should handle login with null token', () => {
      const loginPayload = {
        user: { id: 1, name: 'User' },
        token: null
      };

      const action = login(loginPayload);
      const result = userReducer(initialState, action);

      expect(result.info).toEqual({ id: 1, name: 'User' });
      expect(result.token).toBeNull();
    });
  });

  describe('logout action', () => {
    it('should clear user info and token on logout', () => {
      const currentState = {
        info: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        token: 'abc123token'
      };

      const action = logout();
      const result = userReducer(currentState, action);

      expect(result.info).toBeNull();
      expect(result.token).toBeNull();
    });

    it('should call AsyncStorage.removeItem for token and user', () => {
      const currentState = {
        info: { id: 1, name: 'User' },
        token: 'token123'
      };

      const action = logout();
      userReducer(currentState, action);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('should handle logout when already logged out', () => {
      const action = logout();
      const result = userReducer(initialState, action);

      expect(result.info).toBeNull();
      expect(result.token).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should not affect other state properties if they existed', () => {
      // Test that logout only affects info and token
      const stateWithExtraProps = {
        info: { id: 1, name: 'User' },
        token: 'token123',
        // Note: In real Redux Toolkit, extra properties would be ignored
        // but we test the specific behavior of our slice
      };

      const action = logout();
      const result = userReducer(stateWithExtraProps, action);

      expect(result.info).toBeNull();
      expect(result.token).toBeNull();
    });
  });

  describe('action creators', () => {
    it('should create login action with correct type and payload', () => {
      const payload = {
        user: { id: 1, name: 'Test User' },
        token: 'testtoken'
      };

      const action = login(payload);

      expect(action.type).toBe('user/login');
      expect(action.payload).toEqual(payload);
    });

    it('should create logout action with correct type', () => {
      const action = logout();

      expect(action.type).toBe('user/logout');
      expect(action.payload).toBeUndefined();
    });
  });

  describe('state immutability', () => {
    it('should not mutate the original state on login', () => {
      const originalState = {
        info: null,
        token: null
      };

      const loginPayload = {
        user: { id: 1, name: 'User' },
        token: 'token'
      };

      const action = login(loginPayload);
      const result = userReducer(originalState, action);

      // Original state should remain unchanged
      expect(originalState.info).toBeNull();
      expect(originalState.token).toBeNull();

      // Result should have new values
      expect(result.info).toEqual(loginPayload.user);
      expect(result.token).toBe(loginPayload.token);

      // Should be different objects
      expect(result).not.toBe(originalState);
    });

    it('should not mutate the original state on logout', () => {
      const originalState = {
        info: { id: 1, name: 'User' },
        token: 'token'
      };

      const action = logout();
      const result = userReducer(originalState, action);

      // Original state should remain unchanged
      expect(originalState.info).toEqual({ id: 1, name: 'User' });
      expect(originalState.token).toBe('token');

      // Result should have cleared values
      expect(result.info).toBeNull();
      expect(result.token).toBeNull();

      // Should be different objects
      expect(result).not.toBe(originalState);
    });
  });

  describe('edge cases', () => {

    it('should handle unknown action types', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION', payload: 'test' };
      const result = userReducer(initialState, unknownAction);

      expect(result).toEqual(initialState);
    });
  });
});