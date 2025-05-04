import Camera from '@/components/Camera';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/AppLayout';
import { cacheModelAssets, DownloadProgress, isModelCached } from '@/lib/cache-assets';
import { Link, router } from '@inertiajs/react';
import { Download, History, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const CapturePage: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ loaded: number; total: number; assetName: string } | null>(null);
    const [isCached, setIsCached] = useState<boolean>(true);

    useEffect(() => {
        const checkCached = async () => {
            const cached = await isModelCached();
            setIsCached(cached);
        };
        checkCached();
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        setProgress(null);
        try {
            await cacheModelAssets((progress: DownloadProgress, assetName: string) => {
                setProgress({ ...progress, assetName });
            });
            toast.success('Model assets downloaded', {
                description: 'You can now identify whiskeys offline.',
            });
            setIsCached(true);
        } catch (error) {
            toast.error('Download failed', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setDownloading(false);
            setProgress(null);
        }
    };

    const handleCapture = (dataUrl: string) => {
        setImage(dataUrl);
        sessionStorage.setItem('capturedImage', dataUrl);
    };

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Invalid file type', {
                description: 'Please upload a JPEG or PNG image.',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', {
                description: 'Please upload an image smaller than 5MB.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setImage(dataUrl);
            sessionStorage.setItem('capturedImage', dataUrl);
        };
        reader.onerror = () => {
            toast.error('Failed to read file', {
                description: 'Please try another image.',
            });
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = () => {
        if (image) {
            router.visit('/results');
        } else {
            toast.error('No image selected', {
                description: 'Please capture or upload an image first.',
            });
        }
    };

    const handleChangeImage = () => {
        setImage(null);
        sessionStorage.removeItem('capturedImage');
    };

    return (
        <AppLayout title='Capture'>
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 text-4xl font-bold text-amber-900">Whiskey Goggles</h1>
                            <p className="text-amber-700">Snap, identify, and catalog your whiskey collection</p>
                            <p className="mt-2 text-sm text-amber-600">All inference is performed locally on your device to save costs.</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            {downloading && progress && (
                                <div className="mb-4 w-full">
                                    <p className="mb-2 text-sm text-amber-700">Downloading {progress.assetName}...</p>
                                    <Progress
                                        value={progress.total > 0 ? (progress.loaded / progress.total) * 100 : undefined}
                                        className="h-2 w-full"
                                    />
                                </div>
                            )}
                            {!isCached && !downloading && (
                                <Button
                                    className="mb-4 w-full cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                                    disabled={downloading}
                                    onClick={handleDownload}
                                    size="lg"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    Download Model
                                </Button>
                            )}

                            {image ? (
                                <div className="w-full">
                                    <div className="relative mx-auto mb-4 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg">
                                        <img src={image} alt="Captured whiskey" className="h-full w-full object-contain" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 cursor-pointer border-amber-600 text-amber-800 hover:bg-amber-100"
                                            onClick={handleChangeImage}
                                            size="lg"
                                        >
                                            Change Image
                                        </Button>
                                        <Button
                                            className="flex-1 cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                                            onClick={handleAnalyze}
                                            size="lg"
                                        >
                                            Analyze
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Camera onCapture={handleCapture} />
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full cursor-pointer border-amber-600 text-amber-800 hover:bg-amber-100"
                                        asChild
                                        size="lg"
                                    >
                                        <label>
                                            <Upload className="mr-2 h-5 w-5" />
                                            Upload Image
                                            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUpload} />
                                        </label>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full cursor-pointer border-amber-600 text-amber-800 hover:bg-amber-100"
                                        size="lg"
                                    >
                                        <Link href="/history" className="flex h-full w-full items-center justify-center">
                                            <History className="mr-2 h-5 w-5" />
                                            View History
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default CapturePage;
