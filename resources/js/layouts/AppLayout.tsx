import { Toaster } from '@/components/ui/sonner';
import { Head } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface Props {
    title: string;
}
const AppLayout = ({ children, title }: PropsWithChildren & Props) => {
    return (
        <div className="font-inter min-h-screen">
            <Head title={title} />
            {children}
            <Toaster />
        </div>
    );
};

export default AppLayout;
