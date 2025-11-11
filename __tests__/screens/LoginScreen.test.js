import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import LoginScreen from "../../screens/LoginScreen";
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));
jest.mock("../../util/database", () => ({
  authenticateUser: jest.fn(),
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

const { authenticateUser } = require("../../util/database");
const AsyncStorage = require("@react-native-async-storage/async-storage");
const { login } = require("../../redux/slices/userSlice");

describe("LoginScreen", () => {
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
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Login")).toBeTruthy();
    expect(getByText("Don't have an account? Register here")).toBeTruthy();
  });

  it("navigates to Register screen when register link is pressed", () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText("Don't have an account? Register here"));
    expect(navigation.replace).toHaveBeenCalledWith("Register");
  });

  it("shows SplashScreen when isAuthenticating is true", () => {
    authenticateUser.mockReturnValue(new Promise(() => {})); // never resolves
    const { getByText, getByPlaceholderText, getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password");
    fireEvent.press(getByText("Login"));
    expect(getByTestId("splash-mock")).toBeTruthy();
  });

  it("logs in successfully with valid credentials", async () => {
    const user = { name: "Ajay", email: "test@example.com" };
    authenticateUser.mockResolvedValueOnce(user);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "demo-token-123");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(user));
      expect(dispatch).toHaveBeenCalledWith(login({ user, token: "demo-token-123" }));
    });
  });

  it("shows error alert for invalid credentials", async () => {
    authenticateUser.mockResolvedValueOnce(null);
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("Email"), "wrong@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpass");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Invalid email or password");
    });
    alertMock.mockRestore();
  });

  it("shows error alert if authenticateUser throws", async () => {
    authenticateUser.mockRejectedValueOnce(new Error("DB error"));
    const alertMock = jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error", "Login failed. Please try again.");
    });
    alertMock.mockRestore();
  });
});