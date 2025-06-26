import React from 'react';
import './Overview.css';

const Overview = () => {
    return (
        <div className="overview">
            <h1 className="overview-header">we are redefining the edtech space.</h1>
            <div className="overview-content">
                <div className="left-overview">
                    <p className="overview-text">multiple applications, multiple deadlines, multiple classes....
                        learning shouldn't be overwhelming. what if everything you
                        needed to succeed—your study sessions, notes, calendars,
                        assignments, peers, and teachers—lived in one place?
                    </p>
                    <p className="catch-line">that's zuno</p>
                    <p className="overview-text">an all-in-one academic productivity platform that helps you
                        stay organized, study smarter, and stay connected—built from
                        the ground up with students in mind.
                    </p>
                    <div className="cta">
                        <button>join zuno</button>
                    </div>
                </div>
                <div className="overview-image">
                    <img src="images/hero.png" alt="overview image"/>
                </div>
            </div>
        </div>
    );
};

export default Overview;
