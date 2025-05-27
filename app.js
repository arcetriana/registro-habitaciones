const tarifaPorHora = 5000;

const fechaInput = document.getElementById('fecha');
const horaVisible = document.getElementById('hora-visible');
const horaHH = document.getElementById('hora-hh');
const horaMM = document.getElementById('hora-mm');
const horaAMPM = document.getElementById('hora-ampm');
const horaSelectores = document.getElementById('hora-selectores');

const tiempoSelect = document.getElementById('tiempo');
const extrasSelect = document.getElementById('extras');
const notasInput = document.getElementById('notas');
const totalSpan = document.getElementById('total');
const form = document.getElementById('registroForm');

const pantallaHabitaciones = document.getElementById('pantallaHabitaciones');
const pantallaFormulario = document.getElementById('pantallaFormulario');

const habitacionesContainer = document.getElementById('habitacionesContainer');
const habitacionInput = document.getElementById('habitacion');
const habitacionSeleccionada = document.getElementById('habitacionSeleccionada');
const btnCancelar = document.getElementById('btnCancelar');
const btnLiberar = document.getElementById('btnLiberar');
const btnExportarTodo = document.getElementById('btnExportarTodo');

let registros = JSON.parse(localStorage.getItem('registros')) || [];
let botonesHabitaciones = {};
const totalHabitaciones = 6;

for (let i = 1; i <= totalHabitaciones; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.classList.add('disponible');
  btn.type = 'button';
  btn.addEventListener('click', () => mostrarFormulario(i));
  habitacionesContainer.appendChild(btn);
  botonesHabitaciones[i] = btn;
}

// Restaurar colores al cargar
registros.forEach(r => {
  const btn = botonesHabitaciones[r.habitacion];
  if (btn) {
    btn.classList.remove('disponible');
    btn.classList.add('ocupada');
  }
});

function mostrarFormulario(numHab) {
  habitacionInput.value = numHab;
  habitacionSeleccionada.textContent = `Habitación seleccionada: ${numHab}`;
  pantallaHabitaciones.classList.add('hidden');
  pantallaFormulario.classList.remove('hidden');
  actualizarFecha();
  llenarSelectoresHora();

  const existente = registros.find(r => r.habitacion === String(numHab));
  if (existente) {
    const [hh, mm] = existente.hora.split(' ')[0].split(':');
    const ampm = existente.hora.split(' ')[1];
    horaHH.value = hh;
    horaMM.value = mm;
    horaAMPM.value = ampm;
    tiempoSelect.value = existente.tiempo;
    extrasSelect.value = existente.extras;
    notasInput.value = existente.notas || '';
    actualizarHoraVisible();
  } else {
    extrasSelect.value = '0';
    tiempoSelect.value = '3';
    notasInput.value = '';
  }
  actualizarTotal();
  horaSelectores.classList.add('hidden');
  horaVisible.classList.remove('hidden');
}

function volverAPantallaHabitaciones() {
  pantallaFormulario.classList.add('hidden');
  pantallaHabitaciones.classList.remove('hidden');
  form.reset();
  habitacionSeleccionada.textContent = '';
  totalSpan.textContent = '0';
}

function actualizarHoraVisible() {
  horaVisible.value = `${horaHH.value}:${horaMM.value} ${horaAMPM.value}`;
}

horaVisible.addEventListener('click', () => {
  horaVisible.classList.add('hidden');
  horaSelectores.classList.remove('hidden');
});

