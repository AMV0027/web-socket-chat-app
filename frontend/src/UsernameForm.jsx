import React from 'react';
import bg from './assets/bg-m.jpg';
const UsernameForm = ({ username, setUsername, nextStep }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (username) {
            nextStep();
        }
    };

    return (
        <div className="shadow-xl w-full md:w-[700px] h-screen text-white flex flex-col justify-end items-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${bg})` }}>


            <form onSubmit={handleSubmit} className='flex flex-col justify-start p-5 bg-zinc-900 w-full h-1/2 rounded-t-3xl'>
                <h2 className='text-4xl md:text-5xl font-semibold md:w-[450px] font-inter leading-[60px] mb-2'>
                    It's easy talking to your friends with SocketChat
                </h2>
                <input
                    className="border p-2 mb-2 w-full rounded-xl mt-6 text-black"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button
                    className="bg-gradient-to-tr w-full from-blue-800 to-blue-400 text-white font-semibold p-2 rounded-xl 2"
                    type="submit"
                >
                    Start SocketChat
                </button>
                <a href="https://www.linkedin.com/in/arunmozhi-varman-2565b3266/" target='blank'
                    className='text-center font-inter mt-12 font-extralight italic text-gray-500 underline'>
                    made by Arunmozhi varman
                </a>
            </form>
        </div>
    );
};

export default UsernameForm;
