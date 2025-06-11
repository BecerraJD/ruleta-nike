const LOCAL_STORAGE_KEY = 'roulettePrizes';

// Array de premios iniciales
const defaultPrizes = [
    { name: "Par de Medias", maxQuantity: 24, currentQuantity: 24, type: 'prize' },
    { name: "10% de Descuento", maxQuantity: 30, currentQuantity: 30, type: 'prize' },
    { name: "Desayuno", maxQuantity: 20, currentQuantity: 20, type: 'prize' },
    { name: "Cordones", maxQuantity: 20, currentQuantity: 20, type: 'prize' },
];

let prizes = loadPrizesFromLocalStorage();

if (!prizes || prizes.length === 0) {
    prizes = JSON.parse(JSON.stringify(defaultPrizes));
    savePrizesToLocalStorage();
}

const rouletteWheel = document.getElementById('rouletteWheel');
const spinButton = document.getElementById('spinButton');
const resultDisplay = document.getElementById('result-display');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageContent = document.getElementById('messageContent');

// Referencias a los botones del modal
const confirmActionButton = document.getElementById('confirmActionButton');
const cancelActionButton = document.getElementById('cancelActionButton');
const closeInfoMessageButton = document.getElementById('closeInfoMessageButton'); // El botón de "Cerrar" estilo "Girar"

const modalButtonsContainer = document.querySelector('.modal-buttons-container'); // Nuevo contenedor general de botones

const resetButton = document.getElementById('resetButton');


function loadPrizesFromLocalStorage() {
    try {
        const storedPrizes = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrizes) {
            return JSON.parse(storedPrizes);
        }
    } catch (e) {
        console.error("Error al cargar premios desde localStorage:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return null;
}

function savePrizesToLocalStorage() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prizes));
        logPrizeQuantitiesToConsole();
    } catch (e) {
        console.error("Error al guardar premios en localStorage:", e);
    }
}

/**
 * Muestra el modal con un título y contenido.
 * Controla qué botones se muestran en el modal.
 * @param {string} title - Título del mensaje.
 * @param {string} content - Contenido del mensaje.
 * @param {string} type - 'confirm' para botones de confirmar/cancelar, 'info' para botón de cerrar estilo "Girar".
 */
function showMessage(title, content, type = 'info') {
    messageTitle.textContent = title;
    messageContent.textContent = content;
    
    // Ocultar todos los botones dentro del contenedor general primero
    confirmActionButton.style.display = 'none';
    cancelActionButton.style.display = 'none';
    closeInfoMessageButton.style.display = 'none';

    // Mostrar los botones adecuados según el tipo
    if (type === 'confirm') {
        confirmActionButton.style.display = 'inline-block';
        cancelActionButton.style.display = 'inline-block';
    } else { // type === 'info'
        closeInfoMessageButton.style.display = 'inline-block';
    }

    modalButtonsContainer.style.display = 'flex'; // Asegurarse de que el contenedor de botones sea visible y flex
    messageBox.style.display = 'flex';
}

// Event listeners para los botones del modal
cancelActionButton.addEventListener('click', () => {
    messageBox.style.display = 'none';
});

closeInfoMessageButton.addEventListener('click', () => {
    messageBox.style.display = 'none';
});


// Colores para los segmentos de la ruleta
const segmentColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#FFD166",
    "#C7D3D4"
];

function initializeWheel() {
    rouletteWheel.innerHTML = '';
    const numVisualSegments = 4;
    const anglePerVisualSegment = 360 / numVisualSegments;

    for (let i = 0; i < numVisualSegments; i++) {
        const segment = document.createElement('div');
        segment.classList.add('wheel-segment');
        segment.style.backgroundColor = segmentColors[i];
        const rotation = i * anglePerVisualSegment;
        segment.style.transform = `rotate(${rotation}deg)`;
        rouletteWheel.appendChild(segment);
    }
}

function logPrizeQuantitiesToConsole() {
    console.log("--- Estado actual de los premios ---");
    prizes.forEach(prize => {
        let status = prize.currentQuantity > 0 ? "DISPONIBLE" : "AGOTADO";
        let quantityInfo = `(Quedan: ${prize.currentQuantity})`;
        console.log(`[${status}] ${prize.name} ${quantityInfo}`);
    });
    console.log("-----------------------------------");
}

// Función para la lógica de reinicio real
function performReset() {
    prizes = JSON.parse(JSON.stringify(defaultPrizes));
    savePrizesToLocalStorage();
    
    spinButton.disabled = false;
    resultDisplay.textContent = '';
    messageBox.style.display = 'none'; // Oculta el modal después de reiniciar

    // Reiniciar la posición de la ruleta visualmente
    rouletteWheel.style.transition = 'none';
    rouletteWheel.style.transform = 'rotate(0deg)';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            rouletteWheel.style.transition = 'transform 4s ease-out';
        });
    });

    // Volver a verificar el estado del botón de girar después del reinicio
    const remainingAvailablePrizes = prizes.filter(p => p.currentQuantity > 0);
    if (remainingAvailablePrizes.length === 0) {
        spinButton.disabled = true;
        resultDisplay.textContent = '¡Todos los premios se han agotado!';
    } else {
        spinButton.disabled = false;
    }
}


