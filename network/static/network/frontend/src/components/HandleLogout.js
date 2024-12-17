import { useNavigate } from 'react-router-dom'; // useNavigate in React Router v6
import { CSRFToken } from '../utils'; // Adjust import if needed
import React from 'react';

function HandleLogout({ setUser }) {
    const navigate = useNavigate(); // useNavigate hook instead of useHistory

    React.useEffect(() => {
        fetch("/logout", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            }
        }).then(response => {
            if (response.ok) {
                console.log(response.status);
                localStorage.removeItem('user');
                setUser({ username: undefined, authenticated: false }); // updating the user state for navbar changes
                navigate("/login"); // use navigate() to redirect
            }
        }).catch(error => {
            console.log("Error", error);
        })
    }, [navigate, setUser]);

    return null;
}

export default HandleLogout;
