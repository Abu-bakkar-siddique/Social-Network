// utils.js
export function CSRFToken() {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    return token ? decodeURIComponent(token.split('=')[1]) : null;
}

export function handleErrorField(elements) {
    elements.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('form-control-x');
            element.classList.add('form-control-error');
        }
    });
}
