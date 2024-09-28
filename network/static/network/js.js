// let allPages = ['feed', 'new-post']; //an array representation of all the pages in the application.

// document.addEventListener("DOMContentLoaded", () => {

//     document.querySelector("#feed-l").addEventListener("click", () => loadPage('feed'));
//     document.querySelector("#new-post-l").addEventListener("click", () => loadPage('new-post'));
//     loadPage('feed'); // laods th defalt page

// });

// // extracts csrf token from cookies
// function CSRFToken() {
//     const cookies = document.cookie.split(';');
//     cookies.forEach(cookie => {
//         const [name, value] = cookie.trim().split('=');
//         if (name === 'csrftoken') {
//             return value;
//         }
//     });
// }

// function NewPost() {

//     fetch('/create_post', {
//         method: 'POST',

//         headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': CSRFToken()
//         },

//         body: JSON.stringify({
//             'title': document.querySelector("#post_title").value,
//             'text': document.querySelector("#post_text").value
//         })

//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json(); // Convert response to JSON if it's expected
//         })
//         .then(data => {
//             console.log('Success:', data);
//         })
//         .catch(error => {
//             console.error('There was a problem with the fetch operation:', error);
//         });



// }
// function loadPage(page) {
//     console.log("clicked");
//     allPages.forEach(element => {
//         let link_id = element + "-l";

//         if (element === page) {

//             //activa the link and load the page
//             document.querySelector(`#${element}`).classList.remove("d-none");
//             document.querySelector(`#${link_id}`).classList.add("active");
//         } else {
//             // deactivate the link and unload the page
//             document.querySelector(`#${element}`).classList.add("d-none");
//             document.querySelector(`#${link_id}`).classList.remove("active");
//         }
//     });
// }

function NewPost() {

    const [title, setTitle] = React.useState('');
    const [text, setText] = React.useState('');
    const [alertMessage, setAlertMessage] = React.useState('');

    const submitPost = (event) => {
        event.preventDefault();

        if (title && text) {

            fetch('/create_post', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken()
                },

                body: JSON.stringify({
                    'title': title,
                    'text': text
                })

            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json(); // Convert response to JSON if it's expected
                })
                .then(data => {
                    console.log('Success:', data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
            // Clear the form fields
            setTitle('');
            setText('');
        }
        else {
            // call the error component
            console.log("fill up all fields nigga")
        }
    };

    return (
        <div className="text-center">
            <div id="new-post" className="justify-content-center mt-4">
                <div className="d-flex ml-2 justify-content-start">
                    <h3 className=" main-heading">Create Post</h3>
                </div>
            </div>

            <form id="compose-form" onSubmit={submitPost}>
                <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-control shape-round mb-3"
                    placeholder="Title"
                    rows="1"
                />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="form-control shape-round mb-3"
                    placeholder="What's up on your mind?"
                    rows="6"
                />

                <div className="d-flex justify-content-end">
                    <button id="post-btn" type="submit" className="btn btn-prim shape-round col-2">Post</button>
                </div>
            </form>
            {alertMessage && (
                <div id="alert_message" role="alert">
                    {alertMessage}
                </div>
            )}
        </div>
    );
}

function feedPage() {

    return (
        <div>
            <h1>This is the Feed</h1>
        </div>
    );
}

document.addEventListener("DOMContentLoaded", () => {
    React
})
ReactDOM.render(<NewPost />, document.getElementById('root'));

function renderPage(props) {
    Page = props.page;
    return (
        <Page />
    );
}

function App() {
    // main app function,
}
