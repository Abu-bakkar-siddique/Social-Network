import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FixedNavbars from './components/FixedNavbars';
import NewPost from './components/NewPost';
import AllPosts from './components/AllPosts';
import Login from './components/Login';
import Register from './components/Register';
import HandleLogout from './components/HandleLogout';
import ProfilePage from './components/ProfilePage';
import { CSRFToken } from './utils'; // Make sure utils.js is properly imported
import { useState, useEffect } from 'react';

function App() {

  let userVar = localStorage.getItem('user');
  const [user, setUser] = useState(userVar ? JSON.parse(userVar) : { username: undefined, userId: undefined, authenticated: false });

  useEffect(() => {
    if (!user.authenticated) {
      fetch("/", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': CSRFToken()
        }
      })
        .then(response => {
          if (response.status === 200) {
            return null;
          }
          else if (response.status === 401) {
            console.log("invalid user");
            return null
          }
          else if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data) {
            setUser({
              username: data.username,
              authenticated: data.authenticated,
              userId: data.userId
            });

            localStorage.setItem('user', JSON.stringify({
              username: data.username,
              userId: data.userId,
              authenticated: data.authenticated
            }));
          }
        })
        .catch(error => {
          console.error("Error fetching user data:", error);
        });
    }

  }, []);

  return (

    <BrowserRouter>
      <FixedNavbars user={user} />
      <Routes>
        <Route
          exact path="/create_post"
          element={<NewPost user={user} />}
        />
        <Route
          exact path="/"
          element={<AllPosts profileDetails={undefined} />}
        />
        <Route
          path="/feed"
          element={<AllPosts profileDetails={undefined} />}
        />
        <Route
          path="/login"
          element={<Login setUser={setUser} />}
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/logout"
          element={<HandleLogout setUser={setUser} />}
        />
        <Route
          path="/profile"
          element={<ProfilePage authenticated={user.authenticated} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
