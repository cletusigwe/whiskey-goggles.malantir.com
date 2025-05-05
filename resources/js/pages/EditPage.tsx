import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/AppLayout';
import { getCachedAsset } from '@/lib/cache-assets';
import { nameToUnique } from '@/lib/utils';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, Minus, Plus, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface WhiskeyData {
    id: string;
    store_id: string;
    unique_name: string;
    name: string;
    size: string;
    proof: string;
    abv: string;
    spirit_type: string;
    avg_msrp: string;
    fair_price: string;
    shelf_price: string;
    stock: string;
    notes: string;
    popularity: number;
    total_score: number;
    wishlist_count: number;
    vote_count: number;
    bar_count: number;
    ranking: number;
}

interface PageProps extends InertiaPageProps {
    whiskeys: WhiskeyData[];
    whiskey?: WhiskeyData;
    spirit_types: string[];
}

const EditPage: React.FC = () => {
    const { whiskeys, whiskey, spirit_types } = usePage<PageProps>().props;
    const [image, setImage] = useState<string | null>(null);
    const [whiskeyData, setWhiskeyData] = useState<WhiskeyData>({
        id: '',
        store_id: '',
        unique_name: '',
        name: '',
        size: '750',
        proof: '',
        abv: '',
        spirit_type: 'Bourbon',
        avg_msrp: '',
        fair_price: '',
        shelf_price: '',
        stock: '1',
        notes: '',
        popularity: 0,
        total_score: 0,
        wishlist_count: 0,
        vote_count: 0,
        bar_count: 0,
        ranking: 0,
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [labels, setLabels] = useState<string[]>([]);
    useEffect(() => {
        const loadLabels = async () => {
            try {
                const cachedLabels = await getCachedAsset('labels');
                setLabels(cachedLabels);
            } catch (error) {
                toast.error('Failed to load labels', {
                    description: 'Please try again later.',
                });
            }
        };
        loadLabels();

        const selectedWhiskey = sessionStorage.getItem('selectedWhiskey');
        const storedImage = sessionStorage.getItem('capturedImage');

        if (storedImage) {
            setImage(storedImage);
        }

        if (whiskey) {
            setWhiskeyData({
                ...whiskey,
                size: whiskey.size.toString(),
                stock: whiskey.stock.toString(),
            });
            setSearchTerm(whiskey.name);
        } else if (selectedWhiskey) {
            const parsed = JSON.parse(selectedWhiskey);
            const uniqueName = parsed.unique_name;
            let size = '750';
            if (uniqueName.includes('750ml')) size = '750';
            else if (uniqueName.includes('375ml')) size = '375';
            else if (uniqueName.includes('1L')) size = '1000';
            else if (uniqueName.includes('1.75L')) size = '1750';

            const foundWhiskey = whiskeys.find((w) => w.unique_name === uniqueName);

            if (foundWhiskey) {
                setWhiskeyData({
                    ...foundWhiskey,
                    size: foundWhiskey.size.toString(),
                    stock: foundWhiskey.stock.toString(),
                });
            } else {
                toast.error('Whiskey not found in catalog', {
                    description: 'This is an invalid state. You are doing something',
                });
            }
            setSearchTerm(parsed.name);
        } else {
            toast.error('Whiskey not found in catalog', {
                description: 'This is an invalid state. You are doing something',
            });
        }
    }, [whiskeys, whiskey]);

    const handleNameSelect = (value: string): void => {
        const selectedWhiskey = whiskeys.find((w) => w.unique_name === value);
        if (selectedWhiskey) {
            setWhiskeyData({
                ...selectedWhiskey,
                size: selectedWhiskey.size.toString(),
                stock: whiskeyData.stock,
                notes: whiskeyData.notes,
            });
            setSearchTerm(selectedWhiskey.name);
        }
    };

    const handleInputChange = (field: keyof WhiskeyData, value: string): void => {
        setWhiskeyData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const incrementPrice = (field: keyof WhiskeyData, amount: number): void => {
        const currentValue = Number.parseFloat(whiskeyData[field] as string) || 0;
        const newValue = (currentValue + amount).toFixed(2);
        handleInputChange(field, newValue);
    };

    const handleSave = (): void => {
        const formData = new FormData();
        const editableFields = ['id', 'size', 'proof', 'abv', 'spirit_type', 'avg_msrp', 'fair_price', 'shelf_price', 'notes'];
        Object.entries(whiskeyData).forEach(([key, value]) => {
            if (editableFields.includes(key)) {
                formData.append(key, value.toString());
            }
        });
        if (image) {
            formData.append('image', image);
        }

        router.post('/whiskey', formData, {
            onSuccess: () => {
                toast.success(`${whiskeyData.name} saved!`, {
                    description: `${whiskeyData.name} (${whiskeyData.size}ml) has been updated in your collection.`,
                });
                sessionStorage.removeItem('selectedWhiskey');
                sessionStorage.removeItem('capturedImage');
                router.visit('/history');
            },
            onError: (errors) => {
                toast.error('Failed to save whiskey', {
                    description: Object.values(errors).join(', '),
                });
            },
        });
    };

    return (
        <AppLayout title="Edit">
            <main className="flex min-h-screen flex-col bg-amber-50">
                <div className="flex items-center border-b border-amber-200 p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/')} className="text-amber-800">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-amber-900">Edit Whiskey</h1>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6 flex items-start gap-4">
                            {image && (
                                <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                                    <img src={image} alt="Whiskey" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="mb-1 text-xl font-semibold text-amber-900">{whiskeyData.name || 'Select a Whiskey'}</h2>
                                <p className="text-sm text-amber-700">{whiskeyData.size}ml</p>
                                <p className="text-sm text-amber-700">{whiskeyData.stock} in stock</p>
                            </div>
                        </div>

                        <form className="space-y-4">
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h3 className="mb-3 font-medium text-amber-900">Stats</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Store Id: {whiskeyData.store_id}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Brand Id: {whiskeyData.store_id}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Popularity: {whiskeyData.popularity}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Total Score: {whiskeyData.total_score}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Wishlist: {whiskeyData.wishlist_count}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Votes: {whiskeyData.vote_count}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Bars: {whiskeyData.bar_count}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        Rank: {whiskeyData.ranking}
                                    </Badge>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h3 className="mb-3 font-medium text-amber-900">Basic Info</h3>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Select value={whiskeyData.unique_name || ''} onValueChange={handleNameSelect}>
                                            <SelectTrigger className="w-full border-amber-300 bg-white">
                                                {whiskeyData.unique_name ? (
                                                    <span>
                                                        {whiskeyData.name} ({whiskeyData.size}ml)
                                                    </span>
                                                ) : (
                                                    <span>Select whiskey...</span>
                                                )}
                                            </SelectTrigger>

                                            <SelectContent className="w-full">
                                                <div className="p-2">
                                                    <Input
                                                        placeholder="Search whiskey..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>

                                                {/* scrollable results list */}
                                                <ScrollArea className="h-[200px]">
                                                    {labels
                                                        .filter((label) =>
                                                            label.toLowerCase().includes(nameToUnique(searchTerm.toLowerCase()).trim()),
                                                        )
                                                        .map((label) => {
                                                            const w = whiskeys.find((x) => x.unique_name === label);
                                                            const size = label.includes('750ml')
                                                                ? '750ml'
                                                                : label.includes('375ml')
                                                                  ? '375ml'
                                                                  : label.includes('1L')
                                                                    ? '1L'
                                                                    : '1.75L';

                                                            return (
                                                                <SelectItem key={label} value={label}>
                                                                    <div className="flex w-full items-center justify-between gap-2">
                                                                        <span className="flex-1 truncate">{w?.name ?? label}</span>
                                                                        <span className="text-muted-foreground flex-none text-xs">{size}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}

                                                    {labels.filter((l) => l.toLowerCase().includes(nameToUnique(searchTerm.toLowerCase()).trim()))
                                                        .length === 0 && (
                                                        <div className="text-muted-foreground p-3 text-center text-sm">No whiskey found.</div>
                                                    )}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="size">Size (ml)</Label>
                                            <Select value={whiskeyData.size} onValueChange={(value) => handleInputChange('size', value)}>
                                                <SelectTrigger className="border-amber-300 bg-white">
                                                    <SelectValue placeholder="Size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="375">375ml</SelectItem>
                                                    <SelectItem value="750">750ml</SelectItem>
                                                    <SelectItem value="1000">1L</SelectItem>
                                                    <SelectItem value="1750">1.75L</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="spirit_type">Type</Label>
                                            <Select
                                                value={whiskeyData.spirit_type}
                                                onValueChange={(value) => handleInputChange('spirit_type', value)}
                                            >
                                                <SelectTrigger className="border-amber-300 bg-white">
                                                    <span>{whiskeyData.spirit_type}</span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {spirit_types.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="proof">Proof</Label>
                                            <Input
                                                id="proof"
                                                type="number"
                                                step="0.1"
                                                value={whiskeyData.proof}
                                                onChange={(e) => handleInputChange('proof', e.target.value)}
                                                className="border-amber-300 bg-white"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="abv">ABV %</Label>
                                            <Input
                                                id="abv"
                                                type="number"
                                                step="0.1"
                                                value={whiskeyData.abv}
                                                onChange={(e) => handleInputChange('abv', e.target.value)}
                                                className="border-amber-300 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h3 className="mb-3 font-medium text-amber-900">Pricing</h3>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="avg_msrp" className="flex justify-between">
                                            <span>MSRP</span>
                                            <span className="text-sm text-amber-600">Manufacturer Suggested</span>
                                        </Label>
                                        <div className="flex items-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-r-none border-r-0"
                                                onClick={() => incrementPrice('avg_msrp', -1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <div className="relative flex-1">
                                                <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-amber-800">$</span>
                                                <Input
                                                    id="avg_msrp"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={whiskeyData.avg_msrp}
                                                    onChange={(e) => handleInputChange('avg_msrp', e.target.value)}
                                                    className="rounded-none border-amber-300 bg-white pl-8"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-l-none border-l-0"
                                                onClick={() => incrementPrice('avg_msrp', 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fair_price" className="flex justify-between">
                                            <span>Fair Price</span>
                                            <span className="text-sm text-amber-600">Market Value</span>
                                        </Label>
                                        <div className="flex items-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-r-none border-r-0"
                                                onClick={() => incrementPrice('fair_price', -1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <div className="relative flex-1">
                                                <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-amber-800">$</span>
                                                <Input
                                                    id="fair_price"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={whiskeyData.fair_price}
                                                    onChange={(e) => handleInputChange('fair_price', e.target.value)}
                                                    className="rounded-none border-amber-300 bg-white pl-8"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-l-none border-l-0"
                                                onClick={() => incrementPrice('fair_price', 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="shelf_price" className="flex justify-between">
                                            <span>Shelf Price</span>
                                            <span className="text-sm text-amber-600">Your Selling Price</span>
                                        </Label>
                                        <div className="flex items-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-r-none border-r-0"
                                                onClick={() => incrementPrice('shelf_price', -1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <div className="relative flex-1">
                                                <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-amber-800">$</span>
                                                <Input
                                                    id="shelf_price"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={whiskeyData.shelf_price}
                                                    onChange={(e) => handleInputChange('shelf_price', e.target.value)}
                                                    className="rounded-none border-amber-300 bg-white pl-8"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="rounded-l-none border-l-0"
                                                onClick={() => incrementPrice('shelf_price', 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="mb-2 block text-sm text-amber-700">Quick Price Adjustments</Label>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => incrementPrice('shelf_price', 5)}
                                            >
                                                +$5
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => incrementPrice('shelf_price', 10)}
                                            >
                                                +$10
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => incrementPrice('shelf_price', -5)}
                                            >
                                                -$5
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => incrementPrice('shelf_price', -10)}
                                            >
                                                -$10
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => whiskeyData.avg_msrp && handleInputChange('shelf_price', whiskeyData.avg_msrp)}
                                            >
                                                = MSRP
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h3 className="mb-3 font-medium text-amber-900">Inventory</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add any notes about this whiskey..."
                                        value={whiskeyData.notes ?? ''}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        className="min-h-[80px] border-amber-300 bg-white"
                                    />
                                </div>
                            </div>

                            <Button type="button" className="w-full bg-amber-600 text-white hover:bg-amber-700" size="lg" onClick={handleSave}>
                                <Save className="mr-2 h-5 w-5" />
                                Save Whiskey
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
};

export default EditPage;
