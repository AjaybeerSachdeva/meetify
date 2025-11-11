import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

function AuthNavigator() {
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{
            headerStyle:{ backgroundColor:'#234b95ff' },
            headerTintColor:'white',
            headerTitleStyle:{ fontWeight:'bold' },
            headerTitleAlign:'center',
        }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

export default AuthNavigator;
