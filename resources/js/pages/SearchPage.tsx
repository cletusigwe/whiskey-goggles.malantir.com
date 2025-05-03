import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/layouts/AppLayout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Whiskey {
    unique_name: string;
    name: string;
    size: number;
}

interface PageProps extends InertiaPageProps {
    whiskeys: Whiskey[];
}

const SearchPage: React.FC = () => {
    const { whiskeys } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [results, setResults] = useState<Whiskey[]>([]);
    const [image, setImage] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const storedImage = sessionStorage.getItem('capturedImage');
        if (storedImage) {
            setImage(storedImage);
        }
        const storedRecentSearches = localStorage.getItem('recentWhiskeySearches');
        if (storedRecentSearches) {
            setRecentSearches(JSON.parse(storedRecentSearches));
        }
        setResults(whiskeys);
    }, [whiskeys]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.trim() === '') {
            setResults(whiskeys);
        } else {
            const filtered = whiskeys.filter((whiskey) => whiskey.name.toLowerCase().includes(term.toLowerCase()));
            setResults(filtered);
        }
    };

    const clearSearch = (): void => {
        setSearchTerm('');
        setResults(whiskeys);
    };

    const formatWhiskeyName = (name: string): string => {
        return name
            .replace(/_/g, ' ')
            .replace(/750ml|375ml/g, '')
            .trim();
    };

    const handleSelect = (whiskey: Whiskey): void => {
        router.post(
            '/classify',
            { image, whiskey: whiskey.unique_name },
            {
                onSuccess: () => {
                    const updatedRecentSearches = [whiskey.unique_name, ...recentSearches.filter((item) => item !== whiskey.unique_name)].slice(0, 5);
                    setRecentSearches(updatedRecentSearches);
                    localStorage.setItem('recentWhiskeySearches', JSON.stringify(updatedRecentSearches));
                    toast({
                        title: `${formatWhiskeyName(whiskey.unique_name)} selected!`,
                        description: `You selected ${formatWhiskeyName(whiskey.unique_name)} (${whiskey.size}ml)`,
                    });
                    sessionStorage.setItem('selectedWhiskey', whiskey.unique_name);
                    router.visit('/edit');
                },
            },
        );
    };

    return (
        <AppLayout>
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex items-center border-b border-amber-200 p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/results')} className="text-amber-800">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">Search Whiskey</h1>
                    <div className="w-10"></div>
                </div>

                <div className="p-4">
                    <div className="mx-auto w-full max-w-md">
                        <div className="relative mb-4">
                            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-amber-600" />
                            <Input
                                type="text"
                                placeholder="Search for a whiskey..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="border-amber-300 bg-white py-6 pr-10 pl-10 focus-visible:ring-amber-500"
                                autoFocus
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 transform text-amber-600"
                                    onClick={clearSearch}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        {recentSearches.length > 0 && searchTerm === '' && (
                            <div className="mb-4">
                                <h2 className="mb-2 text-sm font-medium text-amber-800">Recent Searches</h2>
                                <div className="space-y-2">
                                    {recentSearches.map((whiskey, index) => {
                                        const whiskeyData = whiskeys.find((w) => w.unique_name === whiskey);
                                        if (!whiskeyData) return null;
                                        return (
                                            <div
                                                key={index}
                                                className="flex cursor-pointer items-center rounded-lg bg-white p-3 shadow-sm transition-colors hover:bg-amber-100"
                                                onClick={() => handleSelect(whiskeyData)}
                                            >
                                                <h3 className="flex-1 font-medium text-amber-900">{formatWhiskeyName(whiskey)}</h3>
                                                <span className="text-xs text-amber-600">{whiskeyData.size}ml</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <h2 className="text-sm font-medium text-amber-800">{searchTerm ? `Results (${results.length})` : 'All Whiskeys'}</h2>
                        </div>

                        <ScrollArea className="h-[calc(100vh-220px)]">
                            <div className="space-y-2 pr-2">
                                {results.length > 0 ? (
                                    results.map((whiskey, index) => (
                                        <div
                                            key={index}
                                            className="flex cursor-pointer items-center rounded-lg bg-white p-3 shadow-sm transition-colors hover:bg-amber-100"
                                            onClick={() => handleSelect(whiskey)}
                                        >
                                            <h3 className="flex-1 font-medium text-amber-900">{formatWhiskeyName(whiskey.unique_name)}</h3>
                                            <span className="text-xs text-amber-600">{whiskey.size}ml</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-lg bg-white p-4 text-center">
                                        <p className="text-amber-700">No whiskeys found matching your search.</p>
                                        <Button
                                            variant="link"
                                            className="mt-2 text-amber-600"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setResults(whiskeys);
                                            }}
                                        >
                                            Show all whiskeys
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default SearchPage;
