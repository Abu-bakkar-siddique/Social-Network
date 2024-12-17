import React from 'react';
import { Link } from 'react-router-dom';
import { handleErrorField, CSRFToken } from '../utils'; // Correct path if utils.js is in the same directory
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login({ setUser }) {
    const [credentials, setCredentials] = useState({ "username": '', "password": '' });
    const navigate = useNavigate(); // Use useNavigate for React Router v6

    let handleChange = (evnt) => {
        const { name, value } = evnt.target; // field name and value extracted from the respective input field
        setCredentials(prev => ({ ...prev, [name]: value }));
    }

    const loginCall = (event) => {
        event.preventDefault();

        if (!credentials.username && !credentials.password) {
            handleErrorField(['username', 'password']);
            return null;
        }
        else if (!credentials.username) {
            handleErrorField(['username']);
            return null;
        }
        else if (!credentials.password) {
            handleErrorField(['password']);
            return null;
        }

        fetch("/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                "username": credentials.username,
                "password": credentials.password
            })
        }).then(response => {
            if (!response.ok) {
                console.log("wrong credentials");
                handleErrorField(['username', 'password']);
                throw new Error(`something went wrong ${response.status}`);
            }
            return response.json();
        }).then(data => {
            // set the user to be authenticated
            setUser({ username: credentials.username, userId: data.userId, authenticated: true }); // updating the user state for navbar changes 
            localStorage.setItem("user", JSON.stringify({
                username: credentials.username,
                authenticated: true,
                userId: data.userId
            }));
            navigate("/"); // Use navigate() for navigation in v6
        }).catch(error => {
            console.log(error);
        })
    };

    return (
        <div className="auth-container">
            <h2 style={{ textAlign: 'center', color: '#98a4b3', marginBottom: '10px' }}>Login</h2>

            <form onSubmit={loginCall}>
                <div className="form-group">
                    <input id="username" value={credentials.username} autoFocus onChange={handleChange} className="form-control-x shape-round" type="text" name="username" placeholder="Username" />
                </div>
                <div className="form-group">
                    <input id="password" value={credentials.password} className="form-control-x shape-round" onChange={handleChange} type="password" name="password" placeholder="Password" />
                </div>
                <button className="btn btn-prim shape-round" type="submit">Login</button>
            </form>
            <div className="auth-link">
                Don't have an account?
                <Link style={{ color: '#0ca88e' }} to="/register"> Register here.</Link>
            </div>
        </div>
    );
}

export default Login;
