import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import RegisterScreen from "../../screens/RegisterScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("../../util/database", () => ({
  createUser: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
}));

jest.mock("../../redux/slices/userSlice", () => ({
  login: jest.fn((payload) => ({ type: "LOGIN", payload })),
}));

jest.mock("../../screens/SplashScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return () => <Text testID="splash-mock">SplashScreen</Text>;
});

const { createUser } = require("../../util/database");
const AsyncStorage = require("@react-native-async-storage/async-storage");
const { login } = require("../../redux/slices/userSlice");

describe("RegisterScreen", () => {
  let navigation;
  let dispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = { setOptions: jest.fn(), replace: jest.fn() };
    dispatch = jest.fn();
    useNavigation.mockReturnValue(navigation);
    useDispatch.mockReturnValue(dispatch);
  });

  it("renders all UI elements", () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    expect(getByPlaceholderText("Full Name *")).toBeTruthy();
    expect(getByPlaceholderText("Email *")).toBeTruthy();
    expect(getByPlaceholderText("Password * (min 6 characters)")).toBeTruthy();
    expect(getByPlaceholderText("Department (Optional)")).toBeTruthy();
    expect(getByText("Register")).toBeTruthy();
    expect(getByText("Already have an account? Login here")).toBeTruthy();
  });

  it("navigates to Login screen when Login link is pressed", () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText("Already have an account? Login here"));
    expect(navigation.replace).toHaveBeenCalledWith("Login");
  });

  it("shows SplashScreen when isAuthenticating is true", () => {
    // Mock createUser to return a never-resolving promise
    createUser.mockReturnValue(new Promise(() => {})); // never resolves
    const { getByText, getByPlaceholderText, getByTestId } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));
    expect(getByTestId("splash-mock")).toBeTruthy();
  });

  it("registers user successfully with valid inputs", async () => {
    const user = { name: "TestPerson", email: "test@example.com" };
    createUser.mockResolvedValueOnce(user);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "demo-token-123");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(user));
      expect(dispatch).toHaveBeenCalledWith(login({ user, token: "demo-token-123" }));
    });
  });

  it("shows error alert for empty required fields", async () => {
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByText } = render(<RegisterScreen />);
    // Don't fill any fields, just press register
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Please fill all required fields");
    });
    alertMock.mockRestore();
  });

  it("shows error alert for short password", async () => {
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "123"); // Less than 6 characters
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Password must be at least 6 characters");
    });
    alertMock.mockRestore();
  });

  it("shows error alert for invalid email", async () => {
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "invalid-email"); // Invalid email format
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Please enter a valid email address");
    });
    alertMock.mockRestore();
  });

  it("shows error alert for duplicate email (UNIQUE constraint)", async () => {
    const uniqueError = new Error("UNIQUE constraint failed: users.email");
    createUser.mockRejectedValueOnce(uniqueError);
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "existing@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "This email is already registered. Please use a different email.");
    });
    alertMock.mockRestore();
  });

  it("shows error alert if createUser throws generic error", async () => {
    createUser.mockRejectedValueOnce(new Error("DB error"));
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Registration failed. Please try again.");
    });
    alertMock.mockRestore();
  });

  it("shows error alert if createUser returns null", async () => {
    createUser.mockResolvedValueOnce(null); // User creation returns null
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Registration failed. Please try again.");
    });
    alertMock.mockRestore();
  });

  it("includes department when provided", async () => {
    const user = { name: "TestPerson", email: "test@example.com", department: "Engineering" };
    createUser.mockResolvedValueOnce(user);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.changeText(getByPlaceholderText("Department (Optional)"), "Engineering");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "TestPerson",
          email: "test@example.com",
          password: "password123",
          department: "Engineering"
        })
      );
    });
  });

  it("uses 'General' as default department when not provided", async () => {
    const user = { name: "TestPerson", email: "test@example.com", department: "General" };
    createUser.mockResolvedValueOnce(user);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    // Don't fill department field
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          department: "General"
        })
      );
    });
  });

  it("throws error and shows alert when createUser returns falsy value", async () => {
    createUser.mockResolvedValueOnce(null); // Returns null instead of user object
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Registration failed. Please try again.");
    });
    
    alertMock.mockRestore();
  });

  it("throws error when createUser returns undefined", async () => {
    createUser.mockResolvedValueOnce(undefined); // Returns undefined
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Registration failed. Please try again.");
    });
    
    alertMock.mockRestore();
  });

  it("throws error when createUser returns false", async () => {
    createUser.mockResolvedValueOnce(false); // Returns false
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText("Full Name *"), "TestPerson");
    fireEvent.changeText(getByPlaceholderText("Email *"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password * (min 6 characters)"), "password123");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Registration failed. Please try again.");
    });
    
    alertMock.mockRestore();
  });
});