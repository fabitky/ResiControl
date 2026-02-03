/**
 * js/finance.js
 * GESTIÓN FINANCIERA COMPLETA - DOÑA MUÑECA
 * Incluye: Gráficos, PDF con Logo, Backups, Reloj, Cumpleaños y Validación de Deuda.
 */

let financeChart = null;

/**
 * RELOJ EN TIEMPO REAL
 * Muestra fecha larga y hora exacta en la barra superior.
 */
function updateClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    
    setInterval(() => {
        const now = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const fechaStr = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
        const horaStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        clockEl.innerText = `${fechaStr} | ${horaStr}`;
    }, 1000);
}

/**
 * ACTUALIZACIÓN INTEGRAL DEL DASHBOARD
 * Esta función coordina todos los cálculos financieros del mes actual.
 */
async function updateDashboard() {
    if (!db) return;
    
    try {
        const now = new Date();
        const monthKey = now.toISOString().slice(0, 7); // Formato YYYY-MM
        
        // Carga de datos en paralelo desde IndexedDB
        const [residents, payments, expenses] = await Promise.all([
            getAllFromStore("residents"),
            getAllFromStore("payments"),
            getAllFromStore("expenses")
        ]);

        // --- CÁLCULO DE ESTADÍSTICAS ---
        const activeRes = residents.filter(r => (r.status || "Activo") === "Activo");
        document.getElementById('count-residents').innerText = activeRes.length;

        // Sumar ingresos del mes actual
        const income = payments
            .filter(p => p.date === monthKey)
            .reduce((sum, p) => sum + Number(p.amount), 0);
        document.getElementById('total-income').innerText = `$ ${income.toLocaleString('es-UY')}`;

        // Sumar gastos del mes actual
        const exp = expenses
            .filter(e => e.date === monthKey)
            .reduce((sum, e) => sum + Number(e.amount), 0);
        document.getElementById('total-expenses').innerText = `$ ${exp.toLocaleString('es-UY')}`;

        // Balance Neto
        const balance = income - exp;
        const balEl = document.getElementById('net-balance');
        balEl.innerText = `$ ${balance.toLocaleString('es-UY')}`;
        balEl.style.color = balance >= 0 ? "#27ae60" : "#e74c3c";

        // --- RENDERIZADO DE COMPONENTES ---
        checkBirthdays(activeRes);
        renderDebtors(activeRes, payments, monthKey);
        renderPaymentsHistory(payments, residents);
        renderExpenses(expenses);
        prepareSemesterChart(payments, expenses);
        
        // Inicialización del reloj
        if (!window.clockStarted) {
            updateClock();
            window.clockStarted = true;
        }

    } catch (e) {
        console.error("Error crítico en updateDashboard:", e);
    }
}

/**
 * DETECCIÓN DE CUMPLEAÑOS
 */
function checkBirthdays(residents) {
    const currentMonth = new Date().getMonth() + 1;
    const card = document.getElementById('birthday-card');
    const list = document.getElementById('birthday-list');
    
    const bdayPeople = residents.filter(res => {
        if (!res.birthDate) return false;
        const resDate = new Date(res.birthDate + "T00:00:00");
        return (resDate.getMonth() + 1) === currentMonth;
    });

    if (bdayPeople.length > 0) {
        card.style.display = "block";
        list.innerHTML = bdayPeople.map(res => {
            const day = new Date(res.birthDate + "T00:00:00").getDate();
            return `• <strong>${res.name}</strong> - Cumple el día ${day}`;
        }).join("<br>");
    } else {
        card.style.display = "none";
    }
}

/**
 * GENERACIÓN DE REPORTE PDF (CIERRE DE MES DETALLADO) - ESTILO PROFESIONAL
 */
