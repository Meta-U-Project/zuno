import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Seperator from "../components/Seperator";
import Features from "../components/Features";
import Overview from "../components/Overview";
import SchoolSlider from "../components/SchoolSlider";

const HomePage = () => {
    return (
        <div>
            <Navbar />
            <Hero />
            <Seperator />
            <Overview />
            <Seperator />
            <Features />
            <Seperator />
            <SchoolSlider />

        </div>
    );
};

export default HomePage;
