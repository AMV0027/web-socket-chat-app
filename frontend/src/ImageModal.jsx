import React from 'react';
import { IoIosCloseCircle } from "react-icons/io";
import { IoMdCloudDownload } from "react-icons/io";

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="relative">
                <img src={imageUrl} alt="Modal Content" className="max-h-screen max-w-screen" />
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 bg-red-500  text-white text-xl p-1 rounded hover:bg-red-600 "
                >
                    <IoIosCloseCircle />
                </button>
                <a
                    href={imageUrl}
                    download
                    className="absolute top-2 right-10 bg-blue-500 text-white p-1 text-xl rounded hover:bg-blue-700"
                >
                    <IoMdCloudDownload />
                </a>
            </div>
        </div>
    );
};

export default ImageModal;
