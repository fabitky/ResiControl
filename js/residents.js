/**
 * js/residents.js
 * Gestión de residentes, búsquedas y datos de emergencia destacados.
 */

/**
 * RENDERIZAR TABLA DE RESIDENTES
 * Muestra la lista principal con la columna de Emergencia Móvil destacada.
 */
async function renderResidents() {
    if (!db) return;
    const residents = await getAllFromStore("residents");
    const list = document.getElementById('residentsBody');
    if (!list) return;
    
    list.innerHTML = "";
    
    // Ordenar alfabéticamente por nombre
    residents.sort((a, b) => a.name.localeCompare(b.name));

    residents.forEach(res => {
        const row = document.createElement('tr');
        
        // Columna 1: Datos Personales
        const tdInfo = `<td>
            <strong>${res.name}</strong><br>
            <small class="text-muted">CI: ${res.cedula}</small>
        </td>`;

        // Columna 2: EMERGENCIA MÓVIL (Destacada)
        const tdEmergencia = `<td style="background: #fff5f5; border-left: 4px solid #e53e3e;">
            <div style="color: #c53030; font-weight: bold; font-size: 0.85rem; text-transform: uppercase;">
                🚑 ${res.emergenciaNombre || 'NO ASIGNADA'}
            </div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #333; margin-top: 2px;">
                📞 ${res.emergenciaTel || '---'}
            </div>
        </td>`;

        // Columna 3: Ficha Médica (Botón)
        const tdMedical = `<td>
    <button onclick='viewMedical("${res.cedula}")' style="background: #34495e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
        🔍 Ver Resumen
    </button>
</td>`;

        // Columna 4: Estado
        const statusClass = (res.status === 'Activo') ? 'status-activo' : 'status-baja';
        const tdStatus = `<td>
            <span class="status-badge ${statusClass}">${res.status || 'Activo'}</span>
        </td>`;

        // Columna 5: Acciones
        const tdActions = `<td>
            <div style="display: flex; gap: 8px;">
                <button onclick='editResident("${res.cedula}")' title="Editar">✏️</button>
                <button onclick='deleteResident("${res.cedula}")' style="color:red" title="Eliminar">🗑️</button>
				<button onclick="generarFichaIndividual('${res.cedula}')" title="Generar pdf">📄 PDF</button>
            </div>
        </td>`;

        row.innerHTML = tdInfo + tdEmergencia + tdMedical + tdStatus + tdActions;
        list.appendChild(row);
    });
}

/**
 * GUARDAR O ACTUALIZAR RESIDENTE
 */
async function saveResident() {
    const isEdit = document.getElementById('isEdit').value === "true";
    
    const res = {
        cedula: document.getElementById('resCedula').value.trim(),
        name: document.getElementById('resName').value.trim(),
        birthDate: document.getElementById('resBirthDate').value,
        entryDate: document.getElementById('resEntryDate').value,
        status: document.getElementById('resStatus').value,
        // Emergencia Móvil (Nuevos Campos)
        emergenciaNombre: document.getElementById('resEmergenciaMovilNombre').value.trim(),
        emergenciaTel: document.getElementById('resEmergenciaMovilTel').value.trim(),
        // Contacto Familiar
        emerName: document.getElementById('resEmerName').value.trim(),
        emerPhone: document.getElementById('resEmerPhone').value.trim(),
        emerNote: document.getElementById('resEmerNote').value.trim(),
        // Historial Médico
        medical: document.getElementById('resMedical').value.trim()
    };

    if (!res.cedula || !res.name) {
        return alert("La Cédula y el Nombre son obligatorios para el registro.");
    }

    try {
        const tx = db.transaction(["residents"], "readwrite");
        const store = tx.objectStore("residents");
        
        if (isEdit) {
            await store.put(res);
        } else {
            // Verificar si la CI ya existe para evitar duplicados
            const exists = await new Promise(resolve => {
                store.get(res.cedula).onsuccess = (e) => resolve(e.target.result);
            });
            if (exists) return alert("Error: Ya existe un residente con esa Cédula.");
            await store.add(res);
        }

        tx.oncomplete = () => {
            closeModal('residentModal');
            refreshAllData();
            alert(isEdit ? "Ficha actualizada con éxito." : "Residente registrado correctamente.");
        };
    } catch (err) {
        console.error("Error al guardar residente:", err);
        alert("No se pudo guardar la información.");
    }
}

