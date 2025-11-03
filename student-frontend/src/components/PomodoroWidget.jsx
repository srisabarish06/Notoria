import { useState, useEffect } from 'react';

const PomodoroWidget = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer finished
          setIsRunning(false);
          if (isBreak) {
            setMinutes(25);
            setIsBreak(false);
            alert('Break finished! Back to work!');
          } else {
            setMinutes(5);
            setIsBreak(true);
            alert('Pomodoro finished! Take a 5-minute break!');
          }
          setSeconds(0);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds, isBreak]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (isBreak) {
      setMinutes(5);
    } else {
      setMinutes(25);
    }
    setSeconds(0);
  };

  const formatTime = (min, sec) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">
        {isBreak ? 'Break Time' : 'Pomodoro Timer'}
      </h3>
      <div className="text-center">
        <div className="text-4xl font-bold mb-4 text-indigo-600">
          {formatTime(minutes, seconds)}
        </div>
        <div className="flex space-x-2 justify-center">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Pause
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroWidget;
