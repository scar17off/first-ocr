const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const eraseBtn = document.getElementById('erase-btn');
const letterList = document.getElementById('letter-list');
let isDrawing = false;
const gridSize = 10;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    throttledUpdateSimilarity();
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
    updateSimilarity();
}

eraseBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearVisualization();
});

function updateSimilarity() {
    const drawnLetter = getDrawnLetter();
    if (isCanvasEmpty(drawnLetter)) {
        clearVisualization();
        return;
    }
    
    const similarities = Object.keys(dataset).map(letter => ({
        letter,
        similarity: calculateSimilarity(drawnLetter, dataset[letter])
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);

    updateLetterList(similarities);
    visualizeDatasetComparison(drawnLetter, similarities[0].letter);
}

function getDrawnLetter() {
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;
    const grid = [];

    for (let y = 0; y < gridSize; y++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            const imageData = ctx.getImageData(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            const hasDrawing = imageData.data.some((channel, index) => index % 4 !== 3 && channel < 240);
            row.push(hasDrawing ? 1 : 0);
        }
        grid.push(row);
    }

    return grid;
}

function calculateSimilarity(drawnLetter, datasetLetter) {
    let matchingCells = 0;
    let totalCells = 0;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (drawnLetter[y][x] === datasetLetter[y][x]) {
                matchingCells++;
            }
            totalCells++;
        }
    }

    return matchingCells / totalCells;
}

function visualizeGrid(grid, elementId) {
    const container = document.getElementById(elementId);
    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            const cellElement = container.children[y]?.children[x];
            if (cellElement) {
                cellElement.className = `grid-cell ${cell ? 'filled' : ''}`;
            } else {
                const newCell = document.createElement('div');
                newCell.className = `grid-cell ${cell ? 'filled' : ''}`;
                if (!container.children[y]) {
                    const rowElement = document.createElement('div');
                    rowElement.style.display = 'flex';
                    container.appendChild(rowElement);
                }
                container.children[y].appendChild(newCell);
            }
        });
    });
}

function visualizeDatasetComparison(drawnLetter, closestLetter) {
    const container = document.getElementById('dataset-visualization');
    container.innerHTML = '';
    
    const drawnGrid = createGridElement(drawnLetter);
    const datasetGrid = createGridElement(dataset[closestLetter]);
    
    const drawnContainer = document.createElement('div');
    drawnContainer.className = 'dataset-letter';
    drawnContainer.innerHTML = '<h4>Drawn Letter</h4>';
    drawnContainer.appendChild(drawnGrid);
    
    const datasetContainer = document.createElement('div');
    datasetContainer.className = 'dataset-letter';
    datasetContainer.innerHTML = `<h4>Closest Match: ${closestLetter}</h4>`;
    datasetContainer.appendChild(datasetGrid);
    
    container.appendChild(drawnContainer);
    container.appendChild(datasetContainer);
}

function createGridElement(grid) {
    const gridElement = document.createElement('div');
    grid.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.style.display = 'flex';
        
        row.forEach(cell => {
            const cellElement = document.createElement('div');
            cellElement.className = `grid-cell ${cell ? 'filled' : ''}`;
            rowElement.appendChild(cellElement);
        });
        
        gridElement.appendChild(rowElement);
    });
    return gridElement;
}

function updateLetterList(similarities) {
    similarities.forEach(({letter, similarity}, index) => {
        let letterItem = letterList.children[index];
        if (!letterItem) {
            letterItem = document.createElement('div');
            letterItem.className = 'letter-item';
            letterList.appendChild(letterItem);
        }
        const matchHeight = similarity * 100;
        const mismatchHeight = 100 - matchHeight;
        letterItem.innerHTML = `
            <div class="similarity-bar">
                <div class="similarity-fill similarity-match" style="height: ${matchHeight}%"></div>
                <div class="similarity-fill similarity-mismatch" style="height: ${mismatchHeight}%"></div>
            </div>
            ${letter}
        `;
    });
    while (letterList.children.length > similarities.length) {
        letterList.removeChild(letterList.lastChild);
    }
}

function isCanvasEmpty(grid) {
    return grid.every(row => row.every(cell => cell === 0));
}

function clearVisualization() {
    letterList.innerHTML = '';
    document.getElementById('dataset-visualization').innerHTML = '';
}

updateSimilarity();

function initCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

initCanvas();

// This function helps prevent excessive updates when drawing
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

const throttledUpdateSimilarity = throttle(updateSimilarity, 50);

function draw(e) {
    if (!isDrawing) return;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    throttledUpdateSimilarity();
}