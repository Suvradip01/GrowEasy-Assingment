import { configureStore } from '@reduxjs/toolkit';
import importReducer from './importSlice';

export const store = configureStore({
  reducer: {
    import: importReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
