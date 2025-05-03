import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/layouts/AppLayout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface WhiskeyPrediction {
    unique_name: string;
    prob: number;
}

interface PageProps extends InertiaPageProps {
    predictions: WhiskeyPrediction[];
}

const ResultsPage: React.FC = () => {
    const { predictions } = usePage<PageProps>().props;
    const [image, setImage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredPredictions, setFilteredPredictions] = useState<WhiskeyPrediction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedImage = sessionStorage.getItem('capturedImage');
        if (storedImage) {
            setImage(storedImage);
        } else {
            router.visit('/');
            return;
        }

        setTimeout(() => {
            setFilteredPredictions(predictions);
            setIsLoading(false);
        }, 1500);
    }, [predictions]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPredictions(predictions);
        } else {
            const filtered = predictions.filter((prediction) =>
                formatWhiskeyName(prediction.unique_name).toLowerCase().includes(searchTerm.toLowerCase()),
            );
            setFilteredPredictions(filtered);
        }
    }, [searchTerm, predictions]);

    const formatWhiskeyName = (name: string): string => {
        return name
            .replace(/_/g, ' ')
            .replace(/750ml|375ml/g, '')
            .trim();
    };

    const handleSelect = (prediction: WhiskeyPrediction): void => {
        router.post(
            '/classify',
            { image, whiskey: prediction.unique_name },
            {
                onSuccess: () => {
                    toast({
                        title: 'Whiskey identified!',
                        description: `You selected: ${formatWhiskeyName(prediction.unique_name)}`,
                    });
                    sessionStorage.setItem('selectedWhiskey', prediction.unique_name);
                    router.visit('/edit');
                },
            },
        );
    };

    const handleSearch = (): void => {
        router.visit('/search');
    };

    return (
        <AppLayout>
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex items-center border-b border-amber-200 p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="text-amber-800">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">Whiskey Identification</h1>
                    <Button variant="ghost" size="icon" onClick={handleSearch} className="text-amber-800">
                        <Search className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex flex-1 flex-col items-center p-4">
                    {isLoading ? (
                        <div className="flex h-full w-full max-w-md flex-col items-center justify-center">
                            <div className="w-full max-w-xs">
                                <Progress value={65} className="mb-4 h-2" />
                            </div>
                            <p className="text-amber-800">Analyzing your whiskey...</p>
                        </div>
                    ) : (
                        <div className="flex w-full max-w-md flex-col items-center">
                            <div className="relative mb-4 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg">
                                {image && <img src={image} alt="Captured whiskey" className="h-full w-full object-contain" />}
                            </div>

                            <div className="mb-4 w-full">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-amber-600" />
                                    <Input
                                        type="text"
                                        placeholder="Filter results or search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-amber-300 bg-white pl-9"
                                    />
                                </div>
                            </div>

                            <div className="mb-2 w-full">
                                <h2 className="text-lg font-medium text-amber-900">{searchTerm ? 'Search Results' : 'Top Matches'}</h2>
                                <p className="text-sm text-amber-700">Select the correct whiskey</p>
                            </div>

                            <div className="mb-4 max-h-[400px] w-full overflow-y-auto">
                                {filteredPredictions.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredPredictions.map((prediction, index) => (
                                            <Card
                                                key={index}
                                                className="cursor-pointer transition-colors hover:bg-amber-100"
                                                onClick={() => handleSelect(prediction)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-amber-900">
                                                                {formatWhiskeyName(prediction.unique_name)}
                                                            </h3>
                                                            <p className="text-xs text-amber-700">
                                                                {prediction.unique_name.includes('750ml')
                                                                    ? '750ml'
                                                                    : prediction.unique_name.includes('375ml')
                                                                      ? '375ml'
                                                                      : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-12 text-right text-sm text-amber-700">
                                                                {(prediction.prob * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-white p-4 text-center">
                                        <p className="text-amber-700">No matches found.</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full border-amber-600 text-amber-800 hover:bg-amber-100"
                                    onClick={handleSearch}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search Full Catalog
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
};

export default ResultsPage;
