import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Camera, Download, Edit, Search, Trash, X } from 'lucide-react';
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
    const [currentImages, setCurrentImages] = useState<HistoryImage[]>(images);
    const [filteredImages, setFilteredImages] = useState<HistoryImage[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

    // Sync currentImages with images prop when it changes
    useEffect(() => {
        setCurrentImages(images);
    }, [images]);

    // Filter images based on search term and currentImages
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredImages(currentImages);
        } else {
            const filtered = currentImages.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.unique_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            setFilteredImages(filtered);
        }
    }, [searchTerm, currentImages]);

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

    const handleEdit = (historyImage: HistoryImage) => {
        router.visit(`/edit/${historyImage.id}`);
    };

    const handleDelete = (imageId: number) => {
        setSelectedImageId(imageId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedImageId) {
            router.delete(`/images/${selectedImageId}`, {
                onSuccess: () => {
                    setCurrentImages(currentImages.filter((image) => image.id !== selectedImageId));
                    toast.success('Entry deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete entry');
                },
            });
        }
        setIsDeleteDialogOpen(false);
    };

    const handleExport = () => {
        if (currentImages.length === 0) {
            toast.info('No images to export');
            return;
        }

        const data = currentImages.map((image) => [image.image || '', image.unique_name]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            'image_url,whiskey_unique_name\n' +
            data.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'whiskey_dataset.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout title="History">
            <main className="flex min-h-screen flex-col bg-amber-50">
                <header className="flex flex-col items-center gap-2 border-b border-amber-200 p-4 sm:flex-row sm:justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="cursor-pointer text-amber-800">
                        <X className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold text-amber-900 sm:text-xl">Inventory History</h1>
                    <Button
                        size="sm"
                        onClick={handleExport}
                        className="flex cursor-pointer items-center gap-2 bg-amber-600 text-white hover:bg-amber-700"
                    >
                        <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Export New Dataset</span>
                        <span className="sm:hidden">Export Dataset</span>
                    </Button>
                </header>

                <div className="p-4">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-4">
                            <div className="relative w-full">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-amber-600" />
                                <Input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border-amber-300 bg-white pl-9 sm:pl-10"
                                />
                            </div>
                        </div>
                        {validImages.length === 0 ? (
                            <div className="p-6 text-center sm:p-8">
                                <p className="mb-4 text-sm text-amber-700 sm:text-base">
                                    {searchTerm ? 'No images match your search.' : 'No image history yet.'}
                                </p>
                                <Button
                                    size="sm"
                                    className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                                    onClick={() => router.visit('/')}
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Scan a Whiskey
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {validImages.map((image) => (
                                    <Card key={image.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex items-center">
                                                <div className="relative h-20 w-16 flex-shrink-0 sm:h-24 sm:w-20">
                                                    <img
                                                        src={image.image || '/placeholder.svg'}
                                                        alt={image.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 p-2 sm:p-3">
                                                    <h3 className="text-sm font-medium text-amber-900 sm:text-base">
                                                        {formatWhiskeyName(image.unique_name)}
                                                    </h3>
                                                    <p className="text-xs text-amber-600 sm:text-sm">{image.name}</p>
                                                    <p className="text-xs text-amber-600 sm:text-sm">{formatDate(image.created_at)}</p>
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
                                                        onClick={() => handleDelete(image.id)}
                                                    >
                                                        <Trash className="mr-1 h-3 w-3" />
                                                        Delete
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

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this entry? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
};

export default HistoryPage;