/**
 * EDITAR RESIDENTE (Cargar datos al modal)
 */
async function editResident(cedula) {
    const tx = db.transaction(["residents"], "readonly");
    const store = tx.objectStore("residents");
    
    store.get(cedula).onsuccess = (e) => {
        const res = e.target.result;
        if (!res) return;

        // Configurar modal para edición
        document.getElementById('isEdit').value = "true";
        document.getElementById('resCedula').value = res.cedula;
        document.getElementById('resCedula').disabled = true; // No permitir cambiar CI en edición
        
        document.getElementById('resName').value = res.name;
        document.getElementById('resBirthDate').value = res.birthDate || "";
        document.getElementById('resEntryDate').value = res.entryDate || "";
        document.getElementById('resStatus').value = res.status || "Activo";
        
        // Cargar Emergencia Móvil
        document.getElementById('resEmergenciaMovilNombre').value = res.emergenciaNombre || "";
        document.getElementById('resEmergenciaMovilTel').value = res.emergenciaTel || "";
        
        // Cargar Familiar
        document.getElementById('resEmerName').value = res.emerName || "";
        document.getElementById('resEmerPhone').value = res.emerPhone || "";
        document.getElementById('resEmerNote').value = res.emerNote || "";
        
        document.getElementById('resMedical').value = res.medical || "";

        document.querySelector('#residentModal h3').innerText = "Editando Ficha de " + res.name;
        openModal('residentModal');
    };
}

/**
 * ELIMINAR RESIDENTE
 */
async function deleteResident(cedula) {
    if (!confirm("¿Está totalmente seguro? Se eliminará toda la ficha médica y datos de emergencia de este residente.")) return;

    const tx = db.transaction(["residents"], "readwrite");
    tx.objectStore("residents").delete(cedula);
    tx.oncomplete = () => {
        refreshAllData();
    };
}

/**
 * VISUALIZAR RESUMEN (SOLO LECTURA)
 */
async function viewMedical(cedula) {
    const tx = db.transaction(["residents"], "readonly");
    const store = tx.objectStore("residents");
    
    store.get(cedula).onsuccess = (e) => {
        const res = e.target.result;
        if (!res) return;

        // Llenar campos de texto plano
        document.getElementById('vName').innerText = res.name;
        document.getElementById('vCedula').innerText = res.cedula;
        document.getElementById('vBirth').innerText = res.birthDate || "No registrada";
        document.getElementById('vEntry').innerText = res.entryDate || "No registrada";
        document.getElementById('vStatus').innerText = res.status || "Activo";
        
        // Emergencia Móvil
        document.getElementById('vEmergencia').innerText = 
            `${res.emergenciaNombre || '---'} | Tel: ${res.emergenciaTel || '---'}`;
        
        // Familiar
        document.getElementById('vFamiliar').innerText = 
            `${res.emerName || '---'} (${res.emerNote || 'Sin nota'})`;
        document.getElementById('vFamiliarTel').innerText = `📞 ${res.emerPhone || '---'}`;
        
        // Médicos
        document.getElementById('vMedical').innerText = res.medical || "Sin observaciones médicas.";

        // Color del badge de estado
        const badge = document.getElementById('vStatus');
        badge.style.background = (res.status === 'Activo') ? '#27ae60' : '#e74c3c';
        badge.style.color = 'white';
        badge.style.padding = '4px 12px';
        badge.style.borderRadius = '20px';

        openModal('viewResidentModal');
    };
}

/**
 * FILTRAR RESIDENTES (Buscador en tiempo real)
 */
