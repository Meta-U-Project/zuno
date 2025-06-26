import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Seperator from "../components/Seperator";
import Features from "../components/Features";
import Overview from "../components/Overview";

const HomePage = () => {
    return (
        <div>
            <Navbar />
            <Hero />
            <Seperator />
            <Overview />
            <Seperator />
            <Features />

        </div>
    );
};

export default HomePage;
