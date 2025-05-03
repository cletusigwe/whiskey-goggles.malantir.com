import { Toaster } from '@/components/ui/sonner';
import { PropsWithChildren } from 'react';

const AppLayout = ({ children }: PropsWithChildren) => {
    return (
        <div className="font-inter min-h-screen">
            {children}
            <Toaster />
        </div>
    );
};

export default AppLayout;
