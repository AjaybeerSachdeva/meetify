import React,{ useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './redux/store';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from './screens/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from './redux/slices/userSlice';
import { init, insertDefaultRooms, insertDefaultUsers } from './util/database';
import { LogBox } from 'react-native';

function MainNavigator() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.info);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log("Initializing database...");
        await init();
        console.log("Database tables created");

        await insertDefaultRooms();
        await insertDefaultUsers();
        console.log("Default data inserted");

        const token = await AsyncStorage.getItem('token');
        const userInfo = await AsyncStorage.getItem('user');
        if (token && userInfo) {
          dispatch(login({ token, user: JSON.parse(userInfo) }));
        }
      } catch (error) {
        console.error('App initialization error', error);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, [dispatch]);

  // Add this line in your App component, before the return statement
LogBox.ignoreLogs(['Warning: Error: Exception in HostFunction']);

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainNavigator />
    </Provider>
  );
}