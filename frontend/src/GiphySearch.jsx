import React, { useEffect, useState } from 'react';

const GiphySearch = ({ onSelectGif }) => {
    const [gifs, setGifs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (searchTerm) {
            fetch(`https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_API_KEY}&q=${searchTerm}&limit=20`)
                .then(response => response.json())
                .then(data => setGifs(data.data));
        }
    }, [searchTerm]);

    return (
        <div className="w-full md:w-[700px] h-auto mx-auto backdrop-blur-xl bg-black bg-opacity-40 rounded-3xl p-2 max-h-[50vh] overflow-y-scroll">
            <input
                type="text"
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="backdrop-blur-xl bg-opacity-40 rounded-3xl p-2 w-full h-full"
            />
            <div className="flex-wrap flex flex-row items-center justify-center gap-2 mt-2">
                {gifs.map((gif) => (
                    <img
                        key={gif.id}
                        src={gif.images.fixed_height_small.url}
                        alt={gif.title}
                        className="cursor-pointer hover:opacity-75"
                        onClick={() => onSelectGif(gif.images.fixed_height.url)} // Call the callback with the GIF URL
                    />
                ))}
            </div>
        </div>
    );
};

export default GiphySearch;
