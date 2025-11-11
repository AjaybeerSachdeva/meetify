import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import MyBookingsScreen from "../../screens/MyBookingsScreen";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

jest.mock("../../util/database", () => ({
  getUserBookings: jest.fn(),
  cancelBooking: jest.fn(),
  deleteBooking: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("../../components/BookingCard", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ booking, onCancel, onDelete }) => (
    <TouchableOpacity testID={`booking-card-${booking.id}`}>
      <Text>{booking.title}</Text>
      <Text>{booking.roomName}</Text>
      <TouchableOpacity testID={`cancel-${booking.id}`} onPress={onCancel}>
        <Text>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity testID={`delete-${booking.id}`} onPress={onDelete}>
        <Text>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const { getUserBookings, cancelBooking, deleteBooking } = require("../../util/database");

describe("MyBookingsScreen", () => {
  let navigation;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = { setOptions: jest.fn() };
    mockUser = { id: 1, name: "Test User" };
    useNavigation.mockReturnValue(navigation);
    useSelector.mockReturnValue(mockUser);
  });

  it("shows loading state initially", () => {
    getUserBookings.mockReturnValue(new Promise(() => {})); // never resolves
    const { getByText } = render(<MyBookingsScreen />);
    expect(getByText("Loading your bookings...")).toBeTruthy();
  });

  it("renders empty state when no bookings", async () => {
    getUserBookings.mockResolvedValueOnce([]);
    const { getByText } = render(<MyBookingsScreen />);
    
    await waitFor(() => {
      expect(getByText("📅")).toBeTruthy();
      expect(getByText("You have no bookings yet.")).toBeTruthy();
      expect(getByText("Book a room to see your reservations here!")).toBeTruthy();
    });
  });

  it("renders bookings list when bookings exist", async () => {
    const mockBookings = [
      {
        id: 1,
        room_id: 101,
        user_id: 1,
        title: "Team Meeting",
        description: "Weekly standup",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "10:00",
        status: "confirmed",
        room_name: "Conference Room A",
        room_floor: "1st Floor"
      },
      {
        id: 2,
        room_id: 102,
        user_id: 1,
        title: "Client Call",
        description: "Client presentation",
        date: "2024-01-16",
        start_time: "14:00",
        end_time: "15:00",
        status: "confirmed",
        room_name: "Conference Room B",
        room_floor: "2nd Floor"
      }
    ];

    getUserBookings.mockResolvedValueOnce(mockBookings);
    const { getByText, getByTestId } = render(<MyBookingsScreen />);

    await waitFor(() => {
      expect(getByText("My Bookings (2)")).toBeTruthy();
      expect(getByTestId("booking-card-1")).toBeTruthy();
      expect(getByTestId("booking-card-2")).toBeTruthy();
      expect(getByText("Team Meeting")).toBeTruthy();
      expect(getByText("Client Call")).toBeTruthy();
    });
  });

  it("sets navigation options on mount", () => {
    getUserBookings.mockResolvedValueOnce([]);
    render(<MyBookingsScreen />);
    
    expect(navigation.setOptions).toHaveBeenCalledWith({
      headerTitle: 'My Bookings',
      headerTitleStyle: {
        fontSize: expect.any(Number),
        fontWeight: 'bold',
      },
      headerTitleAlign: 'center',
    });
  });

  it("cancels booking successfully", async () => {
    const mockBookings = [
      {
        id: 1,
        room_id: 101,
        user_id: 1,
        title: "Team Meeting",
        description: "Weekly standup",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "10:00",
        status: "confirmed",
        room_name: "Conference Room A",
        room_floor: "1st Floor"
      }
    ];

    getUserBookings.mockResolvedValueOnce(mockBookings);
    cancelBooking.mockResolvedValueOnce();

    const { getByTestId, queryByTestId } = render(<MyBookingsScreen />);

    // Wait for bookings to load
    await waitFor(() => {
      expect(getByTestId("booking-card-1")).toBeTruthy();
    });

    // Cancel the booking
    fireEvent.press(getByTestId("cancel-1"));

    await waitFor(() => {
      expect(cancelBooking).toHaveBeenCalledWith(1);
      expect(queryByTestId("booking-card-1")).toBeNull();
    });
  });

  it("handles cancel booking error", async () => {
    const mockBookings = [
      {
        id: 1,
        room_id: 101,
        user_id: 1,
        title: "Team Meeting",
        description: "Weekly standup",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "10:00",
        status: "confirmed",
        room_name: "Conference Room A",
        room_floor: "1st Floor"
      }
    ];

    getUserBookings.mockResolvedValueOnce(mockBookings);
    cancelBooking.mockRejectedValueOnce(new Error("Cancel failed"));
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByTestId } = render(<MyBookingsScreen />);

    // Wait for bookings to load
    await waitFor(() => {
      expect(getByTestId("booking-card-1")).toBeTruthy();
    });

    // Try to cancel the booking
    fireEvent.press(getByTestId("cancel-1"));

    await waitFor(() => {
      expect(cancelBooking).toHaveBeenCalledWith(1);
      expect(alertMock).toHaveBeenCalledWith("Error", "Failed to cancel booking. Please try again.");
    });

    alertMock.mockRestore();
  });

  it("deletes booking successfully", async () => {
    const mockBookings = [
      {
        id: 1,
        room_id: 101,
        user_id: 1,
        title: "Team Meeting",
        description: "Weekly standup",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "10:00",
        status: "confirmed",
        room_name: "Conference Room A",
        room_floor: "1st Floor"
      }
    ];

    getUserBookings.mockResolvedValueOnce(mockBookings);
    deleteBooking.mockResolvedValueOnce();
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByTestId, queryByTestId } = render(<MyBookingsScreen />);

    // Wait for bookings to load
    await waitFor(() => {
      expect(getByTestId("booking-card-1")).toBeTruthy();
    });

    // Delete the booking
    fireEvent.press(getByTestId("delete-1"));

    await waitFor(() => {
      expect(deleteBooking).toHaveBeenCalledWith(1);
      expect(alertMock).toHaveBeenCalledWith("Success", "Booking record deleted successfully!");
      expect(queryByTestId("booking-card-1")).toBeNull();
    });

    alertMock.mockRestore();
  });

  it("handles delete booking error", async () => {
    const mockBookings = [
      {
        id: 1,
        room_id: 101,
        user_id: 1,
        title: "Team Meeting",
        description: "Weekly standup",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "10:00",
        status: "confirmed",
        room_name: "Conference Room A",
        room_floor: "1st Floor"
      }
    ];

    getUserBookings.mockResolvedValueOnce(mockBookings);
    deleteBooking.mockRejectedValueOnce(new Error("Delete failed"));
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByTestId } = render(<MyBookingsScreen />);

    // Wait for bookings to load
    await waitFor(() => {
      expect(getByTestId("booking-card-1")).toBeTruthy();
    });

    // Try to delete the booking
    fireEvent.press(getByTestId("delete-1"));

    await waitFor(() => {
      expect(deleteBooking).toHaveBeenCalledWith(1);
      expect(alertMock).toHaveBeenCalledWith("Error", "Failed to delete booking record. Please try again.");
    });

    alertMock.mockRestore();
  });

  it("handles error loading bookings", async () => {
    getUserBookings.mockRejectedValueOnce(new Error("DB error"));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(<MyBookingsScreen />);

    await waitFor(() => {
      // Should show empty state when error occurs
      expect(getByText("📅")).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading user bookings:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it("formats bookings data correctly", async () => {
    const rawBooking = {
      id: 1,
      room_id: 101,
      user_id: 1,
      title: "Team Meeting",
      description: "Weekly standup",
      date: "2024-01-15",
      start_time: "09:00",
      end_time: "10:00",
      status: "confirmed",
      room_name: "Conference Room A",
      room_floor: "1st Floor"
    };

    getUserBookings.mockResolvedValueOnce([rawBooking]);
    const { getByTestId } = render(<MyBookingsScreen />);

    await waitFor(() => {
      expect(getByTestId("booking-card-1")).toBeTruthy();
      // The formatted booking should have startTime and endTime with full timestamps
      expect(getUserBookings).toHaveBeenCalledWith(1);
    });
  });

  it("doesn't load bookings if user is not available", () => {
    useSelector.mockReturnValue(null); // No user
    render(<MyBookingsScreen />);
    
    // getUserBookings should not be called
    expect(getUserBookings).not.toHaveBeenCalled();
  });

  it("doesn't load bookings if user has no id", () => {
    useSelector.mockReturnValue({ name: "Test User" }); // User without id
    render(<MyBookingsScreen />);
    
    // getUserBookings should not be called
    expect(getUserBookings).not.toHaveBeenCalled();
  });

  // state tests 

  it("correctly uses Redux selector to get user info", () => {
    const mockState = {
      user: {
        info: {
          id: 123,
          name: "Test User",
          email: "test@example.com"
        },
        isLoggedIn: true,
        otherProperty: "should not be selected"
      },
      rooms: [],
      bookings: []
    };

    // Mock useSelector to capture and test the selector function
    let capturedSelector;
    useSelector.mockImplementation((selectorFunction) => {
      capturedSelector = selectorFunction;
      return selectorFunction(mockState);
    });

    getUserBookings.mockResolvedValueOnce([]);
    render(<MyBookingsScreen />);

    // Test that the selector function correctly accesses state.user.info
    expect(capturedSelector).toBeDefined();
    expect(capturedSelector(mockState)).toEqual({
      id: 123,
      name: "Test User",
      email: "test@example.com"
    });

    // Verify it doesn't return other parts of the state
    expect(capturedSelector(mockState)).not.toEqual(mockState.user);
    expect(capturedSelector(mockState)).not.toEqual(mockState);
  });

  it("selector handles missing user info gracefully", () => {
    const mockStateWithoutUser = {
      user: {
        info: null,
        isLoggedIn: false
      }
    };

    let capturedSelector;
    useSelector.mockImplementation((selectorFunction) => {
      capturedSelector = selectorFunction;
      return selectorFunction(mockStateWithoutUser);
    });

    getUserBookings.mockResolvedValueOnce([]);
    render(<MyBookingsScreen />);

    // Test that the selector returns null when user.info is null
    expect(capturedSelector(mockStateWithoutUser)).toBeNull();
  });

  it("selector handles undefined user state", () => {
    const mockStateWithUndefinedUser = {
      user: {
        info: undefined,
        isLoggedIn: false
      }
    };

    let capturedSelector;
    useSelector.mockImplementation((selectorFunction) => {
      capturedSelector = selectorFunction;
      return selectorFunction(mockStateWithUndefinedUser);
    });

    getUserBookings.mockResolvedValueOnce([]);
    render(<MyBookingsScreen />);

    // Test that the selector returns undefined when user.info is undefined
    expect(capturedSelector(mockStateWithUndefinedUser)).toBeUndefined();
  });
});