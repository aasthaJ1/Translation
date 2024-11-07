import React, { useState, useEffect, useRef } from 'react';
import { MdOutlineSettingsVoice } from "react-icons/md";
import './App.css';
import { io } from 'socket.io-client'; // WebSocket client

const App = () => {
  const [recognizedText, setRecognizedText] = useState(''); // For Kannada text
  const [translatedText, setTranslatedText] = useState(''); // For English translation
  const [error, setError] = useState(''); // For displaying error messages
  const [isRecognitionActive, setIsRecognitionActive] = useState(false); // To track if recognition is active

  const recognitionRef = useRef(null); // Use a ref to store the recognition object
  const socket = io('http://localhost:5000', {
    autoConnect: true,
    transports: ['websocket'], // Use WebSocket transport
    logLevel: 1 // Reduce logging output (1 = errors only)
  });

  useEffect(() => {
    socket.on('translatedText', (data) => {
      setTranslatedText(data.englishText); // Assuming server sends { englishText: "..." }
    });
    return () => {
      socket.off('translatedText');
    };
  }, []);

  const startSpeechRecognition = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'kn-IN'; // Set to Kannada language
    recognition.continuous = true; // Keep listening until the user stops
    recognition.interimResults = true; // Show intermediate results

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }

      setRecognizedText(currentText); // Display Kannada text
      socket.emit('translate', { hindiText: currentText }); // Keep sending as hindiText for translation server
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (isRecognitionActive) {
        recognition.start(); // Restart if still active
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecognitionActive(true); // Mark recognition as active
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Stop the recognition
      setIsRecognitionActive(false); // Mark recognition as inactive
    }
  };

  return (
<div className="flex items-center justify-center h-screen p-4 overflow-auto bg-grey-400">
  <div className="flex flex-col w-full h-[40rem] max-w-screen-xl border-2 border-black shadow-lg md:flex-row">
    <div className="relative flex flex-col flex-1 h-full p-4 text-center rounded-t-lg md:rounded-l-lg">
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <textarea
        value={recognizedText}
        placeholder="Speak in Kannada"
        className="flex-grow w-full p-2 mb-4 overflow-y-auto border rounded-md h-44"
        readOnly
      />
      {!isRecognitionActive ? (
        <button
          className="p-3 mx-auto mb-10 text-white bg-blue-500 rounded-full cursor-pointer"
          onClick={startSpeechRecognition}
        >
          <MdOutlineSettingsVoice className="text-4xl" />
        </button>
      ) : (
        <button
          className="p-3 mx-auto mb-10 text-white bg-red-500 rounded-full cursor-pointer"
          onClick={stopSpeechRecognition}
        >
          <MdOutlineSettingsVoice className="text-4xl" />
        </button>
      )}
      <p>{isRecognitionActive ? 'Recognition is Active. Click to Stop.' : 'Click to Start Recognition'}</p>
    </div>

    <div className="w-full h-2 my-auto border-t-2 border-black md:hidden"></div> {/* Horizontal divider on small screens */}
    <div className="hidden w-2 h-full my-auto border-l-2 border-black md:block"></div> {/* Vertical divider on medium and larger screens */}

    {/* Right Section - Translated English Text */}
    <div className="flex flex-col flex-1 h-full p-4 text-center rounded-b-lg md:rounded-r-lg">
      <textarea
        value={translatedText}
        placeholder="Translation in English"
        className="flex-grow w-full p-2 mb-4 overflow-y-auto border rounded-md h-36"
        readOnly
      />
    </div>
  </div>
</div>


  );
};

export default App;
