const ImageUpload = ({ onSend }) => {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onSend(reader.result); // Send the base64 string
            };
            reader.readAsDataURL(file); // Convert to base64
        }
    };

    return (
        <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
        />
    );
};