spinButton.addEventListener('click', () => {
    if (spinButton.disabled) return;

    const availablePrizes = prizes.filter(p => p.currentQuantity > 0);

    if (availablePrizes.length === 0) {
        showMessage('Juego Terminado', '¡Todos los premios se han agotado! Gracias por jugar.', 'info');
        spinButton.disabled = true;
        return;
    }

    spinButton.disabled = true;
    resultDisplay.textContent = '';

    const weightedPrizes = [];
    availablePrizes.forEach(prize => {
        for (let i = 0; i < prize.currentQuantity; i++) {
            weightedPrizes.push(prize);
        }
    });

    if (weightedPrizes.length === 0) {
        showMessage('Juego Terminado', 'No hay premios disponibles para elegir. Reinicia el juego.', 'info');
        spinButton.disabled = true;
        return;
    }

    const randomIndexWeighted = Math.floor(Math.random() * weightedPrizes.length);
    const selectedPrizeObject = weightedPrizes[randomIndexWeighted];
    
    const originalPrizeIndex = prizes.findIndex(p => p.name === selectedPrizeObject.name);

    if (originalPrizeIndex === -1) {
        console.error("Error: Premio seleccionado no encontrado en el array original de premios.");
        spinButton.disabled = false;
        return;
    }

    const numVisualSegments = 4;
    const anglePerVisualSegment = 360 / numVisualSegments;
    let visualLandingIndex;
    switch (selectedPrizeObject.name) {
        case "Par de Medias":
            visualLandingIndex = 0;
            break;
        case "10% de Descuento":
            visualLandingIndex = 1;
            break;
        case "Desayuno":
            visualLandingIndex = 2;
            break;
        case "Cordones":
            visualLandingIndex = 3;
            break;
    }

    const targetAngle = (visualLandingIndex * anglePerVisualSegment) + (anglePerVisualSegment / 2);
    const totalSpins = 5;
    const finalRotation = (totalSpins * 360) + (360 - targetAngle);

    rouletteWheel.style.transition = 'transform 4s ease-out';
    rouletteWheel.style.transform = `rotate(${finalRotation}deg)`;

    rouletteWheel.addEventListener('transitionend', function handler() {
        rouletteWheel.removeEventListener('transitionend', handler);

        prizes[originalPrizeIndex].currentQuantity--;
        savePrizesToLocalStorage();

        let messageTitleText = '';
        let messageContentText = '';

        if (selectedPrizeObject.type === 'prize') {
            messageTitleText = '¡Felicidades!';
            messageContentText = `¡Has ganado: "${selectedPrizeObject.name}"!`;
            resultDisplay.textContent = `¡Ganaste: ${selectedPrizeObject.name}!`;
        } else {
            messageTitleText = '¡Suerte para la próxima!';
            messageContentText = `"${selectedPrizeObject.name}"`;
            resultDisplay.textContent = `${selectedPrizeObject.name}`;
        }

        showMessage(messageTitleText, messageContentText, 'info'); // Usar 'info' para mostrar el botón de cerrar estilo "Girar"

        const currentTransform = window.getComputedStyle(rouletteWheel).getPropertyValue('transform');
        const matrix = new DOMMatrixReadOnly(currentTransform);
        let currentVisualAngle = Math.atan2(matrix.m21, matrix.m11) * (180 / Math.PI);

        if (currentVisualAngle < 0) {
            currentVisualAngle += 360;
        }

        rouletteWheel.style.transition = 'none';
        rouletteWheel.style.transform = `rotate(${currentVisualAngle}deg)`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                rouletteWheel.style.transition = 'transform 4s ease-out';
            });
        });

        spinButton.disabled = false;

        const remainingAvailablePrizes = prizes.filter(p => p.currentQuantity > 0);
        if (remainingAvailablePrizes.length === 0) {
             spinButton.disabled = true;
             resultDisplay.textContent = '¡Todos los premios se han agotado!';
        }
    });
});

// Event listener para el botón "Nike"
resetButton.addEventListener('click', () => {
    showMessage(
        'Confirmar Reinicio',
        '¿Estás seguro que deseas reiniciar el juego?',
        'confirm' // Tipo 'confirm' para mostrar los botones de confirmación
    );
});

// Event listener para el botón de Confirmar acción
confirmActionButton.addEventListener('click', () => {
    performReset(); // Llama a la función que realiza el reinicio
});


// Inicializar la ruleta y registrar los premios disponibles cuando la ventana haya cargado
window.onload = () => {
    initializeWheel();
    logPrizeQuantitiesToConsole();
    
    const remainingAvailablePrizes = prizes.filter(p => p.currentQuantity > 0);
    if (remainingAvailablePrizes.length === 0) {
        spinButton.disabled = true;
        resultDisplay.textContent = '¡Todos los premios se han agotado!';
    } else {
        spinButton.disabled = false;
    }
};