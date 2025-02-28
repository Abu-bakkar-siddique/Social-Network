const { useState, useEffect, createContext, useContext } = React;
const { BrowserRouter, Route, Switch, Link, useHistory, useParams, useLocation } = ReactRouterDOM;

function CSRFToken() {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    return token ? decodeURIComponent(token.split('=')[1]) : null;
}

// Check
function NewPost({ user }) {
    const [post, setPost] = React.useState({ 'title': '', 'body': '', 'postId': null });
    const history = useHistory();
    const location = useLocation();

    let EditPost = location.state ? location.state.post : null;

    // checking for the post edit call
    React.useEffect(() => {
        if (EditPost) {
            console.log("Edit post request "); ~
                console.log("post title :" + EditPost.title);
            console.log("post body :" + EditPost.body);

            setPost({ title: EditPost.title, body: EditPost.body, postId: EditPost.postId });
        } else {
            console.log("Nope!");
        }
    }, [])

    function submitPost(event, postId = null) {

        event.preventDefault();
        let body = postId ? JSON.stringify({
            'title': post.title,
            'body': post.body,
            'postId': post.postId
        }) :
            JSON.stringify({
                'title': post.title,
                'body': post.body,
            })

        const url = postId ? '/edit_post' : '/create_post';

        if (post.title && post.body) {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken(),
                },
                body: body,
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    history.push(`/profile?userID=${user.userId}`)

                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });

            // Clear the form fields
            setPost({ title: '', body: '', postId: null });
        } else {
            console.log('Please fill up all fields.');
        }
    };

    return (
        <div className="text-center">
            <div id="new-post" className="justify-content-center mt-4">
                <div className="d-flex ml-2 justify-content-start">
                    <h3 className="main-heading">Create Post</h3>
                </div>
            </div>

            <form id="compose-form" onSubmit={(event) => { EditPost ? submitPost(event, post.postId) : submitPost(event) }}>
                <textarea
                    value={post.title}
                    onChange={(e) => setPost({ ...post, title: e.target.value })}
                    className="form-control-x shape-round mb-3"
                    placeholder="Title"
                    rows="1"
                />

                <textarea
                    value={post.body}
                    onChange={(e) => setPost({ ...post, body: e.target.value })}
                    className="form-control-x shape-round mb-3"
                    placeholder="What's up on your mind?"
                    rows="6"
                />

                <div className="d-flex justify-content-end">

                    {EditPost && (
                        <button id="post-btn" type="submit" className="btn btn-prim shape-round col-2">Save</button>
                    )}
                    {!EditPost && (
                        <button id="post-btn" type="submit" className="btn btn-prim shape-round col-2">Post</button>
                    )}
                </div>
            </form>
        </div>
    );
}

