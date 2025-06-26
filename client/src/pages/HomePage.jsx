import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Seperator from "../components/Seperator";
import Features from "../components/Features";
import Overview from "../components/Overview";
import SchoolSlider from "../components/SchoolSlider";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

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
            <Testimonials />
            <Footer/>

        </div>
    );
};

export default HomePage;