function filterResidents() {
    const term = document.getElementById('searchResident').value.toLowerCase();
    const rows = document.querySelectorAll('#residentsBody tr');
    
    rows.forEach(row => {
        // Busca en toda la fila (Nombre, CI, Mutualista)
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? "" : "none";
    });
}
/**
 * FICHA RESIDENTES PARA IMPRIMIR
 */
async function generarFichaIndividual(cedula) {
    const residents = await getAllFromStore("residents");
    const res = residents.find(r => r.cedula === cedula);
    if (!res) return alert("Residente no encontrado");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Función auxiliar para calcular edad
    const calcularEdad = (fechaNac) => {
        if(!fechaNac) return "Sin registrar";
        const hoy = new Date();
        const cumple = new Date(fechaNac);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
        return edad >= 0 ? edad + " años" : "Sin registrar";
    };

    // --- ENCABEZADO PROFESIONAL ---
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA INDIVIDUAL DEL RESIDENTE", 105, 18, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Residencial Doña Muñeca - Gestión Administrativa", 105, 26, { align: "center" });

    let y = 45;

    // --- FUNCIÓN PARA DIBUJAR CAJAS DE SECCIÓN ---
    const drawSection = (title, height) => {
        doc.setFillColor(245, 247, 250);
        doc.rect(15, y, 180, height, 'F');
        doc.setDrawColor(200, 205, 211);
        doc.rect(15, y, 180, height, 'D');
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, 20, y + 7);
        y += 12;
    };

    // --- 1. DATOS PERSONALES ---
    drawSection("1. DATOS PERSONALES", 45);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const labelX = 22;
    const valueX = 65;

    const row = (label, value, isBoldValue = false) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, labelX, y);
        doc.setFont("helvetica", isBoldValue ? "bold" : "normal");
        doc.text(value ? String(value) : "---", valueX, y);
        y += 6;
    };

    row("Nombre Completo:", res.name);
    row("C.I.:", res.cedula);
    row("F. de Nacimiento:", res.birthDate);
    row("Edad:", calcularEdad(res.birthDate));
    row("Estado:", res.status);
    
    // --- DESTACADO: FECHA DE INGRESO ---
    y += 2;
    doc.setDrawColor(41, 128, 185); // Azul
    doc.setFillColor(235, 245, 251);
    doc.rect(20, y - 4, 100, 8, 'FD');
    doc.setTextColor(41, 128, 185);
    doc.setFont("helvetica", "bold");
    doc.text(`FECHA DE INGRESO: ${res.entryDate || '---'}`, 25, y + 1.5);
    y += 15;

    // --- 2. CONTACTO FAMILIAR ---
    drawSection("2. CONTACTO FAMILIAR DE REFERENCIA", 28);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    row("Responsable:", res.emerName);
    row("Teléfono:", res.emerPhone);
    row("Parentesco:", res.emerNote);
    y += 10;

    // --- 3. EMERGENCIA MÓVIL ---
    drawSection("3. SERVICIO DE EMERGENCIA", 22);
    doc.setTextColor(197, 48, 48); // Rojo
    row("Institución:", res.emergenciaNombre, true);
    row("Teléfono Directo:", res.emergenciaTel, true);
    y += 10;

    // --- 4. HISTORIAL MÉDICO Y CUIDADOS ---
    // Calculamos espacio para texto largo
    const medicalText = res.medical || "No se registran cuidados especiales.";
    const splitMedical = doc.splitTextToSize(medicalText, 165);
    const boxHeight = (splitMedical.length * 5) + 15;
    
    drawSection("4. FICHA MÉDICA Y CUIDADOS ESPECIALES", boxHeight);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(splitMedical, 22, y);
    y += (splitMedical.length * 5) + 10;

    // --- PIE DE PÁGINA ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const dateGen = new Date().toLocaleString('es-UY');
    doc.text(`Ficha generada el ${dateGen} - Sistema Doña Muñeca`, 105, 285, { align: "center" });

    doc.save(`Ficha_${res.name.replace(/\s+/g, '_')}.pdf`);
}