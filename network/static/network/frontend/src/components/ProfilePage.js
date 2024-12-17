import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Ensure you're using the correct version of useLocation
import { CSRFToken } from '../utils'; // Correct path if utils.js is in the same directory
import AllPosts from './AllPosts';

function ProfilePage({ authenticated = false }) {

    const userId = params.get('userID');
    const params = new URLSearchParams(location.search);

    const location = useLocation();
    const [profileDetails, setProfileDetails] = useState({ 'username': '', 'followers': undefined, 'following': undefined, 'profilePicUrl': '', 'selfProfile': true, 'imFollowing': undefined })
    const [followed, setFollowed] = useState(false);

    useEffect(() => {
        // fetch users profile details here  
        const url = new URL(`/profile?userID=${userId}`, window.location.origin);
        url.searchParams.append('userID', userId);

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken()
            }
        })
            .then(response => {
                if (response.ok) {
                    console.log(`yess ${response.status}`);
                    console.log(userId);
                    return response.json();
                } else {
                    console.log(`Something went wrong! + ${response.status}`);
                    throw new Error(`HTTP response error ${response.status}`);
                }
            })
            .then(profileData => {
                try {
                    setProfileDetails({
                        username: profileData.username,
                        profilePicUrl: profileData.profilePicUrl,
                        followers: profileData.followers,
                        following: profileData.following,
                        selfProfile: profileData.selfProfile,
                        imFollowing: profileData.imFollowing
                    });
                } catch (err) {
                    console.error("Error setting state:", err);
                    throw err; // Ensures the catch block is hit
                }
            });
    }, [userId, followed]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];

        if (!file) {
            console.log("No file is selected");
            alert("Please select a file.");
            return;
        }

        const imageForm = new FormData();
        imageForm.append('profile_pic', file);

        fetch('/profile', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken(),
            },
            body: imageForm
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setProfileDetails(prevData => ({ ...prevData, profilePicUrl: data.new_profile_pic_url }));
                console.log(`Profile picture updated successfully :${data.new_profile_pic_url}`);
            })
            .catch(error => {
                console.error("Error updating profile picture:", error);
            });
    }

    if (!authenticated) {
        return (
            <h1 className="main-heading"> You are not logged in! </h1>
        )
    }

    function HandleFollowRequest() {
        fetch('/follow', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'userID': userId
            })
        })
            .then(response => {
                if (response.ok) {
                    console.log(`yess ${response.status}`);
                    return response.json();
                }
            })
            .then(data => {
                console.log(data.message);
                setFollowed(!followed);
                console.log(followed)
            })
    }


    return (
        <>
            <div className="profile-container justify-content-center align-items-center mt-5">
                <div className="text-center text-color-cream mt-4">
                    <div className="mt-4">
                        {profileDetails.selfProfile && (
                            <div>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('fileInput').click();
                                    }}
                                >
                                    <img
                                        src={profileDetails.profilePicUrl}
                                        className="border rounded-circle profile-dimensions"
                                        alt="Avatar"
                                        width="240"
                                    />
                                </a>
                                <input
                                    type="file"
                                    id="fileInput"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>
                        )}
                        {!profileDetails.selfProfile && (
                            <div>
                                <img
                                    src={profileDetails.profilePicUrl}
                                    className="border rounded-circle profile-dimensions"
                                    alt="Avatar"
                                    width="240"
                                />
                            </div>
                        )}
                    </div>
                    <div className="mt-3 text-center">
                        <h4 className="mb-2 username-size">{profileDetails.username}</h4>

                        {/* This button is conditional, means it shouldn't appear if the user is viewing their own profile 
                        and follow OR unfollow accordingly */}
                        {!profileDetails.selfProfile && (
                            profileDetails.imFollowing ? (
                                <button onClick={HandleFollowRequest} className="btn-prim follow shape-round col-2">
                                    unfollow
                                </button>
                            ) : (
                                <button onClick={HandleFollowRequest} className="btn-prim follow shape-round col-2">
                                    follow
                                </button>
                            )
                        )}
                        <div className="justify-content-center mt-4 px-4 row">
                            <div className="text-size-2">
                                <h6 className="mb-0 col-6 text-size-2">Followers</h6>
                                <span>{profileDetails.followers}</span>
                            </div>
                            <div className="text-size-2">
                                <h6 className="mb-0 col-6 text-size-2">Following</h6>
                                <span>{profileDetails.following}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-3">
                <AllPosts userId={userId} profileDetails={profileDetails} />
            </div>
        </>
    );
}

export default ProfilePage;
