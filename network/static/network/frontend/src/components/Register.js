import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate for React 18/19
import { handleErrorField, CSRFToken } from '../utils'; // Assuming utils.js is in the components folder

function Register() {
    const [registerInfo, setRegisterInfo] = React.useState({
        "username_r": '',
        'email_r': '',
        "password_r": '',
        'confirmation_r': ''
    });

    const navigate = useNavigate(); // React 18/19 uses useNavigate instead of useHistory

    function listenChange(event) {
        const { name, value } = event.target;
        setRegisterInfo(prev => ({ ...prev, [name]: value }));
    }

    const registerCall = (event) => {
        event.preventDefault();

        if (!registerInfo.username_r && !registerInfo.password_r && !registerInfo.email_r && !registerInfo.confirmation_r) {
            handleErrorField(['username_r', 'password_r', 'email_r', 'confirmation_r']);
            return null;
        }
        else if (!registerInfo.username_r) {
            handleErrorField(['username_r'])
            return null;
        }
        else if (!registerInfo.password_r) {
            handleErrorField(['password_r'])
            return null;
        }
        else if (!registerInfo.email_r) {
            handleErrorField(['email_r'])
            return null;
        }
        else if (!registerInfo.confirmation_r) {
            handleErrorField(['confirmation_r'])
            return null;
        }
        else if (registerInfo.password_r !== registerInfo.confirmation_r) {
            handleErrorField(['confirmation_r', 'password_r']);
            return null;
        }

        fetch("/register", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            credentials: 'include',
            body: JSON.stringify({
                "username": registerInfo.username_r,
                "password": registerInfo.password_r,
                "email": registerInfo.email_r,
                "confirmation": registerInfo.confirmation_r
            })
        }).then(response => {
            if (!response.ok) {
                // only 409 is expected
                console.log(`user already exists ${response.status}`);
                throw new Error(response.status);
            }
            return response.json();
        }).then(data => {
            console.log(data.message);

            navigate('/login'); // React 18/19 uses navigate() instead of history.push
        }).catch(error => {
            console.log(error);
        })
    };

    return (
        <div className="auth-container">
            <h2 style={{ textAlign: 'center', color: '#98a4b3', marginBottom: '10px' }}>Register</h2>

            <form onSubmit={registerCall} method="post">
                <div className="form-group">
                    <input id="username_r" value={registerInfo.username_r} className="form-control-x shape-round" onChange={listenChange} autoFocus type="text" name="username_r" placeholder="Username" />
                </div>
                <div className="form-group">
                    <input id="email_r" value={registerInfo.email_r} className="form-control-x shape-round" onChange={listenChange} type="email" name="email_r" placeholder="Email Address" />
                </div>
                <div className="form-group">
                    <input id="password_r" value={registerInfo.password_r} className="form-control-x shape-round" onChange={listenChange} type="password" name="password_r" placeholder="Password" />
                </div>
                <div className="form-group">
                    <input id="confirmation_r" value={registerInfo.confirmation_r} className="form-control-x shape-round" onChange={listenChange} type="password" name="confirmation_r" placeholder="Confirm Password" />
                </div>
                <button className="btn btn-prim shape-round" type="submit">Register</button>

            </form>
            <div className="auth-link">
                Already have an account?
                <Link style={{ color: '#0ca88e' }} to='/login'> Log In here.</Link>
            </div>
        </div>
    );
}

export default Register;
