// Smart Study Scheduler - Main JavaScript File

// Global Variables
let currentTab = 'timetable';
let timerInterval = null;
let timerRunning = false;
let currentTime = 25 * 60; // 25 minutes in seconds
let timerMode = 'work';
let tasks = [];
let progressData = {
    studyDays: 0,
    totalHours: 0,
    tasksCompleted: 0,
    currentStreak: 0,
    weeklyData: [],
    dailyActivity: {}
};

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const taskModal = document.getElementById('task-modal');
const addTaskBtn = document.getElementById('add-task');
const clearTimetableBtn = document.getElementById('clear-timetable');
const saveTaskBtn = document.getElementById('save-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const closeModalBtn = document.querySelector('.close-btn');

// Timer Elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const timerLabel = document.getElementById('timer-label');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const modeButtons = document.querySelectorAll('.mode-btn');
const getTipBtn = document.getElementById('get-tip');
const tipContent = document.getElementById('tip-content');

// Motivation Elements
const generateMotivationBtn = document.getElementById('generate-motivation');
const saveMotivationBtn = document.getElementById('save-motivation');
const motivationText = document.getElementById('motivation-text');
const motivationType = document.getElementById('motivation-type');
const motivationTone = document.getElementById('motivation-tone');

// Progress Elements
const studyDaysDisplay = document.getElementById('study-days');
const totalHoursDisplay = document.getElementById('total-hours');
const tasksCompletedDisplay = document.getElementById('tasks-completed');
const currentStreakDisplay = document.getElementById('current-streak');
const exportProgressBtn = document.getElementById('export-progress');
const resetProgressBtn = document.getElementById('reset-progress');

// Music Elements
const moodButtons = document.querySelectorAll('.mood-btn');
const playlistTitle = document.getElementById('playlist-title');
const playlistDescription = document.getElementById('playlist-description');
const playlistTracks = document.getElementById('playlist-tracks');
const refreshPlaylistBtn = document.getElementById('refresh-playlist');
const savePlaylistBtn = document.getElementById('save-playlist');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadData();
    setupEventListeners();
    updateProgressDisplay();
    createActivityHeatmap();
});

// Initialize the application
function initializeApp() {
    // Set up drag and drop for timetable
    setupDragAndDrop();
    
    // Set up context menu for tasks
    setupTaskContextMenu();
    
    // Initialize timer
    updateTimerDisplay();
    
    // Load saved data
    loadSavedMotivations();
    loadSavedPlaylists();
}

// Set up event listeners
function setupEventListeners() {
    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Task Modal
    addTaskBtn.addEventListener('click', () => openTaskModal());
    closeModalBtn.addEventListener('click', () => closeTaskModal());
    cancelTaskBtn.addEventListener('click', () => closeTaskModal());
    saveTaskBtn.addEventListener('click', () => saveTask());
    clearTimetableBtn.addEventListener('click', () => clearTimetable());

    // Timer Controls
    startTimerBtn.addEventListener('click', () => startTimer());
    pauseTimerBtn.addEventListener('click', () => pauseTimer());
    resetTimerBtn.addEventListener('click', () => resetTimer());
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTimerMode(btn.dataset.mode, parseInt(btn.dataset.time)));
    });
    getTipBtn.addEventListener('click', () => getProductivityTip());

    // Motivation
    generateMotivationBtn.addEventListener('click', () => generateMotivation());
    saveMotivationBtn.addEventListener('click', () => saveMotivation());

    // Progress
    exportProgressBtn.addEventListener('click', () => exportProgressData());
    resetProgressBtn.addEventListener('click', () => resetProgressData());

    // Music
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });
    refreshPlaylistBtn.addEventListener('click', () => refreshPlaylist());
    savePlaylistBtn.addEventListener('click', () => savePlaylist());
}

// Tab Navigation
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update navigation buttons
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Task Modal Functions
function openTaskModal() {
    taskModal.classList.add('active');
    document.getElementById('task-title').focus();
}

function closeTaskModal() {
    taskModal.classList.remove('active');
    // Clear form
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-duration').value = '1';
    document.getElementById('task-color').value = '#4CAF50';
}

