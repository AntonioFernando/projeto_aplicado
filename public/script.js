const loginBtn = document.getElementById('loginBtn');
const loginPopup = document.getElementById('loginPopup');
const closeBtn = document.getElementsByClassName('close')[0];

// Open the popup
loginBtn.onclick = function() {
    loginPopup.style.display = 'flex';
}

// Close the popup
closeBtn.onclick = function() {
    loginPopup.style.display = 'none';
}

// Close the popup when clicking outside of it
window.onclick = function(event) {
    if (event.target === loginPopup) {
        loginPopup.style.display = 'none';
    }
}

// Handle form submission
document.getElementById('loginForm').onsubmit = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const result = await response.json();
        alert(result.message);
        navMenu.style.display = 'flex';
        loginBtn.style.display = 'none';
        loginPopup.style.display = 'none';

    } else {
        alert('Usuário ou senha inválidos.');
    }
}

// document.getElementById('matrícula').addEventListener('input', function(event) {
//     this.value = this.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
//});