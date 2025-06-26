import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    const handleSignUpClick = () => {
        navigate('/contact');
    };
    return (
        <nav className='navbar'>
            <div className='nav-left'>
                <span>zuno.</span>
            </div>
            <div className='nav-right'>
                <ul className='navList'>
                    <div className='list'>
                        <li className='navItem'>
                            <Link to="/" className='navLink'>Home</Link>
                        </li>
                        <li className='navItem'>
                            <Link to="/about" className='navLink'>Features</Link>
                        </li>
                        <li className='navItem'>
                            <Link to="/services" className='navLink'>Contact</Link>
                        </li>
                    </div>
                    <li className='navItem'>
                        <button className='signUpButton' onClick={handleSignUpClick}>Sign Up</button>
                    </li>
                </ul>
            </div>

        </nav>
    );
};

export default Navbar;
