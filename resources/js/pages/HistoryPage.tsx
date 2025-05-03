import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, Edit, Plus, RefreshCw, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/AppLayout';


interface HistoryItem {
    id: number;
    name: string;
    size: number;
    proof: string;
    spirit_type: string;
    shelf_price: string;
    date: string;
    image: string;
}

interface PageProps extends InertiaPageProps {
    history: HistoryItem[];
}

const HistoryPage: React.FC = () => {
    const { history } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        setFilteredHistory(history);

        const selectedWhiskey = sessionStorage.getItem('selectedWhiskey');
        const storedImage = sessionStorage.getItem('capturedImage');

        if (selectedWhiskey && storedImage) {
            const name = selectedWhiskey
                .replace(/_/g, ' ')
                .replace(/750ml|375ml/g, '')
                .trim();
            const size = selectedWhiskey.includes('750ml') ? 750 : selectedWhiskey.includes('375ml') ? 375 : 750;

            const newItem: HistoryItem = {
                id: Date.now(),
                name,
                size,
                proof: '',
                spirit_type: 'Bourbon',
                shelf_price: '0.00',
                date: new Date().toISOString().split('T')[0],
                image: storedImage,
            };

            setFilteredHistory([newItem, ...history]);
            sessionStorage.removeItem('selectedWhiskey');
            sessionStorage.removeItem('capturedImage');
        }
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

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleNewCapture = (): void => {
        sessionStorage.removeItem('selectedWhiskey');
        sessionStorage.removeItem('capturedImage');
        router.visit('/');
    };

    const handleEditDetails = (item: HistoryItem): void => {
        sessionStorage.setItem('editItemId', item.id.toString());
        const whiskeyString = `${item.name.replace(/ /g, '_')}_${item.size}ml`;
        sessionStorage.setItem('selectedWhiskey', whiskeyString);
        if (item.image) {
            sessionStorage.setItem('capturedImage', item.image);
        }
        toast({
            title: 'Editing whiskey',
            description: `Now editing ${item.name} (${item.size}ml)`,
        });
        router.visit(`/edit?id=${item.id}`);
    };

    const handleReclassify = (item: HistoryItem): void => {
        if (item.image) {
            sessionStorage.setItem('capturedImage', item.image);
            toast({
                title: 'Reclassifying whiskey',
                description: `Reclassifying ${item.name}`,
            });
            router.visit('/results');
        }
    };

    return (
        <AppLayout>

        <main className="flex min-h-screen flex-col bg-amber-50">
            <div className="flex items-center border-b border-amber-200 p-4">
                <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="text-amber-800">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">History</h1>
                <Button variant="ghost" size="icon" onClick={handleNewCapture} className="text-amber-800">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

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

                    {filteredHistory.length > 0 ? (
                        <div className="space-y-4">
                            {filteredHistory.map((item) => (
                                <Card key={item.id} className="whiskey-card overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex items-center">
                                            <div className="relative h-24 w-20 flex-shrink-0">
                                                <img src={item.image || '/placeholder.svg'} alt={item.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1 p-3">
                                                <h3 className="font-medium text-amber-900">{item.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-amber-700">{item.shelf_price}</p>
                                                    <span className="text-xs text-amber-600">
                                                        • {item.size}ml • {item.proof} proof
                                                    </span>
                                                </div>
                                                <p className="text-sm text-amber-600">{formatDate(item.date)}</p>
                                            </div>
                                            <div className="flex flex-col gap-2 pr-2">
                                                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleEditDetails(item)}>
                                                    <Edit className="mr-1 h-3 w-3" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleReclassify(item)}>
                                                    <RefreshCw className="mr-1 h-3 w-3" />
                                                    Reclassify
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="mb-4 text-amber-700">{searchTerm ? 'No whiskeys match your search.' : 'No whiskey history yet.'}</p>
                            {searchTerm ? (
                                <Button
                                    variant="outline"
                                    className="border-amber-600 text-amber-800 hover:bg-amber-100"
                                    onClick={() => setSearchTerm('')}
                                >
                                    Clear Search
                                </Button>
                            ) : (
                                <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => router.visit('/')}>
                                    <Plus className="mr-2 h-5 w-5" />
                                    Add Your First Whiskey
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
        </AppLayout>
    );
};

export default HistoryPage;
