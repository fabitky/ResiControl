// === MANEJO DEL SPLASH SCREEN ===
window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const bar = document.getElementById('loader-bar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (bar) bar.style.width = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                splash.style.opacity = "0";
                splash.style.visibility = "hidden";
                setTimeout(() => splash.remove(), 500);
            }, 400);
        }
    }, 100);
});

// === NAVEGACIÓN ===
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    refreshAllData();
}

// === FORMATO DE MONEDA EN TIEMPO REAL ===
function formatCurrencyInput(event) {
    let value = event.target.value;
    value = value.replace(/\D/g, ""); // Elimina todo lo que no sea número
    if (value !== "") {
        value = new Intl.NumberFormat('es-UY').format(parseInt(value));
    }
    event.target.value = value;
}

// === FUNCIONES DE MODALES ===
function openModal(id) {
    document.getElementById(id).style.display = 'block';
    if (id === 'residentModal') {
        // Reset por defecto al abrir
        if (document.getElementById('isEdit').value !== "true") {
            document.getElementById('resCedula').disabled = false;
        }
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    if (id === 'residentModal') {
        document.getElementById('isEdit').value = "false";
        document.querySelector('#residentModal h3').innerText = "Ficha del Residente";
        document.querySelectorAll('#residentModal input, #residentModal textarea').forEach(i => i.value = "");
    }
}

// Cerrar al hacer clic afuera
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
};

// === REFRESCO GLOBAL ===
async function refreshAllData() {
    if (typeof updateDashboard === 'function') await updateDashboard();
    if (typeof renderResidents === 'function') await renderResidents();
}

// === INICIO ===
window.onload = () => {
    initDB().then(() => {
        refreshAllData();
    });
};