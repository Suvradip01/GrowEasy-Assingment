import { configureStore } from '@reduxjs/toolkit';
import importReducer from './importSlice';

export const store = configureStore({
  reducer: {
    import: importReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