// Check
function FixedNavbars({ setCurrentPage, currentPage }) {
    const { user } = useContext(AuthGlobalContext);
    return (
        <>

            <div>
                <nav className="sidebar">

                    <Link className="navbar-brand" to="/">NetWork</Link>

                    <ul className="navbar-nav">
                        {user.authenticated && (
                            <li className="nav-item">
                                {/* add an image here with the username */}
                                <Link className="nav-link" onClick={() => setCurrentPage(1)} to={`/profile?userID=${user.userId}`}><strong>{user.username}</strong></Link>
                            </li>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link" onClick={() => setCurrentPage(1)} to={`/feed?category=all&page=${currentPage}`}>All Posts</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/search">Search</Link>
                        </li>

                        {user.authenticated && (
                            <>
                                <li className="nav-item">
                                    {/* added a to attribute to go to specific URL */}
                                    <Link className="nav-link" to="/create_post">Create Post</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" onClick={() => setCurrentPage(1)} to={`/feed?category=following&page=${currentPage}`}>Following</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/recommendations">Recommendations</Link>
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

// Check
function handleErrorField(elements) {
    elements.forEach((id) => {
        document.getElementById(id).classList.remove('form-control-x');
        document.getElementById(id).classList.add('form-control-error');
    })
}

//Check
function Login({ setUser }) {
    const [credentials, setCredentials] = React.useState({ "username": '', "password": '' });
    const history = useHistory();

    let handleChange = (evnt) => {
        const { name, value } = evnt.target; // field name and valuee extracted from the respective input field
        setCredentials(prev => ({ ...prev, [name]: value }));
    }

    const loginCall = (event) => {
        event.preventDefault();

        if (!credentials.username && !credentials.password) {
            handleErrorField(['username', 'password'])
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
                console.log("wrong credentials")
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
            }
            ));
            history.push("/");
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

//Check
function Register() {

    // const { setUser } = useContext(AuthGlobalContext);
    const [registerInfo, setRegisterInfo] = React.useState({
        "username_r": '',
        'email_r': '',
        "password_r": '',
        'confirmation_r': ''
    });

    const history = useHistory();
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

            history.push('/login');
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

// LEFT OF HERE 
const AuthGlobalContext = createContext();

function App() {

    let userVar = localStorage.getItem('user');
    const [user, setUser] = React.useState(userVar ? JSON.parse(userVar) : { username: undefined, userId: undefined, authenticated: false });

    const [currentPage, setCurrentPage] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('page')) || 1;
    });

    React.useEffect(() => {

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

        <AuthGlobalContext.Provider value={{ user, setUser }}>

            <BrowserRouter>
                <FixedNavbars currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <Switch>
                    <Route
                        exact path="/create_post"
                        render={(props) => (
                            <NewPost
                                {...props}
                                user={user}
                            />
                        )}
                    />
                    <Route
                        exact path="/edit_post"
                        render={(props) => (
                            <NewPost
                                {...props}
                                user={user}
                            />
                        )}
                    />
                    <Route
                        exact path="/search"
                        render={(props) => (
                            <Search
                                {...props}
                                user={user}
                            />
                        )}
                    />
                    <Route
                        exact path="/"
                        render={(props) => (
                            <AllPosts
                                {...props}
                                currentPage={currentPage} setCurrentPage={setCurrentPage}
                                profileDetails={undefined}
                            />
                        )}
                    />
                    <Route
                        exact path="/recommendations"
                        render={(props) => (
                            <Recommendations
                                {...props}
                                user={user}
                            />
                        )}
                    />
                    <Route
                        path="/feed"
                        render={(props) => (
                            <AllPosts
                                {...props}
                                currentPage={currentPage} setCurrentPage={setCurrentPage}
                                profileDetails={undefined}
                            />
                        )}
                    />

                    {/* Use render prop with explicit setUser prop */}
                    <Route
                        path="/login"
                        render={(props) => (
                            <Login
                                {...props}
                                setUser={setUser}
                            />
                        )}
                    />
                    <Route path="/register" component={Register} />

                    <Route
                        path="/logout"
                        render={(props) => (
                            <HandleLogout
                                {...props}
                                setUser={setUser}
                            />
                        )}
                    />

                    <Route
                        path="/profile"
                        render={(props) => (
                            <ProfilePage
                                {...props}
                                setCurrentPage={setCurrentPage}
                                currentPage={currentPage}
                                authenticated={user.authenticated}
                            />
                        )}
                    />

                    <Route
                        exact path="/edit_post"
                        render={(props) => (
                            <NewPost
                                {...props}
                                user={user}
                            />
                        )}
                    />

                </Switch>
            </BrowserRouter>
        </AuthGlobalContext.Provider>
    );
}

function HandleLogout({ setUser }) {
    const history = useHistory();
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
                history.push("/login");
            }
        }).catch(error => {
            console.log("Error", error);
        })
    }, [history, setUser])
    return null;
}

const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center h-32">
            <div className="relative w-12 h-12">
                <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
                <div className="absolute w-full h-full border-4 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

