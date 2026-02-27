export const resizeImage = (file: File, ratio: number = 0.5): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;

                canvas.width = newWidth;
                canvas.height = newHeight;

                ctx?.drawImage(img, 0, 0, newWidth, newHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: file.type || "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error("Canvas to Blob failed"));
                    }
                }, file.type || "image/jpeg", 0.9); // 0.9 quality
            };
            img.onerror = () => reject(new Error("Failed to load image"));
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
    });
};
