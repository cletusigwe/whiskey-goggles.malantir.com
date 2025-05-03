import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronsUpDown, Minus, Plus, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/AppLayout';

const SPIRIT_TYPES = ['Bourbon', 'Rye', 'Scotch', 'Irish', 'Japanese', 'Canadian', 'Tennessee', 'American', 'Other'];

interface WhiskeyData {
    id: number;
    store_id: string;
    unique_name: string;
    name: string;
    size: number;
    proof: string;
    abv: string;
    spirit_type: string;
    avg_msrp: string;
    fair_price: string;
    shelf_price: string;
    stock: string;
    notes: string;
    popularity: number;
}

interface PageProps extends InertiaPageProps {
    whiskeys: WhiskeyData[];
    whiskey?: WhiskeyData;
}

const EditPage: React.FC = () => {
    const { whiskeys, whiskey } = usePage<PageProps>().props;
    const [image, setImage] = useState<string | null>(null);
    const [whiskeyData, setWhiskeyData] = useState<WhiskeyData>({
        id: 0,
        store_id: '',
        unique_name: '',
        name: '',
        size: 750,
        proof: '',
        abv: '',
        spirit_type: 'Bourbon',
        avg_msrp: '',
        fair_price: '',
        shelf_price: '',
        stock: '1',
        notes: '',
        popularity: 0,
    });
    const [nameSearchOpen, setNameSearchOpen] = useState<boolean>(false);
    const [filteredWhiskeys, setFilteredWhiskeys] = useState<WhiskeyData[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const selectedWhiskey = sessionStorage.getItem('selectedWhiskey');
        const storedImage = sessionStorage.getItem('capturedImage');

        if (storedImage) {
            setImage(storedImage);
        }

        if (whiskey) {
            setWhiskeyData(whiskey);
            updateFilteredWhiskeys(whiskey.name);
        } else if (selectedWhiskey) {
            const name = formatWhiskeyName(selectedWhiskey);
            let size = 750;
            if (selectedWhiskey.includes('750ml')) size = 750;
            else if (selectedWhiskey.includes('375ml')) size = 375;
            else if (selectedWhiskey.includes('1L')) size = 1000;
            else if (selectedWhiskey.includes('1.75L')) size = 1750;

            const foundWhiskey = whiskeys.find((w) => w.name.toLowerCase() === name.toLowerCase() && w.size === size);

            if (foundWhiskey) {
                setWhiskeyData(foundWhiskey);
            } else {
                setWhiskeyData((prev) => ({ ...prev, name, size, unique_name: `${name.replace(/ /g, '_')}_${size}ml` }));
            }
            updateFilteredWhiskeys(name);
        } else {
            router.visit('/');
            return;
        }
    }, [whiskeys, whiskey]);

    const formatWhiskeyName = (name: string): string => {
        return name
            .replace(/_/g, ' ')
            .replace(/750ml|375ml|1L|1\.75L/g, '')
            .trim();
    };

    const updateFilteredWhiskeys = (searchTerm: string): void => {
        if (!searchTerm.trim()) {
            setFilteredWhiskeys(whiskeys);
            return;
        }

        const filtered = whiskeys
            .filter((w) => w.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                const searchLower = searchTerm.toLowerCase();

                if (aLower === searchLower && bLower !== searchLower) return -1;
                if (aLower !== searchLower && bLower === searchLower) return 1;
                if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
                if (!aLower.startsWith(searchLower) && bLower.startsWith(searchLower)) return 1;
                return b.popularity - a.popularity;
            });

        setFilteredWhiskeys(filtered);
    };

    const handleNameSelect = (selectedWhiskey: WhiskeyData): void => {
        setWhiskeyData({
            ...selectedWhiskey,
            stock: whiskeyData.stock,
            notes: whiskeyData.notes,
        });
        setNameSearchOpen(false);
    };

    const handleNameChange = (value: string): void => {
        setWhiskeyData((prev) => ({
            ...prev,
            name: value,
            unique_name: `${value.replace(/ /g, '_')}_${whiskeyData.size}ml`,
        }));
        updateFilteredWhiskeys(value);
    };

    const handleInputChange = (field: keyof WhiskeyData, value: string | number): void => {
        setWhiskeyData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === 'size' && { unique_name: `${prev.name.replace(/ /g, '_')}_${value}ml` }),
        }));
    };

    const incrementPrice = (field: keyof WhiskeyData, amount: number): void => {
        const currentValue = Number.parseFloat(whiskeyData[field] as string) || 0;
        const newValue = (currentValue + amount).toFixed(2);
        handleInputChange(field, newValue);
    };

    const handleSave = (): void => {
        const formData = new FormData();
        Object.entries(whiskeyData).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });
        if (image) {
            formData.append('image', image);
        }

        router.post('/whiskeys', formData, {
            onSuccess: () => {
                toast({
                    title: `${whiskeyData.name} saved!`,
                    description: `${whiskeyData.name} (${whiskeyData.size}ml) has been updated in your collection.`,
                });
                sessionStorage.removeItem('selectedWhiskey');
                sessionStorage.removeItem('capturedImage');
                router.visit('/');
            },
        });
    };

    return (
        <AppLayout>

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
                            <h2 className="mb-1 text-xl font-semibold text-amber-900">{whiskeyData.name || 'Unnamed Whiskey'}</h2>
                            <p className="text-sm text-amber-700">{whiskeyData.size}ml</p>
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 font-medium text-amber-900">Basic Info</h3>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Popover open={nameSearchOpen} onOpenChange={setNameSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={nameSearchOpen}
                                                className="w-full justify-between border-amber-300 bg-white font-normal"
                                            >
                                                {whiskeyData.name || 'Select whiskey...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search whiskey..."
                                                    value={whiskeyData.name}
                                                    onValueChange={handleNameChange}
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No whiskey found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <ScrollArea className="h-[200px]">
                                                            {filteredWhiskeys.map((item) => (
                                                                <CommandItem
                                                                    key={`${item.id}-${item.size}`}
                                                                    value={item.name}
                                                                    onSelect={() => handleNameSelect(item)}
                                                                >
                                                                    <div className="flex w-full items-center justify-between">
                                                                        <span>{item.name}</span>
                                                                        <span className="text-muted-foreground text-xs">{item.size}ml</span>
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto h-4 w-4',
                                                                            whiskeyData.name === item.name && whiskeyData.size === item.size
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="size">Size (ml)</Label>
                                        <Select
                                            value={whiskeyData.size.toString()}
                                            onValueChange={(value) => {
                                                handleInputChange('size', Number(value));
                                                const matchingWhiskey = whiskeys.find(
                                                    (w) => w.name.toLowerCase() === whiskeyData.name.toLowerCase() && w.size === Number(value),
                                                );
                                                if (matchingWhiskey) {
                                                    setWhiskeyData((prev) => ({
                                                        ...prev,
                                                        id: matchingWhiskey.id,
                                                        store_id: matchingWhiskey.store_id,
                                                        unique_name: matchingWhiskey.unique_name,
                                                        proof: matchingWhiskey.proof,
                                                        abv: matchingWhiskey.abv,
                                                        spirit_type: matchingWhiskey.spirit_type,
                                                        avg_msrp: matchingWhiskey.avg_msrp,
                                                        fair_price: matchingWhiskey.fair_price,
                                                        shelf_price: matchingWhiskey.shelf_price,
                                                        popularity: matchingWhiskey.popularity,
                                                    }));
                                                    toast({
                                                        title: 'Size updated',
                                                        description: `Found ${matchingWhiskey.name} (${value}ml) in the database.`,
                                                    });
                                                }
                                            }}
                                        >
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
                                        <Select value={whiskeyData.spirit_type} onValueChange={(value) => handleInputChange('spirit_type', value)}>
                                            <SelectTrigger className="border-amber-300 bg-white">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SPIRIT_TYPES.map((type) => (
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
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock Quantity</Label>
                                    <div className="flex items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="rounded-r-none border-r-0"
                                            onClick={() => {
                                                const currentStock = Number.parseInt(whiskeyData.stock) || 0;
                                                if (currentStock > 0) {
                                                    handleInputChange('stock', (currentStock - 1).toString());
                                                }
                                            }}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            id="stock"
                                            type="number"
                                            min="0"
                                            value={whiskeyData.stock}
                                            onChange={(e) => handleInputChange('stock', e.target.value)}
                                            className="rounded-none border-amber-300 bg-white text-center"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="rounded-l-none border-l-0"
                                            onClick={() => {
                                                const currentStock = Number.parseInt(whiskeyData.stock) || 0;
                                                handleInputChange('stock', (currentStock + 1).toString());
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add any notes about this whiskey..."
                                        value={whiskeyData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        className="min-h-[80px] border-amber-300 bg-white"
                                    />
                                </div>
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
