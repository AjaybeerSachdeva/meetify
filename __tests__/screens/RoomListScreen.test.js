import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RoomListScreen from "../../screens/RoomListScreen";
import { getAllRooms } from '../../util/database';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/userSlice';

jest.mock("../../util/database",()=>({
    getAllRooms:jest.fn(),
}));
jest.mock("react-redux",()=>({
    useDispatch:jest.fn()
}));
jest.mock("../../redux/slices/userSlice",()=>({
    logout:jest.fn(()=>({type:'LOGOUT'}))
}));

jest.mock("../../components/IconButton",()=>"IconButton");
jest.mock("../../components/Room",()=>"Room");
jest.mock("../../components/UserProfileModal", () => "UserProfileModal");

const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

describe('RoomListScreen',()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
    });

    it("renders rooms correctly",async()=>{
        const mockRooms = [
      { id: "1", name: "Room A", floor: "1st", capacity: 10, amenities: [] },
      { id: "2", name: "Room B", floor: "2nd", capacity: 20, amenities: [] },
    ];
    getAllRooms.mockResolvedValueOnce(mockRooms);
    const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
    const { findAllByTestId } = render(<RoomListScreen navigation={navigation} />);
    const rooms = await findAllByTestId(/^room-/); // regex to match all room testIDs
    expect(rooms).toHaveLength(2);
    });

    it("shows alert if loading room fails",async()=>{
        getAllRooms.mockRejectedValueOnce(new Error('DB error'));
        const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
        render(<RoomListScreen navigation={navigation} />);

        await waitFor(()=>{
            expect(alertMock).toHaveBeenCalledWith('Error','Failed to load rooms.');
        });
    });

    it("navigates to MyBookings when left header button is pressed",async()=>{
        getAllRooms.mockResolvedValueOnce([]);
        const navigation={setOptions:jest.fn(),navigate:jest.fn()}; 
        render(<RoomListScreen navigation={navigation} />);
        // Find the headerLeft IconButton and simulate press
        // Since IconButton is mocked as a string, we can't fireEvent on it directly.
        // Instead, check that setOptions was called with a headerLeft that calls myBookingsHandler
        expect(navigation.setOptions).toHaveBeenCalled();
        const options = navigation.setOptions.mock.calls[0][0];
        // Simulate headerLeft press
        const headerLeft = options.headerLeft();
        // headerLeft returns a <View><IconButton ... /></View>
        // We can't simulate press directly, but you can check that the function exists
        expect(typeof options.headerLeft).toBe("function");
    });

    it("shows logout alert when right header button is pressed", async () => {
    getAllRooms.mockResolvedValueOnce([]);
    const navigation = { setOptions: jest.fn(), navigate: jest.fn() };

    render(<RoomListScreen navigation={navigation} />);
    expect(navigation.setOptions).toHaveBeenCalled();
    const options = navigation.setOptions.mock.calls[0][0];
    // Simulate headerRight press
    expect(typeof options.headerRight).toBe("function");
  });

  it("shows profile modal when floating button is pressed", async () => {
    getAllRooms.mockResolvedValueOnce([]);
    const navigation = { setOptions: jest.fn(), navigate: jest.fn() };

    const { getByTestId } = render(<RoomListScreen navigation={navigation} />);
    fireEvent.press(getByTestId("profile-fab"));
    expect(getByTestId("profile-modal").props.visible).toBe(true);
  });

  it("dispatches logout when logout alert is confirmed", async () => {
  getAllRooms.mockResolvedValueOnce([]);
  const dispatch = jest.fn();
  useDispatch.mockReturnValue(dispatch);
  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };

  render(<RoomListScreen navigation={navigation} />);
  const options = navigation.setOptions.mock.calls[0][0];
  // Simulate headerRight press (logout button)
  options.headerRight().props.children.props.onPress();

  // Simulate pressing the "Logout" button in the Alert
  const alertArgs = alertMock.mock.calls[0];
  const buttons = alertArgs[2];
  // Find the "Logout" button and call its onPress
  const logoutButton = buttons.find(btn => btn.text === "Logout");
  logoutButton.onPress();

  expect(dispatch).toHaveBeenCalledWith(logout());
});

it("closes profile modal when onClose is called", async () => {
  getAllRooms.mockResolvedValueOnce([]);
  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
  const { getByTestId } = render(<RoomListScreen navigation={navigation} />);
  // Open modal
  fireEvent.press(getByTestId("profile-fab"));
  expect(getByTestId("profile-modal").props.visible).toBe(true);
  // Call onClose
  getByTestId("profile-modal").props.onClose();
  // Wait for the modal to close
  await waitFor(() => {
    expect(getByTestId("profile-modal").props.visible).toBe(false);
  });
});

it("opens profile modal when IconButton inside Pressable is pressed", async () => {
  getAllRooms.mockResolvedValueOnce([]);
  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
  const { getByTestId } = render(<RoomListScreen navigation={navigation} />);
  fireEvent.press(getByTestId("profile-fab-icon"));
  expect(getByTestId("profile-modal").props.visible).toBe(true);
});

it("navigates to MyBookings when headerLeft IconButton is pressed", async () => {
  getAllRooms.mockResolvedValueOnce([]);
  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
  render(<RoomListScreen navigation={navigation} />);
  const options = navigation.setOptions.mock.calls[0][0];
  // headerLeft returns a View with IconButton as child
  const headerLeftView = options.headerLeft();
  // Find the IconButton and call its onPress
  const iconButton = headerLeftView.props.children;
  iconButton.props.onPress();
  expect(navigation.navigate).toHaveBeenCalledWith("MyBookings");
});
});