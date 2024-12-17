import { Link } from 'react-router-dom';
import React from 'react';

function FixedNavbars({ user }) {

    return (
        <>
            <div className="topnav">
                <div className="search-container">
                    <input type="text" className="search-input shape-round col-10" placeholder="Search..." />
                    <button className="btn search-button shape-round col-2">Search</button>
                </div>
            </div>

            <div>
                <nav className="sidebar">
                    <Link className="navbar-brand" to="/">Word Flow</Link>

                    <ul className="navbar-nav">
                        {user.authenticated && (
                            <li className="nav-item">
                                {/* Add an image or username link to profile */}
                                <Link className="nav-link" to={`/profile?userID=${user.userId}`}><strong>{user.username}</strong></Link>
                            </li>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link" to="/feed?type=all">All Posts</Link>
                        </li>

                        {user.authenticated && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/create_post">Create Post</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/feed?type=following">Following</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/logout">Log Out</Link>
                                </li>
                            </>
                        )}

                        {!user.authenticated && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Log In</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </>
    );
}

export default FixedNavbars;
