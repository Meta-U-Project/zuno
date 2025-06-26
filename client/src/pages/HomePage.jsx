import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Seperator from "../components/Seperator";
import Features from "../components/Features";

const HomePage = () => {
    return (
        <div>
            <Navbar />
            <Hero />
            <Seperator />
            <Features />
        </div>
    );
};

export default HomePage;
