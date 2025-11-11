import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import BookingScreen, { normalizeTime, isValidTime } from '../../screens/BookingScreen';
import { createBooking, getDayBookings } from '../../util/database';
import { useSelector } from 'react-redux';

// Mock dependencies
jest.mock('../../util/database', () => ({
  createBooking: jest.fn(),
  getDayBookings: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../util/responsive', () => ({
  responsiveSize: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  responsiveFontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 20, title: 22 },
  scaleHeight: jest.fn((size) => size),
  getHeaderFontSize: jest.fn(() => 18),
  useOrientation: jest.fn(() => false),
}));

// Mock DateTimePicker to expose onChange for tests
let lastPickerProps = {};
jest.mock('@react-native-community/datetimepicker', () => {
  return (props) => {
    lastPickerProps = props;
    return null;
  };
});

// --- UNIT TESTS FOR LOGIC ---

describe('normalizeTime', () => {
  it('returns empty string for falsy input', () => {
    expect(normalizeTime(undefined)).toBe('');
    expect(normalizeTime('')).toBe('');
  });
  it('pads single digit hours', () => {
    expect(normalizeTime('9:05')).toBe('09:05');
    expect(normalizeTime('10:5')).toBe('10:05');
  });
  it('returns already padded time', () => {
    expect(normalizeTime('09:00')).toBe('09:00');
  });
});

describe('isValidTime', () => {
  it('returns false for undefined', () => {
    expect(isValidTime(undefined)).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isValidTime('')).toBe(false);
  });
  it('returns false for whitespace string', () => {
    expect(isValidTime('   ')).toBe(false);
  });
  it('returns false for invalid format', () => {
    expect(isValidTime('abc')).toBe(false);
    expect(isValidTime('25:00')).toBe(false);
    expect(isValidTime('09:60')).toBe(false);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('12:345')).toBe(false);
  });
  it('returns false for out-of-range hours/minutes', () => {
    expect(isValidTime('23:61')).toBe(false);
    expect(isValidTime('-1:00')).toBe(false);
    expect(isValidTime('08:00')).toBe(false); // before business hours
    expect(isValidTime('21:00')).toBe(false); // after business hours
  });
  it('returns true for valid business hour time', () => {
    expect(isValidTime('09:00')).toBe(true);
    expect(isValidTime('20:00')).toBe(true);
    expect(isValidTime('13:30')).toBe(true);
  });
});

// --- MAIN UI AND BUSINESS LOGIC TESTS ---

