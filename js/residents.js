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
    const { jsPDF } = window.jspdf;
    
    // Obtener datos del residente específico
    const residents = await getAllFromStore("residents");
    const res = residents.find(r => r.cedula === cedula);
    
    if (!res) return alert("Residente no encontrado.");

    const doc = new jsPDF();

    // --- ESTILO VISUAL ---
    doc.setFillColor(44, 62, 80); // Azul oscuro institucional
    doc.rect(0, 0, 210, 30, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("FICHA DEL RESIDENTE", 20, 20);

    // --- INFORMACIÓN PERSONAL ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text("Datos Personales", 20, 45);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 47, 190, 47);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 55;
    
    const datos = [
        ["Nombre Completo:", res.name],
        ["Cédula de Identidad:", res.cedula],
        ["Fecha de Nacimiento:", res.birthDate || "No registrada"],
        ["Estado:", res.status || "Activo"]
    ];

    datos.forEach(linea => {
        doc.setFont("helvetica", "bold");
        doc.text(linea[0], 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(linea[1].toString(), 70, y);
        y += 8;
    });

    // --- INFORMACIÓN MÉDICA (Crucial para traslados) ---
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Información Médica y Emergencia", 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 12;

    doc.setFontSize(11);
    const medica = [
        ["Mutualista:", res.mutualista || "No registrada"],
        ["Emergencia Móvil:", res.emergencia || "No registrada"],
        ["Observaciones/Dieta:", res.observations || "Sin observaciones"]
    ];

    medica.forEach(linea => {
        doc.setFont("helvetica", "bold");
        doc.text(linea[0], 20, y);
        doc.setFont("helvetica", "normal");
        
        // Manejo de texto largo en observaciones
        if (linea[0] === "Observaciones/Dieta:") {
            const splitText = doc.splitTextToSize(linea[1], 120);
            doc.text(splitText, 70, y);
            y += (splitText.length * 6);
        } else {
            doc.text(linea[1].toString(), 70, y);
            y += 8;
        }
    });

    // --- CONTACTO DE FAMILIARES ---
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Contacto de Referencia", 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Responsable: ${res.responsable || "No registrado"}`, 20, y);
    y += 7;
    doc.text(`Teléfono: ${res.phone || "No registrado"}`, 20, y);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Ficha generada automáticamente por Residencial Doña Muñeca - ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });

    doc.save(`Ficha_${res.name.replace(/ /g, "_")}.pdf`);
}