function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const duration = parseFloat(document.getElementById('task-duration').value);
    const color = document.getElementById('task-color').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        description,
        duration,
        color,
        day: null,
        startTime: null,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveData();
    closeTaskModal();
    
    // Create draggable task element
    createDraggableTask(task);
}

function createDraggableTask(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-block draggable-task';
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    taskElement.style.setProperty('--task-color', task.color);
    taskElement.innerHTML = `
        <div style="font-weight: bold;">${task.title}</div>
        <div style="font-size: 0.7rem; opacity: 0.8;">${task.duration}h</div>
        <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Delete task">
            <i class="fas fa-trash"></i>
        </button>
    `;

    // Add drag event listeners
    taskElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        taskElement.classList.add('dragging');
    });

    taskElement.addEventListener('dragend', () => {
        taskElement.classList.remove('dragging');
    });

    // Add to a visible area for dragging
    let taskContainer = document.querySelector('.draggable-tasks-container');
    if (!taskContainer) {
        taskContainer = document.createElement('div');
        taskContainer.className = 'draggable-tasks-container';
        taskContainer.innerHTML = '<h4 style="margin-bottom: 10px; color: #333;">📋 Available Tasks</h4>';
        taskContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255,255,255,0.95);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 250px;
            border: 2px solid #667eea;
        `;
        document.body.appendChild(taskContainer);
    }
    
    taskContainer.appendChild(taskElement);
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Drag and Drop Setup
function setupDragAndDrop() {
    const timeBlocks = document.querySelectorAll('.time-blocks');
    
    timeBlocks.forEach(block => {
        block.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            block.style.backgroundColor = '#e3f2fd';
        });
        
        block.addEventListener('dragenter', (e) => {
            e.preventDefault();
            block.style.backgroundColor = '#e3f2fd';
        });
        
        block.addEventListener('dragleave', (e) => {
            // Only change background if we're actually leaving the element
            if (!block.contains(e.relatedTarget)) {
                block.style.backgroundColor = '';
            }
        });
        
        block.addEventListener('drop', (e) => {
            e.preventDefault();
            block.style.backgroundColor = '';
            
            const taskId = e.dataTransfer.getData('text/plain');
            const task = tasks.find(t => t.id == taskId);
            
            if (task) {
                const rect = block.getBoundingClientRect();
                const dropY = e.clientY - rect.top;
                const startHour = Math.floor(dropY / 60) + 8; // 8 AM start
                
                // Ensure start hour is within valid range (8 AM to 7 PM)
                const validStartHour = Math.max(8, Math.min(19, startHour));
                
                task.day = block.parentElement.dataset.day;
                task.startTime = validStartHour;
                
                // Remove the draggable task from the container
                const draggableTask = document.querySelector(`.draggable-task[data-task-id="${taskId}"]`);
                if (draggableTask) {
                    draggableTask.remove();
                }
                
                placeTaskInTimetable(task);
                saveData();
                
                // Show success message
                showNotification('Task scheduled successfully!', 'success');
            }
        });
    });
}

function placeTaskInTimetable(task) {
    if (!task.day || task.startTime === null) return;
    
    const dayColumn = document.querySelector(`[data-day="${task.day}"] .time-blocks`);
    const taskElement = document.createElement('div');
    taskElement.className = 'task-block';
    taskElement.dataset.taskId = task.id;
    taskElement.style.setProperty('--task-color', task.color);
    taskElement.style.top = `${(task.startTime - 8) * 60}px`;
    taskElement.style.height = `${task.duration * 60}px`;
    taskElement.style.width = 'calc(100% - 10px)';
    taskElement.style.left = '5px';
    taskElement.innerHTML = `
        <div style="font-weight: bold; font-size: 0.8rem;">${task.title}</div>
        <div style="font-size: 0.7rem; opacity: 0.8;">${task.duration}h</div>
        <button class="task-complete-btn" onclick="completeTask(${task.id})" title="Mark as complete">
            <i class="fas fa-check"></i>
        </button>
        <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Delete task">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    dayColumn.appendChild(taskElement);
}

