// Mock AsyncStorage first
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock userSlice to avoid AsyncStorage issues
jest.mock('../../redux/slices/userSlice', () => ({
  __esModule: true,
  default: jest.fn(() => ({})), // Mock reducer function
}));

describe("Redux Store", () => {
    let configureStore;
    let userReducer;
    let store;

    beforeEach(() => {
        // Clear the require cache
        jest.resetModules();
        
        // Mock RTK after clearing modules
        jest.doMock('@reduxjs/toolkit', () => {
            const actual = jest.requireActual('@reduxjs/toolkit');
            return {
                ...actual,
                configureStore: jest.fn(() => ({
                    dispatch: jest.fn(),
                    getState: jest.fn(),
                    subscribe: jest.fn(),
                    replaceReducer: jest.fn(),
                })),
            };
        });

        // Import the mocked configureStore
        configureStore = require('@reduxjs/toolkit').configureStore;
        
        // Import the mocked userReducer
        userReducer = require('../../redux/slices/userSlice').default;
        
        // Import the store (this will call configureStore)
        store = require('../../redux/store').store;
    });

    afterEach(() => {
        jest.dontMock('@reduxjs/toolkit');
    });

    it("configures store with correct reducers", () => {
        expect(configureStore).toHaveBeenCalledWith({
            reducer: {
                user: userReducer,
            }
        });
    });

    it("configureStore is called exactly once", () => {
        expect(configureStore).toHaveBeenCalledTimes(1);
    });

    it("exports a store object with required methods", () => {
        expect(store).toBeDefined();
        expect(typeof store.dispatch).toBe('function');
        expect(typeof store.getState).toBe('function');
        expect(typeof store.subscribe).toBe('function');
    });

    it("includes user reducer in store configuration", () => {
        const [[storeConfig]] = configureStore.mock.calls;
        
        expect(storeConfig.reducer).toHaveProperty('user');
        expect(storeConfig.reducer.user).toBe(userReducer);
    });

    it('configureStore receives object with reducer property', () => {
        const [[storeConfig]] = configureStore.mock.calls;
        
        // Verify the structure of the configuration object
        expect(storeConfig).toBeInstanceOf(Object);
        expect(storeConfig).toHaveProperty('reducer');
        expect(typeof storeConfig.reducer).toBe('object');
    });
});