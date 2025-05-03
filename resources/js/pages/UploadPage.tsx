import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Camera, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

const UploadPage: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = (): void => {
        if (image) {
            setIsLoading(true);
            sessionStorage.setItem('capturedImage', image);
            setTimeout(() => {
                setIsLoading(false);
                router.visit('/results');
            }, 1000);
        }
    };

    const handleCameraCapture = (): void => {
        router.visit('/camera');
    };

    const clearImage = (): void => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout>
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                    <div className="mx-auto flex w-full max-w-md flex-col items-center">
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 text-4xl font-bold text-amber-900">Upload Whiskey</h1>
                            <p className="text-amber-700">Take a photo or upload an image of your whiskey bottle</p>
                        </div>

                        {image ? (
                            <div className="relative mb-6 aspect-[3/4] w-full max-w-md">
                                <img src={image} alt="Uploaded whiskey" className="h-full w-full rounded-lg object-contain" />
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full" onClick={clearImage}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="mb-6 flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-100/50 p-4">
                                <Upload className="mb-4 h-12 w-12 text-amber-600" />
                                <p className="mb-2 text-center text-amber-800">Drag and drop an image here or click to browse</p>
                                <p className="text-center text-sm text-amber-600">For best results, ensure the bottle label is clearly visible</p>
                            </div>
                        )}

                        <div className="flex w-full flex-col gap-3">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />

                            {!image ? (
                                <>
                                    <Button
                                        className="w-full bg-amber-600 text-white hover:bg-amber-700"
                                        size="lg"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-5 w-5" />
                                        Select Image
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full border-amber-600 text-amber-800 hover:bg-amber-100"
                                        size="lg"
                                        onClick={handleCameraCapture}
                                    >
                                        <Camera className="mr-2 h-5 w-5" />
                                        Take Photo
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full bg-amber-600 text-white hover:bg-amber-700"
                                    size="lg"
                                    onClick={handleUpload}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : 'Identify Whiskey'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default UploadPage;