// Task completion function
function completeTask(taskId) {
    const task = tasks.find(t => t.id == taskId);
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        
        // Update progress
        progressData.tasksCompleted++;
        const today = new Date().toDateString();
        if (progressData.dailyActivity[today]) {
            progressData.dailyActivity[today].tasks++;
        }
        
        // Visual feedback
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('completed');
        }
        
        saveData();
        updateProgressDisplay();
    }
}

// Delete individual task function
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove from tasks array
        tasks = tasks.filter(task => task.id != taskId);
        
        // Remove from DOM
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
        
        // Remove from draggable container if exists
        const draggableTask = document.querySelector(`.draggable-task[data-task-id="${taskId}"]`);
        if (draggableTask) {
            draggableTask.remove();
        }
        
        // If no more draggable tasks, remove the container
        const draggableContainer = document.querySelector('.draggable-tasks-container');
        if (draggableContainer && draggableContainer.children.length <= 1) { // Only header remains
            draggableContainer.remove();
        }
        
        saveData();
        showNotification('Task deleted successfully!', 'success');
    }
}

// Edit task function (placeholder for future enhancement)
function editTask(taskId) {
    const task = tasks.find(t => t.id == taskId);
    if (task) {
        showNotification('Edit feature coming soon!', 'info');
        // TODO: Implement edit functionality
        // This could open a modal with task details for editing
    }
}

// Add context menu for tasks
function setupTaskContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        const taskElement = e.target.closest('.task-block');
        if (taskElement) {
            e.preventDefault();
            showTaskContextMenu(e, taskElement);
        }
    });
}

