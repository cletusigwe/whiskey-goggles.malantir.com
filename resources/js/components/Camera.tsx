import { Button } from '@/components/ui/button';
import { SwitchCamera } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CameraProps {
    onCapture: (dataUrl: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [cameraStatus, setCameraStatus] = useState<'available' | 'unavailable' | 'error'>('available');
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [isStarting, setIsStarting] = useState<boolean>(false);

    useEffect(() => {
        const checkCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((device) => device.kind === 'videoinput');

                if (videoInputs.length === 0) {
                    setCameraStatus('unavailable');
                    setVideoDevices([]);
                    return;
                }

                setVideoDevices(videoInputs);
                setCameraStatus('available');

                const hasBackCamera = videoInputs.some(
                    (device) => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'),
                );
                setFacingMode(hasBackCamera ? 'environment' : 'user');
            } catch (error) {
                setCameraStatus('error');
                setVideoDevices([]);
                toast.error('Camera access failed', {
                    description: 'Unable to detect cameras. Please check permissions.',
                });
            }
        };

        checkCameras();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const startCamera = async () => {
        if (cameraStatus !== 'available' || isStarting) {
            if (cameraStatus !== 'available') {
                toast.error('Camera unavailable', {
                    description: cameraStatus === 'unavailable' ? 'No camera detected.' : 'Camera access error.',
                });
            }
            return;
        }

        setIsStarting(true);
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCameraOn(true);
        } catch (error) {
            setCameraStatus('error');
            let errorMessage = 'Failed to access camera.';
            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera access denied. Please grant permissions.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera found on this device.';
                    setCameraStatus('unavailable');
                }
            }
            toast.error('Camera error', {
                description: errorMessage,
            });
        } finally {
            setIsStarting(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    };

    const switchCamera = () => {
        if (isStarting) return;
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
        stopCamera();
        startCamera();
    };

    const captureImage = () => {
        if (!videoRef.current || !isCameraOn) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(dataUrl);
            stopCamera();
        }
    };

    return (
        <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                {cameraStatus === 'available' && <video ref={videoRef} className="h-full w-full object-cover" playsInline autoPlay muted />}
                {!isCameraOn && cameraStatus === 'available' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-200">
                        <Button className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700" onClick={startCamera} disabled={isStarting}>
                            Start Camera
                        </Button>
                    </div>
                )}
                {cameraStatus !== 'available' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-200">
                        <Button className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700" onClick={startCamera} disabled={isStarting}>
                            {cameraStatus === 'unavailable' ? 'No Camera Detected' : 'Allow Camera'}
                        </Button>
                    </div>
                )}
                {isCameraOn && videoDevices.length > 1 && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-2 right-2 cursor-pointer border-amber-600 text-amber-800 hover:bg-amber-100"
                        onClick={switchCamera}
                        disabled={isStarting}
                    >
                        <SwitchCamera className="h-5 w-5" />
                    </Button>
                )}
                {isCameraOn && (
                    <div
                        className="absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 transform cursor-pointer items-center justify-center rounded-full bg-white"
                        onClick={captureImage}
                    >
                        <div className="h-12 w-12 rounded-full bg-red-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Camera;
