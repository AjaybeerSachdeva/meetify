import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoomListScreen from '../screens/RoomListScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName='RoomList' screenOptions={{
            headerStyle:{ backgroundColor:'#234b95ff' },
            headerTintColor:'white',
            headerTitleStyle:{ fontWeight:'bold' },
            headerTitleAlign:'center',
        }}>
      <Stack.Screen name="RoomList" component={RoomListScreen}
      options={{title:'Conference Rooms'}} />
      <Stack.Screen name="BookRoom" component={BookingScreen}
      options={{title:'Book a Room'}} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen}
      options={{title:'My Bookings'}} />
    </Stack.Navigator>
  );
}