function showTaskContextMenu(e, taskElement) {
    const taskId = taskElement.dataset.taskId;
    const task = tasks.find(t => t.id == taskId);
    
    // Remove existing context menu
    const existingMenu = document.querySelector('.task-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'task-context-menu';
    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="completeTask(${taskId})">
            <i class="fas fa-check"></i> Mark as Complete
        </div>
        <div class="context-menu-item" onclick="editTask(${taskId})">
            <i class="fas fa-edit"></i> Edit Task
        </div>
        <div class="context-menu-item delete" onclick="deleteTask(${taskId})">
            <i class="fas fa-trash"></i> Delete Task
        </div>
    `;
    
    contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 150px;
    `;
    
    document.body.appendChild(contextMenu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            contextMenu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

function clearTimetable() {
    if (confirm('Are you sure you want to clear all tasks from the timetable?')) {
        const taskBlocks = document.querySelectorAll('.task-block');
        taskBlocks.forEach(block => block.remove());
        
        // Clear task data but keep unplaced tasks
        tasks = tasks.filter(task => !task.day || task.startTime === null);
        saveData();
    }
}

// Timer Functions
function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    startTimerBtn.disabled = true;
    pauseTimerBtn.disabled = false;
    
    timerInterval = setInterval(() => {
        currentTime--;
        updateTimerDisplay();
        
        if (currentTime <= 0) {
            clearInterval(timerInterval);
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerRunning) return;
    
    timerRunning = false;
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    currentTime = getTimerDuration();
    updateTimerDisplay();
}

function switchTimerMode(mode, time) {
    timerMode = mode;
    currentTime = time * 60;
    
    // Update mode buttons
    modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update timer label
    const labels = {
        'work': 'Work Time',
        'short-break': 'Short Break',
        'long-break': 'Long Break'
    };
    timerLabel.textContent = labels[mode];
    
    updateTimerDisplay();
    resetTimer();
}

function getTimerDuration() {
    const activeMode = document.querySelector('.mode-btn.active');
    return parseInt(activeMode.dataset.time) * 60;
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function timerComplete() {
    timerRunning = false;
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    
    // Play notification sound (if available)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
            body: `${timerMode === 'work' ? 'Time for a break!' : 'Back to work!'}`,
            icon: '/favicon.ico'
        });
    }
    
    // Update progress
    if (timerMode === 'work') {
        updateProgress();
    }
}

// Productivity Tips
function getProductivityTip() {
    const tips = [
        "Take regular breaks to maintain focus and prevent burnout.",
        "Use the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.",
        "Create a dedicated study space free from distractions.",
        "Set specific, achievable goals for each study session.",
        "Use active recall techniques like flashcards or self-quizzing.",
        "Practice spaced repetition to improve long-term retention.",
        "Stay hydrated and take care of your physical health.",
        "Use the Feynman Technique: explain concepts in simple terms.",
        "Break large tasks into smaller, manageable chunks.",
        "Review and reflect on your progress regularly."
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    tipContent.innerHTML = `<p>"${randomTip}"</p>`;
}

// Motivation Generator
function generateMotivation() {
    const type = motivationType.value;
    const tone = motivationTone.value;
    
    const motivations = {
        general: {
            encouraging: [
                "Every expert was once a beginner. Your dedication today builds your expertise tomorrow.",
                "The only way to do great work is to love what you do. Keep pushing forward!",
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "Your future self is watching you right now through memories. Make them proud."
            ],
            energetic: [
                "You've got this! Every study session is a step toward your dreams!",
                "Today's effort is tomorrow's achievement. Let's make it count!",
                "You're building something amazing - keep going!",
                "The best time to plant a tree was 20 years ago. The second best time is now!"
            ],
            calm: [
                "Progress, not perfection. Every step forward is valuable.",
                "Trust the process. Your hard work will pay off.",
                "Take it one day at a time. You're doing better than you think.",
                "Growth happens in the quiet moments of consistent effort."
            ],
            challenging: [
                "Comfort zones are beautiful places, but nothing ever grows there.",
                "The difference between ordinary and extraordinary is that little extra.",
                "Don't limit your challenges. Challenge your limits.",
                "What you get by achieving your goals is not as important as what you become."
            ]
        },
        academic: {
            encouraging: [
                "Knowledge is power, and you're gaining it every day.",
                "Your brain is like a muscle - the more you use it, the stronger it gets.",
                "Every concept you master opens doors to new possibilities.",
                "Education is the key to unlocking your potential."
            ],
            energetic: [
                "Your mind is expanding with every study session!",
                "You're not just learning - you're growing!",
                "Knowledge is your superpower! Keep building it!",
                "Every equation solved, every concept understood - you're leveling up!"
            ],
            calm: [
                "Learning is a journey, not a destination. Enjoy the process.",
                "Your academic growth is a testament to your dedication.",
                "Each study session is an investment in your future.",
                "Wisdom comes from experience, and you're gaining both."
            ],
            challenging: [
                "The mind is not a vessel to be filled, but a fire to be kindled.",
                "Challenge your assumptions, question everything, grow stronger.",
                "Your potential is limitless - don't let comfort hold you back.",
                "Great minds discuss ideas; average minds discuss events; small minds discuss people."
            ]
        }
    };
    
    const typeMotivations = motivations[type] || motivations.general;
    const toneMotivations = typeMotivations[tone] || typeMotivations.encouraging;
    const randomMotivation = toneMotivations[Math.floor(Math.random() * toneMotivations.length)];
    
    motivationText.textContent = randomMotivation;
}

function saveMotivation() {
    const savedMotivations = JSON.parse(localStorage.getItem('savedMotivations') || '[]');
    savedMotivations.push({
        text: motivationText.textContent,
        date: new Date().toISOString(),
        type: motivationType.value,
        tone: motivationTone.value
    });
    localStorage.setItem('savedMotivations', JSON.stringify(savedMotivations));
    alert('Motivation saved!');
}

function loadSavedMotivations() {
    const savedMotivations = JSON.parse(localStorage.getItem('savedMotivations') || '[]');
    // Could display saved motivations in a separate section
}

// Progress Tracking
function updateProgress() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!progressData.dailyActivity[today]) {
        progressData.dailyActivity[today] = {
            hours: 0,
            tasks: 0,
            pomodoros: 0
        };
    }
    
    progressData.dailyActivity[today].pomodoros++;
    progressData.dailyActivity[today].hours += 0.42; // 25 minutes = 0.42 hours
    
    progressData.totalHours += 0.42;
    progressData.studyDays = Object.keys(progressData.dailyActivity).length;
    
    // Calculate streak
    calculateStreak();
    
    saveData();
    updateProgressDisplay();
}

function calculateStreak() {
    const dates = Object.keys(progressData.dailyActivity).sort();
    let streak = 0;
    const today = new Date();
    
    for (let i = dates.length - 1; i >= 0; i--) {
        const date = new Date(dates[i]);
        const diffTime = Math.abs(today - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= streak + 1) {
            streak++;
        } else {
            break;
        }
    }
    
    progressData.currentStreak = streak;
}

function updateProgressDisplay() {
    studyDaysDisplay.textContent = progressData.studyDays;
    totalHoursDisplay.textContent = progressData.totalHours.toFixed(1);
    tasksCompletedDisplay.textContent = progressData.tasksCompleted;
    currentStreakDisplay.textContent = progressData.currentStreak;
}

function createActivityHeatmap() {
    const heatmap = document.getElementById('activity-heatmap');
    heatmap.innerHTML = '';
    
    // Create 7x7 grid for weekly activity
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            const day = document.createElement('div');
            day.className = 'heatmap-day';
            day.textContent = `${i+1}`;
            
            // Check if this day has activity
            const date = new Date();
            date.setDate(date.getDate() - (6-j) * 7 - (6-i));
            const dateStr = date.toISOString().split('T')[0];
            
            if (progressData.dailyActivity[dateStr]) {
                day.classList.add('active');
            }
            
            heatmap.appendChild(day);
        }
    }
}

