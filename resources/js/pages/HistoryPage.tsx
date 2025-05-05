import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Camera, Edit, Plus, RefreshCw, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface HistoryImage {
    id: number;
    whiskey_id: number;
    unique_name: string;
    name: string;
    image: string;
    created_at: string;
}

interface HistoryPageProps {
    images: HistoryImage[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ images }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredImages, setFilteredImages] = useState<HistoryImage[]>([]);

    useEffect(() => {
        setFilteredImages(images);
    }, [images]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredImages(images);
        } else {
            const filtered = images.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.unique_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            setFilteredImages(filtered);
        }
    }, [searchTerm, images]);

    const formatWhiskeyName = (unique_name: string): string => {
        return unique_name.replace(/_/g, ' ').trim();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const validImages = filteredImages.filter((image) => {
        const isValid = image && typeof image.id === 'number' && typeof image.whiskey_id === 'number' && typeof image.unique_name === 'string';
        if (!isValid) {
            console.warn('Invalid image entry:', image);
        }
        return isValid;
    });

    const handleEdit = (image: HistoryImage) => {
        sessionStorage.setItem(
            'selectedWhiskey',
            JSON.stringify({
                id: image.whiskey_id,
                unique_name: image.unique_name,
                name: image.name,
                image: image.image,
            }),
        );
        if (image.image) {
            sessionStorage.setItem('capturedImage', image.image);
        }
        router.visit(`/edit?id=${image.whiskey_id}&image_id=${image.id}`);
    };

    const handleReclassify = (image: HistoryImage) => {
        const imageUrl = image.image || sessionStorage.getItem('capturedImage') || '';
        if (!imageUrl) {
            toast.error('No image available', {
                description: 'Cannot reclassify without an image.',
            });
            return;
        }
        sessionStorage.setItem('capturedImage', imageUrl);
        router.post(
            '/classify',
            { image: imageUrl, whiskey: image.unique_name },
            {
                onSuccess: () => {
                    toast.success('Whiskey reclassified', {
                        description: `Reclassifying ${formatWhiskeyName(image.unique_name)}.`,
                    });
                    router.visit('/results');
                },
                onError: (errors) => {
                    toast.error('Reclassification failed', {
                        description: Object.values(errors).join(', '),
                    });
                },
            },
        );
    };

    const handleNewCapture = () => {
        sessionStorage.removeItem('selectedWhiskey');
        sessionStorage.removeItem('capturedImage');
        router.visit('/');
    };

    return (
        <AppLayout title="History">
            <main className="flex min-h-screen flex-col bg-amber-50">
                <header className="flex items-center border-b border-amber-200 p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="cursor-pointer text-amber-800">
                        <X className="h-6 w-6" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">Inventory History</h1>
                    <Button variant="ghost" size="icon" onClick={handleNewCapture} className="cursor-pointer text-amber-800">
                        <Plus className="h-5 w-5" />
                    </Button>
                </header>

                <div className="p-4">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-amber-600" />
                                <Input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-amber-300 bg-white pl-9"
                                />
                            </div>
                        </div>
                        {validImages.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="mb-4 text-amber-700">{searchTerm ? 'No images match your search.' : 'No image history yet.'}</p>
                                <Button className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700" onClick={handleNewCapture}>
                                    <Camera className="mr-2 h-5 w-5" />
                                    Scan a Whiskey
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {validImages.map((image) => (
                                    <Card key={image.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex items-center">
                                                <div className="relative h-24 w-20 flex-shrink-0">
                                                    <img
                                                        src={image.image || '/placeholder.svg'}
                                                        alt={image.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 p-3">
                                                    <h3 className="font-medium text-amber-900">{formatWhiskeyName(image.unique_name)}</h3>
                                                    <p className="text-sm text-amber-600">{image.name}</p>
                                                    <p className="text-sm text-amber-600">{formatDate(image.created_at)}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 pr-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => handleEdit(image)}
                                                    >
                                                        <Edit className="mr-1 h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => handleReclassify(image)}
                                                    >
                                                        <RefreshCw className="mr-1 h-3 w-3" />
                                                        Reclassify
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default HistoryPage;
