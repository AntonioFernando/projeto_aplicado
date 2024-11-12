const loginBtn = document.getElementById('loginBtn');
const loginPopup = document.getElementById('loginPopup');
const closeBtn = document.getElementsByClassName('close')[0];
const navMenu = document.getElementById('navMenu');

const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8000'  
                : 'https://ccaipf.onrender.com';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(function(error) {
            console.log('Service Worker registration failed:', error);
        });
}

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

    try {
        // Tenta login online primeiro
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        console.log('Resposta do login online:', response);

        if (response.ok) {
            const result = await response.json();
            console.log('Resultado do login:', result);

            const token = result.token;
            console.log('Token recebido:', token);
            localStorage.setItem('authToken', token);
            navMenu.style.display = 'flex';
            loginBtn.style.display = 'none';
            loginPopup.style.display = 'none';
            alert(result.message);
            return;
        } else {
            alert('Usuário ou senha inválidos');
        }
    } catch (error) {
        console.error('Erro de rede no login online:', error);
        alert('Falha ao tentar logar online. Tentando login offline...');
    }

    // Se o login online falhar, tenta o login offline
    const storedToken = localStorage.getItem('authToken');

    if (storedToken) {
        try {
            const decoded = jwt_decode(storedToken);
            const currentTime = Math.floor(Date.now() / 1000);

            if (decoded.exp > currentTime) {
                alert('Login realizado offline!');
                navMenu.style.display = 'flex';
                loginBtn.style.display = 'none';
                loginPopup.style.display = 'none'; 
                return; 
            } else {
                alert('Token expirado. Por favor, faça login online.');
            }
        } catch (err) {
            console.error('Erro ao decodificar token offline:', err);
        }
    }
};
    
// Função para fazer requisições autenticadas
async function makeAuthenticatedRequest(url) {
    const token = localStorage.getItem('authToken');
    if (token) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    } else {
        alert('Usuário não autenticado');
        return null;
    }
}

// Para realizar o logout, basta remover o token
function logout() {
    localStorage.removeItem('authToken');
    alert('Você foi desconectado!');
    window.location.reload();
}