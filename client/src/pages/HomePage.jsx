import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Seperator from "../components/Seperator";
import Features from "../components/Features";
import Overview from "../components/Overview";
import SchoolSlider from "../components/SchoolSlider";
import Testimonials from "../components/Testimonials";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

const HomePage = () => {
    return (
        <div>
            <Navbar />
            <section id="home">
                <Hero />
            </section>
            <Seperator />
            <section id="features">
                <Overview />
                <Seperator />
                <Features />
            </section>
            <Seperator />
            <SchoolSlider />
            <Seperator />
            <Testimonials />
            <Seperator />
            <section id="contact">
                <Contact />
            </section>
            <Footer />
        </div>
    );
};

export default HomePage;
