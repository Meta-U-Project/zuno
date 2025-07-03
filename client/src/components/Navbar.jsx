import React from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    const handleNavigation = (sectionId) => {
        if (isHomePage) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${sectionId}`);
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const signup = () => {
        navigate('/signup');
    };

    return (
        <nav className='navbar'>
            <div className='nav-left'>
                <span onClick={() => handleNavigation('home')}>zuno.</span>
            </div>
            <div className='nav-right'>
                <ul className='navList'>
                    <div className='list'>
                        <li className='navItem'>
                            <a href={isHomePage ? "#home" : "/#home"} className='navLink' onClick={(e) => { e.preventDefault(); handleNavigation('home'); }}>Home</a>
                        </li>
                        <li className='navItem'>
                            <a href={isHomePage ? "#features" : "/#features"} className='navLink' onClick={(e) => { e.preventDefault(); handleNavigation('features'); }}>Features</a>
                        </li>
                        <li className='navItem'>
                            <a href={isHomePage ? "#contact" : "/#contact"} className='navLink' onClick={(e) => { e.preventDefault(); handleNavigation('contact'); }}>Contact</a>
                        </li>
                    </div>
                    <li className='navItem'>
                        <button className='signUpButton' onClick={signup}>Sign Up</button>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
