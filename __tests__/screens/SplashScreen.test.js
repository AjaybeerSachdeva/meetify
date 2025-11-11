import SplashScreen from "../../screens/SplashScreen";
import { render } from "@testing-library/react-native";

describe('Splash Screen',()=>{
    const { getAllByText }=render(<SplashScreen/>);
    it("Splash screen renders correctly",()=>{
        expect(getAllByText("Loading...")).toBeTruthy();
    });
});