import React, { useState, useEffect , useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { createBooking, getDayBookings } from '../util/database';
import { responsiveSize, responsiveFontSize, scaleHeight, getHeaderFontSize, useOrientation } from '../util/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';


const { width, height } = Dimensions.get('window');
const isTablet = width >= 768; 


const normalizeTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};


const isValidTime = (timeString) => {
  if (!timeString || !timeString.trim()) {
    return false;
  }
  
  const time = timeString.trim();
  
  // Handle both "9:00" and "09:00" formats
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return false;
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  
  // Validate ranges
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return false;
  }
  
  // Business hours: 9:00 to 20:00
  if (hours < 9 || hours > 20) {
    return false;
  }
  
  return true;
};


function BookingScreen({ route, navigation }) {
  const isLandscape = useOrientation();
  const { room } = route.params;
  const user = useSelector(state => state.user.info);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: `Book ${room.name}`,
      headerTitleStyle: {
        fontSize: getHeaderFontSize(),
        fontWeight: 'bold',
      },
      headerTitleAlign: 'center',
    });
  }, [navigation, room.name]);

  const today = new Date();
  if(today.getHours() >= 20) {
    today.setDate(today.getDate() + 1);
  }

  const [selectedDate, setSelectedDate]=useState(today);
  const [showDatePicker,setShowDatePicker]=useState(false);

  const [showStartTimePicker,setShowStartTimePicker]=useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTimeDate, setStartTimeDate] = useState(() => {
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0); // 9:00 AM
      return defaultTime;
    }); 

