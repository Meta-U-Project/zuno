import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <div className="footer-brand">
                        <h3 className="footer-logo">zuno.</h3>
                        <p className="footer-tagline">your new study sidekick</p>
                    </div>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Product</h4>
                    <ul className="footer-links">
                        <li><Link to="/features">Features</Link></li>
                        <li><Link to="/pricing">Pricing</Link></li>
                        <li><Link to="/integrations">Integrations</Link></li>
                        <li><Link to="/updates">Updates</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Resources</h4>
                    <ul className="footer-links">
                        <li><Link to="/help">Help Center</Link></li>
                        <li><Link to="/guides">Study Guides</Link></li>
                        <li><Link to="/blog">Blog</Link></li>
                        <li><Link to="/community">Community</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Company</h4>
                    <ul className="footer-links">
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/careers">Careers</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                        <li><Link to="/press">Press</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <div className="newsletter">
                        <p className="newsletter-text">Stay updated</p>
                        <div className="newsletter-form">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="newsletter-input"
                            />
                            <button className="newsletter-button">Subscribe</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-bottom-content">
                    <p className="copyright">© 2024 Zuno. All rights reserved.</p>
                    <div className="footer-legal">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/cookies">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
