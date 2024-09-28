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

// Example React component
function App() {
    return <h1>Hello, React!</h1>;
}

// Rendering the component to the DOM
ReactDOM.render(<App />, document.getElementById('root'));