function llenarSelectoresHora() {
  horaHH.innerHTML = '';
  horaMM.innerHTML = '';

  for (let h = 1; h <= 12; h++) {
    const option = document.createElement('option');
    option.value = option.textContent = h.toString().padStart(2, '0');
    horaHH.appendChild(option);
  }

  for (let m = 0; m < 60; m++) {
    const option = document.createElement('option');
    option.value = option.textContent = m.toString().padStart(2, '0');
    horaMM.appendChild(option);
  }

  const ahora = new Date();
  const opciones = { timeZone: 'America/Costa_Rica', hour: 'numeric', minute: 'numeric', hour12: true };
  const horaTica = new Intl.DateTimeFormat('en-US', opciones).format(ahora);
  const [horaMinuto, ampm] = horaTica.split(' ');
  const [hh, mm] = horaMinuto.split(':');

  horaHH.value = hh.padStart(2, '0');
  horaMM.value = mm;
  horaAMPM.value = ampm.toUpperCase();

  actualizarHoraVisible();
}

function actualizarFecha() {
  const hoy = new Date();
  fechaInput.value = hoy.toLocaleDateString('es-CR');
}

function actualizarTotal() {
  const horas = parseInt(tiempoSelect.value) + parseInt(extrasSelect.value);
  const total = horas * tarifaPorHora;
  totalSpan.textContent = total.toLocaleString('es-CR');
}

function guardarRegistrosEnLocalStorage() {
  localStorage.setItem('registros', JSON.stringify(registros));
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const registro = {
    fecha: fechaInput.value,
    hora: `${horaHH.value}:${horaMM.value} ${horaAMPM.value}`,
    habitacion: habitacionInput.value,
    tiempo: tiempoSelect.value,
    extras: extrasSelect.value,
    notas: notasInput.value,
    total: (parseInt(tiempoSelect.value) + parseInt(extrasSelect.value)) * tarifaPorHora
  };

  fetch("https://script.google.com/macros/s/AKfycby128U8FrMzmJKOdc_0Xg83YoaowSTuL-9SmwwlPGWv_xshD8kXgczn5g00Mx74cK6R/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(registro)
  })
  .then(response => response.text())
  .then(text => {
    console.log("✅ Enviado a Google Sheets:", text);
  })
  .catch(error => {
    console.error("❌ Error al enviar a Google Sheets:", error);
  });

  const btn = botonesHabitaciones[registro.habitacion];
  const existente = registros.find(r => r.habitacion === registro.habitacion);

  if (existente) {
    Object.assign(existente, registro);
  } else {
    registros.push(registro);
  }

  guardarRegistrosEnLocalStorage();

  if (btn) {
    btn.classList.remove('disponible');
    btn.classList.add('ocupada');
  }

  alert('Registro guardado correctamente ✅');
  volverAPantallaHabitaciones();
});

btnCancelar.addEventListener('click', () => volverAPantallaHabitaciones());

btnLiberar.addEventListener('click', () => {
  const habitacion = habitacionInput.value;
  if (!habitacion) {
    alert('No hay habitación seleccionada.');
    return;
  }

  const btn = botonesHabitaciones[habitacion];
  if (btn) {
    btn.classList.remove('ocupada');
    btn.classList.add('disponible');
  }

  registros = registros.filter(r => r.habitacion !== habitacion);
  guardarRegistrosEnLocalStorage();
  alert(`Habitación ${habitacion} liberada correctamente ✅`);
  volverAPantallaHabitaciones();
});

horaHH.addEventListener('change', actualizarHoraVisible);
horaMM.addEventListener('change', actualizarHoraVisible);
horaAMPM.addEventListener('change', actualizarHoraVisible);

tiempoSelect.addEventListener('change', actualizarTotal);
extrasSelect.addEventListener('change', actualizarTotal);

btnExportarTodo.addEventListener('click', () => {
  if (registros.length === 0) {
    alert('No hay registros aún.');
    return;
  }

  const encabezado = ['Fecha', 'Hora', 'Habitación', 'Tiempo (h)', 'Horas extra', 'Notas', 'Total (CRC)'];
  const filas = registros.map(r => [
    r.fecha,
    r.hora,
    r.habitacion,
    r.tiempo,
    r.extras,
    r.notas || '',
    r.total
  ]);

  const csvContenido = [encabezado, ...filas]
    .map(fila => fila.map(campo => `"${campo}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registro_general_habitaciones.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});
