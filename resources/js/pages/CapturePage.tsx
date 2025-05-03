import Camera from '@/components/Camera';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { CameraIcon, History } from 'lucide-react';
import React, { useEffect } from 'react';

const CapturePage: React.FC = () => {
    useEffect(() => {
        sessionStorage.removeItem('selectedWhiskey');
        sessionStorage.removeItem('capturedImage');
    }, []);

    return (
        <AppLayout>
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                    <div className="mx-auto flex w-full max-w-md flex-col items-center">
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 text-4xl font-bold text-amber-900">Whiskey Goggles</h1>
                            <p className="text-amber-700">Snap, identify, and catalog your whiskey collection</p>
                        </div>

                        <Camera />

                        <div className="mt-6 flex w-full flex-col gap-3">
                            <Button className="w-full bg-amber-600 text-white hover:bg-amber-700" size="lg">
                                <Link href="/upload" className="flex items-center">
                                    <CameraIcon className="mr-2 h-5 w-5" />
                                    Take a Photo
                                </Link>
                            </Button>

                            <Button variant="outline" className="w-full border-amber-600 text-amber-800 hover:bg-amber-100" size="lg">
                                <Link href="/history" className="flex items-center">
                                    <History className="mr-2 h-5 w-5" />
                                    View History
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default CapturePage;
