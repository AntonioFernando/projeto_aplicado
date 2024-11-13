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

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('consultaAppDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('colaboradores')) {
                db.createObjectStore('colaboradores', { keyPath: 'matricula' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            reject('Erro ao inicializar o IndexedDB');
        };
    });
}

// Check token on page load to update UI state
window.onload = async function () {
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

    // Inicializa o IndexedDB e sincroniza os colaboradores
    await initDB();
    sincronizarColaboradores();

    // Reseta o timer de inatividade
    resetInactivityTimer();
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
        // Tentativa de login no servidor local primeiro
        const localLoginResponse = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (localLoginResponse.ok) {
            const result = await localLoginResponse.json();
            const token = result.token;

            if (token) {
                // Se o token é válido, armazena e encerra a tentativa de login
                localStorage.setItem('authToken', token);
                navMenu.style.display = 'flex';
                loginBtn.style.display = 'none';
                loginPopup.style.display = 'none';
                alert(result.message);
                
                await initDB();
                await salvarDadosOffline(result.userData);
                return;
            } else {
                alert('Usuário ou senha inválidos');
                return;
            }
        } else {
            // Caso o login no servidor local falhe, tentamos o servidor externo
            console.warn('Servidor local não acessível, tentando servidor externo...');

            const externalLoginResponse = await fetch(`${externalApiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (externalLoginResponse.ok) {
                const result = await externalLoginResponse.json();
                const token = result.token;

                if (token) {
                    // Se o token for válido, armazene-o e finalize a tentativa de login
                    localStorage.setItem('authToken', token);
                    navMenu.style.display = 'flex';
                    loginBtn.style.display = 'none';
                    loginPopup.style.display = 'none';
                    alert(result.message);
                    
                    await initDB();
                    await salvarDadosOffline(result.userData);
                    return;
                } else {
                    alert('Usuário ou senha inválidos');
                    return;
                }
            } else {
                // Caso o login também falhe no servidor externo, mostramos um erro
                alert('Falha ao tentar logar online. Ambos os servidores estão inacessíveis.');
                return;
            }
        }
    } catch (error) {
        // Se houve erro de rede (ambos os servidores inacessíveis)
        console.error('Erro de rede no login online:', error);
        alert('Falha ao tentar logar online. Ambos os servidores estão inacessíveis.');
        
        // Tentando login offline agora
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
                alert('Token inválido ou corrompido.');
            }
        } else {
            alert('Nenhum token encontrado, por favor, faça login online.');
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

let inactivityTimer;

function resetInactivityTimer() {
    // Limpa o timer anterior
    clearTimeout(inactivityTimer);

    // Configura um novo timer para o logout após 15 minutos de inatividade
    inactivityTimer = setTimeout(logout, 15 * 60 * 1000);  // 15 minutos
}

// Adiciona event listeners para resetar o timer quando o usuário interagir com a página
document.onmousemove = resetInactivityTimer;
document.onkeydown = resetInactivityTimer;
document.onclick = resetInactivityTimer;

function logout() {
    localStorage.removeItem('authToken');
    alert('Você foi desconectado devido à inatividade!');
    window.location.reload();
}
