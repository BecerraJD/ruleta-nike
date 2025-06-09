const LOCAL_STORAGE_KEY = 'roulettePrizes';

// Array de premios iniciales
// Cada premio es un objeto con nombre, cantidad máxima, cantidad actual y tipo.
const defaultPrizes = [
    { name: "Par de Medias", maxQuantity: 24, currentQuantity: 24, type: 'prize' },
    { name: "10% de Descuento", maxQuantity: 30, currentQuantity: 30, type: 'prize' },
    { name: "Desayuno", maxQuantity: 20, currentQuantity: 20, type: 'prize' },
    { name: "Cordones", maxQuantity: 20, currentQuantity: 20, type: 'prize' },
    { name: "Lo sentimos! Será la proxima", maxQuantity: 25, currentQuantity: 25, type: 'empty' }, // Premio "vacío"
];

// Intenta cargar los premios desde localStorage, si no existen, usa los valores por defecto
let prizes = loadPrizesFromLocalStorage();

// Si los premios cargados no son válidos o están vacíos, usa los valores por defecto
if (!prizes || prizes.length === 0) {
    prizes = JSON.parse(JSON.stringify(defaultPrizes)); // Hacer una copia profunda para evitar mutaciones
    savePrizesToLocalStorage(); // Guardar los valores por defecto la primera vez
}

const rouletteWheel = document.getElementById('rouletteWheel');
const spinButton = document.getElementById('spinButton');
const resultDisplay = document.getElementById('result-display');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageContent = document.getElementById('messageContent');
const messageBoxClose = document.getElementById('messageBoxClose');


/**
 * Carga los premios desde localStorage.
 * @returns {Array} Un array de objetos de premios o null si no hay datos válidos.
 */
function loadPrizesFromLocalStorage() {
    try {
        const storedPrizes = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrizes) {
            return JSON.parse(storedPrizes);
        }
    } catch (e) {
        console.error("Error al cargar premios desde localStorage:", e);
        // Si hay un error, limpiar el localStorage para evitar problemas futuros
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return null;
}

/**
 * Guarda los premios actuales en localStorage.
 */
function savePrizesToLocalStorage() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prizes));
        logPrizeQuantitiesToConsole(); // <--- LLAMADA AQUÍ: Registrar en consola después de guardar
    } catch (e) {
        console.error("Error al guardar premios en localStorage:", e);
    }
}

// Función para mostrar un mensaje en el modal personalizado
function showMessage(title, content) {
    messageTitle.textContent = title;
    messageContent.textContent = content;
    messageBox.style.display = 'flex';
}

// Event listener para cerrar el modal
messageBoxClose.addEventListener('click', () => {
    messageBox.style.display = 'none';
});

// Colores para los segmentos de la ruleta (solo 4 colores distintos)
const segmentColors = [
    "#FF6B6B", // Rojo claro
    "#4ECDC4", // Verde azulado
    "#FFD166", // Amarillo
    "#C7D3D4"  // Gris azulado
];

/**
 * Inicializa la ruleta creando 4 segmentos visuales (cuadrantes).
 * Cada segmento se coloca angularmente como un cuadrante perfecto.
 */
function initializeWheel() {
    rouletteWheel.innerHTML = ''; // Limpiar segmentos existentes
    const numVisualSegments = 4; // Siempre 4 segmentos visuales (cuadrantes)
    const anglePerVisualSegment = 360 / numVisualSegments; // 90 grados por segmento

    for (let i = 0; i < numVisualSegments; i++) {
        const segment = document.createElement('div');
        segment.classList.add('wheel-segment');

        // Asignar color cíclicamente de los 4 colores definidos
        segment.style.backgroundColor = segmentColors[i];

        // Calcular la rotación para cada uno de los 4 cuadrantes
        // Estos 4 segmentos se posicionan como cuadrantes de un círculo
        const rotation = i * anglePerVisualSegment; // 0, 90, 180, 270 grados
        segment.style.transform = `rotate(${rotation}deg)`;

        rouletteWheel.appendChild(segment);
    }
}

// **NUEVA FUNCIÓN: Muestra el estado de los premios en la consola**
function logPrizeQuantitiesToConsole() {
    console.log("--- Estado actual de los premios ---");
    prizes.forEach(prize => {
        let status = prize.currentQuantity > 0 ? "DISPONIBLE" : "AGOTADO";
        let quantityInfo = `(Quedan: ${prize.currentQuantity})`;

        // Puedes personalizar el formato si quieres diferenciar más
        // los premios "vacíos" o "lo siento" si lo deseas
        if (prize.type === 'empty') {
            console.log(`[${status}] ${prize.name} ${quantityInfo}`);
        } else {
            console.log(`[${status}] ${prize.name} ${quantityInfo}`);
        }
    });
    console.log("-----------------------------------");
}


/**
 * Función para girar la ruleta.
 * Primero, selecciona un premio disponible. Luego, anima la ruleta
 * para aterrizar en ese premio y actualiza su cantidad.
 * Diferencia el mensaje según el tipo de premio (real o vacío).
 */