describe('BookingScreen', () => {
  const mockNavigation = {
    setOptions: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      room: {
        id: 1,
        name: 'Conference Room A',
        capacity: 10,
        floor: '2nd Floor',
        amenities: ['WiFi', 'Projector', 'Whiteboard'],
      },
    },
  };

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockReturnValue(mockUser);
    require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
    getDayBookings.mockResolvedValue([]);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
    Platform.OS = 'android';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the user from redux in booking', async () => {
  createBooking.mockResolvedValue(true);
  const { getByText, getByPlaceholderText, getAllByText } = render(
    <BookingScreen route={mockRoute} navigation={mockNavigation} />
  );
  fireEvent.press(getByText(/📅/));
  act(() => {
    lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
  });
  fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
  fireEvent.press(getAllByText('🕒 Pick Time')[0]);
  act(() => {
    const date = new Date();
    date.setHours(10, 0, 0, 0);
    lastPickerProps.onChange({ type: 'set' }, date);
  });
  fireEvent.press(getAllByText('🕒 Pick Time')[1]);
  act(() => {
    const date = new Date();
    date.setHours(11, 0, 0, 0);
    lastPickerProps.onChange({ type: 'set' }, date);
  });
  fireEvent.press(getByText('Book Room'));
  await waitFor(() => {
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockUser.id })
    );
  });
});

  it('renders room info and available slots', async () => {
    const { getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    expect(getByText('Conference Room A')).toBeTruthy();
    expect(getByText('Capacity: 10 • 2nd Floor')).toBeTruthy();
    expect(getByText('Amenities: WiFi, Projector, Whiteboard')).toBeTruthy();
    await waitFor(() => {
      expect(getDayBookings).toHaveBeenCalledWith(1, '2024-01-15');
    });
  });

  it('shows and selects date using picker', async () => {
    const { getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText(/📅/));
    expect(lastPickerProps.mode).toBe('date');
    // Simulate picking a new date
    act(() => {
      lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
    });
    expect(getByText(/📅/)).toBeTruthy();
  });

  it('shows and selects start time using picker', async () => {
    const { getAllByText, getByPlaceholderText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    expect(lastPickerProps.mode).toBe('time');
    act(() => {
      const date = new Date();
      date.setHours(10, 30, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    expect(getByPlaceholderText('HH:MM (e.g., 09:00)').props.value).toBe('10:30');
  });

  it('shows and selects end time using picker', async () => {
    const { getAllByText, getByPlaceholderText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getAllByText('🕒 Pick Time')[1]);
    expect(lastPickerProps.mode).toBe('time');
    act(() => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    expect(getByPlaceholderText('HH:MM (e.g., 17:00)').props.value).toBe('12:00');
  });

  it('shows error if required fields are missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Book Room'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all required fields');
    });
    alertSpy.mockRestore();
  });

  it('shows error if description is too long', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText(/📅/));
    act(() => {
      lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
    });
    fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    act(() => {
      const date = new Date();
      date.setHours(10, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getAllByText('🕒 Pick Time')[1]);
    act(() => {
      const date = new Date();
      date.setHours(11, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.changeText(getByPlaceholderText('Meeting description (optional)'), 'A'.repeat(100));
    fireEvent.press(getByText('Book Room'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Description should be less than 100 characters');
    });
    alertSpy.mockRestore();
  });

  it('shows error if end time is before start time', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText(/📅/));
    act(() => {
      lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
    });
    fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    act(() => {
      const date = new Date();
      date.setHours(15, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getAllByText('🕒 Pick Time')[1]);
    act(() => {
      const date = new Date();
      date.setHours(14, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getByText('Book Room'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'End time must be after start time');
    });
    alertSpy.mockRestore();
  });

  it('creates booking successfully with valid data', async () => {
    createBooking.mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) buttons[0].onPress();
    });
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText(/📅/));
    act(() => {
      lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
    });
    fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    act(() => {
      const date = new Date();
      date.setHours(10, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getAllByText('🕒 Pick Time')[1]);
    act(() => {
      const date = new Date();
      date.setHours(11, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getByText('Book Room'));
    await waitFor(() => {
      expect(createBooking).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Room booked successfully!',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('shows error if booking creation fails', async () => {
    createBooking.mockRejectedValue(new Error('DB error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByText(/📅/));
    act(() => {
      lastPickerProps.onChange({}, new Date('2024-01-20T00:00:00.000Z'));
    });
    fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    act(() => {
      const date = new Date();
      date.setHours(10, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getAllByText('🕒 Pick Time')[1]);
    act(() => {
      const date = new Date();
      date.setHours(11, 0, 0, 0);
      lastPickerProps.onChange({ type: 'set' }, date);
    });
    fireEvent.press(getByText('Book Room'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Booking Failed', 'DB error');
    });
    alertSpy.mockRestore();
  });

  it('shows available and booked slots', async () => {
    getDayBookings.mockResolvedValue([
      { room_id: 1, start_time: '10:00', end_time: '11:00', title: 'Booked', status: 'confirmed' }
    ]);
    const { getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText('🟢 Available Time Slots')).toBeTruthy();
      expect(getByText('🔴 Already Booked')).toBeTruthy();
    });
  });

  it('shows no available slots message when fully booked', async () => {
    getDayBookings.mockResolvedValue([
      { room_id: 1, start_time: '09:00', end_time: '20:00', title: 'All Day', status: 'confirmed' }
    ]);
    const { getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText('No available slots for this date')).toBeTruthy();
    });
  });

  it('shows character counters for title and description', () => {
    const { getByPlaceholderText, getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Team Meeting');
    expect(getByText('18 characters remaining')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('Meeting description (optional)'), 'Weekly sync');
    expect(getByText('88 characters remaining')).toBeTruthy();
  });

  it('shows warning/danger style for description counter', () => {
    const { getByPlaceholderText, getByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.changeText(getByPlaceholderText('Meeting description (optional)'), 'A'.repeat(90));
    expect(getByText('9 characters remaining')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('Meeting description (optional)'), 'A'.repeat(99));
    expect(getByText('0 characters remaining')).toBeTruthy();
  });

  it('handles platform-specific picker logic (iOS)', () => {
    Platform.OS = 'ios';
    const { getAllByText } = render(
      <BookingScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getAllByText('🕒 Pick Time')[0]);
    expect(lastPickerProps.display).toBe('spinner');
  });

  it('shows error if start time is in the past for today', async () => {
  jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByText, getByPlaceholderText, getAllByText } = render(
    <BookingScreen route={mockRoute} navigation={mockNavigation} />
  );
  // Set start time to 09:00 (past), end time to 11:00 (future)
  fireEvent.changeText(getByPlaceholderText('Enter meeting title'), 'Test Meeting');
  fireEvent.press(getAllByText('🕒 Pick Time')[0]);
  act(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    lastPickerProps.onChange({ type: 'set' }, date);
  });
  fireEvent.press(getAllByText('🕒 Pick Time')[1]);
  act(() => {
    const date = new Date();
    date.setHours(11, 0, 0, 0);
    lastPickerProps.onChange({ type: 'set' }, date);
  });
  fireEvent.press(getByText('Book Room'));
  await waitFor(() => {
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Cannot book a time that has already passed today');
  });
  alertSpy.mockRestore();
});
});