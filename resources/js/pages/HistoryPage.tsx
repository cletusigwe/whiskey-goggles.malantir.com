import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Camera, Edit, Plus, RefreshCw, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Whiskey {
    id: number;
    unique_name: string;
    name: string;
    stock: number;
    size: number;
    proof: string;
    spirit_type: string;
    shelf_price: string;
    date: string;
    image: string;
}

interface HistoryPageProps {
    history: Whiskey[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredHistory, setFilteredHistory] = useState<Whiskey[]>([]);

    useEffect(() => {
        setFilteredHistory(history);
    }, [history]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredHistory(history);
        } else {
            const filtered = history.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.spirit_type.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            setFilteredHistory(filtered);
        }
    }, [searchTerm, history]);

    const formatWhiskeyName = (unique_name: string): string => {
        return unique_name.replace(/_/g, ' ').trim();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const validHistory = filteredHistory.filter((whiskey) => {
        const isValid = whiskey && typeof whiskey.id === 'number' && typeof whiskey.unique_name === 'string';
        if (!isValid) {
            console.warn('Invalid whiskey entry:', whiskey);
        }
        return isValid;
    });

    const handleEdit = (whiskey: Whiskey) => {
        sessionStorage.setItem('selectedWhiskey', JSON.stringify(whiskey));
        if (whiskey.image) {
            sessionStorage.setItem('capturedImage', whiskey.image);
        }
        router.visit('/edit');
    };

    const handleReclassify = (whiskey: Whiskey) => {
        const image = whiskey.image || sessionStorage.getItem('capturedImage') || '';
        if (!image) {
            toast.error('No image available', {
                description: 'Cannot reclassify without an image.',
            });
            return;
        }
        sessionStorage.setItem('capturedImage', image);
        router.post(
            '/classify',
            { image, whiskey: whiskey.unique_name },
            {
                onSuccess: () => {
                    toast.success('Whiskey reclassified', {
                        description: `Reclassifying ${formatWhiskeyName(whiskey.unique_name)}.`,
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
        <AppLayout title='History'>
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
                        {validHistory.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="mb-4 text-amber-700">{searchTerm ? 'No whiskeys match your search.' : 'No whiskey history yet.'}</p>
                                <Button className="cursor-pointer bg-amber-600 text-white hover:bg-amber-700" onClick={handleNewCapture}>
                                    <Camera className="mr-2 h-5 w-5" />
                                    Scan a Whiskey
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {validHistory.map((whiskey) => (
                                    <Card key={whiskey.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex items-center">
                                                <div className="relative h-24 w-20 flex-shrink-0">
                                                    <img
                                                        src={whiskey.image || '/placeholder.svg'}
                                                        alt={whiskey.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 p-3">
                                                    <h3 className="font-medium text-amber-900">{formatWhiskeyName(whiskey.unique_name)}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-amber-700">Stock: {whiskey.stock}</p>
                                                        <span className="text-xs text-amber-600">
                                                            • {whiskey.size}ml • {whiskey.proof} proof
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-amber-600">{formatDate(whiskey.date)}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 pr-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => handleEdit(whiskey)}
                                                    >
                                                        <Edit className="mr-1 h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => handleReclassify(whiskey)}
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
