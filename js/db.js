// js/db.js
let db;
const DB_NAME = "DonaMunecaDB";
const DB_VERSION = 2; // Subimos versión por el cambio de estructura

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            
            // Si ya existía, la borramos para recrearla con el nuevo ID (Cédula)
            if (dbInstance.objectStoreNames.contains("residents")) {
                dbInstance.deleteObjectStore("residents");
            }
            
            dbInstance.createObjectStore("residents", { keyPath: "cedula" });
            
            if (!dbInstance.objectStoreNames.contains("payments")) {
                dbInstance.createObjectStore("payments", { keyPath: "id", autoIncrement: true });
            }
            if (!dbInstance.objectStoreNames.contains("expenses")) {
                dbInstance.createObjectStore("expenses", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => reject(event.target.errorCode);
    });
}
async function verificarIntegridad() {
    const payments = await getAllFromStore("payments");
    const residents = await getAllFromStore("residents");
    const resCédulas = new Set(residents.map(r => r.cedula));
    
    const huerfanos = payments.filter(p => !resCédulas.has(p.residentCedula));
    
    if (huerfanos.length > 0) {
        console.warn(`⚠️ Se encontraron ${huerfanos.length} pagos sin residente asociado.`);
        console.table(huerfanos);
    } else {
        console.log("✅ Integridad de datos: OK");
    }
}