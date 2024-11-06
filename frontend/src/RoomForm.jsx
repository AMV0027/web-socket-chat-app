import React from 'react';
import bg from './assets/bg-m.jpg';

const RoomForm = ({ room, setRoom, nextStep, username }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (room) {
            nextStep();
        }
    };

    const handleGlobalChat = () => {
        setRoom("global");
        nextStep();
    }

    return (
        <div className="shadow-xl w-full md:w-[700px] h-screen text-white flex flex-col justify-end items-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${bg})` }}>

            <form onSubmit={handleSubmit} className='flex flex-col justify-start p-5 bg-zinc-900 w-full h-1/2 rounded-t-3xl'>
                <h2 className="text-4xl font-inter leading-[60px] mb-2  font-semibold">
                    Create/Enter Room Code.
                </h2>
                <p>
                    Or try global chat 👉 <button className='underline text-blue-400' onClick={handleGlobalChat}>Global chat</button>
                </p>
                <input
                    className="border p-2 mb-2 w-full rounded-xl mt-6 text-black"
                    placeholder="Room Code"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button
                    className="bg-gradient-to-tr w-full from-blue-800 to-blue-400 text-white font-semibold p-2 rounded-xl"
                    type="submit"
                >
                    Join Chat
                </button>
                <a href="https://www.linkedin.com/in/arunmozhi-varman-2565b3266/" target='blank'
                    className='text-center font-inter mt-12 font-extralight italic text-gray-500 underline'>
                    made by Arunmozhi varman
                </a>
            </form>
        </div>
    );
};

export default RoomForm;
