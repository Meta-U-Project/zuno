import React from "react";
import "./Testimonials.css";

const Testimonials = () => {
    const testimonials = [
        {
            id: 1,
            name: "Sarah Chen",
            school: "Stanford University",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            testimonial: "Zuno completely transformed how I study. The AI organization feature saved me hours every week, and I finally feel in control of my coursework."
        },
        {
            id: 2,
            name: "Marcus Johnson",
            school: "Harvard University",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            testimonial: "The collaborative features are incredible. My study group uses Zuno to share notes and track our progress together. My GPA improved by 0.5 points!"
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            school: "MIT",
            photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            testimonial: "As an engineering student, I needed something that could handle complex subjects. Zuno's smart categorization and progress tracking keep me on top of everything."
        }
    ];

    return (
        <div className="testimonials">
            <div className="testimonials-grid">
                {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                    <div className="testimonial-content">
                        <p className="testimonial-text">"{testimonial.testimonial}"</p>
                    </div>
                    <div className="testimonial-author">
                        <img
                            src={testimonial.photo}
                            alt={testimonial.name}
                            className="author-photo"
                        />
                    <div className="author-info">
                        <h4 className="author-name">{testimonial.name}</h4>
                        <p className="author-school">{testimonial.school}</p>
                    </div>
                </div>
            </div>
            ))}
        </div>
    </div>
);
};

export default Testimonials;