spinButton.addEventListener('click', () => {
    if (spinButton.disabled) return; // Evitar giros múltiples

    // Filtrar solo los premios que aún tienen cantidad disponible
    const availablePrizes = prizes.filter(p => p.currentQuantity > 0);

    if (availablePrizes.length === 0) {
        // Si no quedan premios disponibles, mostrar un mensaje y deshabilitar el botón
        showMessage('Juego Terminado', '¡Todos los premios se han agotado! Gracias por jugar.');
        spinButton.disabled = true;
        return;
    }

    spinButton.disabled = true; // Deshabilitar el botón durante el giro
    resultDisplay.textContent = ''; // Limpiar el resultado anterior

    // 1. Elegir un premio ganador de los disponibles aleatoriamente
    const randomIndexAvailable = Math.floor(Math.random() * availablePrizes.length);
    const selectedPrizeObject = availablePrizes[randomIndexAvailable];

    // 2. Encontrar el índice original de este premio en el array 'prizes' completo.
    const originalPrizeIndex = prizes.findIndex(p => p.name === selectedPrizeObject.name);

    if (originalPrizeIndex === -1) {
        console.error("Error: Premio seleccionado no encontrado en el array original de premios.");
        spinButton.disabled = false;
        return;
    }

    // Mapear el índice del premio lógico a uno de los 4 segmentos visuales
    const numVisualSegments = 4;
    const anglePerVisualSegment = 360 / numVisualSegments;
    const visualLandingIndex = originalPrizeIndex % numVisualSegments; // Esto asegura que aterrice en uno de los 4 cuadrantes

    // Calcular el ángulo objetivo para que la aguja caiga en el centro del cuadrante visual correspondiente
    const targetAngle = (visualLandingIndex * anglePerVisualSegment) + (anglePerVisualSegment / 2);
    const totalSpins = 5; // Número de giros completos para una animación más larga y dramática
    const finalRotation = (totalSpins * 360) + (360 - targetAngle); // Girar hacia la derecha

    // Aplicar la transformación de giro
    rouletteWheel.style.transition = 'transform 4s ease-out';
    rouletteWheel.style.transform = `rotate(${finalRotation}deg)`;

    // Esperar a que la animación termine antes de mostrar el resultado
    rouletteWheel.addEventListener('transitionend', function handler() {
        rouletteWheel.removeEventListener('transitionend', handler);

        // Decrementar la cantidad del premio ganador
        prizes[originalPrizeIndex].currentQuantity--;
        savePrizesToLocalStorage(); // GUARDAR LOS PREMIOS ACTUALIZADOS EN LOCALSTORAGE y llamar a logPrizeQuantitiesToConsole()

        // Mostrar el resultado en pantalla y en el mensaje modal
        let messageTitleText = '';
        let messageContentText = '';

        if (selectedPrizeObject.type === 'prize') {
            messageTitleText = '¡Felicidades!';
            messageContentText = `¡Has ganado: "${selectedPrizeObject.name}"!`;
            resultDisplay.textContent = `¡Ganaste: ${selectedPrizeObject.name}!`;
        } else { // type === 'empty'
            messageTitleText = '¡Suerte para la próxima!';
            messageContentText = `"${selectedPrizeObject.name}"`;
            resultDisplay.textContent = `${selectedPrizeObject.name}`;
        }

        showMessage(messageTitleText, messageContentText);

        // --- INICIO DE LA CORRECCIÓN PARA LA CONSISTENCIA DE LA ANIMACIÓN ---
        // Obtener el valor actual de la transformación para capturar la rotación visual
        const currentTransform = window.getComputedStyle(rouletteWheel).getPropertyValue('transform');
        const matrix = new DOMMatrixReadOnly(currentTransform);
        let currentVisualAngle = Math.atan2(matrix.m21, matrix.m11) * (180 / Math.PI);

        // Asegurar que el ángulo sea positivo para consistencia
        if (currentVisualAngle < 0) {
            currentVisualAngle += 360;
        }

        // Deshabilitar temporalmente la transición
        rouletteWheel.style.transition = 'none';

        // Establecer la transformación al ángulo visual calculado
        // Esto "reinicia" el valor de rotación interno sin un salto visual
        rouletteWheel.style.transform = `rotate(${currentVisualAngle}deg)`;

        // Habilitar de nuevo la transición después de un retraso muy corto para asegurar que el navegador
        // registre la transición 'none' y el nuevo valor de transformación
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Doble rAF para mayor robustez en diferentes navegadores
                rouletteWheel.style.transition = 'transform 4s ease-out';
            });
        });
        // --- FIN DE LA CORRECCIÓN PARA LA CONSISTENCIA DE LA ANIMACIÓN ---

        spinButton.disabled = false; // Habilitar el botón para el siguiente giro

        // Re-inicializar la ruleta (esto no es estrictamente necesario para la visualización de los 4 segmentos fijos,
        // pero se mantiene si cumple alguna otra función en tu diseño)
        initializeWheel();

        // Verificar si después de este giro ya no quedan premios reales para deshabilitar el botón
        // (considerando también los premios tipo 'empty' para la lógica de fin de juego)
        const remainingAvailablePrizes = prizes.filter(p => p.currentQuantity > 0);
        if (remainingAvailablePrizes.length === 0) {
             spinButton.disabled = true; // Deshabilita si NO quedan premios de ningún tipo
        }
    });
});

// Inicializar la ruleta y registrar los premios disponibles cuando la ventana haya cargado
window.onload = () => {
    initializeWheel();
    logPrizeQuantitiesToConsole(); // <--- LLAMADA INICIAL: Registrar en consola al cargar
};