const [endTimeDate, setEndTimeDate] = useState(() => {
      const defaultTime = new Date();
      defaultTime.setHours(17, 0, 0, 0); // 8:00 PM
      return defaultTime;
    });

  const dateString = selectedDate.toISOString().split('T')[0];
  console.log("Date string is ",dateString);

  // const [date, setDate] = useState(formattedDate);
  const [dateError, setDateError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  // Load bookings from database when date changes
  useEffect(() => {
    const loadBookings = async () => {
      if (dateString) {
        try {
          console.log('🔄 Loading bookings for', dateString);
          const dayBookings = await getDayBookings(room.id, dateString);
          setExistingBookings(dayBookings);
          
          const slots = calculateAvailableSlots(dayBookings);
          setAvailableSlots(slots);
          
          console.log('✅ Loaded', dayBookings.length, 'bookings for', dateString);
        } catch (error) {
          console.error('❌ Error loading bookings:', error);
        }
      }
    };
    
    loadBookings();
  }, [dateString, room.id]);

  const calculateAvailableSlots = (bookings) => {
    const businessStart = 9; 
    const businessEnd = 20; 
    const slotDuration = 0.5; 
    
    const formattedBookings = bookings.map(booking => ({
      startTime: `${dateString}T${booking.start_time}:00`,
      endTime: `${dateString}T${booking.end_time}:00`,
      roomId: booking.room_id,
      status: booking.status
    }));
    
    formattedBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    const availableSlots = [];
    let currentTime = businessStart;
    
    for (const booking of formattedBookings) {
      const bookingStart = new Date(booking.startTime).getHours() + 
                          new Date(booking.startTime).getMinutes() / 60;
      const bookingEnd = new Date(booking.endTime).getHours() + 
                        new Date(booking.endTime).getMinutes() / 60;
      
      if (currentTime + slotDuration <= bookingStart) {
        availableSlots.push({
          start: formatTime(currentTime),
          end: formatTime(bookingStart),
          startHour: currentTime,
          endHour: bookingStart
        });
      }
      
      currentTime = Math.max(currentTime, bookingEnd);
    }
    
    if (currentTime + slotDuration <= businessEnd) {
      availableSlots.push({
        start: formatTime(currentTime),
        end: formatTime(businessEnd),
        startHour: currentTime,
        endHour: businessEnd
      });
    }
    
    return availableSlots;
  };

  const formatTime = (hour) => {
  const hours = Math.floor(hour);
  const minutes = Math.round((hour - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

  const onDateChange = (event, selectedDate) => {
  if (Platform.OS === 'android') {
    setShowDatePicker(false);
  }
  
  if (selectedDate) {
    setSelectedDate(selectedDate);
    setDateError(''); // Clear any previous errors
  }
};

const onStartTimeChange = (event, selectedTime) => {
  console.log('🕒 Start time picker event:', event.type);
  
  if (Platform.OS === 'android') {
    setShowStartTimePicker(false);
  }
  
  if (selectedTime && event.type !== 'dismissed') {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    
    console.log('🕒 Selected start time:', hours, ':', minutes);
    
    // Validate business hours (9 AM to 8 PM)
    if (hours < 9 || hours > 20) {
      Alert.alert('Invalid Time', 'Please select a time between 9:00 AM and 8:00 PM');
      return;
    }
    
    setStartTimeDate(selectedTime);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setStartTime(formattedTime);
    
    console.log('✅ Start time set to:', formattedTime);
  }
};

const onEndTimeChange = (event, selectedTime) => {
  console.log('🕒 End time picker event:', event.type);
  
  if (Platform.OS === 'android') {
    setShowEndTimePicker(false);
  }
  
  if (selectedTime && event.type !== 'dismissed') {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    
    console.log('🕒 Selected end time:', hours, ':', minutes);
    
    // Validate business hours (9 AM to 8 PM)
    if (hours < 9 || hours > 20) {
      Alert.alert('Invalid Time', 'Please select a time between 9:00 AM and 8:00 PM');
      return;
    }
    
    setEndTimeDate(selectedTime);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setEndTime(formattedTime);
    
    console.log('✅ End time set to:', formattedTime);
  }
};

const showStartTimepicker = () => {
    console.log('🕒 Opening start time picker');
    setShowStartTimePicker(true);
  };

  const showEndTimepicker = () => {
    console.log('🕒 Opening end time picker');
    setShowEndTimePicker(true);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Update booking handler to use database
  const handleBooking = async () => {
  if (!dateString || !startTime || !endTime || !title) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  // Single date validation section
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Add past date validation here
  if (inputDate < today) {
    Alert.alert('Invalid Date', 'Cannot book rooms for past dates. Please select today or a future date.');
    return;
  }
  
  // Add future date validation (6 months limit)
  const maxDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months ahead
  if (inputDate > maxDate) {
    Alert.alert('Invalid Date', 'Cannot book rooms more than 6 months in advance.');
    return;
  }

  if(description.length >= 100) {
    Alert.alert('Error', 'Description should be less than 100 characters');
    return;
  }

  if (!isValidTime(startTime)) {
    Alert.alert('Error', 'Please enter valid start time (09:00 to 20:00)');
    return;
  }

  if (!isValidTime(endTime)) {
    Alert.alert('Error', 'Please enter valid end time (09:00 to 20:00)');
    return;
  }

  // Normalize times for consistent storage
  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);

  // Check if booking is for today (reuse existing variables)
  const isToday = inputDate.toDateString() === today.toDateString();

  if (isToday) {
    const currentTime = new Date(); // Use different variable for current time
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
    const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);

    if (startHour < currentHour || (startHour === currentHour && startMinute <= currentMinute)) {
      Alert.alert('Error', 'Cannot book a time that has already passed today');
      return;
    }

    if (endHour < currentHour || (endHour === currentHour && endMinute <= currentMinute)) {
      Alert.alert('Error', 'End time cannot be in the past');
      return;
    }
  }

  const startDateTime = `${dateString}T${normalizedStartTime}:00`;
  const endDateTime = `${dateString}T${normalizedEndTime}:00`;

  if (new Date(endDateTime) <= new Date(startDateTime)) {
    Alert.alert('Error', 'End time must be after start time');
    return;
  }

  try {
    const bookingData = {
      id: Date.now().toString(),
      roomId: room.id,
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      date: dateString, // YYYY-MM-DD format for database
      startTime: normalizedStartTime, // HH:MM format for database
      endTime: normalizedEndTime, // HH:MM format for database
    };

    console.log('🔄 Creating booking:', bookingData);
    
    await createBooking(bookingData);
    
    Alert.alert(
      'Success',
      'Room booked successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    
    console.log('✅ Booking created successfully');
    
  } catch (error) {
    Alert.alert('Booking Failed', error.message);
  }
};

  // Format existing bookings for display
  const formatExistingBookings = () => {
    return existingBookings.map(booking => ({
      startTime: booking.start_time,
      endTime: booking.end_time,
      title: booking.title
    }));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Room Info Section */}
      <View style={styles.roomSection}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDetails}>
          Capacity: {room.capacity} • {room.floor}
        </Text>
        <Text style={styles.amenities}>
          Amenities: {room.amenities.join(', ')}
        </Text>
      </View>

      {/* Date Selection */}
      <View style={styles.dateSection}>
        <View style={styles.sectionTitleRowContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Text style={styles.dateInfoTextInline}>📋 Up to 6 months</Text>
        </View>
        
        <Pressable style={styles.datePickerButton} onPress={showDatepicker}>
          <Text style={styles.datePickerText}>
            📅 {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.datePickerSubtext}>
            {dateString} • Tap to change
          </Text>
        </Pressable>

        {showDatePicker && (
          <View style={styles.dateTimePickerContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()} // Prevent past dates
            maximumDate={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)} // 180 days ahead
          />
          </View>
        )}

        {Platform.OS === 'ios' && showDatePicker && (
          <Pressable style={styles.datePickerDoneButton} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.datePickerDoneText}>Done</Text>
          </Pressable>
        )}

        {dateError ? (
          <Text style={styles.errorText}>{dateError}</Text>
        ) : null}
      </View>

      {/* Available Slots Section */}
      <View style={styles.availabilitySection}>
        <Text style={styles.sectionTitle}>🟢 Available Time Slots</Text>
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, index) => (
            <View
            key={index}
            style={[styles.slotCard, styles.availableSlot]}
          >
              <Text style={styles.slotTime}>⏰ {slot.start} - {slot.end}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noSlotsText}>No available slots for this date</Text>
        )}

        {existingBookings.length > 0 && (
          <>
            <Text style={[styles.sectionTitle,styles.bookedSectionTitle]}>🔴 Already Booked</Text>
            {formatExistingBookings().map((booking, index) => (
              <View key={index} style={[styles.slotCard, styles.bookedSlot]}>
                <Text style={styles.bookedTime}>• {booking.startTime} - {booking.endTime}</Text>
                <Text style={styles.bookedTitle} numberOfLines={1} ellipsizeMode='tail'>({booking.title})</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Book the slot</Text>
        
        <Text style={styles.label}>Start Time *</Text>
        <View style={styles.timeInputContainer}>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="HH:MM (e.g., 09:00)"
            value={startTime}
            editable={false}
            pointerEvents='none'
          />
          <Pressable style={styles.timePickerButton} onPress={showStartTimepicker}>
            <Text style={styles.timePickerButtonText}>🕒 Pick Time</Text>
          </Pressable>
        </View>

        {showStartTimePicker && (
          <View style={styles.dateTimePickerContainer}>
        <DateTimePicker
          style={{
          width: isTablet ? 300 : 200,
          height: isTablet ? 250 : 150,
          }}
          value={startTimeDate}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={onStartTimeChange}
          minimumDate={(() => {
            const minTime = new Date();
            minTime.setHours(9, 0, 0, 0); // 9:00 AM minimum
            return minTime;
          })()}
          maximumDate={(() => {
            const maxTime = new Date();
            maxTime.setHours(20, 0, 0, 0); // 8:00 PM maximum
            return maxTime;
          })()}
        />
        </View>
      )}

        {Platform.OS === 'ios' && showStartTimePicker && (
          <Pressable style={styles.datePickerDoneButton} onPress={() => setShowStartTimePicker(false)}>
            <Text style={styles.datePickerDoneText}>Done</Text>
          </Pressable>
        )}


        <Text style={styles.label}>End Time *</Text>
        <View style={styles.timeInputContainer}>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="HH:MM (e.g., 17:00)"
            value={endTime}
            editable={false}
            pointerEvents='none'
          />
          <Pressable style={styles.timePickerButton} onPress={showEndTimepicker}>
            <Text style={styles.timePickerButtonText}>🕒 Pick Time</Text>
          </Pressable>
        </View>

        {showEndTimePicker && (
          <View style={styles.dateTimePickerContainer}>
        <DateTimePicker
          style={{
          width: isTablet ? 300 : 200,
          height: isTablet ? 250 : 150,
          }}
          value={endTimeDate}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={onEndTimeChange}
          minimumDate={(() => {
            const minTime = new Date();
            minTime.setHours(9, 0, 0, 0); // 9:00 AM minimum
            return minTime;
          })()}
          maximumDate={(() => {
            const maxTime = new Date();
            maxTime.setHours(20, 0, 0, 0); // 8:00 PM maximum
            return maxTime;
          })()}
        />
        </View>
      )}

        {Platform.OS === 'ios' && showEndTimePicker && (
          <Pressable style={styles.datePickerDoneButton} onPress={() => setShowEndTimePicker(false)}>
            <Text style={styles.datePickerDoneText}>Done</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Meeting Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter meeting title"
          value={title}
          onChangeText={setTitle}
          maxLength={30}
        />
        <Text style={[styles.characterCounter,title.length>=20 && styles.characterCounterWarning,title.length>=30 && styles.characterCounterDanger]}>
        {30 - title.length} characters remaining
      </Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input]}
          placeholder="Meeting description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={99}
        />
        <Text style={[
        styles.characterCounter,
        description.length >= 90 && styles.characterCounterWarning,  // Yellow at 90+
        description.length >= 99 && styles.characterCounterDanger    // Red at 99
      ]}>
        {99 - description.length} characters remaining
      </Text>


        <Pressable 
          style={({pressed}) => [
            styles.submitButton, 
            pressed && styles.pressed
          ]} 
          onPress={handleBooking}
        >
          <Text style={styles.submitButtonText}>Book Room</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default BookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  roomSection: {
    backgroundColor: 'white',
    padding: responsiveSize.xl,      
    margin: responsiveSize.lg,      
    borderRadius: responsiveSize.md,   
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) }, 
    shadowOpacity: 0.1,
    shadowRadius: responsiveSize.xs,   
    elevation: 3,
  },
  roomName: {
    fontSize: responsiveFontSize.title, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: responsiveSize.xs,  
  },
  roomDetails: {
    fontSize: responsiveFontSize.lg,  
    color: '#666',
    marginBottom: responsiveSize.xs, 
  },
  amenities: {
    fontSize: responsiveFontSize.md,  
    color: '#007AFF',
    textAlign: 'center',
  },
  dateSection: {
    backgroundColor: 'white',
    padding: responsiveSize.lg,      
    marginHorizontal: responsiveSize.lg, 
    marginBottom: responsiveSize.md,   
    borderRadius: responsiveSize.md,  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveSize.xs,
    elevation: 3,
  },
  availabilitySection: {
    backgroundColor: 'white',
    padding: responsiveSize.lg,
    marginHorizontal: responsiveSize.lg,
    marginBottom: responsiveSize.md,
    borderRadius: responsiveSize.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveSize.xs,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.xl,   
    fontWeight: 'bold',
    color: '#333',
    marginBottom: responsiveSize.lg, 
  },
  bookedSectionTitle:{
    marginTop:responsiveSize.xs,
  },
  bookedTitle: {
    flex: 1,
  minWidth: 0,
  marginTop: 0, // remove marginTop if you want it inline
  fontSize: responsiveFontSize.md,

  },
  slotCard: {
    padding: responsiveSize.md,     
    borderRadius: responsiveSize.sm,  
    marginBottom: responsiveSize.sm,  
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: responsiveSize.xxl * 2, 
  },
  availableSlot: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  bookedSlot: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSize.md,
    borderRadius: responsiveSize.sm,
    marginBottom: responsiveSize.sm,
    minHeight: responsiveSize.xxl * 2,
  },
  slotTime: {
    fontSize: responsiveFontSize.lg, 
    fontWeight: '600',
    color: '#333',
  },
  bookedTime: {
    fontSize: responsiveFontSize.md,  
    color: '#dc3545',
    marginRight: 8,
  },
  noSlotsText: {
    fontSize: responsiveFontSize.lg,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: 'white',
    padding: responsiveSize.xl,  
    margin: responsiveSize.lg,      
    borderRadius: responsiveSize.md,   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveSize.xs,
    elevation: 3,
  },
  label: {
    fontSize: responsiveFontSize.lg,  
    fontWeight: '600',
    color: '#333',
    marginBottom: responsiveSize.xs, 
    marginTop: responsiveSize.md,     
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: responsiveSize.md,       
    borderRadius: responsiveSize.sm,  
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: responsiveFontSize.lg,  
    marginBottom: responsiveSize.md, 
    minHeight: responsiveSize.xxl * 2, 
    textAlignVertical: 'center',
  },
  textArea: {
    height: responsiveSize.xxl * 3.5,  
    textAlignVertical: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: responsiveSize.lg,    
    borderRadius: responsiveSize.sm,   
    marginTop: responsiveSize.xl,      
    minHeight: responsiveSize.xxl * 2.5, 
    justifyContent:'center'
  },
  pressed: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: responsiveFontSize.xl, 
    fontWeight: 'bold',
  },
  characterCounter: {
    fontSize: responsiveFontSize.xs,  
    color: '#666',
    textAlign: 'right',
    marginTop: -responsiveSize.xs,   
    marginBottom: responsiveSize.md,  
  },
  characterCounterWarning: {
    color: '#ff9800',
  },
  characterCounterDanger: {
    color: '#dc3545',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  errorText: {
    fontSize: responsiveFontSize.xs, 
    color: '#dc3545',
    marginTop: -responsiveSize.xs,    
    marginBottom: responsiveSize.md,  
  },
  datePickerButton: {
    backgroundColor: '#f8f8f8',
    padding: responsiveSize.lg,
    borderRadius: responsiveSize.sm,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: responsiveSize.md,
    minHeight: responsiveSize.xxl * 2.5,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '600',
    color: '#333',
    marginBottom: responsiveSize.xs,
  },
  datePickerSubtext: {
    fontSize: responsiveFontSize.md,
    color: '#666',
    fontStyle: 'italic',
  },
  datePickerDoneButton: {
    backgroundColor: '#007AFF',
    padding: responsiveSize.md,
    borderRadius: responsiveSize.sm,
    alignItems: 'center',
    marginTop: responsiveSize.md,
    marginBottom: responsiveSize.md,
  },
  datePickerDoneText: {
    color: 'white',
    fontSize: responsiveFontSize.lg,
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
  },
  timeInput: {
    flex: 1,
    marginRight: responsiveSize.sm,
    marginBottom: 0,
  },
  timePickerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    borderRadius: responsiveSize.sm,
    minHeight: responsiveSize.xxl * 2, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerButtonText: {
    color: 'white',
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
  },
  sectionTitleRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  dateInfoTextInline: {
    fontSize: responsiveFontSize.xs,
    color: '#666',
    fontStyle: 'italic',
    flex: 0.4,
    textAlign:'right'
  },
  dateTimePickerContainer:{
    alignItems:'center',
    justifyContent:'center'
  }
});

export { normalizeTime, isValidTime };