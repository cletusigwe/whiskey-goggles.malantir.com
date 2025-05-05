import { Button } from '@/components/ui/button';
import { SwitchCamera } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CameraProps {
    onCapture: (dataUrl: string) => void;
    isModelCached: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, isModelCached }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
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
                    toast.error('No camera detected', {
                        description: 'Please ensure a camera is available and permissions are granted.',
                    });
                    return;
                }

                setVideoDevices(videoInputs);
                setCameraStatus('available');

                // Prefer back camera if available
                const backCameraIndex = videoInputs.findIndex(
                    (device) => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'),
                );
                setCurrentDeviceIndex(backCameraIndex >= 0 ? backCameraIndex : 0);
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
        if (cameraStatus !== 'available' || isStarting || !isModelCached) {
            if (cameraStatus !== 'available') {
                toast.error('Camera unavailable', {
                    description: cameraStatus === 'unavailable' ? 'No camera detected.' : 'Camera access error.',
                });
            } else if (!isModelCached) {
                toast.error('Model not downloaded', {
                    description: 'Please download the model weights first.',
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

            const currentDevice = videoDevices[currentDeviceIndex];
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: currentDevice ? { exact: currentDevice.deviceId } : undefined },
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
        if (isStarting || videoDevices.length <= 1) return;
        setCurrentDeviceIndex((prev) => (prev + 1) % videoDevices.length);
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
                        <Button
                            className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                            onClick={startCamera}
                            disabled={isStarting || !isModelCached}
                        >
                            Start Camera
                        </Button>
                    </div>
                )}
                {cameraStatus !== 'available' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-200">
                        <Button
                            className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                            onClick={startCamera}
                            disabled={isStarting || !isModelCached}
                        >
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
                        disabled={isStarting || !isModelCached}
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