async function cerrarMes(forcedMonth = null) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) return alert("Librería jsPDF no cargada.");

    const doc = new jsPDF();
    
    // CAMBIO AQUÍ: Si viene un mes del selector lo usa, sino usa el mes actual
    const monthKey = forcedMonth || new Date().toISOString().slice(0, 7);
    
    // Obtención de datos filtrados por el mes elegido
    const residents = await getAllFromStore("residents");
    const payments = (await getAllFromStore("payments")).filter(p => p.date === monthKey);
    const expenses = (await getAllFromStore("expenses")).filter(e => e.date === monthKey);

    // --- ENCABEZADO ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); 
    doc.text("RESIDENCIAL DOÑA MUÑECA", 20, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text(`REPORTE DE CIERRE MENSUAL: ${monthKey}`, 20, 32);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);

    // --- RESUMEN GENERAL ---
    const totalIn = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalEx = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIn - totalEx;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 45, 170, 25, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL INGRESOS", 30, 53);
    doc.text("TOTAL GASTOS", 85, 53);
    doc.text("BALANCE NETO", 140, 53);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`$ ${totalIn.toLocaleString('es-UY')}`, 30, 62);
    doc.text(`$ ${totalEx.toLocaleString('es-UY')}`, 85, 62);
    
    if(balance >= 0) doc.setTextColor(39, 174, 96);
    else doc.setTextColor(192, 57, 43); 
    doc.text(`$ ${balance.toLocaleString('es-UY')}`, 140, 62);

    let y = 85;

    // --- SECCIÓN DE INGRESOS ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("DETALLE DE INGRESOS (COBROS)", 20, y);
    doc.line(20, y + 2, 85, y + 2);
    y += 12;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    if (payments.length === 0) {
        doc.text("- No se registraron cobros en este periodo.", 25, y);
        y += 7;
    } else {
        payments.forEach(p => {
            const res = residents.find(r => r.cedula === p.residentCedula);
            const nombre = res ? res.name : "Residente desconocido";
            doc.text(`• ${nombre}`, 25, y);
            doc.text(`$ ${Number(p.amount).toLocaleString('es-UY')}`, 185, y, { align: "right" });
            doc.line(25, y + 2, 185, y + 2);
            y += 8;
            if (y > 275) { doc.addPage(); y = 20; }
        });
    }

    y += 12; 

    // --- SECCIÓN DE GASTOS ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("DETALLE DE GASTOS POR CATEGORÍA", 20, y);
    doc.line(20, y + 2, 85, y + 2);
    y += 7;

    if (expenses.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.text("- No se registraron gastos en este periodo.", 25, y);
    } else {
        expenses.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
        expenses.forEach(e => {
            doc.setFont("helvetica", "normal");
            doc.text(`[${e.category || 'Otros'}]`, 25, y);
            doc.text(`${e.concept}`, 65, y);
            doc.text(`$ ${Number(e.amount).toLocaleString('es-UY')}`, 185, y, { align: "right" });
            doc.line(25, y + 2, 185, y + 2);
            y += 8;
            if (y > 275) { doc.addPage(); y = 20; }
        });
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sistema de Gestión Doña Muñeca - Generado el ${new Date().toLocaleString()}`, 105, 285, { align: "center" });

    doc.save(`Cierre_${monthKey}_Muneca.pdf`);
}

/**
 * GUARDADO DE DATOS (CON LIMPIEZA DE FORMATO MONEDA)
 */
async function addPayment(residentCedula, amount, selectedDate) {
    const cleanAmount = parseFloat(amount.toString().replace(/\./g, ""));
    if(isNaN(cleanAmount)) return;
    
    // Extrae el mes de la fecha elegida (ej: "2023-05")
    const monthKey = selectedDate.slice(0, 7); 
    
    const tx = db.transaction(["payments"], "readwrite");
    const store = tx.objectStore("payments");
    const request = store.add({ 
        residentCedula, 
        amount: cleanAmount, 
        date: monthKey, // USAMOS LA FECHA ELEGIDA
        fullDate: selectedDate,
        timestamp: Date.now() 
    });
    return new Promise((res) => request.onsuccess = () => res());
}

async function addExpense(concept, amount, selectedDate) {
    const cleanAmount = parseFloat(amount.toString().replace(/\./g, ""));
    const category = document.getElementById('expenseCategory').value;
    if(isNaN(cleanAmount)) return;
    
    const monthKey = selectedDate.slice(0, 7);
    
    const tx = db.transaction(["expenses"], "readwrite");
    const store = tx.objectStore("expenses");
    const request = store.add({ 
        concept, 
        amount: cleanAmount, 
        category: category, 
        date: monthKey, // USAMOS LA FECHA ELEGIDA
        fullDate: selectedDate,
        timestamp: Date.now() 
    });
    return new Promise((res) => request.onsuccess = () => res());
}

/**
 * EDICIÓN DE PAGOS
 */
function editPayment(id, amt, date) {
    document.getElementById('editPayId').value = id;
    document.getElementById('editPayAmount').value = new Intl.NumberFormat('es-UY').format(amt);
    document.getElementById('editPayDate').value = date; // Carga la fecha guardada
    openModal('editPaymentModal');
}

async function saveEditedPayment() {
    const id = Number(document.getElementById('editPayId').value);
    const amtRaw = document.getElementById('editPayAmount').value;
    const newDate = document.getElementById('editPayDate').value;
    const cleanAmount = parseFloat(amtRaw.toString().replace(/\./g, ""));

    if(!newDate) return alert("Seleccione una fecha");

    const tx = db.transaction(["payments"], "readwrite");
    const store = tx.objectStore("payments");
    
    store.get(id).onsuccess = (e) => {
        const data = e.target.result;
        data.amount = cleanAmount;
        data.fullDate = newDate;
        data.date = newDate.slice(0, 7); // Actualiza también el mes para el gráfico
        store.put(data);
    };
    
    tx.oncomplete = () => { 
        closeModal('editPaymentModal'); 
        refreshAllData(); 
    };
}

/**
 * ELIMINACIÓN DE REGISTROS
 */
async function deletePayment(id) {
    if(!confirm("¿Desea eliminar este registro de pago de forma permanente?")) return;
    const tx = db.transaction(["payments"], "readwrite");
    tx.objectStore("payments").delete(id);
    tx.oncomplete = () => refreshAllData();
}

async function deleteExpense(id) {
    if(!confirm("¿Desea eliminar este registro de gasto?")) return;
    const tx = db.transaction(["expenses"], "readwrite");
    tx.objectStore("expenses").delete(id);
    tx.oncomplete = () => refreshAllData();
}

/**
 * RENDERIZADO DE TABLAS FINANCIERAS
 */
function renderDebtors(active, payments, month) {
    const list = document.getElementById('debtorsBody');
    if (!list) return;
    list.innerHTML = "";
    
    active.forEach(res => {
        // Buscamos si existe un pago para este residente en el mes consultado
        const paid = payments.find(p => p.residentCedula === res.cedula && p.date === month);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${res.name}</b><br><small>CI: ${res.cedula}</small></td>
            <td>
                <span class="status-badge" style="background-color: ${paid ? '#27ae60' : '#e67e22'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                    ${paid ? 'AL DÍA' : 'PENDIENTE'}
                </span>
            </td>
            <td style="text-align:center">
                <button class="btn-pay" onclick="openPaymentModal('${res.cedula}','${res.name}')" style="cursor:pointer; padding: 5px 10px;">
                    💰 Cobrar
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

function renderPaymentsHistory(payments, residents, sortBy = 'date') {
    const list = document.getElementById('paymentsHistoryBody');
    if (!list) return;
    list.innerHTML = "";

    let sortedPayments = [...payments];

    // Lógica de ordenamiento
    if (sortBy === 'name') {
        sortedPayments.sort((a, b) => {
            const nameA = residents.find(r => r.cedula === a.residentCedula)?.name || "";
            const nameB = residents.find(r => r.cedula === b.residentCedula)?.name || "";
            return nameA.localeCompare(nameB);
        });
    } else {
        // Por defecto ordena por fecha (timestamp) de más reciente a más antiguo
        sortedPayments.sort((a, b) => b.timestamp - a.timestamp);
    }

    sortedPayments.slice(0, 20).forEach(p => {
        const r = residents.find(res => res.cedula === p.residentCedula);
        list.innerHTML += `<tr>
            <td>${r ? r.name : 'Desconocido'}</td>
            <td>$ ${p.amount.toLocaleString('es-UY')}</td>
            <td>${p.fullDate || p.date}</td>
            <td>
                <button onclick="editPayment(${p.id}, ${p.amount}, '${p.fullDate || ''}')">✏️</button>
                <button onclick="deletePayment(${p.id})" style="color:red">🗑️</button>
            </td>
        </tr>`;
    });
}

function renderExpenses(expenses) {
    const list = document.getElementById('expensesBody');
    if (!list) return;
    list.innerHTML = "";
    [...expenses].sort((a,b) => b.timestamp - a.timestamp).forEach(e => {
        list.innerHTML += `<tr>
            <td>${e.concept}</td>
            <td>$ ${e.amount.toLocaleString('es-UY')}</td>
            <td>${e.date}</td>
            <td><button onclick="deleteExpense(${e.id})" style="color:red">🗑️</button></td>
        </tr>`;
    });
}

/**
 * GRÁFICO DE BARRAS SEMESTRAL
 */
function prepareSemesterChart(payments, expenses) {
    const labels = []; const incomeData = []; const expenseData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        labels.push(d.toLocaleString('es-ES', { month: 'short' }));
        incomeData.push(payments.filter(p => p.date === key).reduce((s, p) => s + Number(p.amount), 0));
        expenseData.push(expenses.filter(e => e.date === key).reduce((s, e) => s + Number(e.amount), 0));
    }
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;
    if (financeChart) {
        financeChart.data.labels = labels;
        financeChart.data.datasets[0].data = incomeData;
        financeChart.data.datasets[1].data = expenseData;
        financeChart.update();
    } else {
        financeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Ingresos', data: incomeData, backgroundColor: '#27ae60' },
                    { label: 'Gastos', data: expenseData, backgroundColor: '#e74c3c' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

/**
 * COPIAS DE SEGURIDAD (BACKUP JSON)
 */
// --- FUNCIÓN DE EXPORTACIÓN CORREGIDA ---
async function exportBackupJSON() {
    const residents = await getAllFromStore("residents");
    const payments = await getAllFromStore("payments");
    const expenses = await getAllFromStore("expenses"); // Agregado para que no se pierdan

    const backupData = {
        residents,
        payments,
        expenses, // Incluimos los gastos en el archivo
        version: "1.6.0",
        date: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_residencia_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// --- FUNCIÓN DE IMPORTACIÓN CORREGIDA ---
async function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Verificación básica de que el archivo es válido
            if (!data.residents || !data.payments) {
                return alert("Error: El archivo no parece ser un backup válido.");
            }

            if (!confirm("Se eliminarán todos los datos actuales y se cargarán los del backup. ¿Deseas continuar?")) return;

            // Limpiamos y cargamos las 3 tablas (incluyendo gastos si existen en el backup)
            await clearAndFillStore("residents", data.residents);
            await clearAndFillStore("payments", data.payments);
            
            if (data.expenses) {
                await clearAndFillStore("expenses", data.expenses);
            }

            alert("Respaldo cargado con éxito. La aplicación se reiniciará.");
            location.reload();
        } catch (err) {
            console.error(err);
            alert("Hubo un error al procesar el archivo JSON.");
        }
    };
    reader.readAsText(file);
}

// --- FUNCIÓN AUXILIAR (Asegúrate de tenerla) ---
async function clearAndFillStore(storeName, items) {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    await store.clear();
    for (const item of items) {
        // Importante: Borramos el ID antiguo para que la base de datos genere nuevos 
        // y no haya conflictos de llaves primarias
        if (item.id) delete item.id;
        await store.add(item);
    }
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}

/**
 * EXPORTAR A EXCEL (LIBRERÍA XLSX)
 */
function exportToExcel() {
    const tx = db.transaction(["residents"], "readonly");
    tx.objectStore("residents").getAll().onsuccess = (e) => {
        const ws = XLSX.utils.json_to_sheet(e.target.result);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Residentes");
        XLSX.writeFile(wb, "Residentes_Dona_Muneca.xlsx");
    };
}

/**
 * FUNCIÓN AUXILIAR DE ACCESO A DATOS
 */
function getAllFromStore(name) {
    return new Promise(res => {
        if(!db) return res([]);
        const tx = db.transaction([name], "readonly");
        tx.objectStore(name).getAll().onsuccess = (e) => res(e.target.result);
    });
}
async function renderPaymentsBy(criteria) {
    const residents = await getAllFromStore("residents");
    const payments = await getAllFromStore("payments");
    renderPaymentsHistory(payments, residents, criteria);
}
/**
 * Captura el mes del selector y dispara la generación del PDF
 */
async function generateMonthlyReportFromSelector() {
    const selector = document.getElementById('reportMonthSelector');
    if (!selector.value) {
        return alert("Por favor, selecciona un mes y año para generar el reporte.");
    }
    
    // El formato de input 'month' es YYYY-MM, justo lo que necesitamos
    const selectedMonth = selector.value; 
    
    // Llamamos a la función existente pero pasándole el mes elegido
    await generateMonthlyReport(selectedMonth);
}
async function cerrarMesDesdeSelector() {
    const selector = document.getElementById('reportMonthSelector');
    
    if (!selector.value) {
        return alert("Por favor, selecciona un mes en el calendario.");
    }

    // selector.value nos da el formato "2024-03" automáticamente
    await cerrarMes(selector.value);
}