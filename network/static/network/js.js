const { BrowserRouter, Route, Switch, Link, useHistory } = ReactRouterDOM;
const { useState, useContext, createContext } = React;
function CSRFToken() {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    return token ? decodeURIComponent(token.split('=')[1]) : null;
}

function NewPost() {

    const [post, setPost] = React.useState({ title: '', body: '' });

    const submitPost = (event) => {
        event.preventDefault();

        if (post.title && post.body) {
            fetch('/create_post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken(),
                },
                body: JSON.stringify({
                    'title': post.title,
                    'body': post.body
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });

            // Clear the form fields
            setPost({ title: '', body: '' });
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

            <form id="compose-form" onSubmit={submitPost}>
                <textarea
                    value={post.title}
                    onChange={(e) => setPost({ ...post, title: e.target.value })}
                    className="form-control-x shape-round mb-3"
                    placeholder="Title"
                    rows="1"
                />

                <textarea
                    value={post.text}
                    onChange={(e) => setPost({ ...post, body: e.target.value })}
                    className="form-control-x shape-round mb-3"
                    placeholder="What's up on your mind?"
                    rows="6"
                />

                <div className="d-flex justify-content-end">
                    <button id="post-btn" type="submit" className="btn btn-prim shape-round col-2">Post</button>
                </div>
            </form>
        </div>
    );
}


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
                    <a className="navbar-brand" to="/">Word Flow</a>

                    <ul className="navbar-nav">
                        {user.authenticated && (
                            <li className="nav-item">
                                {/* add an image here with the username */}
                                <Link className="nav-link" to="/profile"><strong>{user.username}</strong></Link>
                            </li>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link" to="/feed">All Posts</Link>
                        </li>

                        {user.authenticated && (
                            <>
                                <li className="nav-item">
                                    {/* added a to attribute to go to specific URL */}
                                    <Link className="nav-link" to="/create_post">Create Post</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/">Following</Link>
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

function handleErrorField(elements) {
    elements.forEach((id) => {
        document.getElementById(id).classList.remove('form-control-x');
        document.getElementById(id).classList.add('form-control-error');
    })
}


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
            setUser({ username: credentials.username, authenticated: true }); // updating the user state for navbar changes 
            localStorage.setItem("user", JSON.stringify({
                username: credentials.username,
                authenticated: true
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
function Register({ setUser }) {
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
            // set the user to be authenticated
            setUser({ username: registerInfo.username_r, authenticated: true }); // updating the user state for navbar changes 
            localStorage.setItem("user", JSON.stringify({
                username: registerInfo.username_r,
                authenticated: true
            }));
            history.push('/');
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

let userAuthenticated = false;
const AuthGlobalContext = createContext();
function App() {

    let userVar = localStorage.getItem('user'); // user stored in the local storage if they ever logged in previously
    const [user, setUser] = React.useState(userVar ? JSON.parse(userVar) : { username: undefined, userId: undefined, authenticated: false });

    React.useEffect(() => {
        // Fetch user authentication status

        if (!user.authenticated) {
            fetch("/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken()
                }
            })
                .then(response => {
                    if (response.status === 219) {
                        return null;
                    }
                    else if (response.status === 210) {
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
            < BrowserRouter >
                <FixedNavbars user={user} />
                <Switch>
                    {/* also factor these urls on the server side to avoid 404 */}
                    <Route path="/create_post" component={NewPost} />
                    <Route path="/feed" component={AllPosts} />
                    <Route path="/" exact component={() => <h1>Welcome to Network</h1>} />
                    <Route
                        path="/login"
                        render={(props) => <Login {...props} setUser={setUser} />}
                    />
                    <Route path="/logout"
                        render={(props) => <HandleLogout {...props} setUser={setUser} HandleLogout />}
                    />
                    <Route path="/register"
                        render={(props) => <Register {...props} setUser={setUser} Register />}
                    />
                    <Route path="/profile"
                        render={(props) => <ProfilePage  {...props} user={user} Profile />}
                    />
                </Switch>
            </BrowserRouter >
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

function ProfilePage({ user }) {
    if (!user.authenticated) {
        return (

            <h1 className="main-heading"> You are not logged in! </h1>
        )
    }
    const [profileDetails, setProfileDetails] = useState({ 'username': '', 'profilePicUrl': '', 'followers': undefined, 'following': undefined })

    useEffect(() => {
        // fetch users profile detials here  
        const url = new URL('/profile', window.location.origin);
        url.searchParams('userID', `${user.userId}`);
        fetch(url, {
            method: GET,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            }
        }).then(response)
    })
    return (
        <div className="profile-container justify-content-center align-items-center mt-5">
            <div className=" text-center mt-4">

                <div className="mt-3">
                    <img src="https://i.imgur.com/JgYD2nQ.jpg" className="rounded-circle" width="160" />
                </div>

                <div className="mt-3 text-center">
                    <h4 className="mb-2">{user.username}</h4>

                    {/* This button is conditional, means it should'nt apear if user is viewing own profile 
                    and follow OR unfollow accordingly*/}
                    <button className=" btn-prim follow shape-round col-2">Follow</button>
                    <div className="justify-content-center  mt-4 px-4 row">
                        <div>
                            <h6 className="mb-0 col-6">Followers</h6>
                            <span>8,797</span>

                        </div>
                        <div>
                            <h6 className="mb-0 col-6">Following</h6>
                            <span>142</span>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    )

}

// user is undefined means fetch all posts, not specific to any user
function AllPosts({ user = undefined }) { // providing default props

    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]); // all comments 
    const [comment, setComment] = useState('');
    const [like, setLike] = useState({ 'type': '', 'id': undefined });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageRequest, setPageRequest] = useState(false);
    const [commentPost, setCommentPost] = useState(0)

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
                username: post.username,
                profile_pic_url: post.profile_pic_url,
                title: post.title,
                body: post.body,
                timestamp: post.timestamp,
                likes: post.likes,
                comment_count: post.comment_count

            });

            comments[post.id] = post.post_comments;
        });

        setPosts(posts);
        setComments(comments);
    }

    function togglePrevious() {
        setCurrentPage(currentPage - 1);
        setTimeout(() => setPageRequest(pageRequest + 1));
    }
    function toggleNext() {
        setCurrentPage(currentPage + 1);
        setTimeout(() => setPageRequest(pageRequest + 1));
    }

    function addComment(post_id) {
        // make database update first
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
    }

    React.useEffect(() => {
        const url = new URL('/feed', window.location.origin); // or another base URL
        url.searchParams.append('category', user ? user.userId : 'all');
        url.searchParams.append('page', currentPage);
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken(),
            }
        }).then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
        }).then(data => {
            // Call update posts here 
            updatePosts(data.posts);
        }).catch(e => {
            console.log(e);
        });
    }, [like, pageRequest, commentPost]); // Dependencies

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
                                    <a href="">
                                        <img
                                            src={post.profile_pic_url}
                                            className="border ml-1 mt-1 rounded-circle profile-pic-height me-2"
                                            alt="Avatar"
                                        />
                                    </a>

                                    <div className="d-flex justify-content-between w-100">
                                        <a href="#" className="text-color-cream ml-3 me-2">
                                            {post['username']}
                                        </a>
                                        <p className="text-muted mb-0 mr-3 text-end">
                                            {post['timestamp']}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left ml-4 mb-4 text-color-cream" >
                                    <h4>
                                        {post.title}
                                    </h4>
                                </div>

                                <div className="text-left ml-4 text-color-cream">
                                    {post.body}  {post.profile_pic_url}
                                </div>

                                <div className="card-body ">
                                    <div className="d-flex justify-content-between text-center border-top mb-4">
                                        {/* like update button */}
                                        <a
                                            type="button"
                                            data-mdb-button-init
                                            data-mdb-ripple-init
                                            onClick={() => updateLikes(post.id, 'post')}
                                            className="btn btn-link text-color-cream btn-lg"
                                            data-mdb-ripple-color="dark"
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

                                    <div className="d-flex mr-3">
                                        <a href="">
                                            <img
                                                src={post.profile_pic_url}
                                                className="border profile-pic-height rounded-circle me-2"
                                                alt="Avatar"
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

                                            <a onClick={() => addComment(post.id)} className="text-color-cream  me-2">
                                                post comment
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        {comments[post.id]?.map((comnt, idx) => (
                                            <div key={idx} className="d-flex mr-3 mt-2 border-bottom">
                                                <a href="">
                                                    <img
                                                        src={post.profile_pic_url}
                                                        className="border profile-pic-height rounded-circle me-2"
                                                        alt="Avatar"
                                                    />
                                                </a>

                                                <div className="w-100 ml-2 text-left">
                                                    <div className="comment-body" rows="2">
                                                        {comnt.comment_body}
                                                    </div>
                                                    <a
                                                        type="button"
                                                        onClick={() => updateLikes(comnt.id, 'comment')}
                                                        data-mdb-button-init
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

ReactDOM.render(<App />, document.querySelector("#root"));
