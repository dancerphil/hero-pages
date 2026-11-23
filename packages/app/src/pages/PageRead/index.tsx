import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Read } from './Read';

export const PageRead = () => (
    <div className="simplePage">
        <MantineProvider>
            <Read />
        </MantineProvider>
    </div>
);
