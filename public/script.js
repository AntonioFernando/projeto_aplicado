const loginBtn = document.getElementById('loginBtn');
const loginPopup = document.getElementById('loginPopup');
const closeBtn = document.getElementsByClassName('close')[0];
const navMenu = document.getElementById('navMenu');

const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8000'  
                : 'https://ccaipf.onrender.com';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('Service Worker registered:', registration.scope))
        .catch(error => console.log('Service Worker registration failed:', error));
}

// Check token on page load to update UI state
window.onload = function() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        try {
            const decoded = jwt_decode(storedToken);
            const currentTime = Math.floor(Date.now() / 1000);

            if (decoded.exp > currentTime) {
                // User is already authenticated offline
                navMenu.style.display = 'flex';
                loginBtn.style.display = 'none';
                loginPopup.style.display = 'none';
            } else {
                // Token expired
                alert('Token expirado. Por favor, faça login novamente.');
            }
        } catch (err) {
            console.error('Erro ao decodificar token:', err);
        }
    }
};

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
        // Attempt online login first
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const result = await response.json();
            const token = result.token;

            localStorage.setItem('authToken', token);
            navMenu.style.display = 'flex';
            loginBtn.style.display = 'none';
            loginPopup.style.display = 'none';
            alert(result.message);

            // Optionally, save user data to IndexedDB
            await salvarDadosOffline(result.userData);

            return;
        } else {
            alert('Usuário ou senha inválidos');
        }
    } catch (error) {
        console.error('Erro de rede no login online:', error);
        alert('Falha ao tentar logar online. Tentando login offline...');
    }

    // Offline login attempt
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

// Save user data to IndexedDB
async function salvarDadosOffline(userData) {
    if (!db) {
        console.error('IndexedDB não está pronto.');
        return;
    }

    const transaction = db.transaction(['colaboradores'], 'readwrite');
    const store = transaction.objectStore('colaboradores');

    userData.forEach(user => store.put(user));

    transaction.oncomplete = () => console.log('Dados do usuário salvos no IndexedDB');
    transaction.onerror = (event) => console.error('Erro ao salvar dados no IndexedDB:', event.target.errorCode);
}

// Function to make authenticated requests
async function makeAuthenticatedRequest(url) {
    const token = localStorage.getItem('authToken');
    if (token) {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    } else {
        alert('Usuário não autenticado');
        return null;
    }
}

function sincronizarColaboradores() {
    buscarColaborador('http://localhost:8000')
        .then(data => salvarColaboradoresOffline(data))
        .catch(() => {
            console.warn('Servidor local indisponível, tentando o servidor externo...');
            return buscarColaborador('https://ccaipf.onrender.com')
                .then(data => salvarColaboradoresOffline(data))
                .catch(() => {
                    console.warn('Nenhum servidor disponível para sincronização.');
                });
        });
}

// Chama sincronização sempre que o app carrega
window.onload = function () {
    initDB();
    sincronizarColaboradores();
};

let inactivityTimer;

function resetInactivityTimer() {
    // Limpa o timer anterior
    clearTimeout(inactivityTimer);

    // Configura um novo timer para o logout após 15 minutos de inatividade
    inactivityTimer = setTimeout(logout, 15 * 60 * 1000);  // 15 minutos
}

// Adiciona event listeners para resetar o timer quando o usuário interagir com a página
window.onload = resetInactivityTimer;
document.onmousemove = resetInactivityTimer;
document.onkeydown = resetInactivityTimer;
document.onclick = resetInactivityTimer;

function logout() {
    localStorage.removeItem('authToken');
    alert('Você foi desconectado devido à inatividade!');
    window.location.reload();
}