function exportProgressData() {
    const dataStr = JSON.stringify(progressData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-progress.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

function resetProgressData() {
    if (confirm('Are you sure you want to reset all progress data? This cannot be undone.')) {
        progressData = {
            studyDays: 0,
            totalHours: 0,
            tasksCompleted: 0,
            currentStreak: 0,
            weeklyData: [],
            dailyActivity: {}
        };
        saveData();
        updateProgressDisplay();
        createActivityHeatmap();
    }
}

// Music Playlist
function selectMood(mood) {
    // Update active mood button
    moodButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === mood);
    });
    
    // Generate playlist based on mood
    generatePlaylist(mood);
}

function generatePlaylist(mood) {
    const playlists = {
        focused: {
            title: "Focus & Concentration",
            description: "Instrumental tracks to help you maintain deep focus",
            tracks: [
                { title: "Deep Focus", artist: "Study Music", duration: "3:45" },
                { title: "Concentration Flow", artist: "Brain Waves", duration: "4:20" },
                { title: "Mindful Study", artist: "Zen Sounds", duration: "3:30" },
                { title: "Academic Focus", artist: "Study Beats", duration: "4:15" },
                { title: "Mental Clarity", artist: "Focus Music", duration: "3:55" }
            ]
        },
        energetic: {
            title: "High Energy Study",
            description: "Upbeat tracks to boost your energy and motivation",
            tracks: [
                { title: "Power Study", artist: "Energy Boost", duration: "3:50" },
                { title: "Motivation Flow", artist: "Study Power", duration: "4:10" },
                { title: "Dynamic Focus", artist: "Energy Music", duration: "3:40" },
                { title: "Study Drive", artist: "Power Beats", duration: "4:25" },
                { title: "Energetic Mind", artist: "Study Energy", duration: "3:35" }
            ]
        },
        calm: {
            title: "Calm & Relaxed Study",
            description: "Peaceful tracks for stress-free studying",
            tracks: [
                { title: "Peaceful Study", artist: "Calm Sounds", duration: "4:00" },
                { title: "Tranquil Mind", artist: "Relaxation Music", duration: "3:55" },
                { title: "Serene Focus", artist: "Peaceful Beats", duration: "4:10" },
                { title: "Calm Concentration", artist: "Tranquil Study", duration: "3:45" },
                { title: "Mindful Relaxation", artist: "Calm Focus", duration: "4:20" }
            ]
        },
        creative: {
            title: "Creative Study Session",
            description: "Inspirational tracks for creative thinking",
            tracks: [
                { title: "Creative Flow", artist: "Inspiration Music", duration: "4:15" },
                { title: "Innovation Mind", artist: "Creative Beats", duration: "3:50" },
                { title: "Artistic Focus", artist: "Creative Study", duration: "4:05" },
                { title: "Imagination Flow", artist: "Creative Sounds", duration: "3:40" },
                { title: "Innovative Thinking", artist: "Creative Focus", duration: "4:30" }
            ]
        },
        motivated: {
            title: "Motivation Boost",
            description: "Inspiring tracks to keep you motivated",
            tracks: [
                { title: "Success Drive", artist: "Motivation Music", duration: "3:55" },
                { title: "Achievement Flow", artist: "Success Beats", duration: "4:20" },
                { title: "Goal Focus", artist: "Motivation Study", duration: "3:45" },
                { title: "Victory Mind", artist: "Success Sounds", duration: "4:10" },
                { title: "Triumph Focus", artist: "Motivation Flow", duration: "3:50" }
            ]
        },
        relaxed: {
            title: "Relaxed Study Mode",
            description: "Comfortable tracks for easy studying",
            tracks: [
                { title: "Easy Study", artist: "Comfort Music", duration: "4:05" },
                { title: "Gentle Focus", artist: "Relaxed Beats", duration: "3:40" },
                { title: "Smooth Study", artist: "Comfort Sounds", duration: "4:15" },
                { title: "Gentle Mind", artist: "Relaxed Study", duration: "3:50" },
                { title: "Comfortable Focus", artist: "Easy Flow", duration: "4:00" }
            ]
        }
    };
    
    const playlist = playlists[mood];
    if (!playlist) return;
    
    playlistTitle.textContent = playlist.title;
    playlistDescription.textContent = playlist.description;
    
    // Clear existing tracks
    playlistTracks.innerHTML = '';
    
    // Add tracks
    playlist.tracks.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item';
        trackElement.innerHTML = `
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-duration">${track.duration}</div>
        `;
        playlistTracks.appendChild(trackElement);
    });
}

