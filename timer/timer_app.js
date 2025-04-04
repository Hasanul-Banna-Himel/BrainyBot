// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const progressBar = document.getElementById('progressBar');
const currentSession = document.getElementById('currentSession');
const sessionStatus = document.getElementById('sessionStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const currentFocus = document.getElementById('currentFocus');
const focusTimeDisplay = document.getElementById('focusTime');
const breakTimeDisplay = document.getElementById('breakTime');
const saveSettingsBtn = document.getElementById('saveSettings');
const todayFocusTimeDisplay = document.getElementById('todayFocusTime');
const totalSessionsDisplay = document.getElementById('totalSessions');
const historyContainer = document.getElementById('historyContainer');

// Settings fields
const focusNameInput = document.getElementById('focusName');
const focusDurationSelect = document.getElementById('focusDuration');
const breakDurationSelect = document.getElementById('breakDuration');
const sessionsCountSelect = document.getElementById('sessionsCount');

// Tab navigation
const tabs = document.querySelectorAll('.tab');
const tabPanes = document.querySelectorAll('.tab-pane');

// Timer variables
let timer;
let timerRunning = false;
let isPause = false;
let isBreak = false;
let currentSessionNum = 1;
let totalSessions = 4;
let focusDuration = 25 * 60; // 25 minutes in seconds
let breakDuration = 5 * 60; // 5 minutes in seconds
let timeRemaining = focusDuration;
let startTime;
let pauseStartTime;
let totalPauseTime = 0;

// Statistics
let totalFocusTime = 0;
let completedSessions = 0;
let sessionHistory = [];

// Initialize from localStorage if available
function initializeFromStorage() {
  if (localStorage.getItem('focusFlowSettings')) {
    const settings = JSON.parse(localStorage.getItem('focusFlowSettings'));
    focusNameInput.value = settings.focusName;
    focusDurationSelect.value = settings.focusDuration;
    breakDurationSelect.value = settings.breakDuration;
    sessionsCountSelect.value = settings.sessionsCount;
    
    // Update displays
    updateSettings();
  }
  
  if (localStorage.getItem('focusFlowStats')) {
    const stats = JSON.parse(localStorage.getItem('focusFlowStats'));
    totalFocusTime = stats.totalFocusTime || 0;
    completedSessions = stats.completedSessions || 0;
    sessionHistory = stats.sessionHistory || [];
    
    // Update stats display
    updateStatsDisplay();
  }
}

// Save settings
function saveSettings() {
  const settings = {
    focusName: focusNameInput.value,
    focusDuration: focusDurationSelect.value,
    breakDuration: breakDurationSelect.value,
    sessionsCount: sessionsCountSelect.value
  };
  
  localStorage.setItem('focusFlowSettings', JSON.stringify(settings));
  updateSettings();
}

// Update settings in the app
function updateSettings() {
  currentFocus.textContent = focusNameInput.value;
  focusTimeDisplay.textContent = focusDurationSelect.value;
  breakTimeDisplay.textContent = breakDurationSelect.value;
  
  focusDuration = parseInt(focusDurationSelect.value) * 60;
  breakDuration = parseInt(breakDurationSelect.value) * 60;
  totalSessions = parseInt(sessionsCountSelect.value);
  
  resetTimer();
}

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
  
  // Update progress bar
  const totalTime = isBreak ? breakDuration : focusDuration;
  const progress = 100 - ((timeRemaining / totalTime) * 100);
  progressBar.style.width = `${progress}%`;
  
  // Update session display
  currentSession.textContent = `${currentSessionNum}/${totalSessions}`;
  sessionStatus.textContent = isBreak ? 'Break' : 'Focusing';
}

// Start timer
function startTimer() {
  if (!timerRunning) {
    startTime = new Date().getTime();
    totalPauseTime = 0;
    timerRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    timer = setInterval(() => {
      timeRemaining--;
      
      if (timeRemaining <= 0) {
        clearInterval(timer);
        
        // Play sound
        const audio = new Audio('notification.mp3');
        audio.play();
        
        if (isBreak) {
          // End of break
          isBreak = false;
          if (currentSessionNum < totalSessions) {
            currentSessionNum++;
            timeRemaining = focusDuration;
            sessionStatus.textContent = 'Ready';
            timerRunning = false;
            startBtn.disabled = false;
          } else {
            // All sessions completed
            completeAllSessions();
          }
        } else {
          // End of focus session
          completeSession();
          isBreak = true;
          timeRemaining = breakDuration;
          startTimer(); // Automatically start break
        }
      }
      
      updateTimerDisplay();
    }, 1000);
  }
}

// Complete a session
function completeSession() {
  // Calculate actual focus time
  const sessionTime = Math.floor((focusDuration - timeRemaining) / 60);
  totalFocusTime += sessionTime;
  completedSessions++;
  
  // Add to history
  const now = new Date();
  sessionHistory.unshift({
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: sessionTime,
    name: focusNameInput.value
  });
  
  // Limit history to 10 items
  if (sessionHistory.length > 10) {
    sessionHistory.pop();
  }
  
  // Save stats
  saveStats();
  
  // Update display
  updateStatsDisplay();
}

// Complete all sessions
function completeAllSessions() {
  sessionStatus.textContent = 'Completed';
  timerRunning = false;
  startBtn.disabled = false;
  resetBtn.disabled = false;
  pauseBtn.disabled = true;
}

// Pause timer
function pauseTimer() {
  if (timerRunning && !isPause) {
    clearInterval(timer);
    isPause = true;
    pauseStartTime = new Date().getTime();
    pauseBtn.textContent = 'Resume';
    sessionStatus.textContent = 'Paused';
  } else if (isPause) {
    // Calculate pause duration
    const pauseDuration = new Date().getTime() - pauseStartTime;
    totalPauseTime += pauseDuration;
    
    isPause = false;
    pauseBtn.textContent = 'Pause';
    sessionStatus.textContent = isBreak ? 'Break' : 'Focusing';
    startTimer();
  }
}

// Reset timer
function resetTimer() {
  clearInterval(timer);
  timerRunning = false;
  isPause = false;
  isBreak = false;
  currentSessionNum = 1;
  timeRemaining = focusDuration;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  sessionStatus.textContent = 'Ready';
  updateTimerDisplay();
}

// Save statistics
function saveStats() {
  const stats = {
    totalFocusTime: totalFocusTime,
    completedSessions: completedSessions,
    sessionHistory: sessionHistory
  };
  
  localStorage.setItem('focusFlowStats', JSON.stringify(stats));
}

// Update statistics display
function updateStatsDisplay() {
  todayFocusTimeDisplay.textContent = totalFocusTime;
  totalSessionsDisplay.textContent = completedSessions;
  
  // Update history
  if (sessionHistory.length > 0) {
    historyContainer.innerHTML = '';
    sessionHistory.forEach(session => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div>${session.name} (${session.duration} min)</div>
        <div>${session.date} ${session.time}</div>
      `;
      historyContainer.appendChild(historyItem);
    });
  }
}

// Tab navigation
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Set active tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show active content
    tabPanes.forEach(pane => pane.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
  });
});

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
saveSettingsBtn.addEventListener('click', saveSettings);

// Initialize
updateTimerDisplay();
initializeFromStorage();