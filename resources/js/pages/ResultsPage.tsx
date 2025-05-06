import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/AppLayout';
import { getCachedAsset, isModelCached } from '@/lib/cache-assets';
import { nameToUnique } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Camera, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface WhiskeyPrediction {
    id: number;
    unique_name: string;
    name: string;
    prob: number;
    stock: number;
}

interface Props {
    whiskeys: { id: number; unique_name: string; name: string; stock: number }[];
}

const ResultsPage: React.FC<Props> = ({ whiskeys }) => {
    const [topK] = useState(20);
    const [image, setImage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [allPredictions, setAllPredictions] = useState<WhiskeyPrediction[]>([]);
    const [filteredPredictions, setFilteredPredictions] = useState<WhiskeyPrediction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [estimatedTime, setEstimatedTime] = useState<number>(8);

    const useDebounce = (value: string, delay: number) => {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(() => {
            const handler = setTimeout(() => setDebouncedValue(value), delay);
            return () => clearTimeout(handler);
        }, [value]);
        return debouncedValue;
    };

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const storedImage = sessionStorage.getItem('capturedImage');
        if (storedImage) {
            setImage(storedImage);
        } else {
            toast.error('No image found', {
                description: 'Please capture or upload a whiskey photo first.',
            });
            router.visit('/');
            return;
        }

        const runInference = async () => {
            try {
                setIsLoading(true);
                setProgress(0);
                setEstimatedTime(8);

                const progressInterval = setInterval(() => {
                    setProgress((prev) => {
                        const newProgress = prev + 25;
                        if (newProgress >= 100) {
                            clearInterval(progressInterval);
                            return 100;
                        }
                        setEstimatedTime((prev) => Math.max(1, prev - 1));
                        return newProgress;
                    });
                }, 1000);

                const isCached = await isModelCached();
                if (!isCached) {
                    throw new Error('Model assets not cached. Please download them from the homepage.');
                }

                const modelBlob = await getCachedAsset('model');
                const labels = await getCachedAsset('labels');
                const meanStd = await getCachedAsset('mean_std');

                const modelUrl = URL.createObjectURL(modelBlob);
                const session = await window.ort.InferenceSession.create(modelUrl, {
                    executionProviders: ['wasm'],
                });
                URL.revokeObjectURL(modelUrl);

                const tensor = await preprocessImage(storedImage, meanStd);

                const output = await session.run({ pixel_values: tensor });
                const logits = output.logits.data as Float32Array;

                const probs = softmax(Array.from(logits));
                const allPredictionsTemp = probs.map((prob, index) => ({
                    unique_name: labels[index],
                    prob,
                }));
                const highConfidenceCount = allPredictionsTemp.filter((p) => p.prob > 0.5).length;

                const filteredPredictionsTemp = allPredictionsTemp
                    .filter((pred) => whiskeys.some((w) => w.unique_name === pred.unique_name))
                    .map((pred) => {
                        const whiskey = whiskeys.find((w) => w.unique_name === pred.unique_name)!;
                        return {
                            id: whiskey.id,
                            unique_name: whiskey.unique_name,
                            name: whiskey.name,
                            prob: pred.prob,
                            stock: whiskey.stock,
                        };
                    })
                    .sort((a, b) => b.prob - a.prob);

                setAllPredictions(filteredPredictionsTemp);
                setFilteredPredictions(filteredPredictionsTemp.slice(0, topK));
                setIsLoading(false);
                clearInterval(progressInterval);
                setProgress(100);
                setEstimatedTime(0);
                toast.success('Whiskey analysis complete', {
                    description: `Found ${highConfidenceCount} matches above 50% confidence. Displaying the top-${topK} results. You can still search within ${filteredPredictionsTemp.length} available in database.`,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                toast.error('Analysis failed', {
                    description: errorMessage,
                });
                setIsLoading(false);
                router.visit('/');
            }
        };

        runInference();
    }, [whiskeys]);

    useEffect(() => {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase().trim();
        if (lowerSearchTerm === '') {
            setFilteredPredictions(allPredictions.slice(0, topK));
        } else {
            const filtered = allPredictions
                .filter((prediction) => prediction.unique_name.toLowerCase().includes(nameToUnique(lowerSearchTerm)))
                .sort((a, b) => b.prob - a.prob);
            setFilteredPredictions(filtered);
        }
    }, [debouncedSearchTerm, allPredictions]);

    const preprocessImage = async (base64Image: string, meanStd: { mean: number[]; std: number[] }): Promise<any> => {
        const img = new Image();
        img.src = base64Image;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 224, 224);

        const imageData = ctx.getImageData(0, 0, 224, 224);
        const pixels = imageData.data;
        const data = new Float32Array(3 * 224 * 224);

        for (let i = 0, j = 0; i < pixels.length; i += 4, j++) {
            const r = pixels[i] / 255.0;
            const g = pixels[i + 1] / 255.0;
            const b = pixels[i + 2] / 255.0;
            data[j] = (r - meanStd.mean[0]) / meanStd.std[0];
            data[j + 224 * 224] = (g - meanStd.mean[1]) / meanStd.std[1];
            data[j + 2 * 224 * 224] = (b - meanStd.mean[2]) / meanStd.std[2];
        }

        return new window.ort.Tensor('float32', data, [1, 3, 224, 224]);
    };

    const softmax = (logits: number[]): number[] => {
        const maxLogit = Math.max(...logits);
        const exps = logits.map((l) => Math.exp(l - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map((e) => e / sumExps);
    };

    const handleSelect = (prediction: WhiskeyPrediction): void => {
        router.post(
            '/classify',
            { image, whiskey: prediction.unique_name },
            {
                onSuccess: () => {
                    toast.success('Whiskey selected', {
                        description: `You chose ${prediction.name}.`,
                    });
                    sessionStorage.setItem('selectedWhiskey', JSON.stringify(prediction));
                },
                onError: (errors) => {
                    toast.error('Selection failed', {
                        description: Object.values(errors).join(', '),
                    });
                },
            },
        );
    };

    return (
        <AppLayout title="Classify">
            <main className="flex min-h-screen flex-col bg-amber-50">
                <header className="flex items-center border-b border-amber-200 p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="cursor-pointer text-amber-800">
                        <X className="h-6 w-6" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">Whiskey Identification</h1>
                    <div className="w-10"></div>
                </header>

                <div className="flex flex-1 flex-col items-center p-4">
                    <div className="w-full max-w-md">
                        {isLoading ? (
                            <div className="flex h-full w-full flex-col items-center justify-center">
                                <div className="w-full max-w-xs">
                                    <Progress value={progress} className="mb-4 h-2" />
                                </div>
                                <p className="text-amber-800">Analyzing your whiskey...</p>
                                <p className="text-sm text-amber-600">
                                    Estimated time: {estimatedTime} second{estimatedTime !== 1 ? 's' : ''} remaining
                                </p>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-center">
                                <div className="relative mb-4 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg">
                                    {image && <img src={image} alt="Captured whiskey" className="h-full w-full object-contain" />}
                                </div>
                                <div className="mb-4 w-full rounded-lg bg-white p-4 shadow-sm">
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
                                            {filteredPredictions.map((prediction) => (
                                                <Card
                                                    key={prediction.id}
                                                    className="cursor-pointer transition-colors hover:bg-amber-100"
                                                    onClick={() => handleSelect(prediction)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-medium text-amber-900">
                                                                    {whiskeys.filter((w) => w.unique_name == prediction.unique_name)[0].name}
                                                                </h3>
                                                                <p className="text-xs text-amber-700">
                                                                    {prediction.unique_name.includes('750ml')
                                                                        ? '750ml'
                                                                        : prediction.unique_name.includes('375ml')
                                                                          ? '375ml'
                                                                          : prediction.unique_name.includes('1L')
                                                                            ? '1L'
                                                                            : prediction.unique_name.includes('1.75L')
                                                                              ? '1.75L'
                                                                              : ''}
                                                                </p>
                                                                <p className="text-sm text-amber-700">Stock: {prediction.stock}</p>
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
                                            <p className="text-amber-700">No matches found. Try adjusting your search.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="w-full">
                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer border-amber-600 text-amber-800 hover:bg-amber-100"
                                        onClick={() => router.visit('/')}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Try Another Photo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default ResultsPage;
