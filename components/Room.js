import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { responsiveSize, responsiveFontSize, scaleHeight } from "../util/responsive";

function Room({id,name,floor,capacity,amenities}) {
    const navigation=useNavigation();

    function selectRoomHandler(){
        navigation.navigate("BookRoom", {
            room: { id, name, floor, capacity, amenities }
        });
    }

    return <Pressable testID="room-pressable" style={({pressed})=>([styles.container,pressed && styles.pressed])}
     onPress={selectRoomHandler}>
        <View style={styles.innerContainer}>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.location}>{floor}</Text>
        </View>
        <Text style={styles.capacity}>Room has a capacity of {capacity} people</Text>
        <Text style={styles.amenities}>Amenities: {amenities.join(", ")}</Text>
    </Pressable>
}

export default Room;

const styles=StyleSheet.create({
    container:{
        padding: responsiveSize.md,
        margin: responsiveSize.md,
        borderWidth:1,
        borderColor:"#ccc",
        borderRadius: responsiveSize.sm,
        backgroundColor:"#f8f7eaff",
        shadowColor:"#000",
        shadowOffset:{width:0,height: scaleHeight(2)},
        shadowOpacity:0.3,
        shadowRadius: responsiveSize.xs,
        elevation:5,
        minHeight: responsiveSize.xxl * 4, // Minimum touch target
    },
    pressed:{
        opacity:0.75
    },
    innerContainer:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:'space-between',
        marginBottom: responsiveSize.md,
    },
    title:{
        fontSize: responsiveFontSize.xl,
        fontWeight:"bold",
        flexShrink: 1, // Allow text wrapping
    },
    location:{
        fontSize: responsiveFontSize.md,
        color:"#666",
        marginBottom: responsiveSize.md
    },
    capacity:{
        fontSize: responsiveFontSize.lg,
        marginBottom: responsiveSize.xs,
        flexWrap: 'wrap',
    },
    amenities:{
        fontSize: responsiveFontSize.md,
        color:"#333",
        flexWrap: 'wrap',
    }
});