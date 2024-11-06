const loginBtn = document.getElementById('loginBtn');
const loginPopup = document.getElementById('loginPopup');
const closeBtn = document.getElementsByClassName('close')[0];
const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8000'  
                : 'https://ccaipf.onrender.com';

// Open the popup
loginBtn.onclick = function() {
    loginPopup.style.display = 'flex';
    loginBtn.style.display = 'none';
}

// Close the popup
closeBtn.onclick = function() {
    loginPopup.style.display = 'none';
    loginBtn.style.display = 'flex';
}

// Handle form submission
document.getElementById('loginForm').onsubmit = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${apiUrl}/login`, {
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