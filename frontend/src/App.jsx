import React, { useState } from 'react';
import ChatRoom from './ChatRoom';
import RoomForm from './RoomForm';
import UsernameForm from './UsernameForm';

const App = () => {
  const [step, setStep] = useState(0); // 0: Username, 1: Room, 2: Chat
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  return (
    <div className='bg-black flex flex-row justify-center items-center'>
      {step === 0 && (
        <UsernameForm
          username={username}
          setUsername={setUsername}
          nextStep={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <RoomForm
          room={room}
          setRoom={setRoom}
          nextStep={() => setStep(2)}
          username={username}
        />
      )}
      {step === 2 && (
        <ChatRoom
          username={username}
          room={room}
        />
      )}
    </div>
  );
};

export default App;
