import React from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="relative">
                <img src={imageUrl} alt="Modal Content" className="max-h-screen max-w-screen" />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded hover:bg-red-700"
                >
                    Close
                </button>
                <a
                    href={imageUrl}
                    download
                    className="absolute bottom-4 right-4 bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                    Download
                </a>
            </div>
        </div>
    );
};

export default ImageModal;
