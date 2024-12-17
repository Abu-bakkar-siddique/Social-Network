import { useNavigate, useLocation } from 'react-router-dom'; // v6 hooks
import React, { useState, useEffect } from 'react';
import { CSRFToken } from '../utils'; // Correct path if utils.js is in the same directory
function AllPosts({ profileDetails = undefined }) {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [like, setLike] = useState({ 'type': '', 'id': undefined });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageRequest, setPageRequest] = useState(false);
    const [commentPost, setCommentPost] = useState(0);

    const location = useLocation();
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    let type = null;

    if (path === '/profile') {
        type = params.get('userID');
    }
    else if (path === '/') {
        type = 'all';
    }
    else {
        type = params.get('type');
    }

    const navigate = useNavigate(); // v6 navigate hook

    const updateComment = (e) => {
        setComment(e.target.value);
    }

    function updateLikes(id, type = 'post') {
        let operation = 'update_post_likes';
        if (type !== 'post') {
            operation = 'update_comment_likes';
        }

        fetch('/feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRFToken()
            },
            body: JSON.stringify({
                'operation': operation,
                'id': id
            })
        }).then(response => {
            if (response.ok) {
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
                'comment_body': comment
            })

        }).then(response => {
            if (response.ok) {
                setCommentPost(commentPost + 1);
                console.log("comment posted successfully");
                setComment('');
            } else {
                setComment('');
                throw new Error(`something went wrong ${response.status}`);
            }
        }).catch(e => {
            console.log(e);
        });
    }

    useEffect(() => {
        const url = new URL('/feed', window.location.origin);
        url.searchParams.append('category', type);
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
            updatePosts(data.posts);
        }).catch(e => {
            console.log(e);
        });
    }, [like, pageRequest, commentPost, profileDetails, type]);

    function ViewProfile(user_id) {
        const url = new URL(window.location.href);
        url.pathname = '/profile';
        url.searchParams.set('userID', user_id);
        navigate(url.pathname + url.search); // v6 navigate
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
                                        e.preventDefault();
                                        ViewProfile(post['user_id']);
                                    }}>
                                        <img
                                            src={post.profile_pic_url}
                                            className="border ml-1 mt-1 rounded-circle profile-pic-height me-2"
                                            alt="Avatar"
                                            width="40"
                                        />
                                    </a>

                                    <div className="d-flex justify-content-between w-100">
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            ViewProfile(post['user_id']);
                                        }} className="text-color-cream ml-3 me-2">
                                            {post['username']}
                                        </a>

                                        <p className="text-muted mb-0 mr-3 text-end">
                                            {post['timestamp']}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left ml-4 mb-4 text-color-cream">
                                    <h4>{post.title}</h4>
                                </div>

                                <div className="text-left ml-4 text-color-cream">
                                    {post.body}
                                </div>

                                <div className="card-body">
                                    <div className="d-flex justify-content-between text-center border-top mb-4">
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
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            ViewProfile(post['user_id']);
                                        }} className="text-color-cream ml-3 me-2">
                                            <img
                                                src={post.profile_pic_url}
                                                className="border profile-pic-height rounded-circle me-2"
                                                alt="Avatar"
                                                width="40"
                                            />
                                        </a>

                                        <div className="w-100 ml-2 text-left">
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

                                    <div className="mt-5">
                                        {comments[post.id]?.map((comnt, idx) => (
                                            <div key={idx} className="d-flex mr-3 mt-2 border-bottom">
                                                <a href="#" onClick={(e) => {
                                                    e.preventDefault();
                                                    ViewProfile(comnt['userId']);
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
            </div>
        </>
    );
}
export default AllPosts;