function refreshPlaylist() {
    const activeMood = document.querySelector('.mood-btn.active');
    if (activeMood) {
        generatePlaylist(activeMood.dataset.mood);
    }
}

function savePlaylist() {
    const activeMood = document.querySelector('.mood-btn.active');
    if (!activeMood) {
        alert('Please select a mood first');
        return;
    }
    
    const savedPlaylists = JSON.parse(localStorage.getItem('savedPlaylists') || '[]');
    const playlist = {
        mood: activeMood.dataset.mood,
        title: playlistTitle.textContent,
        date: new Date().toISOString()
    };
    
    savedPlaylists.push(playlist);
    localStorage.setItem('savedPlaylists', JSON.stringify(savedPlaylists));
    alert('Playlist saved!');
}

function loadSavedPlaylists() {
    const savedPlaylists = JSON.parse(localStorage.getItem('savedPlaylists') || '[]');
    // Could display saved playlists in a separate section
}

// Data Management
function saveData() {
    localStorage.setItem('studySchedulerData', JSON.stringify({
        tasks,
        progressData,
        currentTime,
        timerMode,
        savedMotivations: JSON.parse(localStorage.getItem('savedMotivations') || '[]'),
        savedPlaylists: JSON.parse(localStorage.getItem('savedPlaylists') || '[]')
    }));
}

function loadData() {
    const savedData = localStorage.getItem('studySchedulerData');
    if (savedData) {
        const data = JSON.parse(savedData);
        tasks = data.tasks || [];
        progressData = data.progressData || progressData;
        currentTime = data.currentTime || currentTime;
        timerMode = data.timerMode || timerMode;
        
        // Restore tasks in timetable
        tasks.forEach(task => {
            if (task.day && task.startTime !== null) {
                placeTaskInTimetable(task);
                
                // Restore completed state
                if (task.completed) {
                    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                    if (taskElement) {
                        taskElement.classList.add('completed');
                    }
                }
            } else {
                // Recreate draggable tasks for unplaced tasks
                createDraggableTask(task);
            }
        });
        
        // Update timer display
        updateTimerDisplay();
    }
}

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
}