function ProfilePage({ authenticated = false, setCurrentPage, currentPage }) {
    const [initialLoading, setInitialLoading] = useState(true);
    const [profileDetails, setProfileDetails] = useState({
        'userId': null,
        'username': '',
        'followers': undefined,
        'following': undefined,
        'profilePicUrl': '',
        'selfProfile': true,
        'imFollowing': undefined
    });
    const [followed, setFollowed] = useState(false);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const userId = params.get('userID');

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
                setTimeout(() => {
                    setProfileDetails(prevData => ({ ...prevData, profilePicUrl: data.new_profile_pic_url }));
                    console.log(`Profile picture updated successfully :${data.new_profile_pic_url}`);
                }, 2000)
            })
            .catch(error => {
                console.error("Error updating profile picture:", error);
            });
    }

    if (!authenticated) {
        return <h1 className="main-heading">You are not logged in!</h1>;
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
        }).then(response => {
            if (response.ok) {
                console.log(`yess ${response.status}`);
                return response.json();
            }
        }).then(data => {
            console.log(data.message);
            setFollowed(!followed);
            console.log(followed);
        });
    }

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const page = parseInt(params.get('page')) || 1;
        setCurrentPage(page);
    }, [location.search]);

    useEffect(() => {
        const url = new URL('/profile', window.location.origin);
        url.searchParams.append('userID', userId);

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken()
            }
        }).then(response => {
            if (response.ok) {
                console.log(`yess ${response.status}`);
                console.log(userId);
                return response.json();
            } else {
                console.log(`something went wrong! + ${response.status}`);
                throw new Error(`HTTP response error ${response.status}`);
            }
        }).then(profileData => {
            try {
                setProfileDetails({
                    username: profileData.username,
                    profilePicUrl: profileData.profilePicUrl,
                    followers: profileData.followers,
                    following: profileData.following,
                    selfProfile: profileData.selfProfile,
                    imFollowing: profileData.imFollowing
                });
                setInitialLoading(false);
            } catch (err) {
                console.error("Error setting state:", err);
                setInitialLoading(false);
                throw err;
            }
        }).catch(error => {
            console.error("Error fetching profile:", error);
            setInitialLoading(false);
        });
    }, [userId, followed, currentPage]);

    if (initialLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <div className="profile-container justify-content-center align-items-center mt-5">
                <div className="text-center text-color-cream mt-4">
                    <div className="mt-4">
                        {profileDetails.selfProfile &&
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
                        }
                        {!profileDetails.selfProfile &&
                            <div>
                                <img
                                    src={profileDetails.profilePicUrl}
                                    className="border rounded-circle profile-dimensions"
                                    alt="Avatar"
                                    width="240"
                                />
                            </div>
                        }
                    </div>
                    <div className="mt-3 text-center">
                        <h4 className="mb-2 username-size">{profileDetails.username}</h4>
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
                <AllPosts userId={userId} profileDetails={profileDetails} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </>
    );
}
function Recommendations({ user }) {

    const [allRecommendations, setAllRecommendations] = useState([]);
    const [followed, setFollowed] = useState(false);
    const history = useHistory();
    let url = new URL("/recommendations", window.location.origin);

    function HandleFollowRequest(userId) {
        fetch('/follow', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'userID': userId
            })
        }).then(response => {
            if (response.ok) {
                console.log(`yess ${response.status}`);
                return response.json();
            }
        }).then(data => {
            console.log(data.message);
            setFollowed(!followed);
            console.log(followed);
        });
    }

    useEffect(() => {
        fetch(url, {
            method: "GET",
            headers: {
                'X-CSRFToken': CSRFToken(),
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                console.log(`recommendations fetched : ${response.status}`);
                return response.json();
            }
        }).then(data => {
            // update state here
            console.log(data.recommendations)
            setAllRecommendations(data.recommendations);
        }).catch(e => {
            throw new Error(`An Error occured while fetching recommendations ${e}`);
        })
    }, [followed]);

    function makeFollowCall(e, user_id) {
        e.preventDefault();
        console.log(user_id);
        HandleFollowRequest(user_id);
    }
    return (
        <>

            <div className="row justify-content-center align-items-center">
                {allRecommendations.map((rec, idx) =>
                (
                    < div key={idx} className=" col-4 container mt-2" >
                        <div className="profile-container text-center">
                            <div className="text-center text-color-cream mt-4">
                                <div className="mt-4">
                                    <img
                                        src={rec.profile_picture}
                                        className="border rounded-circle profile-dimensions"
                                        alt="Avatar"
                                        width="120"
                                    />
                                </div>
                                <div className="mt-3 text-center">
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        history.push(`/profile?userID=${rec.id}`)

                                    }}>
                                        <h4 className="mb-2 username-size-1">{rec.username}</h4>
                                    </a>
                                    <button onClick={(e) => makeFollowCall(e, rec.id)} className="btn-prim follow shape-round col-6">
                                        follow
                                    </button>
                                    <div className="justify-content-center mt-4 px-4 row">
                                        <div className="text-size-2">
                                            <h6 className="mb-0 col-12 text-size-2">Followers</h6>
                                            <span>{rec.followers}</span>
                                        </div>
                                        <div className="text-size-2">
                                            <h6 className="mb-0 col-12 text-size-2">Following</h6>
                                            <span>{rec.following}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <h6 className="mb-2 text-size-2">Interests</h6>

                                        <div className="d-flex flex-wrap justify-content-center gap-2">
                                            {rec.interests.map((interest, idx) => (
                                                <span key={idx} className="badge bg-secondary mt-1 custom-badge ml-1">{interest}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div >


        </>

    );
}

// user is undefined means fetch all posts, not specific to any user
function AllPosts({ userId = null, profileDetails = undefined, currentPage, setCurrentPage }) {
    const [loader, setLoader] = useState(true);
    const [posts, setPosts] = useState([]); // all posts
    const [comments, setComments] = useState([]); // all comments
    const [CurrentUserProfilePic, setCurrentUserProfilePic] = useState('');
    const [comment, setComment] = useState('');
    const [like, setLike] = useState({ 'type': undefined, 'id': undefined });
    const [pageRequest, setPageRequest] = useState(false);
    const [commentPost, setCommentPost] = useState(0)
    const { user } = useContext(AuthGlobalContext);

    const location = useLocation();
    const history = useHistory();
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    let type = null;

    // this checks if on profilePage
    if (userId) {
        type = userId;
    }

    //feed page check
    else if (path === '/feed') {
        type = params.get('category');
    }

    else if (path === '/') {
        type = 'all';
    }

    const updateComment = (e) => {
        setComment(e.target.value);
    }

    function updateLikes(id, type = 'post') {
        let operation = 'update_post_likes';
        if (type !== 'post') {
            operation = 'update_comment_likes';
        }

        // make database update first
        fetch('/feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'operation': operation,
                'id': id // +1 to this comment likes in the database
            })
        }).then(response => {
            if (response.ok) { // if the update was successfull in the db than change the posts state
                setLike({ 'type': type, 'id': id });
                console.log('likes updated successfully');
            }
            else {
                throw new Error(`something went wrong ${response.status}`)
            }
        }).catch(e => {
            console.log(e);
        })
        setLike({});
        setPageRequest(!pageRequest);
    }

    function updatePosts(parameter) {
        const posts = [];
        const comments = {};

        parameter.forEach(post => {

            posts.push({
                id: post.id,
                user_id: post.user_id,
                username: post.username,
                profile_pic_url: post.profile_pic_url,
                title: post.title,
                body: post.body,
                timestamp: post.timestamp,
                likes: post.likes,
                comment_count: post.comment_count,
                selfPost: post.self_post
            });

            comments[post.id] = post.post_comments;
        });

        setPosts(posts);
        setComments(comments);
    }

    function togglePrevious() {
        const newPage = currentPage - 1;
        const params = new URLSearchParams(location.search);
        params.set('page', newPage);
        if (profileDetails) {
            history.push(`/profile?${params.toString()}`);
        }
        else {
            history.push(`/feed?${params.toString()}`);
        }
        setCurrentPage(newPage); // Sync state with URL
    }

    function toggleNext() {
        const newPage = currentPage + 1;
        const params = new URLSearchParams(location.search);
        params.set('page', newPage);
        if (profileDetails) {
            history.push(`/profile?${params.toString()}`);
        }

        else {
            history.push(`/feed?${params.toString()}`);
        }
        setCurrentPage(newPage); // Sync state with URL
    }

    function addComment(post_id) {
        // make database update first
        if (!comment) return null;
        fetch('/feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'operation': 'new_comment',
                'post_id': post_id,
                'comment_body': comment // Use the `comment` from state
            })

        }).then(response => {
            if (response.ok) {
                setCommentPost(commentPost + 1);
                console.log("comment posted sucessfully");
                setComment('');
                // Clear the comment box after submission
            } else {
                setComment('');
                throw new Error(`something went wrong ${response.status}`);
            }
        }).catch(e => {
            console.log(e);
        });
        setComment('');
    }

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const page = parseInt(params.get('page')) || 1;

        setCurrentPage(page);
    }, [location.search]);

    React.useEffect(() => {
        const url = new URL('/feed', window.location.origin); // or another base URL
        url.searchParams.append('category', type);
        url.searchParams.append('page', currentPage);

        fetch(url, {
            method: 'GET',
            headers: {
                'X-CSRFToken': CSRFToken(),
                'Accept': 'application/json'
            }

        }).then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
        }).then(data => {

            // Call update posts here 
            updatePosts(data.posts);
            console.log(data.current_user_profile_pic);
            setCurrentUserProfilePic(data.current_user_profile_pic);
            setLoader(false);
        }).catch(e => {
            setLoader(false);
            console.log(e);
        });
        setLoader(false);
    }, [like, pageRequest, commentPost, profileDetails, currentPage, type]);

    function ViewProfile(user_id) {
        const url = new URL(window.location.href);
        url.pathname = '/profile';
        url.searchParams.set('userID', user_id);
        history.push(url.pathname + url.search);
    }

    if (loader) {
        return <LoadingSpinner />
    }

    return (
        <>
            <div>
                <div className='text-center'>
                    {posts.length === 0 ? (
                        <div className="main-heading">Feed is empty</div>
                    ) : (
                        posts.map((post, index) => (

                            <div key={index} className="profile-container shape-round text-center mt-5" >
                                {/* user/poster profile information */}
                                <div className="d-flex mb-3 shape-round align-items-center">

                                    <a href="#" onClick={(e) => {
                                        e.preventDefault()
                                        ViewProfile(post['user_id'])
                                    }}>
                                        <img
                                            src={post.profile_pic_url}
                                            className="border ml-1 mt-1 rounded-circle profile-pic-height me-2"
                                            alt="Avatar"
                                            width="40"
                                        />
                                    </a>
                                    <div className="d-flex justify-content-between w-100">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                ViewProfile(post['user_id']);
                                            }}
                                            className="text-color-cream ml-3 me-2"
                                        >
                                            {post['username']}
                                        </a>

                                        <div className="d-flex align-items-center">
                                            <p className="text-muted mb-0 mr-3 text-end">{post['timestamp']}</p>
                                            {post['selfPost'] && (
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        history.push('/edit_post', { post: { 'title': post.title, 'body': post.body, 'postId': post.id } })
                                                    }}
                                                    className="text-color-cream mr-3 me-2"
                                                >
                                                    Edit
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                <div className="text-left ml-4 mb-4 text-color-cream" >
                                    <h4>
                                        {post.title}
                                    </h4>
                                </div>

                                <div className="text-left ml-4 text-color-cream">
                                    {post.body}
                                </div>

                                <div className="card-body ">
                                    <div className="d-flex justify-content-between text-center border-top mb-4">
                                        {/* like update button */}
                                        <a
                                            type="button"
                                            className={`btn btn-link text-color-cream btn-lg ${!user.authenticated ? 'disabled' : ''}`}
                                            data-mdb-ripple-color="dark"
                                            onClick={(e) => {
                                                if (!user.authenticated) {
                                                    console.log(`cant like the post${user.authenticated}`);
                                                    e.preventDefault(); // Prevent click action if not authenticated
                                                } else {
                                                    updateLikes(post.id, 'post');
                                                }
                                            }}
                                        >
                                            <i className="fas fa-heart text-danger"></i> {post.likes}
                                        </a>

                                        {/* update comments this doesnt work, just here for aesthetics */}
                                        <a
                                            type="button"
                                            data-mdb-button-init
                                            data-mdb-ripple-init
                                            className="btn btn-link text-color-cream btn-lg"
                                            data-mdb-ripple-color="dark"
                                        >
                                            <i className="fas fa-comment-alt text-color-cream"></i> {post.comment_count}
                                        </a>

                                        <a
                                            type="button"
                                            data-mdb-button-init
                                            data-mdb-ripple-init
                                            className="btn btn-link btn-lg"
                                            data-mdb-ripple-color="dark"
                                        >
                                            <i className="fas fa-share text-color-cream me-2"></i>
                                        </a>
                                    </div>

                                    {user.authenticated && (
                                        <div className="d-flex mr-3">

                                            <a href="#" onClick={(e) => {
                                                e.preventDefault()
                                                ViewProfile(user.userId)
                                            }} className="text-color-cream ml-3 me-2">

                                                <img
                                                    src={CurrentUserProfilePic}
                                                    className="border profile-pic-height rounded-circle me-2"
                                                    alt="Avatar"
                                                    width="40"
                                                />
                                            </a>
                                            <div className=" w-100 ml-2 text-left">

                                                <textarea
                                                    id='comment_body'
                                                    onChange={updateComment}
                                                    className="comment-box"
                                                    rows="2"
                                                    placeholder="Write a comment"
                                                />

                                                <a href="#" onClick={() => addComment(post.id)} className="text-color-cream ml-3 me-2">
                                                    post comment
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5">
                                        {comments[post.id]?.map((comnt, idx) => (
                                            <div key={idx} className="d-flex mr-3 mt-2 border-bottom">

                                                <a
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        ViewProfile(comnt['userId'])
                                                    }} className="text-color-cream ml-3 me-2">

                                                    <img
                                                        src={comnt.user_profile_pic_url}
                                                        className="border profile-pic-height rounded-circle me-2"
                                                        alt="Avatar"
                                                        width="40"
                                                    />
                                                </a>

                                                <div className="w-100 ml-2 text-left">
                                                    <div className="comment-body" rows="2">
                                                        {comnt.comment_body}
                                                    </div>
                                                    <a
                                                        type="button"

                                                        onClick={(e) => {
                                                            if (!user.authenticated) {
                                                                e.preventDefault(); // Prevent click action if not authenticated
                                                            } else {
                                                                updateLikes(comnt.id, 'comment');
                                                            }
                                                        }} data-mdb-button-init
                                                        data-mdb-ripple-init
                                                        className="btn btn-link text-color-cream btn-sm"
                                                        data-mdb-ripple-color="dark"
                                                    >
                                                        <i className="fas fa-heart text-danger"></i> {comnt.likes}
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="d-flex justify-content-center mt-3 align-items-center">
                        {currentPage > 1 && (
                            <button className="btn-prim mr-4 col-2 shape-round"
                                onClick={() => togglePrevious()}
                                disabled={currentPage <= 1}>
                                Previous
                            </button>
                        )}

                        {posts.length >= 10 && (
                            <button className="btn-prim shape-round col-2"
                                onClick={() => toggleNext()}
                                disabled={posts.length < 10}>
                                Next
                            </button>
                        )}
                    </div>

                </div>
            </div >

        </>
    );
}

function Search() {
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [followed, setFollowed] = useState(false);
    const history = useHistory();

    function HandleFollowRequest(userId) {
        fetch('/follow', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'userID': userId
            })
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
        }).then(data => {
            setFollowed(!followed);
        });
    }

    function handleSearch() {
        const url = new URL('/search', window.location.origin);
        url.searchParams.append('query', searchQuery);

        fetch(url, {
            method: 'GET',
            headers: {
                'X-CSRFToken': CSRFToken(),
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
        }).then(data => {
            console.log(data.search_results);
            setSearchResults(data.search_results);

        }).catch(e => {
            throw new Error(`An Error occurred while searching: ${e}`);
        });
    }

    function makeFollowCall(e, user_id) {
        e.preventDefault();
        HandleFollowRequest(user_id);
    }

    return (
        <>
            <div className="topnav row">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input shape-round col-8"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        className="btn search-button shape-round col-4"
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="row justify-content-center align-items-center">
                {searchResults.map((user, idx) => (
                    <div key={idx} className="col-4 container mt-2">
                        <div className="profile-container text-center">
                            <div className="text-center text-color-cream mt-4">
                                <div className="mt-4">
                                    <img
                                        src={user.profile_picture}
                                        className="border rounded-circle profile-dimensions"
                                        alt="Avatar"
                                        width="120"
                                    />
                                </div>
                                <div className="mt-3 text-center">
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        history.push(`/profile?userID=${user.id}`)
                                    }}>
                                        <h4 className="mb-2 username-size-1">{user.username}</h4>
                                    </a>
                                    <button
                                        onClick={(e) => makeFollowCall(e, user.id)}
                                        className="btn-prim follow shape-round col-6"
                                    >
                                        follow
                                    </button>
                                    <div className="justify-content-center mt-4 px-4 row">
                                        <div className="text-size-2">
                                            <h6 className="mb-0 col-12 text-size-2">Followers</h6>
                                            <span>{user.followers}</span>
                                        </div>
                                        <div className="text-size-2">
                                            <h6 className="mb-0 col-12 text-size-2">Following</h6>
                                            <span>{user.following}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <h6 className="mb-2 text-size-2">Interests</h6>
                                        <div className="d-flex flex-wrap justify-content-center gap-2">
                                            {user.interests.map((interest, idx) => (
                                                <span key={idx} className="badge bg-secondary mt-1 custom-badge ml-1">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
ReactDOM.render(<App />, document.querySelector("#root"));