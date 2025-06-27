import React from 'react';
import './Navbar.css';

const Navbar = () => {
    const handleScrollTo = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className='navbar'>
            <div className='nav-left'>
                <span onClick={() => handleScrollTo('home')}>zuno.</span>
            </div>
            <div className='nav-right'>
                <ul className='navList'>
                    <div className='list'>
                        <li className='navItem'>
                            <a href="#home" className='navLink' onClick={(e) => { e.preventDefault(); handleScrollTo('home'); }}>Home</a>
                        </li>
                        <li className='navItem'>
                            <a href="#features" className='navLink' onClick={(e) => { e.preventDefault(); handleScrollTo('features'); }}>Features</a>
                        </li>
                        <li className='navItem'>
                            <a href="#contact" className='navLink' onClick={(e) => { e.preventDefault(); handleScrollTo('contact'); }}>Contact</a>
                        </li>
                    </div>
                    <li className='navItem'>
                        <button className='signUpButton' onClick={() => handleScrollTo('contact')}>Sign Up</button>
                    </li>
                </ul>
            </div>

        </nav>
    );
};

export default Navbar;
