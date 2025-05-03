import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { router } from '@inertiajs/react';
import { CameraIcon, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const Camera: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isActive, setIsActive] = useState<boolean>(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const { toast } = useToast();

    // Check camera availability on mount
    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices: MediaDeviceInfo[]) => {
                const videoDevices = devices.filter((device) => device.kind === 'videoinput');
                if (videoDevices.length > 0) {
                    startCamera();
                } else {
                    setHasPermission(false);
                    toast({
                        title: 'No camera found',
                        description: 'Please connect a camera or use the upload feature instead.',
                        variant: 'destructive',
                    });
                }
            })
            .catch((err: Error) => {
                console.error('Error checking devices:', err);
                setHasPermission(false);
                toast({
                    title: 'Camera access error',
                    description: 'Unable to access camera. Please check your device settings and try again.',
                    variant: 'destructive',
                });
            });
    }, []);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
        };
    }, [stream]);

    const startCamera = useCallback(async (): Promise<void> => {
        try {
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            const constraints = {
                video: {
                    facingMode,
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    aspectRatio: { ideal: 1 }, // Square for whiskey bottles
                },
                audio: false,
            };

            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                videoRef.current.play().catch((err) => console.error('Error playing video:', err));
            }

            setIsActive(true);
            setHasPermission(true);
        } catch (err: unknown) {
            console.error('Error accessing camera:', err);
            setHasPermission(false);
            toast({
                title: 'Camera access denied',
                description: 'Please enable camera permissions in your browser settings and try again.',
                variant: 'destructive',
            });
        }
    }, [facingMode, stream, toast]);

    const stopCamera = (): void => {
        if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            setStream(null);
        }
        setIsActive(false);
    };

    const toggleCamera = (): void => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
        if (isActive) {
            startCamera();
        }
    };

    const capturePhoto = (): void => {
        if (!videoRef.current || !canvasRef.current) {
            toast({
                title: 'Capture error',
                description: 'Camera is not ready. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        const video: HTMLVideoElement = videoRef.current;
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d');

        if (!context) {
            toast({
                title: 'Capture error',
                description: 'Unable to process image. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData: string = canvas.toDataURL('image/jpeg', 0.8);
        sessionStorage.setItem('capturedImage', imageData);
        router.visit('/results');
    };

    return (
        <div className="mx-auto">
            {!isActive ? (
                <div className="flex aspect-[3/4] max-w-[400px] items-center justify-center rounded-xl bg-amber-950/90 shadow-lg">
                    <Button
                        onClick={startCamera}
                        className="bg-amber-600 text-white transition-transform duration-200 hover:scale-105 hover:bg-amber-700"
                        size="lg"
                        aria-label={hasPermission === false ? 'Allow camera access' : 'Activate camera'}
                    >
                        <CameraIcon className="mr-2 h-5 w-5" />
                        {hasPermission === false ? 'Allow Camera Access' : 'Activate Camera'}
                    </Button>
                </div>
            ) : (
                <div className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-xl bg-amber-950 shadow-lg">
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" aria-label="Live camera feed" />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-amber-950/50 to-transparent p-4">
                        <div className="mb-4 flex justify-between">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-amber-900/60 text-white transition-colors duration-200 hover:bg-amber-900/80"
                                onClick={stopCamera}
                                aria-label="Stop camera"
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-amber-900/60 text-white transition-colors duration-200 hover:bg-amber-900/80"
                                onClick={toggleCamera}
                                aria-label={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
                            >
                                <CameraIcon className="h-5 w-5" />
                            </Button>
                        </div>

                        <button
                            className="mx-auto mb-4 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 border-amber-600 bg-amber-100/80 transition-all duration-200 hover:scale-105 hover:bg-amber-100 active:scale-95"
                            onClick={capturePhoto}
                            aria-label="Capture photo"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-amber-950 bg-amber-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Camera;
