import { useNavigate } from 'react-router-dom'; // React 18/19 uses useNavigate instead of useHistory
import { CSRFToken } from '../utils'; // Corrected import path for utils.js
import React from 'react';
function NewPost({ user }) {
    const [post, setPost] = React.useState({ title: '', body: '' });
    const navigate = useNavigate(); // React 18/19 uses useNavigate for programmatic navigation

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
                    navigate('/feed?type=all'); // Using navigate() to redirect after post submission
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
                    value={post.body} // Fixed typo in value to use body instead of text
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

export default NewPost;
