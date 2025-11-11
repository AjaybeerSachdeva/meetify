import { useLayoutEffect, useState, useEffect } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View, Alert, Pressable } from "react-native";
import IconButton from "../components/IconButton";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slices/userSlice";
import { mockRooms } from "../data/mockData";
import Room from "../components/Room";
import { getAllRooms } from "../util/database";
import UserProfileModal from "../components/UserProfileModal";
import { responsiveSize, responsiveFontSize, scaleWidth, getDynamicSize, getLayoutConfig, getHeaderFontSize, getHeaderIconSize, useOrientation } from "../util/responsive";

function RoomListScreen({navigation}){
const dispatch=useDispatch();
const [rooms,setRooms]=useState([]);
const [showProfileModal,setShowProfileModal]=useState(false);
const isLandscape=useOrientation();

useEffect(()=>{
    const loadRooms=async()=>{
        try{
            console.log('Loading rooms from database...');
            const dbRooms=await getAllRooms();
            setRooms(dbRooms);
            console.log(`Loaded ${dbRooms.length} rooms from database.`);
        }catch(error){
            console.error('Error loading rooms:',error);
            Alert.alert('Error','Failed to load rooms.');
        }
    };
    loadRooms();
},[]);

function logoutHandler(){
    Alert.alert('Logout','Are you sure you want to logout?',[
        {text:'Cancel',style:'cancel'},
        {text:'Logout',style:'destructive',onPress:confirmLogoutHandler}
    ]);
}
function confirmLogoutHandler(){
    dispatch(logout());
}
function myBookingsHandler(){
    navigation.navigate('MyBookings');
}

useLayoutEffect(() => {
    navigation.setOptions({
        headerTitle: 'Conference Rooms', // Add explicit title
        headerTitleStyle: {
            fontSize: getHeaderFontSize(), // Responsive title size
            fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
        headerLeft: () => (
            <View style={styles.headerIconContainer}>
                <IconButton 
                    icon='meeting-room' 
                    size={getHeaderIconSize()} 
                    color='white' 
                    onPress={myBookingsHandler}
                />
            </View>
        ),
        headerRight: () => (
            <View style={styles.headerIconContainer}>
                <IconButton 
                    icon='logout' 
                    size={getHeaderIconSize()} 
                    color='white' 
                    onPress={logoutHandler}
                />
            </View>
        ),
        headerLeftContainerStyle: {
            paddingLeft: responsiveSize.xs,
            width: responsiveSize.xxl * 1.8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerRightContainerStyle: {
            paddingRight: responsiveSize.xs,
            width: responsiveSize.xxl * 1.8,
            justifyContent: 'center',
            alignItems: 'center',
        },
    })
}, [navigation]);

const layoutConfig=getLayoutConfig();

    return (
        <View style={isLandscape? styles.containerLandscape:styles.container}>
        <ScrollView style={isLandscape?styles.scrollViewLandscape:styles.scrollView} alwaysBounceVertical={true}>
            {rooms.map((room)=>(
                <Room key={room.id}
                 id={room.id}
                  name={room.name}
                   floor={room.floor}
                    capacity={room.capacity}
                     amenities={room.amenities}
                     testID= {`room-${room.id}`}/>
            ))}
        </ScrollView>
        <Pressable testID="profile-fab" style={[styles.floatingButton,{ bottom:layoutConfig.floatingButtonPosition.bottom,
            right:layoutConfig.floatingButtonPosition.right
        }]} onPress={() => setShowProfileModal(true)}>
            <IconButton testID='profile-fab-icon' onPress={() => setShowProfileModal(true)} icon='person' size={getDynamicSize(20, 24, 28)} color='white'/>
        </Pressable>
        <UserProfileModal testID='profile-modal' visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </View>
    );
}

export default RoomListScreen;

const styles=StyleSheet.create({
    container:{
        flex:1,
    },
    containerLandscape:{
        flex:1,
        flexDirection:'row',
        paddingHorizontal:responsiveSize.xl,
    },
    scrollView:{
        flex:1,
        padding:responsiveSize.lg,
        margin:responsiveSize.md
    },
    scrollViewLandscape: {
        flex: 1,
        padding: responsiveSize.md,
        margin: responsiveSize.sm,
    },
    floatingButton:{
        position: 'absolute',    
        width: scaleWidth(60),
        height: scaleWidth(60),
        borderRadius: scaleWidth(30),  
        backgroundColor: '#007AFF',
        justifyContent: 'center', 
        alignItems: 'center',      
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: responsiveSize.xs },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize.sm,
        elevation: 8, 
    },
    headerIconContainer: {
        width: responsiveSize.xl,         // Fixed container width
        height: responsiveSize.xl,        // Fixed container height  
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: responsiveSize.xs,
    },
});