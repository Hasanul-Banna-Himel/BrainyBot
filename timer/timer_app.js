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
    const quoteDisplay = document.getElementById('motivationalQuote'); // <-- Get quote element

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

    // --- NEW: Motivational Quotes ---
    const motivationalQuotes = [
      "The expert in anything was once a beginner.",
      "Focus on progress, not perfection.",
      "Study hard, do good, and the good life will follow.",
      "Success is the sum of small efforts, repeated day in and day out.",
      "Don't watch the clock; do what it does. Keep going.",
      "Believe you can and you're halfway there.",
      "The only way to learn is to do.",
      "The beautiful thing about learning is that no one can take it away from you.",
      "Push yourself, because no one else is going to do it for you.",
      "Your future is created by what you do today, not tomorrow.",
      "It always seems impossible until it's done.",
      "Learning is a treasure that will follow its owner everywhere.",
      "Strive for progress, not perfection.",
      "The secret to getting ahead is getting started.",
      "Don't let what you cannot do interfere with what you can do.",
      "Wake up with determination. Go to bed with satisfaction.",
      "Small steps in the right direction are better than big steps in the wrong direction.",
      "The pain you feel today will be the strength you feel tomorrow."
    ];
    let lastQuoteIndex = -1; // To avoid showing the same quote twice in a row
    let quoteInterval;

    function updateMotivationalQuote() {
      if (!quoteDisplay) return; // Safety check

      let randomIndex;
      // Prevent immediate repetition if possible
      if (motivationalQuotes.length > 1) {
        do {
            randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        } while (randomIndex === lastQuoteIndex);
      } else {
          randomIndex = 0; // Handle case with only one quote
      }


      lastQuoteIndex = randomIndex;
      quoteDisplay.textContent = motivationalQuotes[randomIndex];
    }

    function startQuoteUpdater() {
        if (quoteInterval) {
            clearInterval(quoteInterval); // Clear existing interval if any
        }
        updateMotivationalQuote(); // Show a quote immediately
        quoteInterval = setInterval(updateMotivationalQuote, 60000); // Update every 60 seconds
    }
    // --- END: Motivational Quotes ---


    // Initialize from localStorage if available
    function initializeFromStorage() {
      if (localStorage.getItem('focusFlowSettings')) {
        const settings = JSON.parse(localStorage.getItem('focusFlowSettings'));
        focusNameInput.value = settings.focusName;
        focusDurationSelect.value = settings.focusDuration;
        breakDurationSelect.value = settings.breakDuration;
        sessionsCountSelect.value = settings.sessionsCount;

        // Update displays
        updateSettings(); // Call this after loading to apply settings
      } else {
         // If no saved settings, apply default values from HTML
         updateSettings();
      }

      if (localStorage.getItem('focusFlowStats')) {
        const stats = JSON.parse(localStorage.getItem('focusFlowStats'));
        // Ensure values are numbers or empty arrays if corrupted/missing
        totalFocusTime = Number(stats.totalFocusTime) || 0;
        completedSessions = Number(stats.completedSessions) || 0;
        sessionHistory = Array.isArray(stats.sessionHistory) ? stats.sessionHistory : [];

        // Update stats display
        updateStatsDisplay();
      } else {
        // Initialize stats display if nothing in storage
        updateStatsDisplay();
      }
    }

    // Save settings
    function saveSettings() {
      const settings = {
        focusName: focusNameInput.value || "Focus", // Add default if empty
        focusDuration: focusDurationSelect.value,
        breakDuration: breakDurationSelect.value,
        sessionsCount: sessionsCountSelect.value
      };

      localStorage.setItem('focusFlowSettings', JSON.stringify(settings));
      updateSettings(); // Apply the saved settings immediately
      alert('Settings saved!'); // Optional feedback
    }

    // Update settings in the app
    function updateSettings() {
      currentFocus.textContent = focusNameInput.value || "Focus"; // Use default if empty
      focusTimeDisplay.textContent = focusDurationSelect.value;
      breakTimeDisplay.textContent = breakDurationSelect.value;

      focusDuration = parseInt(focusDurationSelect.value) * 60;
      breakDuration = parseInt(breakDurationSelect.value) * 60;
      totalSessions = parseInt(sessionsCountSelect.value);

      // Only reset the timer if it's not currently running or paused
      // Prevents losing progress if settings are changed mid-session
      if (!timerRunning && !isPause) {
         resetTimer();
      } else {
         // If running/paused, just update the display and total session count for the current cycle
         timeRemaining = focusDuration; // Reset time only if NOT running/paused? Or update on next cycle? Let's reset for now.
         updateTimerDisplay();
         currentSession.textContent = `${currentSessionNum}/${totalSessions}`;
         // Maybe show a message that changes apply to next session? For now, it resets.
      }
    }

    // Format time as MM:SS
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.max(0, seconds % 60); // Ensure seconds don't go below 0
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Update timer display
    function updateTimerDisplay() {
      timerDisplay.textContent = formatTime(timeRemaining);

      // Update progress bar
      const totalTime = isBreak ? breakDuration : focusDuration;
      // Prevent division by zero and handle completed state
      let progress = 0;
      if (totalTime > 0 && timeRemaining >= 0) {
         progress = 100 - ((timeRemaining / totalTime) * 100);
      } else if (timeRemaining < 0) {
         progress = 100; // Ensure bar is full when timer hits 0
      }
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`; // Clamp between 0 and 100

      // Update session display
      currentSession.textContent = `${currentSessionNum}/${totalSessions}`;
      // Update status text (handle paused state separately)
      if (!isPause) {
        sessionStatus.textContent = timerRunning ? (isBreak ? 'Break' : 'Focusing') : 'Ready';
      } else {
        sessionStatus.textContent = 'Paused';
      }
    }

    // Start timer
    function startTimer() {
       // Handle resuming from pause
       if (isPause) {
           pauseTimer(); // Call pauseTimer to handle resume logic
           return;
       }

      if (!timerRunning) {
        // Determine initial time based on whether it's a focus or break session
        timeRemaining = isBreak ? breakDuration : focusDuration;

        startTime = new Date().getTime();
        totalPauseTime = 0; // Reset pause time for the new interval
        timerRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        pauseBtn.textContent = 'Pause'; // Ensure pause button text is correct

        // Initial display update
        sessionStatus.textContent = isBreak ? 'Break' : 'Focusing';
        updateTimerDisplay();

        timer = setInterval(() => {
          // Calculate elapsed time accurately, accounting for potential JS delays
          const currentTime = new Date().getTime();
          const elapsedTime = Math.floor((currentTime - startTime - totalPauseTime) / 1000);
          timeRemaining = (isBreak ? breakDuration : focusDuration) - elapsedTime;


          if (timeRemaining <= 0) {
            clearInterval(timer);
            timerRunning = false; // Stop the timer flag

            // Play sound
             try {
                 const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLHPM7tCSQQ8Vesfp0KdwPRVVt+nYvaR8TRZqwvDe0LWVZRlmzvfi6cv/fWF84fvm8d0Yd2F85fvn990YdmJ743vu99wZdGF63nrs99wfcWB53Hrq+d0hcF953n7u/d4lb1555nrq/eAobF145nrs++EobV154X3u/OMrb1x34X3s/+crbF142oDwAOktbVx43H/tAOktZlp14XvoAuktXlV251/2AO5bSjhLhd+0AN0vNzFNk/O+ANo6RkJQiuO8AM0zRUFNiue6AMgyR0BMjueqAMErTj9KkOmnALwpUEBKkeunALwqUEBKk+enALsnU0FLl+eqALkoVEFLl+msALwpU0FLl+ilAL0pVEJKmOioALcoVUJKmOqmALYoVUNLmOylALwpV0NMlu2jALopWURNluyjALooOV3wnfJgACsQEF//0vqUAD0ZG1v7yPeiAEAWHFQa0/q3AEoRFkoRx+7EAE8VIVcOzPLLAFEaJVkQy/DMAFUaJlwRzfDPAFYdJ1wTz/DQAFYeKl0T0PDRAF0jLGET0PDTAF0jL2MT0PPUAF0kL2MT0fTTAF4lMGMT0fXSAF8lMmYU0vbRAGAlMmYV0vfSAGEnMmYV0vfRAGEnNGgV0vfRAGMoNmgW0/fRAGMoNmkX0/fRAGUpN2kX0/fSAGUqOGoY0/fSAGYqOWsY0/bSAGcqOW0Z1vbVAGcsOm0a1vfTAGgsOm4a1/fUAGgvO28a1/fUAGkwPXAc2PbUAGsxPXEd2PfTAGwyPnId2fbUAG4zP3Qe2ffUAG8zQHUf2vfVAG81QXYg2/fVAHE3Qnch2/fVAHI3Qngh2/jVAHM4RHki2/jVAHQ5Rnoi3PjVAHU6R3sj3PjRAHY7SHwk3fnRAHc8SX0l3vnRAHg9Sn4l3/nRAHk+S34m3/nRAHk/TH8n4PnRAHo/S4M28/fMAHRJS4BGzvDLAHBJRn0/yfDLAGxJRH40xO/JAGdIP3suxO3GAGBKPHkpv+vBAFtKOXUkv+i9AFdLNnIgv+W8AFVLNXEdvuO6AFJLMm8avOK6AE9ML24XvN+4AE1NL20Uu9+4AExNLmsRuNu4AEhOLmkQtdu5AEVPLWcPtdm5AENQLWUOtNm5AEBQLGQNtNi5AD5RK2MNtNi5AD1SK2MLs9e5ADpTK2ILs9e6ADdUKmELs9i5ADVVKmMKtNi7ADRWKmUKtdi7ADNXKmYLtdq9ADJYKmgLtdi9ADJYKWkMtdm+ADJZKWsMtti+ADBaKW0Ntdi/AC9bKm4Ntdm/AC5cKm8Ottm/AC1dKnENtti/ACxeKnINttm/ACpfKnQOt9nAACpgKnUOt9e/ACpgKXYPtdbAAChhKXgPtdXBACdhKnkPtdbCACdkKnoQttjEACdkKnsQttnFACZlKXwRttrFACZnKn0StdrFACZnK34StNnFACZnK34StNnFACZnK34UtNnFACZnK4AUtdvGACVpKoEVuNzIACNqKoIVuNvIACNsKoMVuNrIACNsKYQWuNvIACJtKYUWudvIACJuKYYXudvIACJuKYYYudvIACJuKocZutzJACJvKogautzJACJvKokbut3KACJwKokbut7LACJwKoobuuDNACJxK4obuuDNACJxK4sbu+DOACJxK4wcu+HPACFyK4wdvOLQACFzKosfvOHQACF0KowfveHQACF0Ko0fveLRACB1KY4gvuXSACB1KI4hvuXRACB2KI8hvubRACB2KJAivufSACB3KJEjv+fSACB3KJIlv+fTACB3J5MnwOjUACB4J5Qnxe3ZAB56J5YpyfDbAB57J5ww0PXfAB99J54x0fbgACB+KqE10vbgACB/KqI30vXgAB+AKqI50vXgAB+AKaM5z/XeAB+BKaM6z/TeAB+BKaQ7z/TeAB+BBqQ7z/TeAB+B');
                 audio.play().catch(e => console.warn("Audio play failed:", e)); // Catch potential errors
             } catch (e) {
                 console.error("Error playing audio:", e);
             }

            if (isBreak) {
              // End of break
              isBreak = false;
              if (currentSessionNum < totalSessions) {
                currentSessionNum++;
                sessionStatus.textContent = 'Ready';
                startBtn.disabled = false; // Ready for next focus
                pauseBtn.disabled = true;
                resetBtn.disabled = true; // Reset possible only when ready
                timeRemaining = focusDuration; // Prepare for next focus
              } else {
                // All sessions completed
                completeAllSessions();
              }
            } else {
              // End of focus session
              completeSession(); // Log stats for completed focus session
              isBreak = true;
              timeRemaining = breakDuration; // Prepare for break
              startTimer(); // Automatically start break
            }
          }

          // Only update display if timer is still supposed to be running
          // Avoids display updates after interval cleared but before function exits
           if(timerRunning) {
              updateTimerDisplay();
           }
        }, 250); // Check time more frequently for smoother display/progress
      }
    }

    // Complete a session (called after a focus period ends)
    function completeSession() {
        // Calculate actual focus time (use the configured duration)
        const sessionTime = parseInt(focusDurationSelect.value); // Log the intended duration
        totalFocusTime += sessionTime;
        completedSessions++; // Count completed focus sessions

        // Add to history
        const now = new Date();
        sessionHistory.unshift({
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: sessionTime, // Log intended duration
            name: focusNameInput.value || "Focus" // Use default if empty
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
      sessionStatus.textContent = 'All Done!';
      timerRunning = false;
      isBreak = false; // Ensure not stuck in break state
      startBtn.disabled = false; // Allow starting a new cycle
      startBtn.textContent = 'Start New'; // Optional: Change button text
      resetBtn.disabled = false; // Allow reset
      pauseBtn.disabled = true;
      timeRemaining = focusDuration; // Reset display for next potential start
      updateTimerDisplay(); // Update display to show final state
       alert("Congratulations! All sessions completed."); // Notify user
    }

    // Pause timer / Resume timer
    function pauseTimer() {
        if (timerRunning && !isPause) {
            // Pausing
            clearInterval(timer);
            isPause = true;
            pauseStartTime = new Date().getTime(); // Record when pause started
            pauseBtn.textContent = 'Resume';
            sessionStatus.textContent = 'Paused';
            startBtn.disabled = true; // Disable start while paused
        } else if (timerRunning && isPause) {
            // Resuming
            const pauseDuration = new Date().getTime() - pauseStartTime;
            totalPauseTime += pauseDuration; // Add the duration of this pause
            isPause = false;
            pauseBtn.textContent = 'Pause';
            sessionStatus.textContent = isBreak ? 'Break' : 'Focusing'; // Restore status
            startBtn.disabled = true; // Keep start disabled while running

            // Re-calculate remaining time based on when it should finish
             const targetEndTime = startTime + (isBreak ? breakDuration : focusDuration) * 1000 + totalPauseTime;
             timeRemaining = Math.ceil((targetEndTime - new Date().getTime()) / 1000);

             // Restart the interval - Call startTimer logic without resetting times
             timer = setInterval(() => {
                const currentTime = new Date().getTime();
                const elapsedTime = Math.floor((currentTime - startTime - totalPauseTime) / 1000);
                timeRemaining = (isBreak ? breakDuration : focusDuration) - elapsedTime;


                if (timeRemaining <= 0) {
                  clearInterval(timer);
                  timerRunning = false; // Stop the timer flag

                   // Play sound
                   try {
                       const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLHPM7tCSQQ8Vesfp0KdwPRVVt+nYvaR8TRZqwvDe0LWVZRlmzvfi6cv/fWF84fvm8d0Yd2F85fvn990YdmJ743vu99wZdGF63nrs99wfcWB53Hrq+d0hcF953n7u/d4lb1555nrq/eAobF145nrs++EobV154X3u/OMrb1x34X3s/+crbF142oDwAOktbVx43H/tAOktZlp14XvoAuktXlV251/2AO5bSjhLhd+0AN0vNzFNk/O+ANo6RkJQiuO8AM0zRUFNiue6AMgyR0BMjueqAMErTj9KkOmnALwpUEBKkeunALwqUEBKk+enALsnU0FLl+eqALkoVEFLl+msALwpU0FLl+ilAL0pVEJKmOioALcoVUJKmOqmALYoVUNLmOylALwpV0NMlu2jALopWURNluyjALooOV3wnfJgACsQEF//0vqUAD0ZG1v7yPeiAEAWHFQa0/q3AEoRFkoRx+7EAE8VIVcOzPLLAFEaJVkQy/DMAFUaJlwRzfDPAFYdJ1wTz/DQAFYeKl0T0PDRAF0jLGET0PDTAF0jL2MT0PPUAF0kL2MT0fTTAF4lMGMT0fXSAF8lMmYU0vbRAGAlMmYV0vfSAGEnMmYV0vfRAGEnNGgV0vfRAGMoNmgW0/fRAGMoNmkX0/fRAGUpN2kX0/fSAGUqOGoY0/fSAGYqOWsY0/bSAGcqOW0Z1vbVAGcsOm0a1vfTAGgsOm4a1/fUAGgvO28a1/fUAGkwPXAc2PbUAGsxPXEd2PfTAGwyPnId2fbUAG4zP3Qe2ffUAG8zQHUf2vfVAG81QXYg2/fVAHE3Qnch2/fVAHI3Qngh2/jVAHM4RHki2/jVAHQ5Rnoi3PjVAHU6R3sj3PjRAHY7SHwk3fnRAHc8SX0l3vnRAHg9Sn4l3/nRAHk+S34m3/nRAHk/TH8n4PnRAHo/S4M28/fMAHRJS4BGzvDLAHBJRn0/yfDLAGxJRH40xO/JAGdIP3suxO3GAGBKPHkpv+vBAFtKOXUkv+i9AFdLNnIgv+W8AFVLNXEdvuO6AFJLMm8avOK6AE9ML24XvN+4AE1NL20Uu9+4AExNLmsRuNu4AEhOLmkQtdu5AEVPLWcPtdm5AENQLWUOtNm5AEBQLGQNtNi5AD5RK2MNtNi5AD1SK2MLs9e5ADpTK2ILs9e6ADdUKmELs9i5ADVVKmMKtNi7ADRWKmUKtdi7ADNXKmYLtdq9ADJYKmgLtdi9ADJYKWkMtdm+ADJZKWsMtti+ADBaKW0Ntdi/AC9bKm4Ntdm/AC5cKm8Ottm/AC1dKnENtti/ACxeKnINttm/ACpfKnQOt9nAACpgKnUOt9e/ACpgKXYPtdbAAChhKXgPtdXBACdhKnkPtdbCACdkKnoQttjEACdkKnsQttnFACZlKXwRttrFACZnKn0StdrFACZnK34StNnFACZnK34StNnFACZnK34UtNnFACZnK4AUtdvGACVpKoEVuNzIACNqKoIVuNvIACNsKoMVuNrIACNsKYQWuNvIACJtKYUWudvIACJuKYYXudvIACJuKYYYudvIACJuKocZutzJACJvKogautzJACJvKokbut3KACJwKokbut7LACJwKoobuuDNACJxK4obuuDNACJxK4sbu+DOACJxK4wcu+HPACFyK4wdvOLQACFzKosfvOHQACF0KowfveHQACF0Ko0fveLRACB1KY4gvuXSACB1KI4hvuXRACB2KI8hvubRACB2KJAivufSACB3KJEjv+fSACB3KJIlv+fTACB3J5MnwOjUACB4J5Qnxe3ZAB56J5YpyfDbAB57J5ww0PXfAB99J54x0fbgACB+KqE10vbgACB/KqI30vXgAB+AKqI50vXgAB+AKaM5z/XeAB+BKaM6z/TeAB+BKaQ7z/TeAB+BBqQ7z/TeAB+B');
                       audio.play().catch(e => console.warn("Audio play failed:", e)); // Catch potential errors
                   } catch (e) {
                       console.error("Error playing audio:", e);
                   }

                  if (isBreak) {
                    // End of break
                    isBreak = false;
                    if (currentSessionNum < totalSessions) {
                      currentSessionNum++;
                      sessionStatus.textContent = 'Ready';
                      startBtn.disabled = false; // Ready for next focus
                      pauseBtn.disabled = true;
                      resetBtn.disabled = true;
                       timeRemaining = focusDuration;
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

                if(timerRunning) {
                   updateTimerDisplay();
                }
              }, 250); // Use the same interval frequency
        }
    }

    // Reset timer
    function resetTimer() {
      clearInterval(timer);
      timerRunning = false;
      isPause = false;
      isBreak = false;
      currentSessionNum = 1;
      totalPauseTime = 0; // Reset total pause time on full reset
      timeRemaining = focusDuration; // Reset to initial focus duration from settings
      startBtn.disabled = false;
      startBtn.textContent = 'Start'; // Reset button text if changed
      pauseBtn.disabled = true;
      resetBtn.disabled = true;
      pauseBtn.textContent = 'Pause';
      sessionStatus.textContent = 'Ready';
      updateTimerDisplay(); // Update display immediately
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
        historyContainer.innerHTML = ''; // Clear previous items
        sessionHistory.forEach(session => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          // Ensure session properties exist before accessing
          const name = session.name || "Unnamed";
          const duration = session.duration || "?";
          const date = session.date || "";
          const time = session.time || "";
          historyItem.innerHTML = `
            <div>${name} (${duration} min)</div>
            <div>${date} ${time}</div>
          `;
          historyContainer.appendChild(historyItem);
        });
      } else {
          // Show placeholder if history is empty
           historyContainer.innerHTML = '<div class="history-item"><div>No sessions recorded yet</div></div>';
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
    initializeFromStorage(); // Load settings and stats first
    // updateTimerDisplay(); // Update display based on loaded/default settings (called within initialize)
    startQuoteUpdater(); // Start the quote rotation