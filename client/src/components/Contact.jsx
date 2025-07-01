import React from "react";
import "./Contact.css";

const Contact = () => {
    return (
        <div className="contact">
            <div className="contact-header">
                <h1 className="overview-header">contact us.</h1>
                <p className="contact-subtitle">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </div>

            <div className="signup-content">
                <div className="contact-form-container">
                    <form className="contact-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject</label>
                            <select
                                id="subject"
                                name="subject"
                                required
                            >
                                <option value="">Select a subject</option>
                                <option value="general">General Inquiry</option>
                                <option value="support">Technical Support</option>
                                <option value="billing">Billing Question</option>
                                <option value="feature">Feature Request</option>
                                <option value="partnership">Partnership</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                required
                                rows="6"
                                placeholder="Tell us how we can help you..."
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-button">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
