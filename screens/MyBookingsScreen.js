import { ScrollView, StyleSheet, Text, View, Alert} from "react-native";
import { useSelector } from "react-redux";
import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigation,} from "@react-navigation/native";
import { getUserBookings, cancelBooking, deleteBooking } from "../util/database";
import BookingCard from "../components/BookingCard";
import { responsiveSize, responsiveFontSize, getHeaderFontSize } from "../util/responsive";

function MyBookingsScreen(){
    const navigation=useNavigation();
    const user = useSelector(state => state.user.info);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'My Bookings',
            headerTitleStyle: {
                fontSize: getHeaderFontSize(),
                fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
        })
    }, [navigation]);

    useEffect(() => {
        const loadMyBookings = async () => {
            try {
                console.log('🔄 Loading bookings for user:', user.id);
                const userBookings = await getUserBookings(user.id);
                const formattedBookings = userBookings.map(booking => ({
                    id: booking.id,
                    roomId: booking.room_id,
                    userId: booking.user_id,
                    title: booking.title,
                    description: booking.description,
                    date: booking.date,
                    startTime: `${booking.date}T${booking.start_time}:00`,
                    endTime: `${booking.date}T${booking.end_time}:00`,
                    status: booking.status,
                    roomName: booking.room_name,
                    roomFloor: booking.room_floor
                }));
                
                setMyBookings(formattedBookings);
                console.log('✅ Loaded', formattedBookings.length, 'bookings from database');
            } catch (error) {
                console.error('❌ Error loading user bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.id) {
            loadMyBookings();
        }
    }, [user]);

    const handleCancelBooking = async (bookingId) => {
        try {
            console.log('🔄 Cancelling booking:', bookingId);
            await cancelBooking(bookingId);
            
            setMyBookings(prevBookings => 
                prevBookings.filter(booking => booking.id !== bookingId)
            );
            
            console.log('✅ Booking cancelled successfully');
        } catch (error) {
            console.error('❌ Error cancelling booking:', error);
            Alert.alert('Error', 'Failed to cancel booking. Please try again.');
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        try {
            console.log('🗑️ Deleting booking:', bookingId);
            await deleteBooking(bookingId);
            
            setMyBookings(prevBookings => 
            prevBookings.filter(booking => booking.id !== bookingId)
            );
            
            Alert.alert('Success', 'Booking record deleted successfully!');
            console.log('✅ Booking record deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting booking:', error);
            Alert.alert('Error', 'Failed to delete booking record. Please try again.');
        }
        };



    if (loading) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.loadingText}>Loading your bookings...</Text>
            </View>
        );
    }

    if (myBookings.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>📅</Text>
                <Text style={styles.emptyMessage}>You have no bookings yet.</Text>
                <Text style={styles.emptySubMessage}>Book a room to see your reservations here!</Text>
            </View>
        );
    }

    return (
       <ScrollView style={styles.container}>
            <Text style={styles.header}>My Bookings ({myBookings.length})</Text>
            {myBookings.map((booking) => (
                <BookingCard 
                    key={booking.id} 
                    booking={booking}
                    onCancel={() => handleCancelBooking(booking.id)}
                    onDelete={() => handleDeleteBooking(booking.id)}
                />
            ))}
        </ScrollView>
    );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: responsiveFontSize.xl,
        fontWeight: 'bold',
        color: '#333',
        margin: responsiveSize.lg,
        marginBottom: responsiveSize.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: responsiveSize.xxl * 2,
    },
    emptyText: {
        fontSize: responsiveFontSize.header * 2,
        marginBottom: responsiveSize.xl,
    },
    emptyMessage: {
        fontSize: responsiveFontSize.xl,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: responsiveSize.md,
    },
    emptySubMessage: {
        fontSize: responsiveFontSize.lg,
        color: '#666',
        textAlign: 'center',
    },
    loadingText: {
        fontSize: responsiveFontSize.lg,
        color: '#666',
        textAlign: 'center',
    },
});