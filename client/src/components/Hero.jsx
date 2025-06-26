import React from "react";
import "./Hero.css";


const Hero = () => {
  return (
    <div className="hero">
        <div className="image">
            <img src="images/hero.png" alt="study" />
        </div>
        <div className="text">
            <p className="title">meet your new study sidekick.</p>
            <p className="subtitle">we'll handle the organizing, focus on the studying.</p>
        </div>
        <div className="cta">
            <button>get started</button>
        </div>
    </div>
  );
};


export default Hero;
